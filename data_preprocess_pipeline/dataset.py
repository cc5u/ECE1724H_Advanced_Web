"""
This script is used to preprocess the data and store the tokenized data.
This file is used in dataloader.py to essentially create train/validation/test dataloaders using the dataset.
"""

from tqdm import tqdm
import numpy as np
from torch.utils.data import Dataset
import torch
from model_training_pipeline.embed_model import EMBED_MODEL_TYPES
#Database
# from database import db

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class CustomizeDataset(Dataset):
    def __init__(
        self,
        text,
        targets,
        class_map,
        bert_model: EMBED_MODEL_TYPES = None,
    ):
        self.texts: list[str] = text 
        self.targets: list[str] = targets
        self.class_map = class_map
        self.bert_model = bert_model
        self.max_length = self._get_max_length()

    def _get_max_length(self):

        model_max_len = self.bert_model.bert_model.config.max_position_embeddings

        lengths = [
            len(self.bert_model.tokenizer.encode(text, add_special_tokens=True, truncation=False))
            for text in tqdm(self.texts, desc="Tokenizing to get input lengths")
        ]

        p95 = np.percentile(lengths, 95)

        # Cap to model limit
        if p95 >= model_max_len:
            return model_max_len

        # Standard bucket sizes
        buckets = [64, 128, 256, 512, 1024, 2048, 4096]

        for n in buckets:
            if p95 <= n and n <= model_max_len:
                return n

        return model_max_len
    
    def __len__(self): #this is needed since the parent class is Dataset
        return len(self.texts)

    
    def __getitem__(self, idx):  # This is needed since the parent class is Dataset
        """
        Returns a dictionary with:
          - 'input_ids'      : token ids (long tensor)
          - 'attention_mask' : attention mask (long tensor)
          - 'labels'         : 0 or 1 (long tensor)
        """
        text = str(self.texts[idx])
        target = self.class_map["label_to_id"][self.targets[idx]]

        enc = self.bert_model.tokenize(text, max_length=self.max_length)
 
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "labels": torch.tensor(target, dtype=torch.long),
        }


if __name__ == "__main__":
    from data.read_data import read_data
    from model_training_pipeline.embed_model import BERT
    data_path = "data/News.csv"
    _, X, y, class_map, num_classes = read_data(path=data_path)
    bert_model = BERT("bert-base-cased")
    dataset = CustomizeDataset(text=X, targets=y, class_map=class_map, bert_model=bert_model)
    print(dataset.max_length)
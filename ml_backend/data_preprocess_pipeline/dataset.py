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
        self.max_length = self.bert_model.bert_model.config.max_position_embeddings
    
    def __len__(self): #this is needed since the parent class is Dataset
        return len(self.texts)

    
    def __getitem__(self, idx):  # This is needed since the parent class is Dataset
        
        text = self.texts[idx]
        target = self.class_map["label_to_id"][self.targets[idx]]

        enc = self.bert_model.tokenize(text)
 
        return {
            "input_ids": torch.tensor(enc["input_ids"], dtype=torch.long),
            "attention_mask": torch.tensor(enc["attention_mask"], dtype=torch.long),
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
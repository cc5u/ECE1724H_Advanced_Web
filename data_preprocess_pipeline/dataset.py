"""
This script is used to preprocess the data and store the tokenized data in the database.
This file is used in dataloader.py to essentially create train/validation/test dataloaders using the dataset.
"""

from torch.utils.data import Dataset
import torch
from model_training_pipeline.embed_model import BERT, DISTILBERT
#Database
# from database import db

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class CustomizeDataset(Dataset):
    def __init__(
        self,
        text,
        targets,
        class_map,
        bert_model: BERT | DISTILBERT = None,
        batch_size=256
    ):
        self.texts = text
        self.targets = targets
        self.class_map = class_map
        self.bert_model = bert_model
        self.batch_size = batch_size

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

        enc = self.bert_model.tokenize(text)
 
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "labels": torch.tensor(target, dtype=torch.long),
        }



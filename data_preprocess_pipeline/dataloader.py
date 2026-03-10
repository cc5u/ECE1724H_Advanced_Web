"""
This script is used to create train/validation/test dataloaders using the dataset.
"""

# Customized Dataset
from data_preprocess_pipeline.dataset import CustomizeDataset
from torch.utils.data import Dataset, DataLoader, Subset
import torch
from sklearn.model_selection import train_test_split
from transformers import DataCollatorWithPadding

# Model
from model_training_pipeline.embed_model import load_embed_model

# Data
from data.read_data import read_data
from data_preprocess_pipeline.data_config import DataConfig
from model_training_pipeline.model_config import EmbedModelConfig, TrainingConfig

# DataLoader stays on CPU; batches are moved to device in the training loop
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class DataPreprocessDataLoader():
    def __init__(self, data_config: DataConfig, training_config: TrainingConfig, embed_model_config: EmbedModelConfig):
        # Bert model Tokenizer
        self.bert_model = load_embed_model(embed_model_config)
        self.tokenizer = self.bert_model.tokenizer

        # DataLoader, Dynamic Padding
        self.data_collator = DataCollatorWithPadding(tokenizer=self.tokenizer)
        self.stratify = data_config.stratify
        self.batch_size = training_config.batch_size
       
        # Custom Dataset with Bert Model Tokenized
        _, self.X, self.y, self.class_map, self.num_classes = read_data(path=data_config.data_path)
        self.data_dataset = CustomizeDataset(
            text=self.X,
            targets=self.y,
            class_map=self.class_map,
            bert_model=self.bert_model,
        )
        self.train_ratio = data_config.train_ratio
        self.test_ratio = data_config.test_ratio
        self.val_ratio = self.test_ratio / (1 - self.test_ratio)

    def split_data(self):
        n_total = len(self.data_dataset)
        indices = list(range(n_total))
        y_stratify = self.y if self.stratify else None
        idx_train_val, idx_test = train_test_split(
            indices, test_size=self.test_ratio, stratify=y_stratify, random_state=42
        )
        y_val_stratify = [self.y[i] for i in idx_train_val] if self.stratify else None
        idx_train, idx_val = train_test_split(
            idx_train_val, test_size=self.val_ratio, stratify=y_val_stratify
        )
        train_dataset = Subset(self.data_dataset, idx_train)
        val_dataset = Subset(self.data_dataset, idx_val)
        test_dataset = Subset(self.data_dataset, idx_test)

        # DataLoaders run on CPU; use pin_memory for faster CPU->GPU when using CUDA
        train_loader = DataLoader(
            train_dataset, batch_size=self.batch_size, shuffle=True,
            pin_memory=(DEVICE == "cuda"),
            collate_fn=self.data_collator,
        )
        val_loader = DataLoader(
            val_dataset, batch_size=self.batch_size, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
            collate_fn=self.data_collator,
        )
        test_loader = DataLoader(
            test_dataset, batch_size=self.batch_size, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
            collate_fn=self.data_collator,
        )

        return train_loader, val_loader, test_loader
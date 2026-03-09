"""
This script is used to create train/validation/test dataloaders using the dataset.
"""

# Customized Dataset
from data_preprocess_pipeline.dataset import CustomizeDataset
from torch.utils.data import Dataset, DataLoader, Subset
import torch
from sklearn.model_selection import train_test_split

# Model
from model_training_pipeline.embed_model import EMBED_MODEL_TYPES

# Data
from data.read_data import read_data
from data_preprocess_pipeline.data_config import DataConfig

# DataLoader stays on CPU; batches are moved to device in the training loop
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class DataPreprocessDataLoader():
    def __init__(self, data_config: DataConfig, bert_model: EMBED_MODEL_TYPES = None):
        if bert_model is None:
            raise ValueError("BERT model is required")
        _, self.X, self.y, self.class_map, self.num_classes = read_data(path=data_config.data_path)
        
        self.stratify = data_config.stratify
        self.data_dataset = CustomizeDataset(
            text=self.X,
            targets=self.y,
            class_map=self.class_map,
            bert_model=bert_model,
        )

    def split_data(self, batch_size: int = 256):
        n_total = len(self.data_dataset)
        indices = list(range(n_total))
        y_stratify = self.y if self.stratify else None
        idx_train_val, idx_test = train_test_split(
            indices, test_size=0.1, stratify=y_stratify, random_state=42
        )
        y_val_stratify = [self.y[i] for i in idx_train_val] if self.stratify else None
        idx_train, idx_val = train_test_split(
            idx_train_val, test_size=0.1 / 0.9, stratify=y_val_stratify
        )
        train_dataset = Subset(self.data_dataset, idx_train)
        val_dataset = Subset(self.data_dataset, idx_val)
        test_dataset = Subset(self.data_dataset, idx_test)

        # DataLoaders run on CPU; use pin_memory for faster CPU->GPU when using CUDA
        train_loader = DataLoader(
            train_dataset, batch_size=batch_size, shuffle=True,
            pin_memory=(DEVICE == "cuda"),
        )
        val_loader = DataLoader(
            val_dataset, batch_size=batch_size, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
        )
        test_loader = DataLoader(
            test_dataset, batch_size=batch_size, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
        )

        return train_loader, val_loader, test_loader
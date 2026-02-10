# Customized Dataset
from data_preprocess_pipeline.dataset import CustomizeDataset
from torch.utils.data import Dataset, DataLoader, random_split
import torch

# Model
from model_training_pipeline.embed_model import bert_model

# Data
from data.read_data import read_data

# DataLoader stays on CPU; batches are moved to device in the training loop
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class datapreprocess_dataloader():
    def __init__(self, batch_size=256, max_len=400):
        self.batch_size = batch_size
        self.max_len = max_len
        _, self.X, self.y = read_data()
        self.data_dataset = CustomizeDataset(
            text=self.X[:100],
            targets=self.y[:100],
            tokenizer=bert_model.tokenizer,
            max_len=self.max_len,
            bert_model=bert_model.bert_model,
            # precompute=precompute,
            batch_size=self.batch_size
        )

    def split_data(self, batch_size=16):
        n_total = len(self.data_dataset)
        n_train = int(0.8 * n_total)
        n_val   = int(0.1 * n_total)
        n_test  = n_total - n_train - n_val 

        train_dataset, val_dataset, test_dataset = random_split(
            self.data_dataset, 
            [n_train, n_val, n_test])

        # DataLoaders run on CPU; use pin_memory for faster CPU->GPU when using CUDA
        train_loader = DataLoader(
            train_dataset, batch_size=16, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
        )
        val_loader = DataLoader(
            val_dataset, batch_size=16, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
        )
        test_loader = DataLoader(
            test_dataset, batch_size=16, shuffle=False,
            pin_memory=(DEVICE == "cuda"),
        )

        return train_loader, val_loader, test_loader
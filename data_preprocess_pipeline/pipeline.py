import torch

from data_preprocess_pipeline.dataset import CustomizeDataset
from data_preprocess_pipeline.dataloader import datapreprocess_dataloader

data_loader_class = datapreprocess_dataloader()
train_loader, val_loader, test_loader = data_loader_class.split_data()

import torch

from data_preprocess_pipeline.dataset import CustomizeDataset
from data_preprocess_pipeline.dataloader import datapreprocess_dataloader

data_loader_class = datapreprocess_dataloader(precompute=True)
train_loader, val_loader, test_loader = data_loader_class.split_data()

if __name__ == "__main__":
    sample_batch = next(iter(train_loader))

    # Print the keys to see what attributes are in the dataset
    print("Keys in the sample:", sample_batch.keys())

    # Print the shapes of each attribute to understand their structure
    for key, value in sample_batch.items():
        print(f"{key}: {type(value)}, {value.shape if type(value) == torch.Tensor else len(value)}")
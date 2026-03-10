from data_preprocess_pipeline.dataloader import DataPreprocessDataLoader
from model_training_pipeline.model_config import TrainingConfig, EmbedModelConfig
from data_preprocess_pipeline.data_config import DataConfig
import time



def preprocess_pipeline(data_config: DataConfig, training_config: TrainingConfig, embed_model_config: EmbedModelConfig):
    print("Preprocessing data...")
    data_loader_class = DataPreprocessDataLoader(data_config=data_config, training_config=training_config, embed_model_config=embed_model_config)
    train_loader, val_loader, test_loader = data_loader_class.split_data()
    num_classes = data_loader_class.num_classes
    print("Data preprocessing complete")
    return train_loader, val_loader, test_loader, num_classes

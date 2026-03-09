from data_preprocess_pipeline.dataloader import DataPreprocessDataLoader
from model_training_pipeline.embed_model import BERT, DISTILBERT
from data_preprocess_pipeline.data_config import DataConfig
import time



def preprocess_pipeline(bert_model: BERT | DISTILBERT = None, data_config: DataConfig = None):
    print("Preprocessing data...")
    data_loader_class = DataPreprocessDataLoader(bert_model=bert_model, data_config=data_config)
    train_loader, val_loader, test_loader = data_loader_class.split_data()
    num_classes = data_loader_class.num_classes
    print("Data preprocessing complete")
    return train_loader, val_loader, test_loader, num_classes

if __name__ == "__main__":
    start_time = time.time()
    train_loader, val_loader, test_loader, num_classes = preprocess_pipeline(bert_model=DISTILBERT(), data_config=DataConfig(data_path="data/data.csv"))
    print(len(train_loader), len(val_loader), len(test_loader))
    print(num_classes)
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
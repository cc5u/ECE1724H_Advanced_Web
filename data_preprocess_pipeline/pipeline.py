from data_preprocess_pipeline.dataloader import datapreprocess_dataloader
from model_training_pipeline.embed_model import bert_model, BERT, DISTILBERT
import time



def preprocess_pipeline(bert_model: BERT | DISTILBERT = bert_model, data_path: str = None):
    data_loader_class = datapreprocess_dataloader(bert_model=bert_model, data_path=data_path)
    train_loader, val_loader, test_loader = data_loader_class.split_data()
    return train_loader, val_loader, test_loader

if __name__ == "__main__":
    start_time = time.time()
    train_loader, val_loader, test_loader = preprocess_pipeline(bert_model=DISTILBERT(), data_path="data/data.csv")
    print(len(train_loader), len(val_loader), len(test_loader))
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
from data_preprocess_pipeline.pipeline import train_loader, val_loader, test_loader
from model_training_pipeline.classify_model import classify_model
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
classify_model.to(DEVICE)

def get_model_output():
    for batch in test_loader:
        # Move batch tensors to same device as model (required for forward + loss)
        input_ids = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels = batch["labels"].to(DEVICE)

        outputs = classify_model(input_ids, attention_mask)
        _, predicted = torch.max(outputs.data, 1)
    return predicted

if __name__ == "__main__":
    classify_model.to(DEVICE)

    for batch in train_loader:
        # Move batch tensors to same device as model (required for forward + loss)
        input_ids = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels = batch["labels"].to(DEVICE)

        outputs = classify_model(input_ids, attention_mask)
        _, predicted = torch.max(outputs.data, 1)
        print(outputs.shape, type(outputs), outputs, predicted)
        print(labels.shape, type(labels), labels)
        break



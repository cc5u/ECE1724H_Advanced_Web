import torch
from torch.utils.data import DataLoader
from tqdm import tqdm
from model_training_pipeline.classify_model import classify_model, SentimentClassifierLast
from data_preprocess_pipeline.pipeline import train_loader, test_loader


def get_accuracy(data_loader: DataLoader, model: SentimentClassifierLast):
    """ Compute the accuracy of the `model` across a dataset `data`

    Example usage:

    >>> model = MyRNN() # to be defined
    >>> get_accuracy(model, valid_loader) # the variable `valid_loader` is from above
    """

    # TO BE COMPLETED
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model.to(DEVICE)

    correct = 0
    total = 0
    model.eval()

    with torch.no_grad():
      for sample_batch in tqdm(data_loader, total=len(data_loader)):
        
        input_ids, attention_mask = sample_batch["input_ids"].to(DEVICE), sample_batch["attention_mask"].to(DEVICE)
        
        outputs = classify_model(input_ids, attention_mask)
        labels = sample_batch["labels"]

        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
    return correct / total

if __name__ == "__main__":
    # accuracy = get_accuracy(train_loader, classify_model)
    # print(accuracy)
    print(len(test_loader))

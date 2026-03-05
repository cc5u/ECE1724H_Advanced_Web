from data_preprocess_pipeline.pipeline import train_loader, val_loader, test_loader
from model_training_pipeline.classify_model import classify_model
from model_training_pipeline.embed_model import bert_model
import torch
import torch.nn.functional as F

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
classify_model.to(DEVICE)

def get_model_output(user_input: str, user_id: int = None, training_session_id: int = None):    
    # Deffine the model
    model= None
    if user_id is None and training_session_id is None:
        model = classify_model
    else: # Load model from S3 bucket according to user_id and training_session_id
        pass

    with torch.no_grad():
        encoding = bert_model.tokenize(user_input)
        input_ids, attention_mask = encoding["input_ids"].to(DEVICE), encoding["attention_mask"].to(DEVICE)
        outputs = model(input_ids, attention_mask)
        probs = F.softmax(outputs, dim=1)   # [1, 2]
        predicted = outputs.argmax(dim=1)    # [1]
        confidence = probs[0, predicted[0]].item()  # scalar 0..1
        print(outputs.shape, type(outputs), outputs)
        _, predicted = torch.max(outputs.data, 1)
    return predicted, confidence

if __name__ == "__main__":
    classify_model.to(DEVICE)

    user_input = "I love this product!"
    predicted, confidence = get_model_output(user_input)
    print(predicted, confidence)



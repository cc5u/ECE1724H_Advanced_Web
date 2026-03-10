import io
from database.redis_client import load_model_from_redis
import torch
import torch.nn.functional as F

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def get_model_output(user_input: str, user_id: str | None = None, training_session_id: str | None = None):    
    # Deffine the model
    model= None
    if user_id is not None and training_session_id is not None:
        model, embed_model = load_model_from_redis(user_id, training_session_id)
    else:
        raise ValueError("User ID and training session ID are required")

    with torch.no_grad():
        encoding = embed_model.tokenize(user_input)
        input_ids, attention_mask = torch.tensor(encoding["input_ids"], dtype=torch.long).to(DEVICE), torch.tensor(encoding["attention_mask"], dtype=torch.long).to(DEVICE)
        outputs = model(input_ids, attention_mask)
        probs = F.softmax(outputs, dim=1)
        predicted = outputs.argmax(dim=1)
        # Top-k confidences: up to 5 classes, or all if binary (2 classes)
        probs_vec = probs[0]
        k = min(5, probs_vec.size(0))
        top_probs, top_indices = torch.topk(probs_vec, k)
        top_confidences = [
            {"class": int(c), "confidence": float(p)}
            for c, p in zip(top_indices.tolist(), top_probs.tolist())
        ]
    return predicted, top_confidences

if __name__ == "__main__":
    user_input = "I love this product!"
    # Replace with real user_id and training_session_id that have a trained model in Redis
    predicted, top_confidences = get_model_output(user_input, user_id="test", training_session_id="test")
    print("predicted:", predicted.tolist(), "confidences:", top_confidences)



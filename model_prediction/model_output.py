import io
from model_training_pipeline.classify_model import SentimentClassifier
from model_training_pipeline.embed_model import MODEL_NAMES
from model_training_pipeline.model_config import TrainingConfig
import torch
import torch.nn.functional as F

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
def load_model_from_redis(user_id: str, training_session_id: str) -> SentimentClassifier:
    """
    Load the model state and config from Redis, build SentimentClassifier, and return it.
    Raises FileNotFoundError if no model state exists for this user/session.
    """
    from database.redis_client import get_model_state, get_training_config

    model_state = get_model_state(user_id, training_session_id)
    if model_state is None:
        raise FileNotFoundError(
            f"No model state found for user_id={user_id!r}, training_session_id={training_session_id!r}. Train first."
        )

    state_dict = torch.load(io.BytesIO(model_state), map_location="cpu", weights_only=True)
    config: TrainingConfig = get_training_config(user_id, training_session_id) or TrainingConfig()
    embed_model = MODEL_NAMES[config.embed_model]
    model = SentimentClassifier(
        n_classes=config.num_classes, 
        hidden_neuron=config.hidden_neurons, 
        dropout=config.dropout, 
        num_layers=config.num_layers, 
        bert_model=embed_model)
    model.load_state_dict(state_dict)
    model.eval()
    return model

def get_model_output(user_input: str, user_id: str | None = None, training_session_id: str | None = None):    
    # Deffine the model
    model= None
    if user_id is not None and training_session_id is not None:
        model = load_model_from_redis(user_id, training_session_id)
    else:
        raise ValueError("User ID and training session ID are required")

    with torch.no_grad():
        encoding = MODEL_NAMES["bert_model"].tokenize(user_input)
        input_ids, attention_mask = encoding["input_ids"].to(DEVICE), encoding["attention_mask"].to(DEVICE)
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



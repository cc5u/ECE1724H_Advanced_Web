import io
import torch
import torch.nn.functional as F
from model_training_pipeline.model_config import TotalConfig
from model_training_pipeline.embed_model import load_embed_model
from cloud_storage.storage_manager import cloud_storage_manager
from model_training_pipeline.classify_model import Classifier
from model_training_pipeline.evaluation import attention_visualization

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def get_model_output(
    user_input: str, 
    user_id: str, 
    training_session_id: str,
    config: TotalConfig
    ):
    # Deffine the model
    classifier_config = config.classifier_config
    embed_model_config = config.embed_model_config
    id_to_label = config.data_config.class_map["id_to_label"]

    def _label_from_idx(idx: int):
        # class_map may come from JSON/Redis, so keys can be strings.
        if str(idx) in id_to_label:
            return id_to_label[str(idx)]
        if idx in id_to_label:
            return id_to_label[idx]
        return idx


    embed_model = load_embed_model(embed_model_config)
    model = Classifier(embed_model, classifier_config).to(DEVICE)
    
    # Load the model state
    model_state = cloud_storage_manager.read_bytes(user_id, training_session_id, f"{classifier_config.model_name}.pth")
    best_state_dict = torch.load(io.BytesIO(model_state), map_location="cpu", weights_only=True)
    model.load_state_dict(best_state_dict)
    model.eval()

    with torch.no_grad():
        encoding = embed_model.tokenize(user_input)
        input_ids, attention_mask = torch.tensor(encoding["input_ids"], dtype=torch.long).to(DEVICE), torch.tensor(encoding["attention_mask"], dtype=torch.long).to(DEVICE)
        input_ids, attention_mask = input_ids.unsqueeze(0), attention_mask.unsqueeze(0)
        outputs = model(input_ids, attention_mask)
        probs = F.softmax(outputs, dim=1)
        predicted_idx = int(outputs.argmax(dim=1).item())
        predicted_label = _label_from_idx(predicted_idx)
        # Top-k confidences: up to 5 classes, or all if binary (2 classes)
        probs_vec = probs[0]
        k = min(5, probs_vec.size(0))
        top_probs, top_indices = torch.topk(probs_vec, k)
        top_confidences = [
            {"class": _label_from_idx(int(c)), "confidence": float(p)}
            for c, p in zip(top_indices.tolist(), top_probs.tolist())
        ]

    # Get the attention visualization
    attention_visualization_data = attention_visualization(model, user_input)
    


    return predicted_label, top_confidences

if __name__ == "__main__":
    user_input = "I love this product!"
    # Replace with real user_id and training_session_id that have a trained model in Redis
    predicted, top_confidences = get_model_output(user_input, user_id="test", training_session_id="test")
    print("predicted:", predicted, "confidences:", top_confidences)



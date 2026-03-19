import io
import torch
import torch.nn.functional as F
from model_training_pipeline.model_config import TotalConfig
from model_training_pipeline.embed_model import load_embed_model
from cloud_storage.storage_manager import cloud_storage_manager
from model_training_pipeline.classify_model import Classifier
from model_training_pipeline.evaluation import attention_visualization, AttentionVisualizationResult
from pydantic import BaseModel

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class ModelPredictionOutput(BaseModel):
    predicted_label: str
    top_confidences: list[dict[str, str | float]]
    attention_visualization: AttentionVisualizationResult


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
        return str(idx)


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
    texts, words, word_scores = attention_visualization(model, user_input)
    
    attention_visualization_result = AttentionVisualizationResult(
        text=texts,
        tokens=words,
        scores=word_scores
    )

    return ModelPredictionOutput(
        predicted_label=predicted_label,
        top_confidences=top_confidences,
        attention_visualization=attention_visualization_result,
    )

if __name__ == "__main__":
    from model_training_pipeline.model_config import TrainingConfig, DataConfig, EmbedModelConfig, ClassifierConfig
    from model_training_pipeline.evaluation import attention_visualization, AttentionVisualizationResult
    user_input = "I’m upgrading my desktop with a new motherboard and a PCIe 4.0 NVMe SSD, but I’m not sure if my current power supply has enough wattage for the GPU. I also need to check RAM compatibility so the DDR5 kit runs at its rated speed without stability issues."
    user_id = "test"
    training_session_id = "test"
    training_config = TrainingConfig(
        learning_rate=2e-5,
        n_epochs=5,
        batch_size=8,
        eval_step=1
    )
    data_config = DataConfig(
        data_path="https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/public/News.csv",
        lowercase=False,
        remove_punctuation=False,
        remove_stopwords=False,
        lemmatization=False,
        handle_urls="replace",
        handle_emails="replace",
        train_ratio=0.8,
        test_ratio=0.2,
        stratify=True,
        class_map={'label_to_id': {'alt.atheism': 0, 'comp.graphics': 1, 'comp.os.ms-windows.misc': 2, 'comp.sys.ibm.pc.hardware': 3, 'comp.sys.mac.hardware': 4, 'comp.windows.x': 5, 'misc.forsale': 6, 'rec.autos': 7, 'rec.motorcycles': 8, 'rec.sport.baseball': 9, 'rec.sport.hockey': 10, 'sci.crypt': 11, 'sci.electronics': 12, 'sci.med': 13, 'sci.space': 14, 'soc.religion.christian': 15, 'talk.politics.guns': 16, 'talk.politics.mideast': 17, 'talk.politics.misc': 18, 'talk.religion.misc': 19}, 'id_to_label': {0: 'alt.atheism', 1: 'comp.graphics', 2: 'comp.os.ms-windows.misc', 3: 'comp.sys.ibm.pc.hardware', 4: 'comp.sys.mac.hardware', 5: 'comp.windows.x', 6: 'misc.forsale', 7: 'rec.autos', 8: 'rec.motorcycles', 9: 'rec.sport.baseball', 10: 'rec.sport.hockey', 11: 'sci.crypt', 12: 'sci.electronics', 13: 'sci.med', 14: 'sci.space', 15: 'soc.religion.christian', 16: 'talk.politics.guns', 17: 'talk.politics.mideast', 18: 'talk.politics.misc', 19: 'talk.religion.misc'}}
    )
    embed_model_config = EmbedModelConfig(
        embed_model="roberta_model",
        fine_tune_mode="unfreeze_all"
    )
    classifier_config = ClassifierConfig(
        model_name="default",
        hidden_neurons=128,
        dropout=0.3,
        classifier_type="LINEAR",
        num_classes=20
    )
    
    total_config = TotalConfig(
        embed_model_config=embed_model_config, 
        classifier_config=classifier_config, 
        training_config=training_config, 
        data_config=data_config)

    model_output = get_model_output(user_input, user_id, training_session_id, total_config)
    print(model_output)

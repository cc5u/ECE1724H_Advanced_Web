"""
Evaluate a trained model loaded from Redis by user_id and training_session_id.
Returns accuracy, precision, recall, and F1-score.
"""

import io
from typing import Any
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import torch.nn as nn
from pydantic import BaseModel, Field
from model_training_pipeline.embed_model import load_bert_model_with_attention
import numpy as np
from sklearn.decomposition import PCA


class MetricsResult(BaseModel):
    accuracy: float = Field(..., description="Classification accuracy")
    precision: float = Field(..., description="Macro precision")
    recall: float = Field(..., description="Macro recall")
    f1_score: float = Field(..., description="Macro F1 score")


class ConfusionMatrixResult(BaseModel):
    labels: list[str] = Field(..., description="Ordered class labels")
    matrix: list[list[int]] = Field(..., description="Confusion matrix values")
    normalize: bool = Field(False, description="Whether values are normalized")


class AttentionVisualizationResult(BaseModel):
    text: str = Field(..., description="Original text used for attention visualization")
    tokens: list[str] = Field(..., description="Merged word tokens")
    scores: list[float] = Field(..., description="Token-level attention scores")


class EmbeddingPoint(BaseModel):
    x: float
    y: float
    label: str
    text: str


class EmbeddingVisualizationResult(BaseModel):
    points: list[EmbeddingPoint]
    legend: list[str]


class LearningCurvesResult(BaseModel):
    x: list[int]
    train_loss: list[float]
    val_loss: list[float]
    train_acc: list[float]
    val_acc: list[float]


class EvaluationResult(BaseModel):
    metrics: MetricsResult
    confusion_matrix: ConfusionMatrixResult
    learning_curves: LearningCurvesResult
    attention_visualization: AttentionVisualizationResult
    embedding_2d: EmbeddingVisualizationResult



# ===== Attention Visualization Functions =====
def _filter_special_tokens(tokenizer, tokens, scores):
    # Filter out special tokens
    filtered_tokens = []
    filtered_scores = []
    for token, score in zip(tokens, scores):
        if token not in tokenizer.all_special_tokens:
            filtered_tokens.append(token)
            filtered_scores.append(score)
    return filtered_tokens, filtered_scores 

def _merge_wordpiece_tokens(tokens, scores):
    # This works for BERT, DistilBERT
    words = []
    word_scores = []
    current_word = ""
    current_scores = []
    for token, score in zip(tokens, scores):
        if token.startswith("##"):
            current_word += token[2:]
            current_scores.append(score)
        else:
            if current_word != "":
                words.append(current_word)
                word_scores.append(sum(current_scores)/len(current_scores))
            current_word = token
            current_scores = [score]
    if current_word != "":
        words.append(current_word)
        word_scores.append(sum(current_scores)/len(current_scores))
    return words, word_scores

def _merge_roberta_tokens(tokenizer, tokens, scores):
    words = []
    word_scores = []

    current_tokens = []
    current_scores = []

    for token, score in zip(tokens, scores):
        if token == "Ċ":
            if current_tokens:
                word = tokenizer.convert_tokens_to_string(current_tokens).strip()
                if word:
                    words.append(word)
                    word_scores.append(sum(current_scores) / len(current_scores))
                current_tokens = []
                current_scores = []
            continue

        if token.startswith("Ġ"):
            if current_tokens:
                word = tokenizer.convert_tokens_to_string(current_tokens).strip()
                if word:
                    words.append(word)
                    word_scores.append(sum(current_scores) / len(current_scores))
            current_tokens = [token]
            current_scores = [score]
        else:
            current_tokens.append(token)
            current_scores.append(score)

    if current_tokens:
        word = tokenizer.convert_tokens_to_string(current_tokens).strip()
        if word:
            words.append(word)
            word_scores.append(sum(current_scores) / len(current_scores))

    return words, word_scores

def _merge_tokens(tokenizer, tokens, scores):
    if any(token.startswith("##") for token in tokens):
        return _merge_wordpiece_tokens(tokens, scores)
    elif any(token.startswith("Ġ") or token == "Ċ" for token in tokens):
        return _merge_roberta_tokens(tokenizer, tokens, scores)
    else:
        return tokens, scores

def attention_visualization(
    model: nn.Module,
    text: str,
):
    print("Building attention visualization...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    bert_model_weights = model.bert_model.bert_model.state_dict()
    bert_model_attention = load_bert_model_with_attention(model.bert_model, bert_model_weights)
    bert_model_attention.to(device)
    bert_model_attention.eval()
    
    # Input IDs and Attention Mask
    tokenizer = model.bert_model.tokenizer
    text_tokens = tokenizer(text, truncation=True, padding=False, max_length=model.bert_model.max_length, return_tensors="pt")
    input_ids = text_tokens["input_ids"].to(device)
    attention_mask = text_tokens["attention_mask"].to(device)
    
    with torch.no_grad():
        inputs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "output_attentions": True,
        }
        outputs = bert_model_attention(**inputs)
    
    attentions = outputs.attentions
    last_layer_attentions = attentions[-1]
    average_attentions = last_layer_attentions.mean(dim=1)
    cls_attention = average_attentions[:, 0, :]
    tokens = tokenizer.convert_ids_to_tokens(input_ids[0].tolist())
    scores = cls_attention.squeeze(0).tolist()
    

    filtered_tokens, filtered_scores = _filter_special_tokens(tokenizer, tokens, scores)
    words, word_scores = _merge_tokens(tokenizer, filtered_tokens, filtered_scores)

    return text, words, word_scores
# =============================================

# ==== Embedding Visualization Functions ======

def build_embedding_2d(model, data_loader, n_samples=50):
    """
    Build 2D embedding visualization payload from the first n_samples
    in a DataLoader whose dataset is a Subset(CustomizeDataset).

    Returns:
    {
        "points": [
            {"x": ..., "y": ..., "label": "...", "text": "..."},
            ...
        ],
        "legend": [...]
    }
    """
    print("Building embedding 2D...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    # test_loader.dataset is a Subset
    subset = data_loader.dataset
    base_dataset = subset.dataset

    # first n indices from this subset
    n_samples = min(n_samples, len(subset))
    indices = subset.indices[:n_samples]

    # raw texts
    texts = [base_dataset.texts[i] for i in indices]

    # raw string labels, e.g. "Positive", "Negative"
    raw_labels = [base_dataset.targets[i] for i in indices]

    # tokenized samples from base dataset
    samples = [base_dataset[i] for i in indices]

    # dynamic padding using the same collate_fn as your DataLoader
    batch = data_loader.collate_fn(samples)

    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)

    with torch.no_grad():
        # expected shape: (batch, seq_len, hidden_size)
        last_hidden_states = model._embed_input(input_ids, attention_mask)

        # Use CLS embedding for each text
        # shape: (batch, hidden_size)
        sentence_embeddings = last_hidden_states[:, 0, :]

    # Move to CPU numpy for PCA
    sentence_embeddings = sentence_embeddings.detach().cpu().numpy()

    # PCA to 2D
    pca = PCA(n_components=2)
    coords_2d = pca.fit_transform(sentence_embeddings)  # shape: (n_samples, 2)

    # Optional: rescale for nicer frontend numbers, e.g. ~0 to 100
    x_vals = coords_2d[:, 0]
    y_vals = coords_2d[:, 1]

    def minmax_scale(arr):
        arr_min = arr.min()
        arr_max = arr.max()
        if arr_max - arr_min < 1e-12:
            return np.full_like(arr, 50.0, dtype=float)
        return 100.0 * (arr - arr_min) / (arr_max - arr_min)

    x_scaled = minmax_scale(x_vals)
    y_scaled = minmax_scale(y_vals)

    points = []
    for x, y, label, text in zip(x_scaled, y_scaled, raw_labels, texts):
        points.append({
            "x": round(float(x), 2),
            "y": round(float(y), 2),
            "label": str(label),
            "text": text[:100],
        })

    legend = sorted([str(lbl) for lbl in set(raw_labels)])

    return points, legend
# =============================================

def evaluate(
    model: nn.Module,
    data_loader: DataLoader,
    class_map: dict,
) -> dict[str, Any]:


    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in data_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"]
            outputs = model(input_ids, attention_mask)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().tolist())
            all_labels.extend(labels.tolist())

    y_true = all_labels
    y_pred = all_preds

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average="macro", zero_division=0)
    recall = recall_score(y_true, y_pred, average="macro", zero_division=0)
    f1score = f1_score(y_true, y_pred, average="macro", zero_division=0)

    # Confusion matrix
    confusion_matrix_result = confusion_matrix(y_true, y_pred, labels=list(class_map["label_to_id"].values())).tolist()
    
    # Attention Visualization
    text = data_loader.dataset.dataset.texts[0]
    text, words, word_scores = attention_visualization(model, text)

    # Embedding Visualization
    points, legend = build_embedding_2d(model, data_loader)


    evaluation_result = EvaluationResult(
        metrics=MetricsResult(
            accuracy=float(accuracy),
            precision=float(precision),
            recall=float(recall),
            f1_score=float(f1score),
        ),
        confusion_matrix=ConfusionMatrixResult(
            labels=[str(label) for label in class_map["label_to_id"].keys()],
            matrix=confusion_matrix_result,
            normalize=False,
        ),
        learning_curves=LearningCurvesResult(
            x=[],
            train_loss=[],
            val_loss=[],
            train_acc=[],
            val_acc=[],
        ),
        attention_visualization=AttentionVisualizationResult(
            text=text,
            tokens=words,
            scores=word_scores,
        ),
        embedding_2d=EmbeddingVisualizationResult(
            points=[EmbeddingPoint(**point) for point in points],
            legend=legend,
        ),
    )
    return evaluation_result.model_dump()

if __name__ == "__main__":
    from model_training_pipeline.classify_model import Classifier
    from model_training_pipeline.embed_model import load_embed_model, load_bert_model_with_attention
    from model_training_pipeline.model_config import ClassifierConfig, EmbedModelConfig
    from data_preprocess_pipeline.data_config import DataConfig
    from model_training_pipeline.train import TrainingConfig
    from data_preprocess_pipeline.pipeline import preprocess_pipeline
    from transformers import BertModel

    classifier_config = ClassifierConfig(
        model_name="test_model",
        hidden_neurons=64,
        dropout=0.1,
        num_classes=None,
        classifier_type="LINEAR"
    )
    embed_model_config = EmbedModelConfig(
        embed_model="roberta_model",
        fine_tune_mode="unfreeze_all"
        # unfreeze_last_n_layers=1
    )
    data_config = DataConfig(
        # data_path="data/spam.csv",
        data_path = "https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/projects/public/spam.csv",
        lowercase=False,
        remove_punctuation=False,
        remove_stopwords=False,
        lemmatization=False,
        handle_urls="replace",
        handle_emails="replace",
        train_ratio=0.80,
        test_ratio=0.20,
        stratify=True,
    )
    training_config = TrainingConfig(
        learning_rate=2e-5,
        n_epochs=5,
        batch_size=8,
        eval_step=2
    )

    train_loader, val_loader, test_loader, num_classes, class_map = preprocess_pipeline(
        data_config=data_config, 
        training_config=training_config, 
        embed_model_config=embed_model_config)
    classifier_config.num_classes = num_classes
    data_config.class_map = class_map
    bert_model = load_embed_model(embed_model_config)
    model = Classifier(bert_model, classifier_config)
    model.eval()
    result = evaluate(model, test_loader, data_config.class_map)
    print(result)
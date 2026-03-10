import torch
import torch.nn as nn
from typing import Optional
from transformers import (
    BertModel, BertTokenizer,
    DistilBertModel, DistilBertTokenizer,
    LongformerModel, LongformerTokenizer
)
from model_training_pipeline.model_config import EmbedModelConfig

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def freeze_all_params(module: nn.Module) -> None:
    for param in module.parameters():
        param.requires_grad = False


def unfreeze_all_params(module: nn.Module) -> None:
    for param in module.parameters():
        param.requires_grad = True


def unfreeze_last_n_layers(layers, n: int) -> None:
    if n <= 0:
        raise ValueError("unfreeze_last_n_layers must be > 0")
    if n > len(layers):
        raise ValueError(f"Requested last {n} layers, but model only has {len(layers)} layers")

    for layer in layers[-n:]:
        for param in layer.parameters():
            param.requires_grad = True


def apply_fine_tune_mode(
    base_model: nn.Module,
    encoder_layers,
    embed_model_config: EmbedModelConfig
) -> None:
    mode = embed_model_config.fine_tune_mode

    # Freeze everything first
    freeze_all_params(base_model)

    if mode == "freeze_all":
        return

    if mode == "unfreeze_all":
        unfreeze_all_params(base_model)
        return

    if mode == "unfreeze_last_n_layers":
        n = embed_model_config.unfreeze_last_n_layers
        if n is None:
            raise ValueError("unfreeze_last_n_layers must be set for fine_tune_mode='unfreeze_last_n_layers'")
        unfreeze_last_n_layers(encoder_layers, n)
        return

    raise ValueError(f"Unsupported fine_tune_mode: {mode}")


class BERT(nn.Module):
    def __init__(
        self,
        model_name: str = "bert-base-uncased",
        embed_model_config: Optional[EmbedModelConfig] = None
    ):
        super().__init__()
        if embed_model_config is None:
            embed_model_config = EmbedModelConfig()
        self._model_name = model_name
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.bert_model = BertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.max_length = self.bert_model.config.max_position_embeddings  # 512 for BERT

        apply_fine_tune_mode(
            base_model=self.bert_model,
            encoder_layers=self.bert_model.encoder.layer,
            embed_model_config=embed_model_config
        )

    def tokenize(self, sentence):
        return self.tokenizer(
            sentence,
            max_length=self.max_length,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )

    def forward(self, input_ids, attention_mask):
        return self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )


class DISTILBERT(nn.Module):
    def __init__(
        self,
        model_name: str = "distilbert-base-uncased",
        embed_model_config: Optional[EmbedModelConfig] = None
    ):
        super().__init__()
        if embed_model_config is None:
            embed_model_config = EmbedModelConfig()
        self._model_name = model_name
        self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
        self.bert_model = DistilBertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.max_length = self.bert_model.config.max_position_embeddings  # 512

        apply_fine_tune_mode(
            base_model=self.bert_model,
            encoder_layers=self.bert_model.transformer.layer,
            embed_model_config=embed_model_config
        )

    def tokenize(self, sentence):
        return self.tokenizer(
            sentence,
            max_length=self.max_length,
            add_special_tokens=True,
            return_attention_mask=True,
            truncation=True,
        )

    def forward(self, input_ids, attention_mask):
        return self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )


class LONGFORMER(nn.Module):
    def __init__(
        self,
        model_name: str = "allenai/longformer-base-4096",
        embed_model_config: Optional[EmbedModelConfig] = None
    ):
        super().__init__()
        if embed_model_config is None:
            embed_model_config = EmbedModelConfig()
        self._model_name = model_name
        self.tokenizer = LongformerTokenizer.from_pretrained(model_name)
        self.bert_model = LongformerModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)

        # safer than using config.max_position_embeddings directly
        self.max_length = 4096

        apply_fine_tune_mode(
            base_model=self.bert_model,
            encoder_layers=self.bert_model.encoder.layer,
            embed_model_config=embed_model_config
        )

    def tokenize(self, sentence):
        return self.tokenizer(
            sentence,
            max_length=self.max_length,
            add_special_tokens=True,
            return_attention_mask=True,
            truncation=True,
        )

    def forward(self, input_ids, attention_mask):
        return self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )


# For type hinting
EMBED_MODEL_TYPES = BERT | DISTILBERT | LONGFORMER


MODEL_NAMES = {
    "bert_model": BERT,
    "distilbert_model": DISTILBERT,
    "longformer_model": LONGFORMER,
}

MODEL_INSTANCES = {
    "bert_model": "bert-base-uncased",
    "distilbert_model": "distilbert-base-uncased",
    "longformer_model": "allenai/longformer-base-4096",
}


def load_embed_model(embed_model_config: EmbedModelConfig) -> EMBED_MODEL_TYPES:
    embed_model_cls = MODEL_NAMES[embed_model_config.embed_model]
    model_name = MODEL_INSTANCES[embed_model_config.embed_model]

    embed_model = embed_model_cls(
        model_name=model_name,
        embed_model_config=embed_model_config
    )

    return embed_model
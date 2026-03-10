import transformers
from transformers import BertModel, BertTokenizer
from transformers import DistilBertModel, DistilBertTokenizer
from transformers import LongformerModel, LongformerTokenizer
import torch.nn as nn
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"



class BERT(nn.Module):
    def __init__(self, model_name="bert-base-cased", freeze_base_model=True):
        super().__init__()
        self._model_name = model_name
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.bert_model = BertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        
        if freeze_base_model:
            self.bert_model.eval()
            for param in self.bert_model.parameters():
                param.requires_grad = False
        else:
            self.bert_model.train()

    def tokenize(self, sentence, max_length=400):
        encoding = self.tokenizer(
            sentence,
            max_length=max_length,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )
        return encoding

    def forward(self, input_ids, attention_mask):
        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

class DISTILBERT(nn.Module):
    def __init__(self, model_name="distilbert-base-uncased", freeze_base_model=True):
        super().__init__()
        self._model_name = model_name
        self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
        self.bert_model = DistilBertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        if freeze_base_model:
            self.bert_model.eval()
            for param in self.bert_model.parameters():
                param.requires_grad = False
        else:
            self.bert_model.train()

    def tokenize(self, sentence, max_length=400):
        encoding = self.tokenizer(
            sentence,
            max_length=max_length,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )
        return encoding

    def forward(self, input_ids, attention_mask):
        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

class LONGFORMER(nn.Module):
    def __init__(self, model_name="allenai/longformer-base-4096", freeze_base_model=True):
        super().__init__()
        self._model_name = model_name
        self.tokenizer = LongformerTokenizer.from_pretrained(model_name)
        self.bert_model = LongformerModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        if freeze_base_model:
            self.bert_model.eval()
            for param in self.bert_model.parameters():
                param.requires_grad = False
        else:
            self.bert_model.train()

    def tokenize(self, sentence, max_length=None):
        # max_length = self.bert_model.config.max_position_embeddings if max_length is None else max_length
        encoding = self.tokenizer(
            sentence,
            max_length=4096,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )
        return encoding

    def forward(self, input_ids, attention_mask):
        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

# This is for type hinting
EMBED_MODEL_TYPES = BERT | DISTILBERT | LONGFORMER

# This is for the model names
MODEL_NAMES = {
    "bert_model": BERT,
    "distilbert_model": DISTILBERT,
    "longformer_model": LONGFORMER
}

MODEL_INSTANCES = {
    "bert_model": "bert-base-uncased",
    "distilbert_model": "distilbert-base-uncased",
    "longformer_model": "allenai/longformer-base-4096"
}


if __name__ == "__main__":
    sample_txt = (
        "I want to learn how to do sentiment analysis using BERT and tokenizer."
    )
    
    bert = BERT()
    bert_freeze = BERT(freeze_base_model=True)
    bert_unfreeze = BERT(freeze_base_model=False)

    # Check frozen parameters
    print("All frozen:", all(not p.requires_grad for p in bert_freeze.bert_model.parameters()))
    print("All trainable:", all(p.requires_grad for p in bert_unfreeze.bert_model.parameters()))

    # Check training status
    print("Initial:")
    print("wrapper.training =", bert_freeze.training)
    print("bert_model.training =", bert_freeze.bert_model.training)

    bert_freeze.train()
    print("\nAfter bert_freeze.train():")
    print("wrapper.training =", bert_freeze.training)
    print("bert_model.training =", bert_freeze.bert_model.training)

    bert_freeze.eval()
    print("\nAfter bert_freeze.eval():")
    print("wrapper.training =", bert_freeze.training)
    print("bert_model.training =", bert_freeze.bert_model.training)
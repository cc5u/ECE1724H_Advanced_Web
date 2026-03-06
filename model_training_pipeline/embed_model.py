import transformers
from transformers import BertModel, BertTokenizer
from transformers import DistilBertModel, DistilBertTokenizer
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"



class BERT:
    def __init__(self, model_name="bert-base-cased"):
        self._model_name = model_name
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.bert_model = BertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.bert_model.eval()
        for param in self.bert_model.parameters():
            param.requires_grad = False

    def tokenize(self, sentence):
        encoding = self.tokenizer(
            sentence,
            max_length=400,  # Ensures the sentence has at most 32 tokens
            add_special_tokens=True,  # Add '[CLS]' and '[SEP]' # [CLS]: Start Token; [SEP]: End Token
            return_token_type_ids=False,  # Since working with a single sentence, token type IDs are not needed
            padding="max_length",  # Ensure all inputs are the same length by padding shorter ones
            return_attention_mask=True,  # Returns a tensor indicating which tokens are real (1) and which are padding (0)
            return_tensors="pt",  # Return PyTorch tensors
            truncation=True,  # Truncates the sentence if it's too long
        )
        return encoding

    def embed(self, input_ids, attention_mask):

        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

class DISTILBERT:
    def __init__(self, model_name="distilbert-base-uncased"):
        self._model_name = model_name
        self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
        self.bert_model = DistilBertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.bert_model.eval()
        for param in self.bert_model.parameters():
            param.requires_grad = False

    def tokenize(self, sentence):
        encoding = self.tokenizer(
            sentence,
            max_length=400,  # Ensures the sentence has at most 32 tokens
            add_special_tokens=True,  # Add '[CLS]' and '[SEP]' # [CLS]: Start Token; [SEP]: End Token
            return_token_type_ids=False,  # Since working with a single sentence, token type IDs are not needed
            padding="max_length",  # Ensure all inputs are the same length by padding shorter ones
            return_attention_mask=True,  # Returns a tensor indicating which tokens are real (1) and which are padding (0)
            return_tensors="pt",  # Return PyTorch tensors
            truncation=True,  # Truncates the sentence if it's too long
        )
        return encoding

    def embed(self, input_ids, attention_mask):

        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

# This is for type hinting
EMBED_MODEL_TYPES = BERT | DISTILBERT

# This is for the model instances
bert_model = BERT("bert-base-cased")
distilbert_model = DISTILBERT("distilbert-base-uncased")

# This is for the model names
MODEL_NAMES = {
    "bert_model": bert_model,
    "distilbert_model": distilbert_model
}


if __name__ == "__main__":
    sample_txt = (
        "I want to learn how to do sentiment analysis using BERT and tokenizer."
    )
    # encoding = MODEL_NAMES["bert_model"].tokenize(sample_txt)
    # output = MODEL_NAMES["bert_model"].embed(encoding["input_ids"].to(DEVICE), encoding["attention_mask"].to(DEVICE))
    # print(output.keys())
    # encoding = MODEL_NAMES["distilbert_model"].tokenize(sample_txt)
    # output = MODEL_NAMES["distilbert_model"].embed(encoding["input_ids"].to(DEVICE), encoding["attention_mask"].to(DEVICE))
    # print(output.keys())
    # print(output.hidden_states[-1].shape[-1])
    print(bert_model.bert_model.config.hidden_size)
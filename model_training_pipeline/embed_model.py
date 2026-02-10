import transformers
from transformers import BertModel, BertTokenizer
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"



class BERT:
    def __init__(self, model_name):
        self._model_name = model_name
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.bert_model = BertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)

    def tokenize(self, sentence):
        encoding = self.tokenizer.encode_plus(
            sentence,
            max_length=32,  # Ensures the sentence has at most 32 tokens
            add_special_tokens=True,  # Add '[CLS]' and '[SEP]' # [CLS]: Start Token; [SEP]: End Token
            return_token_type_ids=False,  # Since working with a single sentence, token type IDs are not needed
            padding="max_length",  # Ensure all inputs are the same length by padding shorter ones
            return_attention_mask=True,  # Returns a tensor indicating which tokens are real (1) and which are padding (0)
            return_tensors="pt",  # Return PyTorch tensors
            truncation=True,  # Truncates the sentence if it's too long
        )
        return encoding

    def forward_pass(self, encoding):
        if encoding == None:
            raise ValueError(
                "Encoding is None. Please call the 'tokenize' method first before passing data to 'model_output'."
            )

        output = self.bert_model(
            input_ids=encoding["input_ids"],
            attention_mask=encoding["attention_mask"],
            output_hidden_states=True,
        )

        return output


bert_model = BERT("bert-base-cased")


if __name__ == "__main__":
    sample_txt = (
        "I want to learn how to do sentiment analysis using BERT and tokenizer."
    )
    encoding = bert_model.tokenize(sample_txt)
    output = bert_model.forward_pass(encoding)
    print(output.keys())

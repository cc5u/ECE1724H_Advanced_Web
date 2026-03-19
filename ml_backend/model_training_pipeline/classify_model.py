# Torch
import torch
import torch.nn as nn
from model_training_pipeline.embed_model import EMBED_MODEL_TYPES
from model_training_pipeline.model_config import ClassifierConfig
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"  

class Classifier(nn.Module):

  def __init__(self, bert_model: EMBED_MODEL_TYPES, classifier_config: ClassifierConfig):
    super(Classifier, self).__init__()

    # Define the Hyperparameters
    self.n_classes = classifier_config.num_classes
    self.hidden_neurons = classifier_config.hidden_neurons
    self.dropout_rate = classifier_config.dropout
    self.classifier_type = classifier_config.classifier_type

    # Embed model
    self.bert_model = bert_model
    self.hidden_size = bert_model.bert_model.config.hidden_size
    
    # Define the classifier layer (GRU)
    self.dropout = nn.Dropout(self.dropout_rate)
    self.rnn = nn.GRU(self.hidden_size, self.hidden_neurons, bidirectional=True, batch_first=True) # Take the last hidden state
    self.fc_gru = nn.Linear(self.hidden_neurons*2, self.n_classes)

    # Define the classifier layer (Linear)
    self.pooler = nn.Sequential(
      nn.Linear(self.hidden_size, self.hidden_size),
      nn.Tanh(),
    )
    self.fc_linear = nn.Sequential(
      nn.Linear(self.hidden_size, self.hidden_neurons),
      nn.ReLU(),
      nn.Dropout(self.dropout_rate),
      nn.Linear(self.hidden_neurons, self.n_classes)
    )


  def _embed_input(self, input_ids, attention_mask):
    input_ids = input_ids.to(DEVICE)
    attention_mask = attention_mask.to(DEVICE)
    inputs = {
      "input_ids": input_ids,
      "attention_mask": attention_mask,
      "output_hidden_states": True,
    }
    outputs = self.bert_model(**inputs)
    return outputs.last_hidden_state


  def forward(self, input_ids, attention_mask):

    last_hidden = self._embed_input(input_ids, attention_mask)

    # GRU Classifier
    if self.classifier_type == "GRU":
      # Outputs: (batch_size, seq_len, hidden_neurons*2)
      # Hidden: (2, batch_size, hidden_neurons)
      lengths = attention_mask.sum(dim=1).cpu()
      packed_sequences = pack_padded_sequence(last_hidden, lengths, batch_first=True, enforce_sorted=False)
      _, hidden = self.rnn(packed_sequences)
      out = torch.cat([hidden[-2], hidden[-1]], dim=1)
      out = self.dropout(out)
      outputs = self.fc_gru(out)

    # Linear Classifier
    elif self.classifier_type == "LINEAR":
      pooled_output = last_hidden[:, 0, :]
      pooled_output = self.pooler(pooled_output)
      outputs = self.fc_linear(pooled_output)
    return outputs


if __name__ == "__main__":
  from model_training_pipeline.embed_model import EmbedModelConfig, load_embed_model
  embed_config = EmbedModelConfig(
    embed_model="bert_model",
    fine_tune_mode="unfreeze_last_n_layers",
    unfreeze_last_n_layers=1
  )
  classifier_config = ClassifierConfig(
    num_classes=2,
    hidden_neurons=128,
    dropout=0.5,
    classifier_type="GRU")

  bert_model = load_embed_model(embed_config)
  classifier = Classifier(bert_model, classifier_config)
  

  error_flag = False
  if embed_config.fine_tune_mode == "unfreeze_all":
    all_trainable = all(param.requires_grad for _, param in classifier.named_parameters())
    if all_trainable:
      print("All parameters are trainable as expected for 'unfreeze_all'.")
    else:
      print("WARNING: Some parameters are not trainable, which is unexpected for 'unfreeze_all'.")

  elif embed_config.fine_tune_mode == "freeze_all":
    for name, param in classifier.named_parameters():
      if name.startswith("bert_model"):
        if param.requires_grad:
          print(f"{name} is trainable, which is unexpected for 'freeze_all'.")
          error_flag = True
      else: # classifier parameters should be trainable
        if not param.requires_grad:
          print(f"{name} should be trainable, but is not")
          error_flag = True
    if error_flag:
      print("ERROR: Some parameters are not trainable or frozen as expected.")
    else:
      print("All parameters are trainable or frozen as expected.")
    
  elif embed_config.fine_tune_mode == "unfreeze_last_n_layers":
    # Unfreeze couple layers
      for name, param in classifier.named_parameters():
        if name.startswith("bert_model"):
          if param.requires_grad:
            print(f"{name} is trainable")
        else: # classifier parameters should be trainable
          if not param.requires_grad:
            print(f"{name} should be trainable, but is not")
            error_flag = True
      if error_flag:
        print("ERROR: Some parameters are not trainable or frozen as expected.")
      else:
        print("All parameters are trainable or frozen as expected.")

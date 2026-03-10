# Torch
import torch
import torch.nn as nn
from model_training_pipeline.embed_model import EMBED_MODEL_TYPES
from model_training_pipeline.model_config import ClassifierConfig

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
    self.fc_linear = nn.Sequential(
      nn.Linear(self.hidden_size, self.hidden_neurons),
      nn.ReLU(),
      nn.Dropout(self.dropout_rate),
      nn.Linear(self.hidden_neurons, self.n_classes)
    )


  def _embed_input(self, input_ids, attention_mask):
    input_ids = input_ids.to(DEVICE)
    attention_mask = attention_mask.to(DEVICE)
    outputs = self.bert_model.forward(input_ids, attention_mask)
    return outputs.hidden_states[-1]


  def forward(self, input_ids, attention_mask):

    last_hidden = self._embed_input(input_ids, attention_mask)
    last_hidden = self.dropout(last_hidden)

    # GRU Classifier
    if self.classifier_type == "GRU":
      outputs, hidden = self.rnn(last_hidden)
      out = torch.cat([hidden[-2], hidden[-1]], dim=1)
      out = self.dropout(out)
      outputs = self.fc_gru(out)

    # Linear Classifier
    elif self.classifier_type == "LINEAR":
      cls_token = last_hidden[:, 0, :]
      outputs = self.fc_linear(cls_token)

    # Return the outputs
    return outputs
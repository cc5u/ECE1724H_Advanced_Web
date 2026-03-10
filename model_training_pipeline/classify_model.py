# Torch
import torch
import torch.nn as nn
from model_training_pipeline.embed_model import EMBED_MODEL_TYPES

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class SentimentClassifier(nn.Module):

  def __init__(self, n_classes, bert_model: EMBED_MODEL_TYPES = None, hidden_neuron=256, dropout=0.3, num_layers=1):
    super(SentimentClassifier, self).__init__()

    if bert_model is None:
      raise ValueError("BERT model is required")
    
    self.bert_model = bert_model
    self.hidden_size = bert_model.bert_model.config.hidden_size
    
    # Clean, sequential MLP head
    self.fc = nn.Sequential(
      nn.Linear(self.hidden_size, hidden_neuron), # Fixed typo: hidden_sizez -> hidden_size
      nn.ReLU(),
      nn.Dropout(dropout),
      nn.Linear(hidden_neuron, n_classes)
    )

  def _embed_input(self, input_ids, attention_mask):
    input_ids = input_ids.to(DEVICE)
    attention_mask = attention_mask.to(DEVICE)
    outputs = self.bert_model.forward(input_ids, attention_mask)
    return outputs.hidden_states[-1]


  def forward(self, input_ids, attention_mask):
    """
    last_hidden should be a shape of [batch_size, seq_len, hidden_dim]
    """
    last_hidden = self._embed_input(input_ids, attention_mask)

    # 1. Extract the [CLS] token
    cls_token = last_hidden[:, 0, :]
    
    # 2. Pass the [CLS] token through the sequential block!
    outputs = self.fc(cls_token)

    return outputs

    

# class SentimentClassifier(nn.Module):

#   def __init__(self, n_classes, bert_model: EMBED_MODEL_TYPES = None, hidden_neuron=256, dropout=0.3, num_layers=1):
#     super(SentimentClassifier, self).__init__()

#     # Use LSTM since sequential input data
#     if bert_model is None:
#       raise ValueError("BERT model is required")
    
#     self.bert_model = bert_model
#     self.hidden_size = bert_model.bert_model.config.hidden_size
    
#     # Having bidirectional process input both backward and forward, which is good for sentiment since it requires the whole context instead of only the past words.
#     self.dropout = nn.Dropout(dropout)
#     self.rnn = nn.GRU(self.hidden_size, hidden_neuron, num_layers=num_layers, bidirectional=True, batch_first=True) # Take the last hidden state
#     self.fc = nn.Linear(hidden_neuron*2, n_classes)


#   def _embed_input(self, input_ids, attention_mask):
#     input_ids = input_ids.to(DEVICE)
#     attention_mask = attention_mask.to(DEVICE)
#     outputs = self.bert_model.forward(input_ids, attention_mask)
#     return outputs.hidden_states[-1]


#   def forward(self, input_ids, attention_mask):
#     """
#     The last_hidden shoul be a shape of [batch_size, seq_len, hidden_dim]
#     """
#     last_hidden = self._embed_input(input_ids, attention_mask)
    
#     # outputs, hidden = self.rnn(last_hidden)
#     # out = outputs[:, -1, :]
#     _, hidden = self.rnn(last_hidden)
#     out = torch.cat([hidden[-2], hidden[-1]], dim=1)
    
#     out = self.dropout(out)
#     outputs = self.fc(out)

#     return outputs
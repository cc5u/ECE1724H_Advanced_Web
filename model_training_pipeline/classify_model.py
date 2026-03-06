# Torch
import torch
import torch.nn as nn
from model_training_pipeline.embed_model import bert_model, BERT, DISTILBERT

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class SentimentClassifier(nn.Module):

  def __init__(self, n_classes, bert_model: BERT | DISTILBERT = bert_model, hidden_neuron=256, dropout=0.3, num_layers=1):
    super(SentimentClassifier, self).__init__()

    # Use LSTM since sequential input data

    # Having bidirectional process input both backward and forward, which is good for sentiment since it requires the whole context instead of only the past words.
    self.rnn = nn.GRU(768, hidden_neuron, num_layers=num_layers, bidirectional=True, batch_first=True) # Take the last hidden state
    self.fc = nn.Linear(hidden_neuron*2, n_classes)
    self.dropout = nn.Dropout(dropout)
    self.bert_model = bert_model

  def _embed_input(self, input_ids, attention_mask):
    input_ids = input_ids.to(DEVICE)
    attention_mask = attention_mask.to(DEVICE)
    outputs = self.bert_model.embed(input_ids, attention_mask)
    return outputs.hidden_states[-1]


  def forward(self, input_ids, attention_mask):
    """
    The last_hidden shoul be a shape of [batch_size, seq_len, hidden_dim]
    """
    last_hidden = self._embed_input(input_ids, attention_mask)
    outputs, hidden = self.rnn(last_hidden)

    # Use the last hidden state from the last hidden layer (Include both direction (Forward + Backward))
    out = outputs[:, -1, :]

    out = self.dropout(out)
    outputs = self.fc(out)

    return outputs
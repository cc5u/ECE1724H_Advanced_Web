"""
This script is used to preprocess the data and store the tokenized data in the database.
This file is used in dataloader.py to essentially create train/validation/test dataloaders using the dataset.
"""

from torch.utils.data import Dataset
import torch
from model_training_pipeline.embed_model import BERT
#Database
# from database import db

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class CustomizeDataset(Dataset):
    def __init__(
        self,
        text,
        targets,
        max_len,
        bert_model: BERT = None,
        # precompute=True,
        batch_size=256
    ):
        """
        reviews     : array/list of text data
        targets     : array/list of 'positive'/'negative' labels
        tokenizer   : BERT tokenizer
        max_len     : maximum sequence length for tokenization
        bert_model  : BERT model class from embed_model.py
        embed_folder: folder to store .pt files of precomputed embeddings
        precompute  : True -> generate & save embeddings, False -> load from disk only
        """
        self.texts = text
        self.targets = targets
        self.max_len = max_len
        self.bert_model = bert_model
        # self.precompute = precompute
        self.batch_size = batch_size
        # Initialize database
        # self.conn = db.init_db()

        # if self.precompute and (self.bert_model is not None):
        #     self._precompute_embeddings()

    def __len__(self): #this is needed since the parent class is Dataset
        return len(self.texts)

    def __getitem__(self, idx):  # This is needed since the parent class is Dataset
        """
        Returns a dictionary with:
          - 'input_ids'      : token ids (long tensor)
          - 'attention_mask' : attention mask (long tensor)
          - 'labels'         : 0 or 1 (long tensor)
        """
        text = str(self.texts[idx])
        target = 1 if self.targets[idx] == "positive" else 0

        enc = self.bert_model.tokenize(text)
 
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "labels": torch.tensor(target, dtype=torch.long),
        }






# This is not used since it is impractical to store all the embeddings in sqlite.

    # def __getitem__(self, idx):  # This is needed since the parent class is Dataset
    #     """
    #     Returns a dictionary with:
    #       - 'review_text'   : original text (optional, for reference)
    #       - 'pooled_output' : [768]-dim embedding tensor from BERT
    #       - 'last_hidden'   : [seq_len, 768] tensor from the last hidden layer
    #       - 'targets'       : 0 or 1 (long tensor)
    #     """
    #     text = str(self.texts[idx])
    #     # DB id is 1-based (first inserted row has id=1); dataset idx is 0-based
    #     embeddings = db.get(self.conn, idx + 1)
    #     if embeddings is None:
    #         raise KeyError(f"No embedding found for dataset index {idx} (db id {idx + 1}). Run precompute first.")

    #     pooled_tensor, last_hidden_tensor, output_tensor = db.convert_sql_data_to_tensor(embeddings["pooled_embedding"], embeddings["last_hidden_embedding"], embeddings["last_hidden_seq_len"], embeddings["last_hidden_hidden_dim"], embeddings["output"])

    #     # db.get() returns tensors for pooled_embedding, last_hidden_embedding, and output (0/1)
    #     return {
    #         "review_text": text,
    #         "pooled_output": pooled_tensor,
    #         "last_hidden": last_hidden_tensor,
    #         "targets": output_tensor,
    #     }

    # def _precompute_embeddings(self):
    #     """
    #     Precompute embeddings in batches rather than one by one.
    #     """
    #     # Move the model to device (CPU/GPU)
    #     self.bert_model = self.bert_model.to(DEVICE)
    #     self.bert_model.eval()

    #     print("Precomputing BERT embeddings (batched)...")

    #     # 1) Tokenize everything
    #     encodings = [self.tokenizer(
    #         str(text),
    #         add_special_tokens=True,
    #         max_length=self.max_len,
    #         padding="max_length",
    #         truncation=True,
    #         return_attention_mask=True,
    #         return_tensors="pt",
    #     ) for text in self.texts]
    #     input_ids = torch.cat([e['input_ids'] for e in encodings], dim=0)
    #     attention_masks = torch.cat([e['attention_mask'] for e in encodings], dim=0)

    #     # 2) Create a TensorDataset and DataLoader
    #     dataset_tensors = TensorDataset(input_ids, attention_masks)
    #     dataloader = DataLoader(
    #         dataset_tensors,
    #         batch_size=self.batch_size,
    #         shuffle=False,
    #         pin_memory=(DEVICE == "cuda"),  # faster CPU->GPU transfer when using CUDA
    #     )

    #     # We'll need to index back into `self.texts` to save each sample’s .pt
    #     idx_offset = 0 #Keep track of the review index when saving embeddings

    #     for batch in tqdm(dataloader, total=len(dataloader)):
    #         # Move batch to same device as model (required for forward pass)
    #         input_ids, attention_mask = [
    #             t.to(DEVICE, non_blocking=True) for t in batch
    #         ]

    #         with torch.no_grad():
    #             outputs = self.bert_model( # Compute BERT Embeddings
    #                 input_ids=input_ids,
    #                 attention_mask=attention_mask,
    #                 output_hidden_states=True #This makes BERT return hidden states
    #             )
    #         # outputs.pooler_output.shape is [batch_size, hidden_dim]
    #         # outputs.hidden_states[-1].shape is [batch_size, seq_len, hidden_dim]

    #         pooled_output_batch = outputs.pooler_output.detach().cpu()
    #         last_hidden_batch = outputs.hidden_states[-1].detach().cpu()

    #         # 3) Save each sample in the batch
    #         for i in range(len(input_ids)):
    #             pooled_embedding_tensor: torch.Tensor = pooled_output_batch[i].clone()
    #             last_hidden_embedding_tensor: torch.Tensor = last_hidden_batch[i].clone()
    #             pooled_embedding_dimension = pooled_embedding_tensor.shape
    #             last_hidden_embedding_dimension = last_hidden_embedding_tensor.shape
                
    #             # Convert to bytes to store in SQLite database
    #             pooled_embedding = pooled_embedding_tensor.numpy().astype(np.float32).tobytes()
    #             last_hidden_embedding = last_hidden_embedding_tensor.numpy().astype(np.float32).tobytes()

    #             sample_idx = idx_offset + i
    #             db.insert(
    #                 conn=self.conn,
    #                 pooled_embedding=pooled_embedding,
    #                 pooled_dimension=pooled_embedding_dimension[0],
    #                 output=self.targets[sample_idx],
    #                 source_id=str(sample_idx),
    #                 last_hidden_embedding=last_hidden_embedding,
    #                 last_hidden_seq_len=last_hidden_embedding_dimension[0],
    #                 last_hidden_hidden_dim=last_hidden_embedding_dimension[1],
    #             )

    #         idx_offset += len(input_ids)

    #     print("Done precomputing embeddings.")
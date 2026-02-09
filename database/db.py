import sqlite3
from pathlib import Path
from typing import Optional

import numpy as np
import torch

# Default table names
EMBEDDINGS_TABLE = "embeddings"
OUTPUTS_TABLE = "embedding_outputs"


def get_connection(db_path: str | Path) -> sqlite3.Connection:
    """Create or connect to an SQLite database at the given path."""
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row  # allow dict-like access by column name
    return conn


def create_embeddings_table(conn: sqlite3.Connection, table: str = EMBEDDINGS_TABLE) -> None:
    """
    Create the embeddings table if it does not exist.

    Columns:
        id: primary key
        source_id: optional identifier for the source (e.g. document id, row id)
        pooled_embedding: BLOB, float32 bytes, shape [hidden_dim] (e.g. 768)
        pooled_dimension: length of pooled vector (for reconstruction)
        last_hidden_embedding: BLOB, float32 bytes, flattened shape [seq_len * hidden_dim]
        last_hidden_seq_len: sequence length (for reshape)
        last_hidden_hidden_dim: hidden dim (for reshape) -> reshape to (seq_len, hidden_dim)
        created_at: timestamp
    """
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {table} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT,
            pooled_embedding BLOB NOT NULL,
            pooled_dimension INTEGER NOT NULL,
            last_hidden_embedding BLOB,
            last_hidden_seq_len INTEGER,
            last_hidden_hidden_dim INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()


def create_outputs_table(
    conn: sqlite3.Connection,
    table: str = OUTPUTS_TABLE,
    embeddings_table: str = EMBEDDINGS_TABLE,
) -> None:
    """
    Create the outputs table (one row per embedding id).
    Columns: id, embedding_id (FK to embeddings), output (TEXT), created_at.
    """
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {table} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            embedding_id INTEGER NOT NULL UNIQUE,
            output TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (embedding_id) REFERENCES {embeddings_table}(id)
        )
        """
    )
    conn.commit()


def init_db(
    db_path: str | Path = "database/embeddings.db",
    embeddings_table: str = EMBEDDINGS_TABLE,
    outputs_table: str = OUTPUTS_TABLE,
) -> sqlite3.Connection:
    """
    Initialize the database, embeddings table, and outputs table. Returns the connection.
    """
    conn = get_connection(db_path)
    create_embeddings_table(conn, table=embeddings_table)
    create_outputs_table(conn, table=outputs_table, embeddings_table=embeddings_table)
    return conn


def insert(
    conn: sqlite3.Connection,
    pooled_embedding: bytes,
    pooled_dimension: int,
    output: str,
    source_id: Optional[str] = None,
    last_hidden_embedding: Optional[bytes] = None,
    last_hidden_seq_len: Optional[int] = None,
    last_hidden_hidden_dim: Optional[int] = None,
    embeddings_table: str = EMBEDDINGS_TABLE,
    outputs_table: str = OUTPUTS_TABLE,
) -> int:
    """
    Insert one record: pooled embedding, optional last-hidden-state embedding, and output.
    Returns the embedding row id.

    For BERT-style outputs:
      pooled_embedding: outputs.pooler_output[i].numpy().astype(np.float32).tobytes()
      pooled_dimension: e.g. 768
      last_hidden_embedding: outputs.hidden_states[-1][i].numpy().astype(np.float32).tobytes()
      last_hidden_seq_len: e.g. 128
      last_hidden_hidden_dim: e.g. 768
    """
    cur = conn.execute(
        f"""
        INSERT INTO {embeddings_table} (
            source_id, pooled_embedding, pooled_dimension,
            last_hidden_embedding, last_hidden_seq_len, last_hidden_hidden_dim
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            source_id,
            pooled_embedding,
            pooled_dimension,
            last_hidden_embedding,
            last_hidden_seq_len,
            last_hidden_hidden_dim,
        ),
    )
    emb_id = cur.lastrowid
    conn.execute(
        f"""
        INSERT INTO {outputs_table} (embedding_id, output) VALUES (?, ?)
        ON CONFLICT(embedding_id) DO UPDATE SET output = excluded.output
        """,
        (emb_id, output),
    )
    conn.commit()
    return emb_id


def convert_sql_data_to_tensor(
    pooled_bytes: bytes,
    last_hidden_bytes: bytes,
    last_hidden_seq_len: int,
    last_hidden_hidden_dim: int,
    output: str,
) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    # Convert BLOB bytes to tensors
    pooled_np = np.frombuffer(pooled_bytes, dtype=np.float32)
    pooled_tensor = torch.from_numpy(pooled_np.copy())
    last_hidden_np = np.frombuffer(last_hidden_bytes, dtype=np.float32).reshape(
        last_hidden_seq_len, last_hidden_hidden_dim
    )
    last_hidden_tensor = torch.from_numpy(last_hidden_np.copy())

    # Convert output string to tensor (0=negative, 1=positive)
    output_tensor = torch.tensor(
        1 if output == "positive" else 0, dtype=torch.long
    )

    return pooled_tensor, last_hidden_tensor, output_tensor

def get(
    conn: sqlite3.Connection,
    embedding_id: int,
    embeddings_table: str = EMBEDDINGS_TABLE,
    outputs_table: str = OUTPUTS_TABLE,
) -> Optional[dict]:
    """
    Fetch one record by embedding id. Returns a dict with keys:
    id, source_id, pooled_embedding (torch.Tensor 1D), pooled_dimension,
    last_hidden_embedding (torch.Tensor 2D or None), last_hidden_seq_len, last_hidden_hidden_dim,
    output (torch.Tensor long: 0=negative, 1=positive, or None), created_at.
    Returns None if not found.
    """
    emb = conn.execute(
        f"SELECT * FROM {embeddings_table} WHERE id = ?", (embedding_id,)
    ).fetchone()
    if emb is None:
        return None
    out = conn.execute(
        f"SELECT output FROM {outputs_table} WHERE embedding_id = ?", (embedding_id,)
    ).fetchone()

    return {
        "id": emb["id"],
        "source_id": emb["source_id"],
        "pooled_embedding": emb["pooled_embedding"],
        "pooled_dimension": emb["pooled_dimension"],
        "last_hidden_embedding": emb["last_hidden_embedding"],
        "last_hidden_seq_len": emb["last_hidden_seq_len"],
        "last_hidden_hidden_dim": emb["last_hidden_hidden_dim"],
        "output": out["output"],
        "created_at": emb["created_at"],
    }

if __name__ == "__main__":
    conn = get_connection("database/embeddings.db")
    data = get(conn, 3)
    if data:
        pooled_tensor, last_hidden_tensor, output_tensor = convert_sql_data_to_tensor(data["pooled_embedding"], data["last_hidden_embedding"], data["last_hidden_seq_len"], data["last_hidden_hidden_dim"], data["output"])
        print("pooled_tensor:", pooled_tensor.shape, type(pooled_tensor))
        print("last_hidden_tensor:", last_hidden_tensor.shape, type(last_hidden_tensor))
        print("output_tensor:", output_tensor.shape, type(output_tensor), output_tensor)
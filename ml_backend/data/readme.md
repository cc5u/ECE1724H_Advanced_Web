# Data

`data.csv` is not in the repo (gitignored). Add your own CSV here for training.

## Expected format

- **Filename:** `data.csv` (in this folder).
- **Format:** CSV with two columns, header on the first row.

| Column   | Type   | Description                          |
|----------|--------|--------------------------------------|
| `input`  | string | Text input (e.g. review, comment).   |
| `output` | string | Label: `"positive"` or `"negative"`. |

**Example:**

```csv
input,output
"I really liked this product...",positive
"Not worth the money.",negative
```

- Values in `input` may contain commas and quotes; use standard CSV quoting (e.g. wrap in `"` and escape internal `"` as `""`).
- No empty rows between records.

## Loading the data

Use the helper in this package:

```python
from data.read_data import read_data

df, X, y = read_data()
# df: full DataFrame (columns: input, output)
# X: 1D array of input strings
# y: 1D array of output strings ("positive" / "negative")
```

If your CSV is elsewhere, pass the path:

```python
df, X, y = read_data(path="path/to/your.csv")
```

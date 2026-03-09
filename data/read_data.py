import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

def read_data(path: str | Path = None):
    """
    Read CSV data from the specified path and return a pandas DataFrame.
    Default: data.csv in the same directory as this script.
    """
    if path is None:
        path = Path(__file__).resolve().parent / "data.csv"
    df = pd.read_csv(path)
    df = df.dropna()

    # For testing purposes, only read the first 100 rows
    if df.shape[1] == 2:
        df.columns = ['input', 'output']
        
    X = df['input'].values
    y = df['output'].values

    # Ensure all inputs are strings to tokenize
    X = [str(x) for x in X]

    # Build class_map and number of classes
    unique_labels = sorted(df['output'].unique())
    label_to_id = {label: idx for idx, label in enumerate(unique_labels)}
    id_to_label = {idx: label for label, idx in label_to_id.items()}
    class_map = {
        "label_to_id": label_to_id,
        "id_to_label": id_to_label
    }
    num_classes = len(unique_labels)

    return df, X, y, class_map, num_classes


if __name__ == "__main__":
    df, X, y, class_map, num_classes = read_data(path = "data/News.csv")
    print(len(df), len(X), len(y), class_map, num_classes)
    print(type(X), type(y))
    non_string_indices = [(idx, val) for idx, val in enumerate(X) if not isinstance(val, str)]
    if not non_string_indices:
        print("All values in X are strings.")
    else:
        print("Non-string values found at the following indices and values:")
        for idx, val in non_string_indices:
            print(f"Index {idx}: {val} (type: {type(val)})")

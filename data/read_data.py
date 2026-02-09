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
    X = df['input'].values
    y = df['output'].values

    return df, X, y


if __name__ == "__main__":
    df, X, y = read_data()
    print(len(df), len(X), len(y))
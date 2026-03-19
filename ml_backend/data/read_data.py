import pandas as pd
from pathlib import Path


def read_data(path: str | Path = None):
    """
    Read CSV data from the specified path and return processed data.
    """
    if path is None:
        path = Path(__file__).resolve().parent / "data.csv"

    # df = pd.read_csv(path)
    df = pd.read_csv(path, encoding="latin-1")
    df = df.dropna()

    if df.shape[1] == 2:
        df.columns = ["input", "output"]

    X = df["input"].tolist()
    y = df["output"].tolist()

    # Ensure all inputs are strings
    X = [str(x) for x in X]

    # Convert labels to plain Python types
    unique_labels = sorted(df["output"].dropna().tolist())
    unique_labels = sorted(set(
        x.item() if hasattr(x, "item") else x
        for x in unique_labels
    ))

    label_to_id = {
        str(label) if isinstance(label, bytes) else label: int(idx)
        for idx, label in enumerate(unique_labels)
    }

    id_to_label = {
        int(idx): str(label) if isinstance(label, bytes) else label
        for label, idx in label_to_id.items()
    }

    class_map = {
        "label_to_id": label_to_id,
        "id_to_label": id_to_label,
    }

    num_classes = int(len(unique_labels))

    return df, X, y, class_map, num_classes

if __name__ == "__main__":
    data_path = "https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/projects/public/News.csv"
    # data_path = "data/IMDB.csv"
    # data_path = "https://deep-learning-project.tor1.digitaloceanspaces.com/users/57c7e97b-89e5-4d83-a80a-7b797753c698/dataset/4922c373-6dff-4f03-8b5b-a7d88c918428/my-data2.csv"
    df, X, y, class_map, num_classes = read_data(data_path)
    print(df.head())
    print(X[:5])
    print(y[:5])
    print(class_map)
    print(num_classes)
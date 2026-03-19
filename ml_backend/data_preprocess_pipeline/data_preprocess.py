import pandas as pd
import numpy as np
import re
import matplotlib.pyplot as plt
from IPython.display import display

# NLP Tools
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from data_preprocess_pipeline.data_config import DataConfig

nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)
STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()
URL_PATTERN = re.compile(r'https?://\S+|www\.\S+')
EMAIL_PATTERN = re.compile(r'\S+@\S+')

def _preprocess_text(text: str, config: DataConfig) -> str:
    text = str(text)

    # 1. Handle URLs
    if config.handle_urls == 'remove':
        text = re.sub(URL_PATTERN, '', text)
    elif config.handle_urls == 'replace':
        text = re.sub(URL_PATTERN, '[URL]', text)

    # 2. Handle Emails
    if config.handle_emails == 'remove':
        text = re.sub(EMAIL_PATTERN, '', text)
    elif config.handle_emails == 'replace':
        text = re.sub(EMAIL_PATTERN, '[EMAIL]', text)

    # 3. Lowercase
    if config.lowercase:
        text = text.lower()

    # 4. Remove Punctuation
    if config.remove_punctuation:
        text = text.replace('[url]', 'URL_TAG_PROTECTED').replace('[email]', 'EMAIL_TAG_PROTECTED')
        text = text.replace('[URL]', 'URL_TAG_PROTECTED').replace('[EMAIL]', 'EMAIL_TAG_PROTECTED')
        text = re.sub(r'[^\w\s]', '', text)
        text = text.replace('url_tag_protected', '[url]').replace('email_tag_protected', '[email]')
        text = text.replace('URL_TAG_PROTECTED', '[URL]').replace('EMAIL_TAG_PROTECTED', '[EMAIL]')

    words = text.split()

    # 5. Remove Stopwords
    if config.remove_stopwords:
        words = [w for w in words if w.lower() not in STOP_WORDS]

    # 6. Lemmatization
    if config.lemmatization:
        words = [LEMMATIZER.lemmatize(w) for w in words]

    return " ".join(words)

def process_text_pipeline(x: list[str], config: DataConfig) -> list[str]:
    return np.array([_preprocess_text(text, config) for text in x])

if __name__ == "__main__":
    from data.read_data import read_data
    data_path = "data/News.csv"
    data_config = DataConfig(
        data_path=data_path,
        lowercase=True,
        remove_punctuation=True,
        remove_stopwords=True,
        lemmatization=True,
        handle_urls="replace",
        handle_emails="replace",
        train_ratio=0.80,
        test_ratio=0.20,
    )
    df, X, y, class_map, num_classes = read_data(path=data_config.data_path)
    print(f"Type of X: {type(X)}")
    avg_length = sum(len(text) for text in X) / len(X)
    print(f"Average length of X before preprocessing: {avg_length:.2f} characters")
    
    import time
    start_time = time.time()
    X = process_text_pipeline(X, data_config)
    end_time = time.time()
    print(f"Type of X after preprocessing: {type(X)}")
    print(f"Time taken to preprocess text: {end_time - start_time:.2f} seconds")
    # Compute the average length (number of characters) per text in X
    avg_length = sum(len(text) for text in X) / len(X)
    print(f"Average length of X after preprocessing: {avg_length:.2f} characters")
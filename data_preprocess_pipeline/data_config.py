from typing import Literal, Optional
from pydantic import BaseModel, Field

class DataConfig(BaseModel):
    data_path: str = Field(default="https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/projects/public/spam.csv", description="Path to the data file")
    lowercase: bool = Field(default=False, description="Whether to convert text to lowercase")
    remove_punctuation: bool = Field(default=False, description="Whether to remove punctuation")
    remove_stopwords: bool = Field(default=False, description="Whether to remove stopwords")
    lemmatization: bool = Field(default=False, description="Whether to lemmatize text")
    handle_urls: Literal["keep", "remove", "replace"] = Field(default="replace", description="Whether to handle URLs")
    handle_emails: Literal["keep", "remove", "replace"] = Field(default="replace", description="Whether to handle emails")
    train_ratio: float = Field(default=0.80, ge=0.0, le=1.0)
    test_ratio: float = Field(default=0.20, ge=0.0, le=1.0)
    stratify: bool = Field(default=True, description="Whether to stratify the data")
    class_map: Optional[dict] = Field(default=None, description="Class map")
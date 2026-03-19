import boto3
import os
from botocore.config import Config
import pandas as pd
import io

from dotenv import load_dotenv
load_dotenv()

class SpaceStorageManager:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            region_name=os.getenv("DO_REGION"),
            endpoint_url=os.getenv("DO_ENDPOINT"),
            aws_access_key_id=os.getenv("DO_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("DO_SECRET_KEY"),
            config=Config(signature_version='s3v4')
        )
        self.bucket = os.getenv("DO_BUCKET_NAME")

    def upload_bytes(self, byte_data, user_id, session_id, filename):
        key = f"users/{user_id}/sessions/{session_id}/weights/{filename}"
        if not isinstance(byte_data, bytes):
            raise ValueError("Data must be in bytes format")
        self.s3_client.put_object(
            Body=byte_data,
            Bucket=self.bucket,
            Key=key
        )
        return key
    
    def read_bytes(self, user_id, session_id, filename):
        key = f"users/{user_id}/sessions/{session_id}/weights/{filename}"
        response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
        return response['Body'].read()

cloud_storage_manager = SpaceStorageManager()
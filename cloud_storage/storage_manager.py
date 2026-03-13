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
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        if not isinstance(byte_data, bytes):
            raise ValueError("Data must be in bytes format")
            
        self.s3_client.put_object(
            Body=byte_data,
            Bucket=self.bucket,
            Key=key
        )
        return key
    
    def read_bytes(self, user_id, session_id, filename):
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
        return response['Body'].read()
    
    
    def upload_csv_from_df(self, df, user_id, session_id, filename):
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        self.s3_client.put_object(
            Body=csv_buffer.getvalue(), 
            Bucket=self.bucket, 
            Key=key,
            ContentType='text/csv'
        )
        return key
    
    
    def read_csv(self, user_id, session_id, filename):
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        df = pd.read_csv(io.StringIO(content))
        return df
            

    def upload_metrics(self, metrics_json, user_id, session_id):
        import json
        key = f"projects/users/{user_id}/sessions/{session_id}/outputs/metrics.json"
        self.s3_client.put_object(Body=json.dumps(metrics_json), Bucket=self.bucket, Key=key)
        
    def upload_image(self, local_path, user_id, session_id, filename):
        
        key = f"projects/users/{user_id}/sessions/{session_id}/outputs/{filename}"
        self.s3_client.upload_file(
            local_path, 
            self.bucket, 
            key,
            ExtraArgs={'ContentType': 'image/png'} 
        )
        return key
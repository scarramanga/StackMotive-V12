"""
Vault Client - Storage backend for portfolio snapshots
"""
import os
import shutil
from typing import Dict, Any, Optional
from datetime import datetime


def get_vault_backend() -> str:
    """Get configured vault backend"""
    return os.getenv('VAULT_BACKEND', 'local')


def push_to_local_vault(artifacts: Dict[str, Any], user_id: int) -> Dict[str, str]:
    """
    Push artifacts to local vault storage
    
    Args:
        artifacts: Dict of artifact paths and checksums
        user_id: User ID
    
    Returns:
        Dict with vault locations
    """
    vault_path = os.getenv('VAULT_LOCAL_PATH', '/tmp/vault')
    date_str = datetime.utcnow().strftime('%Y-%m-%d')
    user_vault = os.path.join(vault_path, date_str, str(user_id))
    
    os.makedirs(user_vault, exist_ok=True)
    
    locations = {}
    for format_type, artifact_info in artifacts.items():
        if 'path' in artifact_info:
            source_path = artifact_info['path']
            filename = os.path.basename(source_path)
            dest_path = os.path.join(user_vault, filename)
            
            shutil.copy2(source_path, dest_path)
            locations[format_type] = dest_path
    
    return locations


def push_to_s3_vault(artifacts: Dict[str, Any], user_id: int) -> Dict[str, str]:
    """
    Push artifacts to S3-compatible storage
    
    Args:
        artifacts: Dict of artifact paths and checksums
        user_id: User ID
    
    Returns:
        Dict with S3 URIs
    """
    import boto3
    from botocore.exceptions import ClientError
    
    bucket = os.getenv('VAULT_S3_BUCKET')
    region = os.getenv('VAULT_S3_REGION', 'us-east-1')
    access_key = os.getenv('VAULT_S3_ACCESS_KEY_ID')
    secret_key = os.getenv('VAULT_S3_SECRET_ACCESS_KEY')
    
    if not all([bucket, access_key, secret_key]):
        raise ValueError("S3 credentials not configured")
    
    s3_client = boto3.client(
        's3',
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )
    
    date_str = datetime.utcnow().strftime('%Y-%m-%d')
    s3_prefix = f"{date_str}/{user_id}"
    
    locations = {}
    for format_type, artifact_info in artifacts.items():
        if 'path' in artifact_info:
            source_path = artifact_info['path']
            filename = os.path.basename(source_path)
            s3_key = f"{s3_prefix}/{filename}"
            
            try:
                s3_client.upload_file(source_path, bucket, s3_key)
                locations[format_type] = f"s3://{bucket}/{s3_key}"
            except ClientError as e:
                raise RuntimeError(f"Failed to upload {filename} to S3: {e}")
    
    return locations


def push_artifacts(artifacts: Dict[str, Any], user_id: int) -> Dict[str, str]:
    """
    Push artifacts to configured vault backend
    
    Args:
        artifacts: Dict of artifact paths and checksums
        user_id: User ID
    
    Returns:
        Dict with vault locations by format type
    """
    backend = get_vault_backend()
    
    if backend == 's3':
        return push_to_s3_vault(artifacts, user_id)
    else:
        return push_to_local_vault(artifacts, user_id)

"""
Tests for vault_client.py
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
import tempfile
from unittest.mock import patch, MagicMock
from server.services.vault_client import (
    get_vault_backend,
    push_to_local_vault,
    push_to_s3_vault,
    push_artifacts
)


def test_get_vault_backend_default():
    """Test default vault backend"""
    with patch.dict(os.environ, {}, clear=True):
        backend = get_vault_backend()
        assert backend == 'local'


def test_get_vault_backend_s3():
    """Test S3 vault backend"""
    with patch.dict(os.environ, {'VAULT_BACKEND': 's3'}):
        backend = get_vault_backend()
        assert backend == 's3'


def test_push_to_local_vault():
    """Test pushing to local vault"""
    with tempfile.TemporaryDirectory() as tmpdir:
        artifact_file = os.path.join(tmpdir, 'test.json')
        with open(artifact_file, 'w') as f:
            f.write('{"test": "data"}')
        
        artifacts = {
            "json": {"path": artifact_file, "checksum": "abc123"}
        }
        
        vault_path = os.path.join(tmpdir, 'vault')
        with patch.dict(os.environ, {'VAULT_LOCAL_PATH': vault_path}):
            locations = push_to_local_vault(artifacts, user_id=1)
        
        assert 'json' in locations
        assert os.path.exists(locations['json'])
        
        with open(locations['json'], 'r') as f:
            content = f.read()
            assert content == '{"test": "data"}'


def test_push_to_s3_vault_mocked():
    """Test S3 vault push with mocked client"""
    mock_s3_client = MagicMock()
    
    with tempfile.TemporaryDirectory() as tmpdir:
        artifact_file = os.path.join(tmpdir, 'test.json')
        with open(artifact_file, 'w') as f:
            f.write('{"test": "data"}')
        
        artifacts = {
            "json": {"path": artifact_file, "checksum": "abc123"}
        }
        
        with patch('boto3.client', return_value=mock_s3_client):
            with patch.dict(os.environ, {
                'VAULT_S3_BUCKET': 'test-bucket',
                'VAULT_S3_ACCESS_KEY_ID': 'test-key',
                'VAULT_S3_SECRET_ACCESS_KEY': 'test-secret'
            }):
                locations = push_to_s3_vault(artifacts, user_id=1)
        
        assert 'json' in locations
        assert locations['json'].startswith('s3://test-bucket/')
        mock_s3_client.upload_file.assert_called_once()


def test_push_artifacts_local():
    """Test push_artifacts with local backend"""
    with tempfile.TemporaryDirectory() as tmpdir:
        artifact_file = os.path.join(tmpdir, 'test.json')
        with open(artifact_file, 'w') as f:
            f.write('{"test": "data"}')
        
        artifacts = {
            "json": {"path": artifact_file, "checksum": "abc123"}
        }
        
        vault_path = os.path.join(tmpdir, 'vault')
        with patch.dict(os.environ, {
            'VAULT_BACKEND': 'local',
            'VAULT_LOCAL_PATH': vault_path
        }):
            locations = push_artifacts(artifacts, user_id=1)
        
        assert 'json' in locations
        assert os.path.exists(locations['json'])

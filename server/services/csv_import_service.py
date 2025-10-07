"""
CSV portfolio import service with pandas parsing and field mapping
Adapted from StackMotive_Final tmp_services/backend/portfolio_loader.py
"""
import os
from typing import List, Dict, Tuple
from pydantic import BaseModel, validator
import pandas as pd
from io import StringIO
from fastapi import HTTPException, UploadFile
import logging

logger = logging.getLogger(__name__)

CSV_MAX_ROWS = int(os.getenv("CSV_MAX_ROWS", "10000"))
CSV_MAX_SIZE_MB = int(os.getenv("CSV_MAX_SIZE_MB", "20"))
CSV_AGENT_LOG = os.getenv("CSV_AGENT_LOG", "false").lower() == "true"


class PortfolioPosition(BaseModel):
    """Portfolio position with validation"""
    symbol: str
    name: str = ""
    quantity: float
    avgPrice: float
    currentPrice: float = 0.0
    assetClass: str = "equity"
    account: str = "default"
    currency: str = "USD"
    syncSource: str = "csv"
    
    @validator('quantity', 'avgPrice')
    def must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('must be positive')
        return v
    
    @validator('assetClass')
    def valid_asset_class(cls, v):
        valid_classes = ['equity', 'crypto', 'fund', 'bond', 'cash']
        if v not in valid_classes:
            raise ValueError(f'must be one of {valid_classes}')
        return v


async def validate_csv_file(file: UploadFile) -> str:
    """
    Validate CSV file size and read contents
    
    Args:
        file: FastAPI UploadFile
    
    Returns:
        CSV data as string
        
    Raises:
        HTTPException: If file too large or invalid
    """
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    
    if size_mb > CSV_MAX_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {size_mb:.1f}MB (max {CSV_MAX_SIZE_MB}MB)"
        )
    
    try:
        csv_data = contents.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid UTF-8 encoding")
    
    return csv_data


def parse_csv_with_mapping(
    csv_data: str,
    field_mapping: Dict[str, str],
    user_id: int
) -> Tuple[List[PortfolioPosition], List[str]]:
    """
    Parse CSV data with flexible field mapping
    
    Args:
        csv_data: Raw CSV string
        field_mapping: Dict mapping our fields to CSV column names
        user_id: User ID for agent logging
    
    Returns:
        Tuple of (positions list, errors list)
    """
    try:
        df = pd.read_csv(StringIO(csv_data))
        
        if len(df) > CSV_MAX_ROWS:
            raise HTTPException(
                status_code=400,
                detail=f"Too many rows: {len(df)} (max {CSV_MAX_ROWS})"
            )
        
        if df.empty or len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="CSV has no headers or columns")
        
        if CSV_AGENT_LOG:
            logger.info(f"CSV import: userId={user_id}, rows={len(df)}, columns={list(df.columns)}")
        
        positions = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                position_data = {
                    'symbol': str(row.get(field_mapping.get('symbol', 'Symbol'), '')).strip(),
                    'name': str(row.get(field_mapping.get('name', 'Name'), '')).strip(),
                    'quantity': float(row.get(field_mapping.get('quantity', 'Quantity'), 0)),
                    'avgPrice': float(row.get(field_mapping.get('avgPrice', 'Avg Price'), 0)),
                    'currentPrice': float(row.get(field_mapping.get('currentPrice', 'Current Price'), 0) or 0),
                    'assetClass': str(row.get(field_mapping.get('assetClass', 'Asset Class'), 'equity')).strip(),
                    'account': str(row.get(field_mapping.get('account', 'Account'), 'default')).strip(),
                    'currency': str(row.get(field_mapping.get('currency', 'Currency'), 'USD')).strip(),
                    'syncSource': 'csv',
                }
                
                position = PortfolioPosition(**position_data)
                positions.append(position)
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")  # +2 for 1-indexing and header row
        
        return positions, errors
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail=f"CSV processing error: {str(e)}")


def parse_standard_csv(csv_data: str, user_id: int) -> Tuple[List[PortfolioPosition], List[str]]:
    """
    Parse CSV with standard column names
    
    Standard columns: Symbol, Name, Quantity, Avg Price, Current Price, Asset Class, Account, Currency
    """
    standard_mapping = {
        'symbol': 'Symbol',
        'name': 'Name',
        'quantity': 'Quantity',
        'avgPrice': 'Avg Price',
        'currentPrice': 'Current Price',
        'assetClass': 'Asset Class',
        'account': 'Account',
        'currency': 'Currency',
    }
    return parse_csv_with_mapping(csv_data, standard_mapping, user_id)

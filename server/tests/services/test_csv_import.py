import pytest
from io import BytesIO
from fastapi import UploadFile
from server.services.csv_import_service import (
    parse_csv_with_mapping,
    parse_standard_csv,
    validate_csv_file,
    PortfolioPosition,
    CSV_MAX_ROWS
)


SAMPLE_CSV = """Symbol,Name,Quantity,Avg Price,Current Price,Asset Class,Account,Currency
TEST1,Test Asset 1,100,140.50,150.25,equity,Brokerage,USD
TEST2,Test Asset 2,50,2700.00,2800.50,equity,Brokerage,USD
TESTBTC,Test Bitcoin,0.5,40000.00,45000.00,crypto,Crypto Wallet,USD
TEST3,Test Asset 3,25,650.00,700.00,equity,IRA,USD"""


CUSTOM_MAPPING_CSV = """Ticker,Company,Shares,Cost,Price,Type
TEST1,Test Asset 1,100,140.50,150.25,stock
TEST2,Test Asset 2,75,250.00,300.00,stock"""


def test_parse_standard_csv():
    """Test parsing CSV with standard column names"""
    positions, errors = parse_standard_csv(SAMPLE_CSV, user_id=1)
    
    assert len(positions) == 4
    assert len(errors) == 0
    
    assert positions[0].symbol == "TEST1"
    assert positions[0].name == "Test Asset 1"
    assert positions[0].quantity == 100.0
    assert positions[0].avgPrice == 140.50
    assert positions[0].currentPrice == 150.25
    assert positions[0].assetClass == "equity"
    assert positions[0].account == "Brokerage"
    assert positions[0].currency == "USD"
    
    assert positions[2].symbol == "TESTBTC"
    assert positions[2].assetClass == "crypto"


def test_parse_csv_with_custom_mapping():
    """Test parsing CSV with custom field mapping"""
    field_mapping = {
        'symbol': 'Ticker',
        'name': 'Company',
        'quantity': 'Shares',
        'avgPrice': 'Cost',
        'currentPrice': 'Price',
        'assetClass': 'Type',
    }
    
    positions, errors = parse_csv_with_mapping(CUSTOM_MAPPING_CSV, field_mapping, user_id=1)
    
    assert len(positions) == 2
    assert len(errors) == 0
    assert positions[0].symbol == "TEST1"
    assert positions[0].quantity == 100.0


def test_parse_csv_with_errors():
    """Test CSV with invalid rows (per-row error reporting)"""
    bad_csv = """Symbol,Quantity,Avg Price
TEST1,100,150.00
TEST2,-50,2800.50
TEST3,invalid,700.00"""
    
    positions, errors = parse_standard_csv(bad_csv, user_id=1)
    
    assert len(positions) == 1
    assert len(errors) == 2
    assert "Row 3" in errors[0]
    assert "Row 4" in errors[1]


def test_parse_csv_row_limit():
    """Test CSV row limit enforcement"""
    rows = ["Symbol,Quantity,Avg Price"]
    for i in range(CSV_MAX_ROWS + 10):
        rows.append(f"TEST{i},100,150.00")
    large_csv = "\n".join(rows)
    
    from fastapi import HTTPException
    with pytest.raises(HTTPException, match="Too many rows"):
        parse_standard_csv(large_csv, user_id=1)


def test_parse_csv_no_headers():
    """Test CSV with no headers"""
    from fastapi import HTTPException
    with pytest.raises(HTTPException, match="no headers"):
        parse_standard_csv("", user_id=1)


@pytest.mark.asyncio
async def test_validate_csv_file_size_limit():
    """Test file size limit enforcement"""
    from server.services.csv_import_service import CSV_MAX_SIZE_MB
    from fastapi import HTTPException
    
    large_content = b"x" * (CSV_MAX_SIZE_MB * 1024 * 1024 + 1000)
    file = UploadFile(filename="test.csv", file=BytesIO(large_content))
    
    with pytest.raises(HTTPException, match="File too large"):
        await validate_csv_file(file)


@pytest.mark.asyncio
async def test_validate_csv_file_valid():
    """Test valid CSV file"""
    content = SAMPLE_CSV.encode('utf-8')
    file = UploadFile(filename="test.csv", file=BytesIO(content))
    
    result = await validate_csv_file(file)
    assert result == SAMPLE_CSV


def test_pydantic_validation():
    """Test Pydantic model validation"""
    valid_data = {
        'symbol': 'TEST1',
        'quantity': 100.0,
        'avgPrice': 150.0,
    }
    position = PortfolioPosition(**valid_data)
    assert position.symbol == 'TEST1'
    
    with pytest.raises(ValueError, match="must be positive"):
        PortfolioPosition(symbol='TEST1', quantity=-100.0, avgPrice=150.0)
    
    with pytest.raises(ValueError, match="must be one of"):
        PortfolioPosition(symbol='TEST1', quantity=100.0, avgPrice=150.0, assetClass='invalid')

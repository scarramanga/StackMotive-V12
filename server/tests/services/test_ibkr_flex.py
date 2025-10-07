import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from unittest.mock import patch, AsyncMock
import xml.etree.ElementTree as ET
from server.services import ibkr_flex_service


MOCK_XML_RESPONSE = """<?xml version="1.0" encoding="UTF-8"?>
<FlexQueryResponse>
  <FlexStatement accountId="U0000000" whenGenerated="2024-10-07T00:00:00">
    <CashReportCurrency currency="USD" endingCash="10000.50"/>
    <CashReportCurrency currency="EUR" endingCash="5000.25"/>
    <OpenPosition symbol="TEST1" description="Test Asset 1" position="100" 
                   markPrice="150.25" currency="USD" positionValue="15025.00" 
                   fxRateToBase="1.0"/>
    <OpenPosition symbol="TEST2" description="Test Asset 2" position="50" 
                   markPrice="2800.50" currency="USD" positionValue="140025.00" 
                   fxRateToBase="1.0"/>
  </FlexStatement>
</FlexQueryResponse>"""

MOCK_XML_NO_STATEMENT = """<?xml version="1.0" encoding="UTF-8"?>
<FlexQueryResponse>
  <Status>Success</Status>
</FlexQueryResponse>"""

MOCK_XML_NO_REFERENCE = """<?xml version="1.0" encoding="UTF-8"?>
<FlexQueryResponse>
  <Status>Success</Status>
</FlexQueryResponse>"""


@pytest.mark.asyncio
async def test_fetch_statement_xml_success():
    """Test successful IBKR Flex statement fetch"""
    with patch.dict('os.environ', {'IBKR_FLEX_TOKEN': 'test_token', 'IBKR_FLEX_QUERY_ID': 'test_query'}):
        send_response = AsyncMock()
        send_response.text = '<FlexQueryResponse><Status>Success</Status><ReferenceCode>123456</ReferenceCode></FlexQueryResponse>'
        
        get_response = AsyncMock()
        get_response.text = MOCK_XML_RESPONSE
        
        with patch('server.services.ibkr_flex_service.request_with_retry', side_effect=[send_response, get_response]):
            result = await ibkr_flex_service.fetch_statement_xml()
            
            assert result is not None
            assert result.find('.//FlexStatement') is not None


@pytest.mark.asyncio
async def test_fetch_statement_xml_not_configured():
    """Test error when credentials missing"""
    with patch.dict('os.environ', {}, clear=True):
        with pytest.raises(ibkr_flex_service.IbkrFlexNotConfigured):
            await ibkr_flex_service.fetch_statement_xml()


@pytest.mark.asyncio
async def test_fetch_statement_xml_no_reference_code():
    """Test error when no ReferenceCode returned"""
    with patch.dict('os.environ', {'IBKR_FLEX_TOKEN': 'test_token', 'IBKR_FLEX_QUERY_ID': 'test_query'}):
        send_response = AsyncMock()
        send_response.text = MOCK_XML_NO_REFERENCE
        
        with patch('server.services.ibkr_flex_service.request_with_retry', return_value=send_response):
            with pytest.raises(ibkr_flex_service.IbkrFlexError, match="No ReferenceCode"):
                await ibkr_flex_service.fetch_statement_xml()


def test_parse_minimal_payload():
    """Test XML parsing into normalized payload"""
    xml_root = ET.fromstring(MOCK_XML_RESPONSE)
    payload = ibkr_flex_service.parse_minimal_payload(xml_root)
    
    assert payload["broker"] == "ibkr"
    assert payload["accountId"] == "U0000000"
    assert "USD" in payload["cashByCcy"]
    assert "EUR" in payload["cashByCcy"]
    assert len(payload["portfolio"]["positions"]) == 2
    assert payload["portfolio"]["positions"][0]["symbol"] == "TEST1"
    assert payload["portfolio"]["positions"][0]["quantity"] == 100.0
    assert payload["positionsImported"] == 2
    assert payload["currencies"] == ["USD", "EUR"]
    assert "_digest" in payload


def test_parse_minimal_payload_no_statement():
    """Test error when no FlexStatement in XML"""
    xml_root = ET.fromstring(MOCK_XML_NO_STATEMENT)
    
    with pytest.raises(ibkr_flex_service.IbkrFlexError, match="No FlexStatement"):
        ibkr_flex_service.parse_minimal_payload(xml_root)


def test_compute_statement_digest():
    """Test digest computation for idempotency"""
    digest1 = ibkr_flex_service.compute_statement_digest("U123", "2024-10-07", 5)
    digest2 = ibkr_flex_service.compute_statement_digest("U123", "2024-10-07", 5)
    digest3 = ibkr_flex_service.compute_statement_digest("U123", "2024-10-07", 6)
    
    assert digest1 == digest2
    assert digest1 != digest3

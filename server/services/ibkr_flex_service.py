"""
IBKR Flex Query service for portfolio data import
Harvested from StackMotive-V11 server/services/brokers/ibkr_flex_client.py
"""
import os
import time
import hashlib
import xml.etree.ElementTree as ET
from server.services.http_client import request_with_retry

class IbkrFlexError(Exception):
    """IBKR Flex API error"""
    pass


class IbkrFlexNotConfigured(IbkrFlexError):
    """IBKR Flex credentials not configured"""
    pass


def compute_statement_digest(account_id: str, when_generated: str, position_count: int) -> str:
    """
    Compute unique digest for IBKR statement to enable idempotency
    
    Args:
        account_id: IBKR account ID
        when_generated: Statement generation timestamp
        position_count: Number of positions in statement
    
    Returns:
        SHA256 hex digest
    """
    digest_input = f"{account_id}|{when_generated}|{position_count}"
    return hashlib.sha256(digest_input.encode()).hexdigest()


async def fetch_statement_xml():
    """
    Fetch IBKR Flex Query statement XML with retry logic
    
    Returns:
        XML ElementTree root with FlexQueryResponse
        
    Raises:
        IbkrFlexNotConfigured: Missing credentials
        IbkrFlexError: API errors
    """
    flex_token = os.getenv("IBKR_FLEX_TOKEN")
    flex_query = os.getenv("IBKR_FLEX_QUERY_ID")
    flex_base = os.getenv(
        "IBKR_FLEX_BASE",
        "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService",
    )
    
    if not (flex_token and flex_query):
        raise IbkrFlexNotConfigured("Missing IBKR_FLEX_TOKEN or IBKR_FLEX_QUERY_ID")

    try:
        r = await request_with_retry(
            "GET",
            f"{flex_base}/SendRequest",
            params={"t": flex_token, "q": flex_query, "v": "3"},
        )
    except Exception as e:
        raise IbkrFlexError(f"SendRequest failed: {e}") from e
    
    root = ET.fromstring(r.text)
    status = root.findtext(".//Status") or ""
    if status != "Success":
        msg = root.findtext(".//ErrorMessage") or "SendRequest failed"
        raise IbkrFlexError(msg)
    ref = root.findtext(".//ReferenceCode")
    if not ref:
        raise IbkrFlexError("No ReferenceCode returned")

    for attempt in range(10):
        try:
            g = await request_with_retry(
                "GET",
                f"{flex_base}/GetStatement",
                params={"t": flex_token, "q": ref, "v": "3"},
            )
        except Exception as e:
            if attempt == 9:
                raise IbkrFlexError(f"GetStatement polling failed: {e}") from e
            time.sleep(1)
            continue
        
        gr = ET.fromstring(g.text)
        if (
            gr.tag == "FlexQueryResponse"
            and gr.find(".//FlexStatement") is not None
        ):
            return gr
        time.sleep(1)

    raise IbkrFlexError("Statement not ready after polling")


def _as_float(s):
    """Convert string to float, return 0.0 on error"""
    try:
        return float(s)
    except:
        return 0.0


def parse_minimal_payload(xml_root):
    """
    Parse IBKR Flex XML into normalized portfolio payload
    
    Args:
        xml_root: XML ElementTree root from fetch_statement_xml()
        
    Returns:
        Dict with broker, accountId, cash, positions, totalValue, digest
    """
    stmt = xml_root.find(".//FlexStatement")
    if stmt is None:
        raise IbkrFlexError("No FlexStatement in response")

    account_id = stmt.get("accountId") or ""
    base_currency = "BASE"
    as_of = stmt.get("whenGenerated") or ""

    cash = {}
    for c in xml_root.findall(".//CashReportCurrency"):
        ccy = c.get("currency")
        if not ccy:
            continue
        cash[ccy] = _as_float(c.get("endingCash") or "0")

    positions = []
    total_base = 0.0
    for p in xml_root.findall(".//OpenPosition"):
        qty = _as_float(p.get("position") or "0")
        mark = _as_float(p.get("markPrice") or "0")
        val_ccy = _as_float(p.get("positionValue") or "0")
        fx_to_base = _as_float(p.get("fxRateToBase") or "1")
        val_base = val_ccy * fx_to_base
        total_base += val_base
        positions.append(
            {
                "symbol": p.get("symbol"),
                "description": p.get("description"),
                "quantity": qty,
                "markPrice": mark,
                "currency": p.get("currency"),
                "valueCcy": val_ccy,
                "valueBase": val_base,
            }
        )

    digest = compute_statement_digest(account_id, as_of, len(positions))

    return {
        "broker": "ibkr",
        "accountId": account_id,
        "baseCurrency": base_currency,
        "asOf": as_of,
        "cashByCcy": cash,
        "currencies": list(cash.keys()),
        "portfolio": {"positions": positions, "totalValue": total_base},
        "positionsImported": len(positions),
        "_digest": digest,
    }


async def get_ibkr_portfolio_payload():
    """
    Main entry point: Fetch and parse IBKR Flex portfolio data
    
    Returns:
        Normalized portfolio dict with positions and cash
    """
    xml_root = await fetch_statement_xml()
    return parse_minimal_payload(xml_root)

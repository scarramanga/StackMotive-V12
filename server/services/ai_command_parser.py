import re
from typing import Optional, Dict, Any

def parse_ai_command(text: str) -> Optional[Dict[str, Any]]:
    """
    Parse natural language command into structured action.
    Returns None if not a command.
    """
    text = text.lower().strip()
    
    if any(keyword in text for keyword in ['add to watchlist', 'watchlist add', 'track']):
        symbol_match = re.search(r'\$?([A-Z]{1,5})\b', text.upper())
        if symbol_match:
            return {
                'action': 'add_to_watchlist',
                'symbol': symbol_match.group(1),
                'notes': text
            }
    
    if any(keyword in text for keyword in ['remove from watchlist', 'untrack', 'stop watching']):
        symbol_match = re.search(r'\$?([A-Z]{1,5})\b', text.upper())
        if symbol_match:
            return {
                'action': 'remove_from_watchlist',
                'symbol': symbol_match.group(1)
            }
    
    if any(keyword in text for keyword in ['set alert', 'create alert', 'notify me', 'alert me']):
        symbol_match = re.search(r'\$?([A-Z]{1,5})\b', text.upper())
        price_match = re.search(r'\$?(\d+(?:\.\d+)?)', text)
        if symbol_match:
            return {
                'action': 'create_alert',
                'symbol': symbol_match.group(1),
                'trigger_price': float(price_match.group(1)) if price_match else None,
                'notes': text
            }
    
    if any(keyword in text for keyword in ['export', 'download report', 'generate report']):
        return {
            'action': 'export_portfolio',
            'format': 'csv'
        }
    
    return None

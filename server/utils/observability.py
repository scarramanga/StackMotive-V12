"""
Observability utilities for structured logging
"""
import json
import time
from typing import Dict, Any
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)


def log_import_event(
    source: str,
    user_id: int,
    items_imported: int,
    duration_ms: int,
    status: str,
    error: str = None
):
    """
    Log a structured import event
    
    Args:
        source: Data source name (e.g., "ibkr", "kucoin", "csv")
        user_id: User ID performing the import
        items_imported: Number of items successfully imported
        duration_ms: Operation duration in milliseconds
        status: Operation status ("success" or "error")
        error: Error message if status is "error"
    """
    context = {
        "source": source,
        "userId": user_id,
        "itemsImported": items_imported,
        "duration_ms": duration_ms,
        "status": status
    }
    
    if error:
        context["error"] = error
    
    logger.info(json.dumps(context))


@contextmanager
def log_import_operation(source: str, user_id: int):
    """
    Context manager to log import operations with timing
    
    Usage:
        with log_import_operation("ibkr", user_id) as ctx:
            ctx["itemsImported"] = 100
    """
    start_time = time.time()
    context = {"source": source, "userId": user_id, "status": "success"}
    
    try:
        yield context
    except Exception as e:
        context["status"] = "error"
        context["error"] = str(e)
        raise
    finally:
        duration_ms = int((time.time() - start_time) * 1000)
        context["duration_ms"] = duration_ms
        logger.info(json.dumps(context))

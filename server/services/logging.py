"""
Structured logging service with PII redaction and correlation IDs.
Based on StackMotive-V11 log_manager.py with enhancements for V12.
"""
import os
import logging
import logging.handlers
import uuid
import json
import re
from datetime import datetime
from typing import Optional

LOG_DIR = "./logs"
APP_LOG_FILE = os.path.join(LOG_DIR, "app.log")

EXCLUDED_PATTERNS = [
    "PING",
    "PONG", 
    "Sending packet MESSAGE",
    "Received packet MESSAGE",
]


class JSONFormatter(logging.Formatter):
    """Format logs as JSON with structured fields"""
    def format(self, record):
        record_dict = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "none"),
        }
        return json.dumps(record_dict)


class NoiseFilter(logging.Filter):
    """Filter out noisy log messages"""
    def filter(self, record):
        msg = record.getMessage()
        return not any(p in msg for p in EXCLUDED_PATTERNS)


PII_PATTERNS = [
    # Email addresses
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL_REDACTED]"),
    # Phone numbers (international format)
    (r"\+?[1-9]\d{1,14}", "[PHONE_REDACTED]"),
    # Credit card numbers (basic pattern)
    (r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[CARD_REDACTED]"),
    # JWT tokens (basic pattern)
    (r"eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*", "[JWT_REDACTED]"),
    # API keys (common patterns)
    (r"sk_[a-zA-Z0-9]{24,}", "[API_KEY_REDACTED]"),
    (r"pk_[a-zA-Z0-9]{24,}", "[API_KEY_REDACTED]"),
    # UUIDs (when used as sensitive identifiers)
    (
        r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b",
        "[UUID_REDACTED]",
    ),
    # IRD numbers (New Zealand tax numbers)
    (r"\b\d{2,3}-?\d{3}-?\d{3}\b", "[IRD_REDACTED]"),
    # Australian TFN (Tax File Numbers)
    (r"\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b", "[TFN_REDACTED]"),
    # Generic sensitive data patterns
    (r'password["\s]*[:=]["\s]*[^"\s,}]+', 'password": "[REDACTED]'),
    (r'secret["\s]*[:=]["\s]*[^"\s,}]+', 'secret": "[REDACTED]'),
    (r'token["\s]*[:=]["\s]*[^"\s,}]+', 'token": "[REDACTED]'),
]


def redact_pii(message: str) -> str:
    """
    Redact personally identifiable information from log messages

    Args:
        message: The log message to redact

    Returns:
        The message with PII redacted
    """
    redacted_message = message

    for pattern, replacement in PII_PATTERNS:
        redacted_message = re.sub(
            pattern, replacement, redacted_message, flags=re.IGNORECASE
        )

    return redacted_message


def setup_logging(
    level: str = "INFO",
    log_format: str = "json", 
    sampling_rate: float = 1.0
):
    """Configure application logging with JSON format and PII redaction"""
    logger = logging.getLogger()
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)

    logger.handlers.clear()

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    if log_format == "json":
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
    console_handler.addFilter(NoiseFilter())
    logger.addHandler(console_handler)

    try:
        if not os.path.exists(LOG_DIR):
            os.makedirs(LOG_DIR)
        
        file_handler = logging.handlers.TimedRotatingFileHandler(
            APP_LOG_FILE, when="midnight", backupCount=7
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(JSONFormatter())
        file_handler.addFilter(NoiseFilter())
        logger.addHandler(file_handler)
    except (PermissionError, OSError) as e:
        print(f"Warning: Cannot create log file {APP_LOG_FILE}: {e}")
        print("Continuing with console logging only")


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(name)


def log_with_request_id(logger: logging.Logger, level: int, message: str, request_id: Optional[str] = None):
    """Log a message with request ID context"""
    extra = {"request_id": request_id or str(uuid.uuid4())}
    logger.log(level, redact_pii(message), extra=extra)

"""
Logging middleware for structured request/response logging.
Based on StackMotive-V11 middleware/logging.py with request ID correlation.
"""
import time
import json
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests with timing and request ID correlation"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "unknown")
        
        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start_time) * 1000)
            
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            }
            logger.info(json.dumps(log_data))
            return response
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": 500,
                "duration_ms": duration_ms,
                "error": str(e),
            }
            logger.error(json.dumps(log_data))
            raise

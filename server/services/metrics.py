"""
Metrics collection service for application monitoring.
Based on StackMotive-V11 middleware/metrics.py with custom metrics implementation.
"""
import time
from typing import Dict, Any
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class MetricsCollector:
    """Collect application metrics for monitoring"""
    
    def __init__(self, namespace: str = "stackmotive"):
        self.namespace = namespace
        self._metrics = {
            "total_requests": 0,
            "error_count": 0,
            "total_duration_ms": 0,
        }
    
    def increment_requests(self):
        """Increment total request counter"""
        self._metrics["total_requests"] += 1
    
    def increment_errors(self):
        """Increment error counter"""
        self._metrics["error_count"] += 1
    
    def add_duration(self, duration_ms: int):
        """Add request duration to total"""
        self._metrics["total_duration_ms"] += duration_ms
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot"""
        avg_response_time = 0
        if self._metrics["total_requests"] > 0:
            avg_response_time = self._metrics["total_duration_ms"] // self._metrics["total_requests"]
        
        return {
            "total_requests": self._metrics["total_requests"],
            "error_count": self._metrics["error_count"],
            "avg_response_time_ms": avg_response_time,
        }


metrics_collector = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            return response
        except Exception:
            metrics_collector.increment_errors()
            raise
        finally:
            duration_ms = int((time.time() - start_time) * 1000)
            metrics_collector.increment_requests()
            metrics_collector.add_duration(duration_ms)

"""
Request context middleware for X-Request-ID header propagation.
Generates or extracts request IDs and makes them available throughout the request lifecycle.
"""
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to generate and propagate X-Request-ID headers.
    Extracts X-Request-ID from incoming requests or generates a new one.
    Adds the request ID to the response headers and makes it available to the request state.
    """
    
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        request.state.request_id = request_id
        
        try:
            response = await call_next(request)
        except Exception as e:
            raise
        
        if isinstance(response, Response):
            response.headers["X-Request-ID"] = request_id
        
        return response

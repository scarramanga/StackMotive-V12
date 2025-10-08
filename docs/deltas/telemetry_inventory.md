# Telemetry Inventory (Reuse-First Analysis)

## Overview
This document analyzes telemetry and observability features across StackMotive V12, V11, and Final repositories to identify proven components for reuse in V12.

## Feature Comparison Table

| Feature | V12 Path | V11 Path | Final Path | Winner | Rationale |
|---------|----------|----------|------------|--------|-----------|
| **JSON Logging** | None | `server/services/log_manager.py` | None | **V11** | Production-ready with correlation IDs, PII redaction, rotating file handler, noise filtering |
| **Request ID Middleware** | None | `server/middleware/logging.py` (partial) | None | **V11 + New** | V11 has internal request_id generation, need to add X-Request-ID header propagation |
| **Health Live** | `server/main.py:187-198` | `server/main.py:303-305` | `server/main.py:33-35` | **V11** | Simple status check, V12's is adequate but V11's pattern is cleaner |
| **Health Ready** | None | `server/main.py:308-338` | None | **V11** | DB + Redis connectivity checks with proper error handling and timeouts |
| **Metrics Middleware** | None | `server/middleware/metrics.py` | None | **V11** | Custom metrics tracking requests, errors, response times with global collector |
| **Metrics Endpoint** | None | `server/middleware/metrics.py` (/metrics route) | None | **V11** | Exposes aggregated metrics for monitoring tools |
| **PII Redaction** | None | `server/services/log_manager.py:71-119` | None | **V11** | Comprehensive regex patterns for email, phone, cards, JWT, API keys, TFN/IRD |
| **Global Error Handler** | `server/main.py:464-471` | `server/main.py:823-827` | None | **V12** | Already exists in V12, adequate implementation |
| **Request Logging** | None | `server/middleware/logging.py` | None | **V11** | JSON structured request logs with timing and correlation |
| **Health Monitor Service** | None | `server/services/health_monitor.py` | None | **V11 (simplified)** | V11 has comprehensive monitoring but too complex for V12 - will simplify |

## Repository Details

### V12 Current State
- **Commit SHA**: 1711122d
- **Health endpoint**: Basic `/health` in main.py returning status and timestamp
- **Logging**: Standard Python logging with basic configuration
- **Middleware**: Has tier enforcement middleware, ready for additional middleware
- **Observability**: Basic `utils/observability.py` for import event logging

### V11 Production Components
- **Commit SHA**: [To be documented]
- **Structured Logging**: Full JSON logging with JSONFormatter, NoiseFilter, PII redaction
- **Middleware Stack**: Logging and metrics middleware with request correlation
- **Health Checks**: `/health` (live) and `/ready` (DB/Redis checks) endpoints
- **Metrics Collection**: Custom metrics for requests, errors, response times
- **Error Handling**: Circuit breakers, comprehensive health monitoring

### Final Minimal State
- **Commit SHA**: [To be documented]
- **Telemetry**: Minimal health check endpoint only
- **Infrastructure**: Basic FastAPI setup without observability features

## Implementation Deltas for V12

### High Priority (Phase 13 Core)
1. **Structured Logging Service** - Port V11's `log_manager.py` → `services/logging.py`
2. **Request Context Middleware** - New implementation for X-Request-ID propagation
3. **Logging Middleware** - Port V11's `middleware/logging.py` → `middleware/logging_middleware.py`
4. **Metrics Service** - Port V11's `middleware/metrics.py` → `services/metrics.py`
5. **Health Endpoints** - Port V11's health/ready endpoints → `routes/health.py`
6. **Main.py Integration** - Wire all middleware and routes

### Environment Configuration
```env
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_SAMPLING_RATE=1.0
METRICS_ENABLED=true
METRICS_NAMESPACE=stackmotive
HEALTH_DB_TIMEOUT_MS=800
HEALTH_REDIS_TIMEOUT_MS=500
```

### Testing Requirements
- Request ID correlation tests
- Metrics collection and exposition tests  
- Health endpoint connectivity tests
- PII redaction validation tests

## Decision Rationale

**Why V11 as Primary Source:**
- Production-tested observability stack
- Comprehensive PII redaction for compliance
- Proper correlation ID implementation
- Custom metrics collection without external dependencies
- Error handling and health check patterns

**Simplifications for V12:**
- Remove complex health monitoring (websockets, circuit breakers, psutil)
- Simplify health checks to DB + Redis connectivity only
- Use custom metrics instead of Prometheus (no external deps)
- Optional Redis (graceful degradation for local dev)

**New Components:**
- X-Request-ID header propagation (V11 only has internal request_id)
- Rate limiting on health/metrics endpoints
- Comprehensive test suite for all telemetry features

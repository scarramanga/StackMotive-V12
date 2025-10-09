"""
StackMotive FastAPI Server
Main server with billing integration
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
import logging
import uvicorn
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime

from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from server.database import Base, engine
from server.services.rate_limiter import limiter
from server.routes.user import router as user_router, UserResponse, Token
from server.routes.auth import router as auth_router
from server.routes.onboarding import router as onboarding_router_new
from server.routes.preferences import router as preferences_router_new
from server.routes.paper_trading import router as paper_trading_router
from server.routes.market_data import router as market_data_router
from server.routes.strategy import router as strategy_router
from server.routes.tax import router as tax_router
from server.routes.trades import router as trades_router
from server.routes.watchlist import router as watchlist_router
from server.routes.trading_accounts import router as trading_accounts_router
from server.routes.market_events import router as market_events_router
from server.routes.whale_activities import router as whale_activities_router
from server.routes.portfolio import router as portfolio_router
from server.routes.asset_view_tools import router as asset_view_tools_router
from server.routes.asset_drilldown import router as asset_drilldown_router
from server.routes.manual_trade_journal import router as manual_trade_journal_router
from server.routes.onboarding_flow import router as onboarding_flow_router
from server.routes.user_preferences_panel import router as user_preferences_panel_router
from server.routes.performance_analytics_panel import router as performance_analytics_panel_router
from server.auth import get_current_user
from server.routes.advisor import router as advisor_router
from server.routes.signal_log import router as signal_log_router
from server.routes.portfolio_loader import router as portfolio_loader_router
from server.routes.strategy_assignment import router as strategy_assignment_router
from server.routes.allocation_visualizer import router as allocation_visualizer_router
from server.routes.ai_rebalance_suggestions import router as ai_rebalance_router
from server.routes.strategy_editor import router as strategy_editor_router
from server.routes.asset_sync_settings import router as asset_sync_router
from server.routes.holdings_review import router as holdings_review_router
from server.routes.macro_monitor import router as macro_monitor_router
from server.routes.rebalance_scheduler import router as rebalance_scheduler_router
from server.routes.dca_stop_loss import router as dca_stop_loss_router
from server.routes.asset_tagging_system import router as asset_tagging_system_router
from server.routes.asset_exclusion_panel import router as asset_exclusion_panel_router
from server.routes.vault_categories import router as vault_categories_router
from server.routes.rotation_control import router as rotation_control_router
from server.routes.live_signal_summary_panel import router as live_signal_summary_panel_router
from server.routes.strategy_ranking_system import router as strategy_ranking_system_router
from server.routes.strategy_comparison_engine import router as strategy_comparison_engine_router
from server.routes.export import router as export_router
from server.routes.rebalance_risk import router as rebalance_risk_router
from server.routes.billing import router as billing_router
from server.routes.stripe_webhook import router as stripe_router
from server.routes.kucoin import router as kucoin_router
from server.routes.ibkr_import import router as ibkr_import_router
from server.routes.strategy_panel import router as strategy_panel_router
from server.routes.ai_summaries import router as ai_summaries_router
from server.routes.ai_commands import router as ai_commands_router
from server.routes.tier_preview import router as tier_preview_router
from server.routes.export_snapshot import router as export_snapshot_router
from server.routes.vault_push import router as vault_push_router
from server.routes.macro_summary import router as macro_summary_router
from server.routes.user_preferences import router as user_preferences_router
from server.routes.notifications import router as notifications_router
from server.routes.data_federation import router as federation_router
from server.routes.health import router as health_router

from server.middleware.tier_enforcement import TierEnforcementMiddleware
from server.middleware.request_context import RequestContextMiddleware
from server.middleware.logging_middleware import LoggingMiddleware
from server.services.metrics import MetricsMiddleware
from server.websocket_server import socket_app, initialize_websocket_services, cleanup_websocket_services

from server.models.user import User
from server.models.paper_trading import PaperTradingAccount
from server.models.signal_models import TradingSignal, RebalanceAction

from server.services.logging import setup_logging
from server.config.settings import settings
import os

setup_logging(
    level=os.getenv("LOG_LEVEL", "INFO"),
    log_format=os.getenv("LOG_FORMAT", "json"),
    sampling_rate=float(os.getenv("LOG_SAMPLING_RATE", "1.0"))
)
logger = logging.getLogger(__name__)

# Create all database tables
Base.metadata.create_all(bind=engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

app = FastAPI(
    title="StackMotive API",
    description="Trading platform API with integrated billing",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    swagger_ui_parameters={"persistAuthorization": True}
)

app.state.limiter = limiter

app.add_middleware(SlowAPIMiddleware)
app.add_middleware(TierEnforcementMiddleware)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(LoggingMiddleware)

if os.getenv("METRICS_ENABLED", "true").lower() == "true":
    app.add_middleware(MetricsMiddleware)

# Override the default OpenAPI schema to use Bearer auth
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=[
            {"name": "Authentication", "description": "Login and token management"},
            {"name": "Users", "description": "User management and preferences"},
            {"name": "Paper Trading", "description": "Paper trading account operations"},
            {"name": "Market Data", "description": "Cryptocurrency price data and market information"},
            {"name": "Strategy", "description": "Trading strategy signals and recommendations"},
            {"name": "Tax", "description": "Tax calculations and reporting for AU/NZ/US"},
            {"name": "Billing", "description": "Billing operations"},
            {"name": "Stripe Webhook", "description": "Stripe webhook operations"}
        ]
    )

    # Add Bearer token security scheme
    openapi_schema["components"] = {
        "securitySchemes": {
            "bearerAuth": {  # Name it bearerAuth to match OAuth2PasswordBearer
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Enter the JWT token from /api/login"
            }
        }
    }

    # Ensure schemas section exists
    if "schemas" not in openapi_schema["components"]:
        openapi_schema["components"]["schemas"] = {}

    # Add response model schemas explicitly
    openapi_schema["components"]["schemas"].update(
        {
            "Token": Token.schema(),
            "UserResponse": UserResponse.schema()
        }
    )

    # Apply Bearer token globally
    openapi_schema["security"] = [{"bearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "StackMotive API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "status": "running"
    }

# Mount routers with tags
app.include_router(
    health_router,
    prefix="/api"
)

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)

from server.routes.auth import compat as auth_compat
app.include_router(
    auth_compat,
    prefix="/api",
    tags=["auth-compat"]
)

app.include_router(
    onboarding_router_new,
    prefix="/api/onboarding",
    tags=["Onboarding"]
)

app.include_router(
    preferences_router_new,
    prefix="/api",
    tags=["Preferences"]
)

# app.include_router(
#     user_router,
#     prefix="/api",
#     tags=["Users", "Authentication"]
# )
app.include_router(
    paper_trading_router,
    prefix="/api",
    tags=["Paper Trading"]
)
app.include_router(
    market_data_router,
    prefix="/api",
    tags=["Market Data"]
)
app.include_router(
    strategy_router,
    prefix="/api/strategy",
    tags=["Strategy"]
)
app.include_router(
    tax_router,
    prefix="/api",
    tags=["Tax"]
)
app.include_router(
    trades_router,
    prefix="/api",
    tags=["Trades"]
)
app.include_router(
    watchlist_router,
    prefix="/api",
    tags=["Watchlist"]
)
app.include_router(
    trading_accounts_router,
    prefix="/api",
    tags=["Trading Accounts"]
)
app.include_router(
    market_events_router,
    prefix="/api",
    tags=["Market Events"]
)
app.include_router(
    whale_activities_router,
    prefix="/api",
    tags=["Whale Activities"]
)
app.include_router(
    portfolio_router,
    prefix="/api",
    tags=["Portfolio"]
)
app.include_router(
    asset_view_tools_router,
    prefix="/api",
    tags=["Asset View Tools"]
)
app.include_router(
    asset_drilldown_router,
    prefix="/api",
    tags=["Asset Drilldown"]
)
app.include_router(
    manual_trade_journal_router,
    prefix="/api",
    tags=["Manual Trade Journal"]
)
app.include_router(
    onboarding_flow_router,
    prefix="/api",
    tags=["Onboarding Flow"]
)
app.include_router(
    user_preferences_panel_router,
    prefix="/api",
    tags=["User Preferences Panel"]
)
app.include_router(
    performance_analytics_panel_router,
    prefix="/api",
    tags=["Performance Analytics Panel"]
)
app.include_router(
    asset_tagging_system_router,
    prefix="/api",
    tags=["Asset Tagging System"]
)
app.include_router(
    asset_exclusion_panel_router,
    prefix="/api",
    tags=["Asset Exclusion Panel"]
)
app.include_router(
    live_signal_summary_panel_router,
    prefix="/api",
    tags=["Live Signal Summary Panel"]
)
app.include_router(
    strategy_ranking_system_router,
    prefix="/api",
    tags=["Strategy Ranking System"]
)
app.include_router(
    strategy_comparison_engine_router,
    prefix="/api",
    tags=["Strategy Comparison Engine"]
)
app.include_router(
    advisor_router,
    prefix="/api",
    tags=["Advisor"]
)
app.include_router(
    signal_log_router,
    prefix="/api",
    tags=["Signal Log"]
)
app.include_router(
    ai_rebalance_router,
    prefix="/api",
    tags=["AI Rebalance Suggestions"]
)
app.include_router(
    portfolio_loader_router,
    prefix="/api",
    tags=["Portfolio Loader"]
)
app.include_router(
    strategy_assignment_router,
    prefix="/api",
    tags=["Strategy Assignment"]
)
app.include_router(
    allocation_visualizer_router,
    prefix="/api",
    tags=["Allocation Visualizer"]
)
app.include_router(
    strategy_editor_router,
    prefix="/api",
    tags=["Strategy Editor"]
)
app.include_router(
    asset_sync_router,
    prefix="/api",
    tags=["Asset Sync"]
)
app.include_router(
    holdings_review_router,
    prefix="/api",
    tags=["Holdings Review"]
)
app.include_router(
    macro_monitor_router,
    prefix="/api",
    tags=["Macro Monitor"]
)
app.include_router(
    rebalance_scheduler_router,
    prefix="/api",
    tags=["Rebalance Scheduler"]
)
app.include_router(
    dca_stop_loss_router,
    prefix="/api",
    tags=["DCA & Stop-Loss"]
)
app.include_router(
    vault_categories_router,
    prefix="/api",
    tags=["Vault Categories"]
)
app.include_router(
    rotation_control_router,
    prefix="/api",
    tags=["Rotation Control"]
)
app.include_router(
    export_router,
    prefix="/api",
    tags=["Export"]
)
app.include_router(
    rebalance_risk_router,
    prefix="/api",
    tags=["Rebalance Risk"]
)
app.include_router(billing_router, prefix="/api/billing", tags=["Billing"])
app.include_router(stripe_router, prefix="/api/billing")
app.include_router(
    kucoin_router,
    prefix="/api/kucoin",
    tags=["KuCoin"]
)
app.include_router(
    ibkr_import_router,
    prefix="/api",
    tags=["IBKR Import"]
)
app.include_router(
    strategy_panel_router,
    prefix="/api",
    tags=["Strategy Panel"]
)
app.include_router(
    ai_summaries_router,
    prefix="/api",
    tags=["AI Summaries"]
)
app.include_router(
    ai_commands_router,
    prefix="/api",
    tags=["AI Commands"]
)
app.include_router(
    tier_preview_router,
    prefix="/api",
    tags=["Tier Preview"]
)
app.include_router(
    export_snapshot_router,
    prefix="/api",
    tags=["Export Snapshot"]
)
app.include_router(
    vault_push_router,
    prefix="/api",
    tags=["Vault"]
)
app.include_router(
    macro_summary_router,
    prefix="/api",
    tags=["Macro Monitor"]
)
app.include_router(
    user_preferences_router,
    prefix="/api",
    tags=["User Preferences"]
)
app.include_router(
    notifications_router,
    prefix="/api",
    tags=["Notifications"]
)
app.include_router(
    federation_router,
    tags=["Data Federation"]
)

app.mount("/socket.io", socket_app)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("StackMotive API starting...")
    await initialize_websocket_services()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("StackMotive API shutting down...")
    await cleanup_websocket_services()

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    logger.info("🚀 Starting StackMotive API Server")
    logger.info("📊 Billing integration: ACTIVE")
    logger.info("🔗 Stripe integration: ACTIVE")
    logger.info("🗄️ Database: PostgreSQL")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


File: server/models/__init__.py
Line 3: from .user import User
Line 4: from .paper_trading import PaperTradingAccount

File: server/routes/user.py
Line 416: from .paper_trading import get_holdings as get_paper_trading_holdings

# No unqualified 'from models...', 'import models', 'from database...', or 'import database' found in backend codebase.
# All other imports use fully qualified paths (e.g., 'from server.models...') or are standard library/third-party.
# No ambiguous or context-dependent imports found in backend codebase.

# Note: Relative imports (from .module) are flagged above, as they can break if execution context changes (e.g., running a file directly). 
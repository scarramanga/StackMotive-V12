import re
from pathlib import Path
from collections import defaultdict

routes_dir = Path("/home/ubuntu/repos/StackMotive-V12/server/routes")
output = []

execute_counts = defaultdict(int)
crud_types = defaultdict(set)

for py_file in routes_dir.glob("*.py"):
    if py_file.name.endswith(".bak"):
        continue
    
    content = py_file.read_text()
    
    count = len(re.findall(r'\.execute\(|cursor\.execute\(', content))
    execute_counts[py_file.name] = count
    
    if re.search(r'INSERT INTO', content, re.IGNORECASE):
        crud_types[py_file.name].add("INSERT")
    if re.search(r'UPDATE \w+', content, re.IGNORECASE):
        crud_types[py_file.name].add("UPDATE")
    if re.search(r'DELETE FROM', content, re.IGNORECASE):
        crud_types[py_file.name].add("DELETE")
    if re.search(r'SELECT .* FROM', content, re.IGNORECASE):
        crud_types[py_file.name].add("SELECT")

mvp_panels = {
    "portfolio.py": "Portfolio Dashboard",
    "performance_analytics_panel.py": "Performance Analytics",
    "user_preferences_panel.py": "User Preferences",
    "theme_preferences.py": "Theme Settings",
    "macro_monitor.py": "Macro Monitor",
    "watchlist.py": "Watchlist",
    "holdings_review.py": "Holdings Review",
    "asset_drilldown.py": "Asset Details",
}

sorted_files = sorted(execute_counts.items(), key=lambda x: x[1], reverse=True)

print("| File | #Execs | CRUD Types | MVP Panel? | Recommended Action |")
print("|------|--------|------------|------------|-------------------|")

for filename, count in sorted_files:
    if count == 0:
        continue
    
    crud = ", ".join(sorted(crud_types.get(filename, []))) or "N/A"
    mvp_panel = mvp_panels.get(filename, "")
    
    if filename in ["portfolio.py", "performance_analytics_panel.py", "user_preferences_panel.py", "theme_preferences.py"]:
        action = "✅ Convert Now (MVP-critical)"
    elif filename in ["macro_monitor.py", "watchlist.py", "holdings_review.py", "asset_drilldown.py"]:
        action = "⚠️ Convert (MVP-adjacent)"
    elif "backtest" in filename.lower() or "simulation" in filename.lower() or "strategy_comparison" in filename.lower():
        action = "🟡 Stub (Advanced Feature)"
    elif count > 20:
        action = "🔍 Review & Decide"
    else:
        action = "🟡 Stub (Non-critical)"
    
    print(f"| {filename} | {count} | {crud} | {mvp_panel} | {action} |")

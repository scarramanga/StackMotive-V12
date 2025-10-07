#!/usr/bin/env python3
"""
Automatically stub all non-critical route files for PostgreSQL migration.
Preserves route decorators and signatures, replaces implementations with 501 stubs.
"""

import re
from pathlib import Path
from typing import List, Tuple

CONVERTED_ROUTES = {
    "portfolio.py",
    "performance_analytics_panel.py",
    "user_preferences_panel.py",
    "theme_preferences.py"
}

def extract_routes(content: str) -> List[Tuple[str, str, str]]:
    """Extract route decorators, signatures, and docstrings from file."""
    routes = []
    
    pattern = r'(@router\.[a-z]+\([^)]*\))\s*\n\s*(async\s+def\s+\w+\([^)]*\):)\s*\n\s*"""([^"]*?)"""'
    
    for match in re.finditer(pattern, content, re.MULTILINE | re.DOTALL):
        decorator = match.group(1)
        signature = match.group(2)
        docstring = match.group(3)
        routes.append((decorator, signature, docstring))
    
    return routes

def generate_stub_file(original_path: Path) -> str:
    """Generate a stubbed version of a route file."""
    content = original_path.read_text()
    
    routes = extract_routes(content)
    
    if not routes:
        return """from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/stub")
async def stub_endpoint():
    \"\"\"Temporary stub - pending PostgreSQL migration\"\"\"
    raise HTTPException(status_code=501, detail="Route pending PostgreSQL migration")
"""
    
    stub_content = """from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


"""
    
    for decorator, signature, docstring in routes:
        stub_content += f"{decorator}\n{signature}\n"
        stub_content += f'    """{docstring}"""\n'
        stub_content += f'    raise HTTPException(status_code=501, detail="Route pending PostgreSQL migration")\n\n'
    
    return stub_content

def main():
    routes_dir = Path("/home/ubuntu/repos/StackMotive-V12/server/routes")
    
    for route_file in routes_dir.glob("*.py"):
        if route_file.name in CONVERTED_ROUTES or route_file.name == "__init__.py":
            print(f"⏭️  Skipping {route_file.name} (converted or special)")
            continue
        
        if route_file.name.endswith(".bak"):
            print(f"⏭️  Skipping {route_file.name} (backup)")
            continue
        
        print(f"🔄 Stubbing {route_file.name}...")
        
        try:
            stub_content = generate_stub_file(route_file)
            route_file.write_text(stub_content)
            print(f"✅ Stubbed {route_file.name}")
        except Exception as e:
            print(f"❌ Failed to stub {route_file.name}: {e}")

if __name__ == "__main__":
    main()

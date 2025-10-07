from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
import json
from datetime import datetime
from pathlib import Path

from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()

# Block 20: Theme Toggle - API Routes
# Manages user theme preferences with backend persistence

class ThemePreferences(BaseModel):
    theme_mode: str = "light"  # light, dark, auto, system
    accent_color: str = "#3B82F6"
    font_size: str = "medium"  # small, medium, large
    high_contrast: bool = False
    reduce_motion: bool = False
    compact_mode: bool = False
    sidebar_collapsed: bool = False
    
    @validator('theme_mode')
    def validate_theme_mode(cls, v):
        allowed_themes = ['light', 'dark', 'auto', 'system']
        if v not in allowed_themes:
            raise ValueError(f'Theme mode must be one of: {", ".join(allowed_themes)}')
        return v
    
    @validator('font_size')
    def validate_font_size(cls, v):
        allowed_sizes = ['small', 'medium', 'large']
        if v not in allowed_sizes:
            raise ValueError(f'Font size must be one of: {", ".join(allowed_sizes)}')
        return v

class ThemeSyncRequest(BaseModel):
    device_id: Optional[str] = None
    sync_source: str = "web"
    preferences: ThemePreferences

class ThemePreferencesResponse(BaseModel):
    id: str
    user_id: int
    preferences: ThemePreferences
    applied_at: str
    created_at: str
    updated_at: str

# Agent Memory logging
async def log_to_agent_memory(user_id: int, action_type: str, action_summary: str, input_data: str, output_data: str, metadata: Dict[str, Any], db = Depends(db_session)):
    try:
        stmt, params = qmark("""
            INSERT INTO AgentMemory 
            (userId, blockId, action, context, userInput, agentResponse, metadata, timestamp, sessionId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            "block_20",
            action_type,
            action_summary,
            input_data,
            output_data,
            json.dumps(metadata) if metadata else None,
            datetime.now().isoformat(),
            f"session_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        ))
        
        db.execute(stmt, params)
        db.commit()
        
    except Exception as e:
        print(f"Failed to log to agent memory: {e}")

@router.get("/theme/preferences/{user_id}")
async def get_theme_preferences(user_id: int, db = Depends(db_session)):
    """Get user theme preferences"""
    try:
        stmt, params = qmark("""
            CREATE TABLE IF NOT EXISTS UserThemePreferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                theme_mode TEXT NOT NULL DEFAULT 'light',
                accent_color TEXT NOT NULL DEFAULT '#3B82F6',
                font_size TEXT NOT NULL DEFAULT 'medium',
                high_contrast BOOLEAN NOT NULL DEFAULT 0,
                reduce_motion BOOLEAN NOT NULL DEFAULT 0,
                compact_mode BOOLEAN NOT NULL DEFAULT 0,
                sidebar_collapsed BOOLEAN NOT NULL DEFAULT 0,
                applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(userId)
            )
        """, ())
        db.execute(stmt, params)
        
        stmt, params = qmark("""
            SELECT * FROM UserThemePreferences WHERE userId = ?
        """, (user_id,))
        
        result = db.execute(stmt, params).mappings().first()
        
        if not result:
            default_preferences = ThemePreferences()
            stmt, params = qmark("""
                INSERT INTO UserThemePreferences 
                (userId, theme_mode, accent_color, font_size, high_contrast, 
                 reduce_motion, compact_mode, sidebar_collapsed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                default_preferences.theme_mode,
                default_preferences.accent_color,
                default_preferences.font_size,
                default_preferences.high_contrast,
                default_preferences.reduce_motion,
                default_preferences.compact_mode,
                default_preferences.sidebar_collapsed
            ))
            
            db.execute(stmt, params)
            db.commit()
            
            stmt, params = qmark("""
                SELECT * FROM UserThemePreferences WHERE userId = ?
            """, (user_id,))
            result = db.execute(stmt, params).mappings().first()
        
        preference_data = dict(result)
        
        preferences = ThemePreferences(
            theme_mode=preference_data['theme_mode'],
            accent_color=preference_data['accent_color'],
            font_size=preference_data['font_size'],
            high_contrast=bool(preference_data['high_contrast']),
            reduce_motion=bool(preference_data['reduce_motion']),
            compact_mode=bool(preference_data['compact_mode']),
            sidebar_collapsed=bool(preference_data['sidebar_collapsed'])
        )
        
        await log_to_agent_memory(
            user_id,
            "theme_preferences_retrieved",
            f"Retrieved theme preferences for user",
            "",
            f"Theme: {preferences.theme_mode}, Font: {preferences.font_size}",
            {"theme_mode": preferences.theme_mode, "font_size": preferences.font_size},
            db
        )
        
        return {
            "id": str(preference_data['id']),
            "user_id": user_id,
            "preferences": preferences.dict(),
            "applied_at": preference_data['applied_at'],
            "created_at": preference_data['created_at'],
            "updated_at": preference_data['updated_at']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/theme/preferences/{user_id}")
async def update_theme_preferences(user_id: int, preferences: ThemePreferences, db = Depends(db_session)):
    """Update user theme preferences"""
    try:
        stmt, params = qmark("""
            UPDATE UserThemePreferences 
            SET theme_mode = ?, accent_color = ?, font_size = ?, 
                high_contrast = ?, reduce_motion = ?, compact_mode = ?, 
                sidebar_collapsed = ?, updated_at = ?
            WHERE userId = ?
        """, (
            preferences.theme_mode,
            preferences.accent_color,
            preferences.font_size,
            preferences.high_contrast,
            preferences.reduce_motion,
            preferences.compact_mode,
            preferences.sidebar_collapsed,
            datetime.now().isoformat(),
            user_id
        ))
        
        result = db.execute(stmt, params)
        
        if result.rowcount == 0:
            stmt, params = qmark("""
                INSERT INTO UserThemePreferences 
                (userId, theme_mode, accent_color, font_size, high_contrast, 
                 reduce_motion, compact_mode, sidebar_collapsed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                preferences.theme_mode,
                preferences.accent_color,
                preferences.font_size,
                preferences.high_contrast,
                preferences.reduce_motion,
                preferences.compact_mode,
                preferences.sidebar_collapsed
            ))
            db.execute(stmt, params)
        
        db.commit()
        
        await log_to_agent_memory(
            user_id,
            "theme_preferences_updated",
            f"Updated theme preferences",
            preferences.json(),
            f"Theme updated to {preferences.theme_mode}",
            {
                "theme_mode": preferences.theme_mode,
                "accent_color": preferences.accent_color,
                "font_size": preferences.font_size
            },
            db
        )
        
        return {
            "success": True,
            "message": "Theme preferences updated successfully",
            "preferences": preferences.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/theme/sync/{user_id}")
async def sync_theme_preferences(user_id: int, sync_request: ThemeSyncRequest, db = Depends(db_session)):
    """Sync theme preferences across devices"""
    try:
        stmt, params = qmark("""
            CREATE TABLE IF NOT EXISTS ThemeSyncHistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                device_id TEXT,
                theme_data TEXT NOT NULL,
                sync_timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                sync_source TEXT NOT NULL DEFAULT 'web',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """, ())
        db.execute(stmt, params)
        
        await update_theme_preferences(user_id, sync_request.preferences, db)
        
        stmt, params = qmark("""
            INSERT INTO ThemeSyncHistory (userId, device_id, theme_data, sync_source)
            VALUES (?, ?, ?, ?)
        """, (
            user_id,
            sync_request.device_id,
            sync_request.preferences.json(),
            sync_request.sync_source
        ))
        
        db.execute(stmt, params)
        db.commit()
        
        await log_to_agent_memory(
            user_id,
            "theme_preferences_synced",
            f"Synced theme preferences from {sync_request.sync_source}",
            sync_request.json(),
            f"Theme synced successfully",
            {
                "sync_source": sync_request.sync_source,
                "device_id": sync_request.device_id,
                "theme_mode": sync_request.preferences.theme_mode
            },
            db
        )
        
        return {
            "success": True,
            "message": "Theme preferences synced successfully",
            "sync_timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/theme/sync/history/{user_id}")
async def get_theme_sync_history(user_id: int, limit: int = 10, db = Depends(db_session)):
    """Get theme sync history for a user"""
    try:
        stmt, params = qmark("""
            SELECT * FROM ThemeSyncHistory 
            WHERE userId = ? 
            ORDER BY sync_timestamp DESC 
            LIMIT ?
        """, (user_id, limit))
        
        history = [dict(row) for row in db.execute(stmt, params).mappings().all()]
        
        for entry in history:
            try:
                entry['theme_data'] = json.loads(entry['theme_data'])
            except:
                entry['theme_data'] = {}
        
        return {
            "history": history,
            "user_id": user_id,
            "total_entries": len(history)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/theme/preferences/{user_id}")
async def reset_theme_preferences(user_id: int, db = Depends(db_session)):
    """Reset theme preferences to default"""
    try:
        default_preferences = ThemePreferences()
        await update_theme_preferences(user_id, default_preferences, db)
        
        await log_to_agent_memory(
            user_id,
            "theme_preferences_reset",
            f"Reset theme preferences to default",
            "",
            f"Theme reset to default settings",
            {"action": "reset_to_default"},
            db
        )
        
        return {
            "success": True,
            "message": "Theme preferences reset to default",
            "preferences": default_preferences.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))       
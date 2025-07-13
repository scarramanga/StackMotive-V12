# StackMotive Database Migration Policy

## ⚠️ CRITICAL: Manual Migration Control

### Rules:
1. **NO AUTOMATIC MIGRATIONS** - Alembic must ONLY be run manually
2. **NO AUTO-GENERATED REVISIONS** without explicit approval
3. **ALL migrations MUST have proper down_revision linkage**
4. **NO duplicate migration IDs**

### Current State:
- Latest Migration: `8fb547391494_add_strategy_column_to_trades_table.py`
- Status: ✅ STABLE
- Last Verified: 2025-05-29

### Migration Workflow:
1. Create migration: `alembic revision --autogenerate -m "description"`
2. Review generated file manually
3. Test upgrade: `alembic upgrade head`
4. Test downgrade: `alembic downgrade -1`
5. Document in `db_migrations_log.txt`
6. Commit only after verification

### ⛔ NEVER RUN:
- `alembic upgrade head` in production without review
- Auto-generated migrations without manual verification
- Duplicate strategy column fixes

### Contact:
If migrations are needed, create an explicit request with:
- Reason for schema change
- Expected impact
- Rollback plan 
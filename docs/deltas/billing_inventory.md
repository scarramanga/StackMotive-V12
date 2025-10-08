# Phase 14: Billing & Pricing Inventory (Reuse-First Audit)

**Audit Date:** 2025-10-08  
**Repositories:** V11, V12, Final

## Component Comparison

| Component | V11 Path | V12 Path | Final Path | Winner | Rationale |
|-----------|----------|----------|------------|--------|-----------|
| **Stripe Webhook Handler** | `routes/billing_webhooks.py` (SQLAlchemy) + `routes/stripe_webhook.py` (psycopg2) | `routes/billing.py` (stubs only) | None | **V11** | V11 has complete HMAC-verified webhook handlers. billing_webhooks.py uses SQLAlchemy ORM (cleaner). |
| **Webhook Signature Verification** | ✅ `stripe.Webhook.construct_event()` | ❌ Not implemented | ❌ Not found | **V11** | Critical security: HMAC verification prevents unauthorized webhook calls |
| **Subscription Model** | ✅ `models/billing.py` (Subscription class) + users table fields | ❌ None | ❌ Not found | **V11** | Separate subscriptions table for history + users table fields for quick tier checks |
| **Tier Pricing Matrix** | ✅ `utils/tier_config.py` (observer=0, navigator=29, operator=99, sovereign=299) | ❌ None | ❌ Not found | **V11** | Static tier pricing configuration |
| **Price ID → Tier Mapping** | ✅ `billing_webhooks.py::_map_price_to_tier()` via env vars | ❌ None | ❌ Not found | **V11** | Maps Stripe price IDs to tier names |
| **Grace Period Logic** | ⚠️ Handles `cancel_at_period_end` but no `grace_until` field | ❌ None | ❌ Not found | **New** | Need to add grace_until field for 7-day grace period |
| **Event Deduplication** | ❌ None | ❌ None | ❌ Not found | **New** | Need to add last_event_id tracking to prevent duplicate processing |
| **Billing Audit Log** | ⚠️ Logs to `webhook_logs` table + `agent_memory` | ❌ None | ❌ Not found | **V11 + New** | V11 logs webhooks; need dedicated billing_events table with payload hashing |
| **Tier Access Control** | ✅ `middleware/tier_enforcement.py` | ✅ `middleware/tier_enforcement.py` | ❌ Not found | **V12** | V12 already has working tier enforcement integrated |
| **Billing Portal Route** | ✅ `routes/billing.py` (partial) | ❌ Stub only | ❌ Not found | **V11** | Customer portal session creation |
| **Health/Metrics Endpoints** | ✅ Phase 13 complete | ✅ Phase 13 complete | ❌ Not found | **V12** | Already implemented in Phase 13 |

## Deltas Needed for V12

### From V11 (Reuse)
1. **Webhook Handler** - Port `billing_webhooks.py` (uses SQLAlchemy ORM, cleaner than stripe_webhook.py's raw psycopg2)
2. **Subscription Model** - Port `models/billing.py` Subscription class
3. **Tier Pricing** - Port `utils/tier_config.py` TIER_PRICING constant
4. **Price Mapping** - Adapt `_map_price_to_tier()` to use env vars

### New Components (Not in V11)
1. **Grace Period** - Add `grace_until` DateTime field (7 days after `current_period_end`)
2. **Event Deduplication** - Add `last_event_id` to subscriptions table
3. **Billing Events Audit** - Create dedicated `billing_events` table with SHA256 payload hashing
4. **Billing Sync Service** - Centralized Stripe → DB sync logic
5. **Grace Period Service** - Check if user in grace period vs. locked out

### Database Schema
- **user_subscriptions table**: user_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end, grace_until, last_event_id, created_at, updated_at
- **billing_events table**: id, event_id (Stripe), event_type, payload_hash (SHA256), status, created_at, error_message

## Git References
- V11 billing_webhooks.py: server/routes/billing_webhooks.py
- V11 models/billing.py: server/models/billing.py
- V11 utils/tier_config.py: server/utils/tier_config.py
- V12 tier_enforcement.py: server/middleware/tier_enforcement.py

## Key Findings
- **Final repository has NO billing implementation** - contrary to original plan assumptions
- V11 has two webhook handlers: billing_webhooks.py (SQLAlchemy ORM) and stripe_webhook.py (raw psycopg2)
- V11 uses both users table fields AND separate subscriptions table for dual-purpose: quick checks + detailed history
- V11's stripe_config.json is minimal (just placeholder keys/price_ids)
- V11 handles cancel_at_period_end but doesn't implement grace period countdown
- V12's tier_enforcement middleware already checks user.subscription_tier, so our changes just add the subscription management layer

## Security Enhancements for V12
1. **HMAC Signature Verification** - Already in V11, will port with stripe.Webhook.construct_event()
2. **Event Deduplication** - NEW - prevents replay attacks by tracking last_event_id
3. **SHA256 Payload Hashing** - NEW - audit integrity without storing full payloads
4. **Separate Audit Table** - NEW - billing_events table for compliance tracking

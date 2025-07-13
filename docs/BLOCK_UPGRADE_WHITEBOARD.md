# StackMotive Block Upgrade Whiteboard

### 🔐 Build Constraints Summary
- No mock/static inputs — all blocks must operate on live or dynamic user/system data.
- All agent actions and user interactions must log to the Agent Memory Table.
- Every config edit must be versioned (see Block 150).
- All alerts, feedback, and prompts must also route to Central Logging Dashboard.
- Components must reuse existing design system where possible; new UI patterns require annotation.
- Testing minimum: 80% unit + integration coverage per block.
- Supabase is the default DB unless noted.

### 🚦 Block Implementation Priority (140–144)
| Priority | Block | Reason |
|----------|-------|--------|
| 🥇 1 | 140 – Multi-User Household Mode | Adds new user logic and roles — will influence later blocks (esp. Vault access and config scoping). Needs to go first. |
| 🥈 2 | 144 – Sovereign Education Feed | GPT + content block; low dependency, useful for testing Memory Table + content approval. |
| 🥉 3 | 143 – Recession Readiness Meter | Integrates with macro data already flowing. Good test case for agent alerts + logging UX. |
| 4 | 141 – ESG Violation Watchdog | Slightly trickier due to external feed variability. Slotted after core roles/config/UI are locked. |
| 5 | 142 – Yield Curve Insight Panel | Technically clean, but depends on visuals and agent context, so deliver after macro score integration. |

## Deep Scan Summary (Blocks 12–149)
- **No exact duplicate blocks found.**
- **Merge candidates identified:**
  - Journaling/Logging: Manual Trade Journal, Logger, Intent Recorder, Reason Recorder, Rebalance/Override logs
  - Overlays/Strategy: Overlay History Viewer, Strategy Rotation Visualiser, Historical Rotation Replay
  - Reporting/Export: Snapshot Exporter, Export to PDF Snapshot, Backtest Export Panel
  - Asset Replacement: Asset Replacement Suggestion, Asset Replacement Engine
  - Tier Gating: Tier-Based Feature Control, User Tier Enforcement
  - Sentiment: Sentiment Tracker, Overlay Enhancer, Explorer
  - Asset Lifecycle: Asset Migration Tracker, Asset Lifecycle Tracker
- **Gaps/Orphans:**
  - No global activity/audit log (all actions, not just trades/overrides)
  - No system health dashboard (aggregates sync, API, error, and alert status)
- **Fit:**
  - Most blocks reference each other well; ensure all logs, exports, and notifications are accessible from unified UIs.

**Plan:**
Continue building by blocks for velocity and auditability, then perform a tidy-up/merge pass at the end to consolidate overlaps and fill any gaps.

---

This file tracks the status of dashboard embedding, Supabase sync, audit logging, agent/engine integration, and user education/tooltips for all major feature blocks.

| Block | Description | Dashboard Embed | Supabase Sync | Audit Logging | Agent Integration | User Education | Status | Notes |
|-------|-------------|----------------|--------------|---------------|-------------------|---------------|--------|-------|
| 49    | Mobile Navbar System | N/A | N/A | N/A | N/A | N/A | ✅ Complete | Mobile nav replaces sidebar on mobile |
| 50    | User Tier Enforcement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | All panels/routes tier-gated |
| 51    | Overlay History Viewer | ✅ | N/A | N/A | ✅ | ✅ | ✅ Complete | Uses real overlay history, dashboard embedded |
| 52    | Watchlist Weighting Panel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Supabase sync, audit log, dashboard embedded |
| 53    | Vault Category Allocator | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 In progress | Dashboard embedded, ready for Supabase sync/audit/agent integration |
| 54    | Reporting Archive System | ✅ | ✅ | ⬜ | ⬜ | ⬜ | 🟡 In progress | Real downloads, infinite scroll, dashboard integrated |
| 55    | Trade Reason Recorder | ⬜ | ✅ | ⬜ | 🟡 | ⬜ | 🟡 In progress | Modal, journal integration, agent context capture |
| 56    | Dashboard Personalisation Engine | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 In progress | Panel state model, drag/drop, persistent layout, schema ready |
| 58    | Auto-Trim Toggle | ✅ | ⬜ | ⬜ | ✅ | ⬜ | 🟡 MVP-complete, production features on hold | Core logic and toggle implemented. Remaining: user prompt/modal, logging/audit, Notification Center, Rebalance Scheduler integration. See chat for details. |
| 69    | ESG & Ethics Filter | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Backlogged | Pending: Decision at end of cycle. Requires real ESG data/API for full implementation. Manual exclusion system possible as fallback. |
| 70    | Strategy Preset Marketplace | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⛔ Blocked | UI scaffolded, upload/clone logic pending tier/billing integration |
| 71    | API Sync Health Monitor | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⛔ Blocked | Dashboard indicator and resync button stubbed, backend integration pending |
| 72    | Manual Override Log | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Zustand store and UI panel implemented, all overrides tracked |
| 73    | Custom Asset Categories | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Allocator supports user-defined categories, analytics and persistence done |
| 74    | Data Import Wizard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | CSV import upgraded with mapping presets, UTF-8 BOM, error logging |
| 75    | Annual Tax Filing Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Real PDF export, no mock data, NZ/AU compliance, warnings for incomplete data |
| 76    | Asset Class Allocation Ring | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Real-data donut chart, dashboard embedded |
| 77    | Risk Exposure Meter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Real-data risk meter, dashboard embedded |
| 78    | Portfolio Sync Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Discrepancy flagging, audit trail, explicit warnings/logs |
| 79    | Scheduled Rebalance Suggestions | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 80    | Benchmark Comparison Module | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 81    | Integration Manager | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 82    | Allocation Change Summary | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 83    | Stale Data Detector | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 84    | Export to PDF Snapshot | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 85    | Strategy Rotation Visualiser | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 86    | AI Personalisation Engine | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 87    | Trading Calendar Awareness | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 88    | Asset Lifecycle Tracker | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 89    | Asset Kill Switch | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 90    | Vault Share Forecast Tool | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 91    | Rebalance Simulation Engine | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 92    | Multi-Currency Support | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 93    | Time Horizon Optimiser | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 94    | Trust Score Badge | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 95    | Market Sentiment Bar | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 96    | AI Agent Config Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 97    | Portfolio Exposure Breakdown | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 98    | Voice Summary Mode | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 99    | Auto Strategy Re-tester | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 100   | Historical Rotation Replay | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 101   | Agent Overlay Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 102   | Overlay Prompt History | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 103   | Strategy Drift Monitor | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 104   | Investment Horizon Visual | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 105   | Help & Tour System | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 106   | Vault Allocation Summary | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 107   | Quarterly Macro Forecast Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 108   | Indicator Sensitivity Tuner | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 109   | Rebalance Friction Simulator | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 110   | SignalGPT Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 111   | Overlay Generator (AI) | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 112   | Manual Trade Logger | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 113   | Overlay Documentation Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 114   | Asset Drilldown Enhancer | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 115   | Rebalance Intent Logging | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 116   | Confidence Heatmap | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 117   | Overlay Ranking System | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 118   | Notification Settings Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 119   | CSV Auto-Sync Scheduler | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 120   | Portfolio Stress Test Engine | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 121   | Watchlist Trigger Alerts | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 122   | Sovereign Wealth Tracker | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 123   | Overlay Logic Visualiser | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 124   | Future Value Forecaster | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 125   | Overlay Selector UI | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 126   | Yield & Income Tracker | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 127   | Sentiment Explorer | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 128   | Tier-Based Feature Control | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 129   | Custom Rebalance Rules | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 130   | Risk Threshold Alerts | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 131   | Asset Migration Tracker | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 132   | Cost Basis Annotator | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 133   | Trade Intent Recorder | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 134   | Performance Badge Tracker | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 135   | Goal Alignment Report | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 136   | Asset Override Memory | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 137   | Strategy Persistence Engine | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 138   | Signal Timing Logger | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 139   | Legacy Vault Builder | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 140   | Multi-User Household Mode | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Unique logins for up to 5 household members (Navigator+). Vault/overlay-level access via global roles table. Activity logs exportable as CSV (timestamp, action, user ID, vault). Co-managers: no billing, vault deletion, or system-level config rights. |
| 141   | ESG Violation Watchdog | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Integrate 2–3 ESG feeds (Sustainalytics, RepRisk, crowdsourced). User can toggle E/S/G focus; store in config. Conflicting data: rank sources, show "mixed signal" badge, log all discrepancies. |
| 142   | Yield Curve Insight Panel | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Use Recharts (fallback: D3). Export chart as PNG, data as CSV. Stale data: subtle icon + tooltip; >24h = banner. Historical and current context required. |
| 143   | Recession Readiness Meter | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Fixed formula for readiness score; future: user weighting (Operator+). Mobile: condensed meter. Snooze/unsnooze in notification center; auto-unsnooze after 7d. Updates at least every 24h. |
| 144   | Sovereign Education Feed | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | GPT agent: conversational, data-aware, StackMotive tone. Admin/CTO approval queue; only published items visible. Users can bookmark/favorite; "Saved" tab in sidebar. No ads/3rd-party content. |
| 145   | Asset Debasement Score | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 146   | Portfolio Rebalance Journal | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 147   | Time-Based Triggers | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 148   | Asset Replacement Engine | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |
| 149   | Final Deployment Checklist | 🟡 | ⬜ | ⬜ | ⬜ | ⬜ | 🟡 Scaffolded | Production-grade scaffolding, ready for real data integration. No mock data or placeholders. |

**Legend:**
- ✅ = Complete
- ⬜ = Not started
- 🟡 = In progress
- N/A = Not applicable
- ⛔ = Blocked

**Instructions:**
- Add new blocks as needed.
- Update status and notes as work progresses.
- Use this as the single source of truth for batch upgrades and compliance review. 
## Block 1 — App Shell & Layout
**Status**: Core  
**Labels**: frontend, layout, auth  
**Description**: Sets up routing shell, auth-wrapped pages, responsive layout. Includes main menu, protected routes, and initial session handling.

## Block 2 — Strategy Overlay Engine
**Status**: MVP  
**Labels**: engine, overlay, signals  
**Description**: Core logic engine to apply overlays to user portfolios. Accepts inputs from signals, user intent, and sentiment data.

## Block 3 — Allocation Visualiser
**Status**: new  
**Labels**: UI, charts, allocation  
**Description**: Renders portfolio allocation donut and strategy stack. Responds to changes in asset weights and AI-suggested rebalance prompts.

## Block 4 — Tax Reporting (NZ/AU)
**Status**: MVP  
**Labels**: tax, compliance, reporting  
**Description**: End-of-year tax module aligned to IRD & ATO rules. Generates CSV/PDF reports for portfolio transactions and gains.

## Block 5 — AI Signal Engine
**Status**: MVP  
**Labels**: agent, signals, AI  
**Description**: GPT-powered module continuously monitors portfolio assets, generating signals based on strategy rules, market data, and events.

## Block 6 — Watchlist Trigger System
**Status**: ready  
**Labels**: agent, triggers, watchlist  
**Description**: Tracks external assets defined by the user. If pre-defined signal thresholds are met, prompts user to consider asset swap or trim.

## Block 7 — Portfolio Sync (CSV/API)
**Status**: MVP  
**Labels**: integrations, sync, IBKR, Sharesies  
**Description**: Allows portfolio to be imported via CSV or synced via API for IBKR. Runs auto-sync jobs for live updates or manual refresh.

## Block 8 — Macro Monitor Agent
**Status**: experimental  
**Labels**: AI, macro, events  
**Description**: Monitors macroeconomic/geopolitical events (e.g. CPI, Fed moves, wars) and assesses portfolio impact. Offers user prompts when changes are material.

## Block 9 — Rebalance Scheduler
**Status**: new  
**Labels**: scheduler, rebalance, automation  
**Description**: Time-based rebalance trigger engine that allows users to configure daily, weekly, or event-driven rebalances.

## Block 10 — DCA & Stop-Loss Assistant
**Status**: MVP  
**Labels**: agent, strategy, capital  
**Description**: Lets users define DCA and stop-loss strategies per asset. Agent adjusts signals and prompts actions based on thresholds and volatility.

## Block 11 — AI Portfolio Advisor Panel
**Status**: MVP  
**Labels**: UI, AI, panel  
**Description**: Displays agent recommendations, rebalance prompts, and rationale based on recent market conditions and user strategies.

## Block 12 — Snapshot Exporter
**Status**: new  
**Labels**: export, UI, PDF  
**Description**: Allows user to export current strategy/portfolio as PDF, including asset allocations, backtest summaries, and key signals.

## Block 13 — Manual Trade Journal
**Status**: ready  
**Labels**: UI, notes, journaling  
**Description**: UI panel for logging manual trades and adding user notes. Can be synced with import data to identify mismatches.

## Block 14 — Sentiment Tracker (Lite)
**Status**: MVP  
**Labels**: sentiment, overlay, signal  
**Description**: Tracks market sentiment using basic keyword scanning, Twitter indicators, and sentiment overlays on user assets.

## Block 15 — Onboarding Flow
**Status**: MVP  
**Labels**: UI, onboarding, auth  
**Description**: Step-by-step onboarding flow to define user intent (growth, stability, autonomy), strategy preferences, and initial sync.

## Block 16 — User Preferences Panel
**Status**: MVP  
**Labels**: UI, settings, preferences  
**Description**: UI panel for setting preferences like rotation aggressiveness, risk tolerance, excluded sectors, and display options.

## Block 17 — Performance Analytics Panel
**Status**: MVP  
**Labels**: analytics, portfolio, UI  
**Description**: Displays cumulative returns, drawdowns, and CAGR by strategy and by asset. Includes toggles for timeframe comparison.

## Block 18 — Backtest Engine
**Status**: core  
**Labels**: backtest, logic, strategy  
**Description**: Engine to simulate portfolio performance using past data and selected overlays. Outputs to dashboard and export modules.

## Block 19 — Rotation Tracker
**Status**: MVP  
**Labels**: strategy, signals, rotation  
**Description**: Displays asset rotation changes driven by strategy overlays. Shows date, rationale, and before/after weighting.

## Block 20 — Strategy Builder Interface
**Status**: new  
**Labels**: UI, builder, overlay  
**Description**: Lets users customize overlay logic with drag-and-drop blocks or conditional selectors. Early version uses presets only.

## Block 21 — Signal History Log
**Status**: MVP  
**Labels**: logging, signals, history  
**Description**: Tracks all past signal triggers and related agent actions. Filterable by asset, overlay, and trigger condition.

## Block 22 — Asset Drill-Down Page
**Status**: core  
**Labels**: UI, asset, detail  
**Description**: Dedicated asset view showing all related signals, sentiment, allocation, strategy role, and historical performance.

## Block 23 — AI Chat Assistant (SignalGPT)
**Status**: MVP  
**Labels**: GPT, assistant, overlay  
**Description**: GPT-based assistant that explains portfolio signals, overlay logic, and market impacts in natural language.

## Block 24 — Vault Integration (Obsidian)
**Status**: backlogged  
**Labels**: sovereignty, vault, integration  
**Description**: Integration with cold storage & external vault tracking. Placeholder for long-term sovereign asset tracking.

## Block 25 — Theme + Mobile Responsiveness
**Status**: ready  
**Labels**: UI, responsive, theme  
**Description**: Ensures all pages support dark/light theme toggle and responsive layout down to mobile. Includes fixed nav and touch UI.

## Block 26 — Notification Center
**Status**: MVP  
**Labels**: alerts, signals, notifications  
**Description**: Delivers real-time or digest-based alerts when strategy triggers, signal thresholds, or watchlist events occur.

## Block 27 — Manual Mode Toggle
**Status**: MVP  
**Labels**: UI, toggle, mode  
**Description**: Allows user to switch between live sync mode and manual entry/testing mode. Useful for Sharesies users and mock tests.

## Block 28 — Market Overview Dashboard
**Status**: core  
**Labels**: market, UI, dashboard  
**Description**: Shows broad market data, volatility index, rates, news sentiment. Frames macro context for AI agents and overlays.

## Block 29 — Asset Trust Score Badge
**Status**: MVP  
**Labels**: signals, badge, trust  
**Description**: Evaluates asset via on-chain, technical, and sentiment signals. Produces 1–5 badge score visible in asset view.

## Block 30 — Strategy Simulation Toggle
**Status**: ready  
**Labels**: simulation, strategy, backtest  
**Description**: Adds toggle to simulate effect of alternate strategies without changing the real portfolio. Compares outcomes visually.

## Block 31 — Portfolio Health Score
**Status**: MVP  
**Labels**: score, diagnostics, strategy  
**Description**: Calculates a rolling “health score” based on diversification, recent drawdowns, correlation, and risk exposure. Shown in dashboard.

## Block 32 — Overlay Documentation Panel
**Status**: ready  
**Labels**: docs, overlays, help  
**Description**: In-app panel explaining each overlay in plain English, with logic summaries and backtest notes.

## Block 33 — AI Co-Pilot Toggle
**Status**: MVP  
**Labels**: agent, toggle, autonomy  
**Description**: Toggles level of agent control — Observer, Navigator, Operator, Sovereign. Influences AI suggestion frequency and scope.

## Block 34 — Sovereign Signal Dashboard
**Status**: new  
**Labels**: macro, overlay, sovereign  
**Description**: Highlights asset classes that preserve purchasing power under fiat debasement and global QE regimes.

## Block 35 — Rotation Mode Presets
**Status**: MVP  
**Labels**: UI, preset, settings  
**Description**: Users can select predefined rotation styles (e.g. Aggressive Growth, Defensive, Sovereign Blend) as starting strategy configs.

## Block 36 — Portfolio Comparison Tool
**Status**: MVP  
**Labels**: comparison, strategy, performance  
**Description**: Compares current portfolio vs model or past version. Shows relative CAGR, volatility, and tracking error.

## Block 37 — Monthly Strategy Review
**Status**: MVP  
**Labels**: AI, reporting, strategy  
**Description**: End-of-month agent summary with overlay performance, rotation moves, and key signal justifications.

## Block 38 — Real Asset Tracker
**Status**: MVP  
**Labels**: real assets, alt, inflation  
**Description**: Supports tracking of real-world assets like gold, property proxies, or commodity ETFs to improve inflation hedging.

## Block 39 — TradingView Integration (Lite)
**Status**: experimental  
**Labels**: TV, UI, charts  
**Description**: Adds inline TradingView chart viewer to asset drilldown and overlays. Allows visual confirmation of strategy logic.

## Block 40 — Watchlist AI Evaluation
**Status**: MVP  
**Labels**: agent, watchlist, screening  
**Description**: Agent scans watchlist assets for alignment with user goals. Recommends adds/swaps based on score and signals.

## Block 41 — Sentiment Overlay Enhancer
**Status**: new  
**Labels**: overlay, sentiment, refinement  
**Description**: Adds additional data sources and NLP filtering to improve sentiment overlays used in hybrid strategies.

## Block 42 — Asset Replacement Suggestion
**Status**: MVP  
**Labels**: signals, agent, replacement  
**Description**: When asset underperforms, agent evaluates top-ranked watchlist candidates and suggests precise replacement strategy.

## Block 43 — Macro Event Alerts
**Status**: MVP  
**Labels**: macro, agent, alert  
**Description**: Detects macroeconomic/geopolitical shocks (e.g. CPI shock, Fed hike, major war) and prompts strategy reassessment.

## Block 44 — Session Persistence & Auth
**Status**: core  
**Labels**: auth, session, security  
**Description**: Ensures secure login, session restoration, and role handling. Prepares for Stripe billing roles and scoped features.

## Block 45 — Feedback & Help Modal
**Status**: ready  
**Labels**: UI, help, feedback  
**Description**: Floating help button connects to AI assistant, opens doc links, and allows bug/feedback reporting from inside app.

## Block 46 — Account Settings & Billing
**Status**: MVP  
**Labels**: settings, billing, Stripe  
**Description**: UI panel for managing user account, email, password, and subscription tier. Integrates Stripe customer portal.

## Block 47 — Portfolio Timeline Visualiser
**Status**: MVP  
**Labels**: UI, timeline, performance  
**Description**: Interactive timeline of portfolio value, major signal events, and rotation points. Can filter by asset or strategy.

## Block 48 — Backtest Export Panel
**Status**: new  
**Labels**: backtest, export, reports  
**Description**: Allows export of backtest result as PDF/CSV. Includes key metrics, allocation heatmaps, and signal logs.

## Block 49 — Mobile Navbar System
**Status**: core  
**Labels**: mobile, UI, navigation  
**Description**: Builds a responsive bottom-nav system for mobile-first design. Replaces sidebar on small screens.

## Block 50 — User Tier Enforcement
**Status**: MVP  
**Labels**: auth, tier, restriction  
**Description**: Logic layer for enforcing user tier permissions (e.g., Observer, Navigator). Gates access to advanced features accordingly.

## Block 51 — Overlay History Viewer
**Status**: MVP  
**Labels**: overlay, history, strategy  
**Description**: Shows past overlay combinations and their impact. Helps users understand evolving strategy allocations.

## Block 52 — Watchlist Weighting Panel
**Status**: MVP  
**Labels**: watchlist, weighting, UI  
**Description**: Lets user assign priority or weights to watchlist assets. Influences agent decision logic for replacement suggestions.

## Block 53 — Vault Category Allocator
**Status**: MVP  
**Labels**: sovereignty, vault, allocation  
**Description**: Categorizes user assets into vault-like groups (e.g., BTC, gold, hard equities) and ensures target exposure levels.

## Block 54 — Reporting Archive System
**Status**: MVP  
**Labels**: reports, archive, download  
**Description**: Allows user to view/download past reports, agent logs, and rebalance summaries from a single archive panel.

## Block 55 — Trade Reason Recorder
**Status**: MVP  
**Labels**: journaling, AI, decision  
**Description**: Agent captures the rationale behind user decisions (buy/sell) and builds a reasoning journal for learning/reflection.

## Block 56 — Dashboard Personalisation Engine
**Status**: MVP  
**Labels**: UI, customisation, user  
**Description**: Allows users to show/hide panels, pin preferred components, and save layout as profile preset.

## Block 57 — Sovereign Signals Weekly Digest
**Status**: MVP  
**Labels**: reporting, macro, email  
**Description**: Generates weekly email or in-app digest summarizing key shifts, sovereign strategy changes, and economic updates.

## Block 58 — Auto-Trim Toggle
**Status**: MVP  
**Labels**: strategy, risk, trim  
**Description**: Allows user to set a toggle for auto-trimming oversized positions after a gain. Agent prompts before executing logic.

## Block 59 — Multi-Portfolio Support
**Status**: MVP  
**Labels**: portfolio, multi-account, tracking  
**Description**: Enables tracking and analysis of multiple portfolios (e.g., personal + trust). Users can isolate or combine performance views.

## Block 60 — Agent Confidence Meter
**Status**: MVP  
**Labels**: AI, confidence, score  
**Description**: Assigns a trust/confidence score to agent suggestions based on model certainty, backtest validation, and market clarity.

## Block 61 — Alert Snooze & Override
**Status**: MVP  
**Labels**: UI, alerts, override  
**Description**: Lets user snooze certain alerts or override agent prompts with justification. Maintains decision trail in logs.

## Block 62 — Cash Buffer Management
**Status**: MVP  
**Labels**: cash, allocation, strategy  
**Description**: Lets user define minimum/target cash reserves. Agent respects buffer and avoids over-deployment of capital.

## Block 63 — Signal Cross-Validation Tool
**Status**: MVP  
**Labels**: signals, validation, overlay  
**Description**: Cross-checks signals from multiple overlays for consistency. Flags discrepancies and adjusts confidence scoring.

## Block 64 — Market Open/Close Awareness
**Status**: MVP  
**Labels**: market, time, awareness  
**Description**: Agent adapts behavior based on market hours (e.g. alerts at open/close). Improves timing of prompts and syncs.

## Block 65 — Global News Filter
**Status**: MVP  
**Labels**: news, sentiment, filter  
**Description**: NLP module filters global headlines for relevance to portfolio holdings. Flags risk-on/off signals.

## Block 66 — Historical Portfolio Playback
**Status**: MVP  
**Labels**: replay, history, learning  
**Description**: User can scrub through past weeks/months to see how portfolio changed and what triggered key decisions.

## Block 67 — Smart Asset Tags
**Status**: MVP  
**Labels**: UI, tagging, filter  
**Description**: Adds intelligent tags (e.g. "Volatile", "Stablecoin", "Innovation") to assets. Supports filtering and sorting.

## Block 68 — AI-Generated Portfolio Summary
**Status**: MVP  
**Labels**: AI, summary, reporting  
**Description**: GPT module generates natural language summary of portfolio status, strategy alignment, and recent changes.

## Block 69 — ESG & Ethics Filter
**Status**: backlogged  
**Labels**: ESG, filter, screening  
**Description**: Optional overlay to include/exclude assets based on ESG scores or ethical alignment.

## Block 70 — Strategy Preset Marketplace (vFuture)
**Status**: scoped  
**Labels**: strategy, preset, future  
**Description**: Allows users to browse and clone community- or AI-curated strategy presets. Future release.

## Block 71 — API Sync Health Monitor
**Status**: MVP  
**Labels**: API, sync, status  
**Description**: Monitors sync health for IBKR and other connections. Warns if data is stale or job failed.

## Block 72 — Manual Override Log
**Status**: MVP  
**Labels**: journal, override, log  
**Description**: Tracks when user manually overrides strategy/agent recommendation. Recorded for future context.

## Block 73 — Custom Asset Categories
**Status**: MVP  
**Labels**: categorisation, UI, custom  
**Description**: Lets user define categories beyond default (e.g. "Legacy", "Experimental"). Enhances reporting clarity.

## Block 74 — Data Import Wizard (CSV)
**Status**: MVP  
**Labels**: import, CSV, UX  
**Description**: Step-by-step tool for CSV import, column mapping, and format validation. Supports Sharesies and other non-API brokers.

## Block 75 — Annual Tax Filing Report
**Status**: MVP  
**Labels**: tax, reporting, NZ, AU  
**Description**: Generates tax-compliant end-of-year reports for NZ/AU. Handles CGT, dividends, and realised/unrealised gains.

## Block 76 — Asset Class Allocation Ring
**Status**: MVP  
**Labels**: UI, allocation, visual  
**Description**: Donut or ring chart showing current allocation across major asset classes (Equities, Crypto, Cash, Real Assets, etc.).

## Block 77 — Risk Exposure Meter
**Status**: MVP  
**Labels**: risk, exposure, UI  
**Description**: Gauges total portfolio risk using standard deviation, beta, and overlay triggers. Outputs as a dynamic risk meter.

## Block 78 — Portfolio Sync Engine
**Status**: core  
**Labels**: sync, backend, automation  
**Description**: Service that refreshes live portfolio data from API or CSV on schedule. Detects deltas and flags asset changes.

## Block 79 — Scheduled Rebalance Suggestions
**Status**: MVP  
**Labels**: rebalance, schedule, strategy  
**Description**: Agent offers rebalance suggestions at user-defined frequency or after significant signal thresholds are met.

## Block 80 — Benchmark Comparison Module
**Status**: MVP  
**Labels**: benchmarking, reporting  
**Description**: Compares performance against selected benchmarks (e.g. BTC, S&P 500, Gold). Supports multiple timeframe overlays.

## Block 81 — Integration Manager
**Status**: MVP  
**Labels**: settings, integrations  
**Description**: UI and logic layer to manage API keys, CSV sources, exchange auth, and sync toggles.

## Block 82 — Allocation Change Summary
**Status**: MVP  
**Labels**: reporting, allocation  
**Description**: Agent summarizes what allocation changes were made or proposed, their rationale, and projected impact.

## Block 83 — Stale Data Detector
**Status**: MVP  
**Labels**: sync, alerts, validation  
**Description**: Flags when asset price or portfolio data hasn't updated in X hours. Prevents analysis based on old data.

## Block 84 — Export to PDF Snapshot
**Status**: MVP  
**Labels**: export, reporting  
**Description**: One-click export of portfolio snapshot with visuals, commentary, and performance metrics. Used for sharing or compliance.

## Block 85 — Strategy Rotation Visualiser
**Status**: MVP  
**Labels**: strategy, UI, timeline  
**Description**: Animated or timeline-based visual showing overlay shifts over time. Useful for seeing macro rotation trends.

## Block 86 — AI Personalisation Engine
**Status**: MVP  
**Labels**: AI, profile, adaptation  
**Description**: Agent adapts tone, prompt style, and emphasis based on observed user decisions and tier.

## Block 87 — Trading Calendar Awareness
**Status**: MVP  
**Labels**: calendar, market, sync  
**Description**: System aware of holidays, half-days, and exchange calendars. Optimizes timing for sync, alerts, and rebalance prompts.

## Block 88 — Asset Lifecycle Tracker
**Status**: MVP  
**Labels**: tracking, lifecycle  
**Description**: Tracks an asset from watchlist → portfolio → removed, recording reasons and performance during holding period.

## Block 89 — Asset Kill Switch
**Status**: MVP  
**Labels**: risk, removal, override  
**Description**: One-click removal of toxic or blacklisted assets. Disables signals and triggers optional rebalance routine.

## Block 90 — Vault Share Forecast Tool
**Status**: scoped  
**Labels**: sovereignty, vault, gifting  
**Description**: Forecasts long-term value of vault assets per heir (e.g., 0.5 BTC per child). Optional inflation curve integration.

## Block 91 — Rebalance Simulation Engine
**Status**: MVP  
**Labels**: strategy, simulation, test  
**Description**: Simulates effects of proposed rebalancing actions using historical data or overlay models. Agent uses for previewing.

## Block 92 — Multi-Currency Support
**Status**: MVP  
**Labels**: currency, reporting, FX  
**Description**: Enables portfolio valuation in NZD, AUD, USD, BTC. Auto-converts values based on FX feeds.

## Block 93 — Time Horizon Optimiser
**Status**: MVP  
**Labels**: AI, planning, backtest  
**Description**: Agent evaluates strategy performance over varying holding periods. Suggests optimal DCA and rebalance frequencies.

## Block 94 — Trust Score Badge
**Status**: MVP  
**Labels**: AI, confidence, badge  
**Description**: Displays an agent-generated badge per asset indicating trust level based on trend, macro, sentiment and alerts.

## Block 95 — Market Sentiment Bar
**Status**: MVP  
**Labels**: sentiment, macro, UI  
**Description**: Shows live market sentiment index or summary bar (Fear/Greed, VIX trend, Twitter AI scan).

## Block 96 — AI Agent Config Panel
**Status**: MVP  
**Labels**: settings, agent, config  
**Description**: UI panel allowing user to adjust how proactive, conservative, or autonomous the agent should behave.

## Block 97 — Portfolio Exposure Breakdown
**Status**: MVP  
**Labels**: UI, allocation, visual  
**Description**: Shows exposure by region, sector, volatility class, ESG, or other tag-based slicing.

## Block 98 — Voice Summary Mode
**Status**: scoped  
**Labels**: AI, voice, UX  
**Description**: Agent offers voice summary of portfolio performance and changes via text-to-speech.

## Block 99 — Auto Strategy Re-tester
**Status**: MVP  
**Labels**: agent, strategy, backtest  
**Description**: After new market conditions or signals, agent automatically reruns strategy backtest and evaluates impact.

## Block 100 — Historical Rotation Replay
**Status**: MVP  
**Labels**: UI, strategy, education  
**Description**: Lets user step back in time and see how previous overlays rotated and evolved in response to signal changes.

## Block 101 — Agent Overlay Panel
**Status**: review  
**Labels**: UI, agent, overlay  
**Description**: Interface for configuring and viewing AI overlay output. Can be reused from V10 if compatible with new structure.

## Block 102 — Overlay Prompt History
**Status**: MVP  
**Labels**: logs, strategy, agent  
**Description**: Tracks what overlay prompts the agent generated, when they were shown, and if the user accepted or declined.

## Block 103 — Strategy Drift Monitor
**Status**: MVP  
**Labels**: agent, tracking, alert  
**Description**: Monitors divergence between current portfolio and target strategy. Notifies if drift exceeds threshold.

## Block 104 — Investment Horizon Visual
**Status**: MVP  
**Labels**: UI, horizon, planning  
**Description**: Visual UI to help users map short/mid/long term holdings and align strategy goals accordingly.

## Block 105 — Help & Tour System
**Status**: MVP  
**Labels**: help, UI, onboarding  
**Description**: Tooltip and guided-tour system to orient new users through app flows and advanced features.

## Block 106 — Vault Allocation Summary
**Status**: MVP  
**Labels**: sovereignty, vault, allocation  
**Description**: Summary view showing how much of the portfolio is held in “vault-grade” assets (BTC, gold, select equities) and how it aligns to goals.

## Block 107 — Quarterly Macro Forecast Panel
**Status**: MVP  
**Labels**: macro, forecast, AI  
**Description**: Agent generates a quarterly forecast report outlining macro trends, interest rate outlook, and key asset impact.

## Block 108 — Indicator Sensitivity Tuner
**Status**: MVP  
**Labels**: signals, tuning, strategy  
**Description**: Lets users fine-tune sensitivity thresholds for key indicators (MACD, RSI, MA crossovers) per overlay.

## Block 109 — Rebalance Friction Simulator
**Status**: MVP  
**Labels**: simulation, friction, real-world  
**Description**: Models the impact of slippage, fees, and taxes on hypothetical rebalances. Used to stress test strategies.

## Block 110 — SignalGPT Panel
**Status**: implemented  
**Labels**: AI, signals, UI  
**Description**: GPT-powered assistant panel that explains signals, strategy logic, and answers user questions live. Fully streaming.

## Block 111 — Overlay Generator (AI)
**Status**: MVP  
**Labels**: AI, overlays, strategy  
**Description**: Allows GPT to generate new overlays based on user goals (e.g., “Build me a sovereign deflation-proof rotation model”).

## Block 112 — Manual Trade Logger
**Status**: MVP  
**Labels**: journaling, tracking, manual  
**Description**: Enables user to log external trades (e.g., via Sharesies or manual DCA) and link them to strategy rationale.

## Block 113 — UI Dark Mode Support
**Status**: complete  
**Labels**: UI, theme, polish  
**Description**: Supports full dark mode UI toggle. Enhances usability and readability in low-light environments.

## Block 114 — Asset Drilldown Enhancer
**Status**: MVP  
**Labels**: UI, asset, signals  
**Description**: Improves the individual asset drilldown with more advanced metrics, overlays, price targets, and macro tie-ins.

## Block 115 — Rebalance Intent Logging
**Status**: MVP  
**Labels**: agent, journal, rebalance  
**Description**: Logs when a rebalance was considered but not actioned. Captures user reasoning or agent confidence level.

## Block 116 — Confidence Heatmap
**Status**: MVP  
**Labels**: visual, confidence, signals  
**Description**: Visual heatmap showing confidence scores across assets and overlays. Identifies weak spots in strategy.

## Block 117 — Overlay Ranking System
**Status**: MVP  
**Labels**: overlay, scoring, AI  
**Description**: Agent scores and ranks overlays by predictive accuracy and goal alignment over time.

## Block 118 — Notification Settings Panel
**Status**: MVP  
**Labels**: UX, alerts, user  
**Description**: Lets user customise what types of alerts and agent messages they receive, and when.

## Block 119 — CSV Auto-Sync Scheduler
**Status**: MVP  
**Labels**: CSV, sync, backend  
**Description**: Automatically re-imports user CSVs on a schedule or manual trigger. Ensures data freshness for non-API users.

## Block 120 — Portfolio Stress Test Engine
**Status**: MVP  
**Labels**: risk, scenario, simulation  
**Description**: Simulates shocks (e.g., 30% BTC crash, Fed hike, war) and estimates impact on user portfolio.

## Block 121 — Watchlist Trigger Alerts
**Status**: MVP  
**Labels**: watchlist, alerts, triggers  
**Description**: Sends alerts when assets on the watchlist meet predefined signal or price conditions.

## Block 122 — Sovereign Wealth Tracker
**Status**: MVP  
**Labels**: sovereignty, vault, net worth  
**Description**: Tracks portion of portfolio meeting sovereign criteria. Aligns with long-term goal of fiat exit and legacy building.

## Block 123 — Overlay Logic Visualiser
**Status**: MVP  
**Labels**: overlay, logic, UI  
**Description**: Diagram view showing how each overlay evaluates assets — e.g., which signals matter most, and why.

## Block 124 — Future Value Forecaster
**Status**: MVP  
**Labels**: forecast, AI, planning  
**Description**: Projects portfolio value using Monte Carlo, DCA modelling, and market assumptions over user-defined horizon.

## Block 125 — Overlay Selector UI
**Status**: MVP  
**Labels**: overlay, config, UI  
**Description**: Allows users to browse overlays, preview impact on portfolio, and assign them to asset classes.

## Block 126 — Yield & Income Tracker
**Status**: MVP  
**Labels**: income, yield, dividends  
**Description**: Tracks yield-generating assets (e.g., staking, dividends), summarises monthly/yearly income vs growth assets.

## Block 127 — Sentiment Explorer
**Status**: MVP  
**Labels**: sentiment, NLP, macro  
**Description**: Tool for browsing sentiment data across assets, sectors, and time — driven by news, Reddit, Twitter feeds.

## Block 128 — Tier-Based Feature Control
**Status**: MVP  
**Labels**: billing, tier, access  
**Description**: Enables or disables features based on user tier (Observer, Navigator, Operator, Sovereign).

## Block 129 — Custom Rebalance Rules
**Status**: MVP  
**Labels**: strategy, user-defined, control  
**Description**: Allows users to define override logic, such as “Never trim BTC” or “Always reinvest dividends.”

## Block 130 — Risk Threshold Alerts
**Status**: MVP  
**Labels**: risk, alert, monitoring  
**Description**: Sends alerts when portfolio exceeds user-defined risk thresholds (e.g., >30% in high-volatility assets).

## Block 131 — Asset Migration Tracker
**Status**: MVP  
**Labels**: history, migration, rebalance  
**Description**: Tracks when and why an asset moved from watchlist to portfolio, or was removed altogether.

## Block 132 — Cost Basis Annotator
**Status**: MVP  
**Labels**: tax, reporting, cost basis  
**Description**: Records and adjusts cost basis automatically (from CSV/API) to support accurate tax and performance metrics.

## Block 133 — Trade Intent Recorder
**Status**: MVP  
**Labels**: journal, decision, override  
**Description**: Users can log their trade intent even if not executed in app. Useful for strategy tracking and retrospective analysis.

## Block 134 — Performance Badge Tracker
**Status**: MVP  
**Labels**: gamification, metrics, badges  
**Description**: Tracks user’s achievement badges (e.g., "30% YTD", "Perfect Rotation") and adds to reporting dashboard.

## Block 135 — Goal Alignment Report
**Status**: MVP  
**Labels**: reporting, goal, progress  
**Description**: Shows how well current portfolio aligns to declared goal (e.g. Growth, Stability, Sovereignty). GPT-powered summary.

## Block 136 — Asset Override Memory
**Status**: MVP  
**Labels**: override, memory, agent  
**Description**: Agent remembers manual overrides and begins adjusting future prompts accordingly — learning user preferences.

## Block 137 — Strategy Persistence Engine
**Status**: core  
**Labels**: strategy, persistence, long-term  
**Description**: Maintains overarching strategy integrity over time, despite temporary signal noise or news-driven distractions.

## Block 138 — Signal Timing Logger
**Status**: MVP  
**Labels**: signals, logging, accuracy  
**Description**: Logs when signals were first triggered, acted on, and what the results were — enables post-hoc strategy reviews.

## Block 139 — Legacy Vault Builder
**Status**: scoped  
**Labels**: sovereignty, inheritance, legacy  
**Description**: Supports long-term vault building with legacy goals in mind. Includes gifting intentions, long-hold forecasts.

## Block 140 — Multi-User Household Mode
**Status**: scoped  
**Labels**: profiles, sharing, access  
**Description**: Allows household members (e.g. partner, children) to view or co-manage certain vaults or overlays.

## Block 141 — ESG Violation Watchdog
**Status**: scoped  
**Labels**: ESG, filter, watchdog  
**Description**: Flags ESG violations or controversies around portfolio holdings. Enables user to take action or reweight.

## Block 142 — Yield Curve Insight Panel
**Status**: MVP  
**Labels**: macro, bond, forecasting  
**Description**: Visualises inverted yield curves, spreads, and implications for equity and crypto rotation strategies.

## Block 143 — Recession Readiness Meter
**Status**: MVP  
**Labels**: macro, alert, defensive  
**Description**: Indicates how defensively the portfolio is positioned based on macro risk, volatility, and asset classes.

## Block 144 — Sovereign Education Feed
**Status**: MVP  
**Labels**: onboarding, education, sovereignty  
**Description**: Dynamic GPT-fed module educating users about sovereign wealth, fiat cycles, and independent investing.

## Block 145 — Asset Debasement Score
**Status**: MVP  
**Labels**: fiat, scoring, inflation  
**Description**: Scores assets by how resistant they are to fiat debasement. BTC scores high, fiat cash low, bonds variable.

## Block 146 — Portfolio Rebalance Journal
**Status**: MVP  
**Labels**: journaling, strategy, logs  
**Description**: Full rebalance action log — what was changed, what was suggested, and what was skipped. Agent can learn from it.

## Block 147 — Time-Based Triggers
**Status**: MVP  
**Labels**: scheduling, triggers, alerts  
**Description**: Supports triggers like “Every Friday” or “1st of Month” for DCA, portfolio reviews, or rebalance checks.

## Block 148 — Asset Replacement Engine
**Status**: MVP  
**Labels**: rotation, replacement, agent  
**Description**: Suggests replacing underperforming assets with stronger watchlist candidates. Uses overlay signals + agent confidence.

## Block 149 — Final Deployment Checklist
**Status**: release  
**Labels**: QA, checklist, deploy  
**Description**: QA-confirmed list of all key functionality and user flows. Used before each major release to validate readiness.

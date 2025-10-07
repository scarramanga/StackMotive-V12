"""
AI Orchestrator - Provider-agnostic AI summaries with fallback templates
Supports OpenAI and Anthropic with graceful degradation
"""
import os
import json
from typing import Dict, Any, Optional
import logging
from server.services.cache import get_cache, set_cache

logger = logging.getLogger(__name__)

STACK_AI_PROVIDER = os.getenv("STACK_AI_PROVIDER", "openai").lower()
STACK_AI_MODEL = os.getenv("STACK_AI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
AI_SUMMARY_CACHE_TTL = int(os.getenv("AI_SUMMARY_CACHE_TTL", "300"))


def get_ai_client():
    """Get AI client based on provider configuration"""
    if STACK_AI_PROVIDER == "openai" and OPENAI_API_KEY:
        try:
            import openai
            return openai.OpenAI(api_key=OPENAI_API_KEY)
        except ImportError:
            logger.warning("openai package not installed, falling back to templates")
            return None
    elif STACK_AI_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
        try:
            import anthropic
            return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        except ImportError:
            logger.warning("anthropic package not installed, falling back to templates")
            return None
    return None


def fallback_portfolio_summary(signal_payload: Dict[str, Any]) -> str:
    """Rule-based template summary when AI provider unavailable"""
    overlays = signal_payload.get("overlays", {})
    summary = signal_payload.get("summary", {})
    
    lines = ["📊 Portfolio Analysis Summary\n"]
    
    total_positions = summary.get("total_positions", 0)
    lines.append(f"You currently hold {total_positions} positions.")
    
    momentum = overlays.get("momentum", {})
    buckets = momentum.get("buckets", {})
    if buckets.get("strong_up"):
        lines.append(f"Strong performers: {', '.join(buckets['strong_up'][:3])}")
    if buckets.get("strong_down"):
        lines.append(f"⚠️ Underperformers: {', '.join(buckets['strong_down'][:3])}")
    
    concentration = overlays.get("concentration", {})
    conc_level = concentration.get("concentration", "Unknown")
    lines.append(f"\nConcentration risk: {conc_level}")
    if concentration.get("top_holdings"):
        top = concentration["top_holdings"][0]
        lines.append(f"Largest position: {top['symbol']} ({top['weight_pct']:.1f}%)")
    
    drawdown = overlays.get("drawdown", {})
    max_dd = drawdown.get("max_drawdown_pct", 0)
    current_dd = drawdown.get("current_drawdown_pct", 0)
    lines.append(f"\nMax drawdown: {max_dd}%")
    if current_dd > 5:
        lines.append(f"⚠️ Currently in {current_dd}% drawdown from peak")
    
    lines.append("\n💡 Consider rebalancing if concentration risk is high or reviewing underperformers.")
    
    return "\n".join(lines)


def fallback_strategy_explanation(signal_payload: Dict[str, Any]) -> str:
    """Rule-based strategy explanation when AI provider unavailable"""
    overlays = signal_payload.get("overlays", {})
    
    lines = ["🎯 Strategy Overlay Analysis\n"]
    
    momentum = overlays.get("momentum", {})
    buckets = momentum.get("buckets", {})
    lines.append("**Momentum Analysis:**")
    lines.append(f"- Strong uptrend: {len(buckets.get('strong_up', []))} positions")
    lines.append(f"- Neutral: {len(buckets.get('neutral', []))} positions")
    lines.append(f"- Downtrend: {len(buckets.get('strong_down', []))} positions")
    
    volatility = overlays.get("volatility", {})
    vol_data = volatility.get("volatility_by_symbol", {})
    high_vol = [s for s, d in vol_data.items() if d.get("class") == "high"]
    lines.append(f"\n**Volatility:**")
    lines.append(f"- High volatility assets: {len(high_vol)}")
    
    concentration = overlays.get("concentration", {})
    lines.append(f"\n**Risk Assessment:**")
    lines.append(f"- Concentration: {concentration.get('concentration', 'Unknown')}")
    lines.append(f"- HHI: {concentration.get('hhi', 0)}")
    
    lines.append("\n**Recommendations:**")
    if concentration.get("concentration") in ["High", "Very High"]:
        lines.append("- Consider diversifying to reduce concentration risk")
    if len(buckets.get("strong_down", [])) > 0:
        lines.append("- Review underperforming positions for potential exit")
    if len(high_vol) > len(vol_data) / 2:
        lines.append("- Portfolio shows high volatility; consider risk management")
    
    return "\n".join(lines)


async def summarize_portfolio(signal_payload: Dict[str, Any]) -> str:
    """Generate portfolio summary using AI or fallback"""
    cache_key = f"ai:summary:{hash(json.dumps(signal_payload, sort_keys=True))}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    
    client = get_ai_client()
    
    if client is None:
        summary = fallback_portfolio_summary(signal_payload)
        set_cache(cache_key, summary, ttl=AI_SUMMARY_CACHE_TTL)
        return summary
    
    prompt = f"""Analyze this portfolio and provide a concise summary for an investor:

Portfolio Data:
{json.dumps(signal_payload, indent=2)}

Provide a 3-4 paragraph summary covering:
1. Overall portfolio health and performance
2. Key risk factors and opportunities
3. Actionable recommendations

Keep it professional and concise."""
    
    try:
        if STACK_AI_PROVIDER == "openai":
            response = client.chat.completions.create(
                model=STACK_AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professional portfolio analyst providing intelligence-only insights. Never provide financial advice or trading recommendations."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            summary = response.choices[0].message.content
        elif STACK_AI_PROVIDER == "anthropic":
            response = client.messages.create(
                model=STACK_AI_MODEL,
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            summary = response.content[0].text
        else:
            summary = fallback_portfolio_summary(signal_payload)
        
        set_cache(cache_key, summary, ttl=AI_SUMMARY_CACHE_TTL)
        return summary
        
    except Exception as e:
        logger.error(f"AI provider error: {e}, falling back to template")
        summary = fallback_portfolio_summary(signal_payload)
        set_cache(cache_key, summary, ttl=AI_SUMMARY_CACHE_TTL)
        return summary


async def explain_strategy(signal_payload: Dict[str, Any]) -> str:
    """Generate strategy explanation using AI or fallback"""
    cache_key = f"ai:explain:{hash(json.dumps(signal_payload, sort_keys=True))}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    
    client = get_ai_client()
    
    if client is None:
        explanation = fallback_strategy_explanation(signal_payload)
        set_cache(cache_key, explanation, ttl=AI_SUMMARY_CACHE_TTL)
        return explanation
    
    prompt = f"""Explain the following strategy overlay analysis in detail:

Overlay Data:
{json.dumps(signal_payload, indent=2)}

Provide a detailed explanation covering:
1. What each overlay metric means
2. How these metrics interact
3. Strategic implications
4. Risk considerations

Be technical but clear."""
    
    try:
        if STACK_AI_PROVIDER == "openai":
            response = client.chat.completions.create(
                model=STACK_AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a quantitative analyst explaining portfolio strategies. Provide analysis only, not advice."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            explanation = response.choices[0].message.content
        elif STACK_AI_PROVIDER == "anthropic":
            response = client.messages.create(
                model=STACK_AI_MODEL,
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )
            explanation = response.content[0].text
        else:
            explanation = fallback_strategy_explanation(signal_payload)
        
        set_cache(cache_key, explanation, ttl=AI_SUMMARY_CACHE_TTL)
        return explanation
        
    except Exception as e:
        logger.error(f"AI provider error: {e}, falling back to template")
        explanation = fallback_strategy_explanation(signal_payload)
        set_cache(cache_key, explanation, ttl=AI_SUMMARY_CACHE_TTL)
        return explanation

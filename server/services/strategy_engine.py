"""
Strategy Engine - Pure calculation functions for portfolio overlays
No external calls, deterministic outputs from database data
"""
from typing import Dict, List, Any
from datetime import datetime, timedelta
import math


def calculate_momentum_buckets(positions: List[Dict]) -> Dict[str, Any]:
    """
    Calculate momentum classification for positions
    Returns buckets: strong_up, moderate_up, neutral, moderate_down, strong_down
    """
    if not positions:
        return {"buckets": {}, "summary": "No positions"}
    
    momentum_scores = {}
    for pos in positions:
        current_price = float(pos.get('currentPrice', 0) or pos.get('avgCost', 0))
        avg_cost = float(pos.get('avgCost', 1))
        momentum = (current_price / avg_cost - 1) * 100 if avg_cost > 0 else 0
        
        if momentum > 20:
            bucket = "strong_up"
        elif momentum > 5:
            bucket = "moderate_up"
        elif momentum < -20:
            bucket = "strong_down"
        elif momentum < -5:
            bucket = "moderate_down"
        else:
            bucket = "neutral"
        
        momentum_scores[pos['symbol']] = {
            "bucket": bucket,
            "momentum_pct": momentum,
            "current_price": current_price,
            "avg_cost": avg_cost
        }
    
    buckets = {}
    for symbol, data in momentum_scores.items():
        bucket = data['bucket']
        if bucket not in buckets:
            buckets[bucket] = []
        buckets[bucket].append(symbol)
    
    return {
        "buckets": buckets,
        "details": momentum_scores,
        "summary": f"{len(buckets.get('strong_up', []))} strong uptrend, {len(buckets.get('neutral', []))} neutral"
    }


def calculate_volatility_class(trades: List[Dict], positions: List[Dict]) -> Dict[str, Any]:
    """
    Calculate volatility classification per symbol
    Uses standard deviation of returns from trade history
    """
    volatility_by_symbol = {}
    
    trades_by_symbol = {}
    for trade in trades:
        symbol = trade.get('symbol')
        if symbol:
            if symbol not in trades_by_symbol:
                trades_by_symbol[symbol] = []
            trades_by_symbol[symbol].append(trade)
    
    for symbol, symbol_trades in trades_by_symbol.items():
        if len(symbol_trades) < 2:
            volatility_by_symbol[symbol] = {"class": "unknown", "value": 0}
            continue
        
        returns = []
        for i in range(len(symbol_trades) - 1):
            entry = float(symbol_trades[i].get('entry_price', 0))
            exit = float(symbol_trades[i].get('exit_price', entry))
            if entry > 0:
                ret = (exit - entry) / entry
                returns.append(ret)
        
        if returns:
            mean_return = sum(returns) / len(returns)
            variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
            volatility = math.sqrt(variance) * 100
            
            if volatility > 15:
                vol_class = "high"
            elif volatility > 8:
                vol_class = "medium"
            else:
                vol_class = "low"
            
            volatility_by_symbol[symbol] = {
                "class": vol_class,
                "value": volatility,
                "trade_count": len(symbol_trades)
            }
    
    return {
        "volatility_by_symbol": volatility_by_symbol,
        "summary": f"Analyzed {len(volatility_by_symbol)} symbols"
    }


def calculate_concentration(positions: List[Dict]) -> Dict[str, Any]:
    """
    Calculate portfolio concentration metrics
    Returns top-N weights and HHI (Herfindahl-Hirschman Index)
    """
    if not positions:
        return {"concentration": "N/A", "hhi": 0, "top_holdings": []}
    
    total_value = sum(
        float(pos.get('quantity', 0)) * float(pos.get('currentPrice', 0) or pos.get('avgCost', 0))
        for pos in positions
    )
    
    if total_value <= 0:
        return {"concentration": "N/A", "hhi": 0, "top_holdings": []}
    
    holdings = []
    for pos in positions:
        value = float(pos.get('quantity', 0)) * float(pos.get('currentPrice', 0) or pos.get('avgCost', 0))
        weight = (value / total_value) * 100
        holdings.append({
            "symbol": pos['symbol'],
            "value": value,
            "weight_pct": weight
        })
    
    holdings.sort(key=lambda x: x['weight_pct'], reverse=True)
    
    hhi = sum(h['weight_pct'] ** 2 for h in holdings)
    
    top_5_pct = sum(h['weight_pct'] for h in holdings[:5])
    
    if hhi > 2500:
        concentration = "Very High"
    elif hhi > 1500:
        concentration = "High"
    elif hhi > 1000:
        concentration = "Moderate"
    else:
        concentration = "Low"
    
    return {
        "concentration": concentration,
        "hhi": round(hhi, 2),
        "top_5_pct": round(top_5_pct, 2),
        "top_holdings": holdings[:10],
        "summary": f"{concentration} concentration (HHI: {round(hhi, 2)})"
    }


def calculate_drawdown_lite(trades: List[Dict], positions: List[Dict]) -> Dict[str, Any]:
    """
    Calculate maximum drawdown from simplified equity curve
    Built from realized P&L + current mark-to-market
    """
    if not trades and not positions:
        return {"max_drawdown_pct": 0, "current_drawdown_pct": 0, "peak_value": 0}
    
    equity_curve = [10000.0]
    
    sorted_trades = sorted(
        [t for t in trades if t.get('exit_time')],
        key=lambda x: x.get('exit_time', '')
    )
    
    for trade in sorted_trades:
        pnl = float(trade.get('profit_loss', 0))
        equity_curve.append(equity_curve[-1] + pnl)
    
    current_unrealized = sum(
        (float(pos.get('currentPrice', 0) or pos.get('avgCost', 0)) - float(pos.get('avgCost', 0))) * 
        float(pos.get('quantity', 0))
        for pos in positions
    )
    equity_curve.append(equity_curve[-1] + current_unrealized)
    
    peak = equity_curve[0]
    max_drawdown = 0
    current_drawdown = 0
    
    for value in equity_curve:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak if peak > 0 else 0
        max_drawdown = max(max_drawdown, drawdown)
        if value == equity_curve[-1]:
            current_drawdown = drawdown
    
    return {
        "max_drawdown_pct": round(max_drawdown * 100, 2),
        "current_drawdown_pct": round(current_drawdown * 100, 2),
        "peak_value": round(peak, 2),
        "current_value": round(equity_curve[-1], 2),
        "summary": f"Max DD: {round(max_drawdown * 100, 2)}%"
    }


def get_strategy_overlays(user_id: int, db) -> Dict[str, Any]:
    """
    Main function to generate all strategy overlays from database
    """
    from server.db.qmark import qmark
    
    stmt, params = qmark("""
        SELECT symbol, quantity, avgCost, currentPrice, lastUpdated
        FROM portfolio_positions
        WHERE userId = ?
    """, (user_id,))
    positions = [dict(row) for row in db.execute(stmt, params).mappings().all()]
    
    stmt, params = qmark("""
        SELECT symbol, trade_type, entry_price, exit_price, quantity, 
               profit_loss, entry_time, exit_time, status
        FROM trades
        WHERE userId = ? AND status = 'closed'
        ORDER BY exit_time DESC
        LIMIT 100
    """, (user_id,))
    trades = [dict(row) for row in db.execute(stmt, params).mappings().all()]
    
    momentum = calculate_momentum_buckets(positions)
    volatility = calculate_volatility_class(trades, positions)
    concentration = calculate_concentration(positions)
    drawdown = calculate_drawdown_lite(trades, positions)
    
    return {
        "userId": user_id,
        "timestamp": datetime.now().isoformat(),
        "overlays": {
            "momentum": momentum,
            "volatility": volatility,
            "concentration": concentration,
            "drawdown": drawdown
        },
        "summary": {
            "total_positions": len(positions),
            "total_trades_analyzed": len(trades),
            "risk_level": concentration["concentration"]
        }
    }

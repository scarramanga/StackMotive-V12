"""
Tests for ai_orchestrator.py
Tests AI provider abstraction and fallback logic
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from unittest.mock import patch, MagicMock
from server.services.ai_orchestrator import (
    summarize_portfolio,
    explain_strategy,
    fallback_portfolio_summary,
    fallback_strategy_explanation
)


@pytest.fixture
def sample_payload():
    return {
        "userId": 1,
        "timestamp": "2024-01-01T00:00:00",
        "overlays": {
            "momentum": {
                "buckets": {
                    "strong_up": ["AAPL", "MSFT"],
                    "neutral": ["TSLA"],
                    "strong_down": ["META"]
                },
                "summary": "2 strong uptrend, 1 neutral"
            },
            "concentration": {
                "concentration": "High",
                "hhi": 2800,
                "top_holdings": [
                    {"symbol": "AAPL", "weight_pct": 45.0}
                ]
            },
            "drawdown": {
                "max_drawdown_pct": 15.5,
                "current_drawdown_pct": 5.2
            }
        },
        "summary": {
            "total_positions": 4,
            "total_trades_analyzed": 20
        }
    }


def test_fallback_portfolio_summary(sample_payload):
    """Test fallback template generation"""
    summary = fallback_portfolio_summary(sample_payload)
    
    assert "4 positions" in summary
    assert "AAPL" in summary or "MSFT" in summary
    assert "High" in summary
    assert "15.5%" in summary


def test_fallback_strategy_explanation(sample_payload):
    """Test fallback strategy explanation"""
    explanation = fallback_strategy_explanation(sample_payload)
    
    assert "Momentum Analysis" in explanation
    assert "Strong uptrend: 2 positions" in explanation
    assert "High" in explanation
    assert "Recommendations" in explanation


@pytest.mark.asyncio
async def test_summarize_portfolio_no_keys(sample_payload):
    """Test summary generation with no API keys"""
    with patch('server.services.ai_orchestrator.OPENAI_API_KEY', None):
        with patch('server.services.ai_orchestrator.ANTHROPIC_API_KEY', None):
            summary = await summarize_portfolio(sample_payload)
            
            assert len(summary) > 0
            assert "positions" in summary.lower()


@pytest.mark.asyncio
async def test_summarize_portfolio_with_mock_openai(sample_payload):
    """Test summary with mocked AI client"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Mocked AI summary"
    
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_response
    
    with patch('server.services.ai_orchestrator.get_ai_client', return_value=mock_client):
        with patch('server.services.ai_orchestrator.STACK_AI_PROVIDER', 'openai'):
            summary = await summarize_portfolio(sample_payload)
            
            assert summary == "Mocked AI summary"
            mock_client.chat.completions.create.assert_called_once()


@pytest.mark.asyncio
async def test_explain_strategy_no_keys(sample_payload):
    """Test explanation with no API keys"""
    with patch('server.services.ai_orchestrator.OPENAI_API_KEY', None):
        with patch('server.services.ai_orchestrator.ANTHROPIC_API_KEY', None):
            explanation = await explain_strategy(sample_payload)
            
            assert len(explanation) > 0
            assert "Momentum" in explanation

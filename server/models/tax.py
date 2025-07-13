from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from server.database import Base
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# SQLAlchemy Models
class TaxTransaction(Base):
    __tablename__ = "tax_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # buy, sell
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    fees = Column(Float, default=0.0)
    date = Column(DateTime, nullable=False)
    cost_basis = Column(Float, nullable=True)
    proceeds = Column(Float, nullable=True)
    capital_gain = Column(Float, nullable=True)
    gain_type = Column(String, nullable=True)  # short, long
    tax_year = Column(String, nullable=False)
    country = Column(String, default="AU")
    created_at = Column(DateTime, default=datetime.utcnow)

class TaxReport(Base):
    __tablename__ = "tax_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tax_year = Column(String, nullable=False)
    country = Column(String, nullable=False)
    report_type = Column(String, default="annual")  # annual, quarterly, estimated
    total_proceeds = Column(Float, default=0.0)
    total_cost_basis = Column(Float, default=0.0)
    total_gain_loss = Column(Float, default=0.0)
    short_term_gains = Column(Float, default=0.0)
    long_term_gains = Column(Float, default=0.0)
    estimated_tax_owed = Column(Float, default=0.0)
    report_data = Column(JSON, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="draft")

class TaxSettings(Base):
    __tablename__ = "tax_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    country = Column(String, default="AU")
    tax_residency = Column(String, default="AU")
    accounting_method = Column(String, default="FIFO")  # FIFO, LIFO, ACB
    include_fees = Column(Boolean, default=True)
    include_foreign_income = Column(Boolean, default=True)
    carry_forward_losses = Column(Boolean, default=True)
    previous_year_losses = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic Models
class CountryInfo(BaseModel):
    code: str
    name: str
    cgt_rate: str
    threshold: str
    deadline: str
    forms: List[str]

class TaxTransactionBase(BaseModel):
    symbol: str
    transaction_type: str
    quantity: float
    price: float
    fees: float = 0.0
    date: datetime
    cost_basis: Optional[float] = None
    proceeds: Optional[float] = None
    capital_gain: Optional[float] = None
    gain_type: Optional[str] = None

class TaxTransactionCreate(TaxTransactionBase):
    pass

class TaxTransactionResponse(TaxTransactionBase):
    id: int
    user_id: int
    tax_year: str
    country: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TaxSummary(BaseModel):
    total_realized_gains: float = 0.0
    total_realized_losses: float = 0.0
    net_capital_gains: float = 0.0
    short_term_gains: float = 0.0
    long_term_gains: float = 0.0
    total_fees: float = 0.0
    total_dividends: float = 0.0
    estimated_tax_owed: float = 0.0

class TaxReportRequest(BaseModel):
    tax_year: str
    country: str = "AU"
    accounting_method: str = "FIFO"
    include_fees: bool = True
    include_foreign_income: bool = True
    report_type: str = "annual"

class TaxReportResponse(BaseModel):
    id: int
    user_id: int
    tax_year: str
    country: str
    report_type: str
    summary: TaxSummary
    transactions: List[TaxTransactionResponse]
    country_info: CountryInfo
    generated_at: datetime
    status: str
    
    class Config:
        from_attributes = True

class TaxSettingsRequest(BaseModel):
    country: str = "AU"
    tax_residency: str = "AU"
    accounting_method: str = "FIFO"
    include_fees: bool = True
    include_foreign_income: bool = True
    carry_forward_losses: bool = True
    previous_year_losses: float = 0.0

class TaxSettingsResponse(BaseModel):
    id: int
    user_id: int
    country: str
    tax_residency: str
    accounting_method: str
    include_fees: bool
    include_foreign_income: bool
    carry_forward_losses: bool
    previous_year_losses: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Tax calculation utilities
class TaxCalculator:
    """Tax calculation logic for different countries"""
    
    # Tax rates by country and year
    TAX_RATES = {
        "AU": {
            "2024": {"low": 0.19, "medium": 0.325, "high": 0.37, "top": 0.45},
            "2023": {"low": 0.19, "medium": 0.325, "high": 0.37, "top": 0.45},
        },
        "NZ": {
            "2024": {"low": 0.105, "medium": 0.175, "high": 0.30, "top": 0.33},
            "2023": {"low": 0.105, "medium": 0.175, "high": 0.30, "top": 0.33},
        },
        "US": {
            "2024": {"short_term": 0.37, "long_term_low": 0.0, "long_term_medium": 0.15, "long_term_high": 0.20},
            "2023": {"short_term": 0.37, "long_term_low": 0.0, "long_term_medium": 0.15, "long_term_high": 0.20},
        }
    }
    
    @staticmethod
    def get_country_info(country_code: str) -> CountryInfo:
        """Get country-specific tax information"""
        info_map = {
            "AU": CountryInfo(
                code="AU",
                name="Australia",
                cgt_rate="50% discount for assets held >12 months",
                threshold="CGT discount applies to assets held >12 months",
                deadline="October 31st",
                forms=["Capital Gains Tax Schedule", "Individual Tax Return"]
            ),
            "NZ": CountryInfo(
                code="NZ",
                name="New Zealand", 
                cgt_rate="No general CGT (trader vs investor rules apply)",
                threshold="Bright-line test for property (10 years)",
                deadline="July 7th",
                forms=["IR3 Individual Income Tax Return", "IR4 Income Tax Return"]
            ),
            "US": CountryInfo(
                code="US",
                name="United States",
                cgt_rate="0%, 15%, or 20% for long-term gains",
                threshold="Short-term: ordinary income rates, Long-term: preferential rates",
                deadline="April 15th",
                forms=["Form 8949", "Schedule D", "Form 1040"]
            )
        }
        return info_map.get(country_code, info_map["AU"])
    
    @staticmethod
    def calculate_capital_gains(transactions: List[TaxTransactionResponse], 
                              country: str = "AU", 
                              accounting_method: str = "FIFO") -> TaxSummary:
        """Calculate capital gains using specified accounting method"""
        summary = TaxSummary()
        
        # Group by symbol for lot tracking
        holdings = {}
        
        for transaction in transactions:
            symbol = transaction.symbol
            if symbol not in holdings:
                holdings[symbol] = []
            
            if transaction.transaction_type.lower() == "buy":
                # Add to holdings
                holdings[symbol].append({
                    "quantity": transaction.quantity,
                    "cost_basis": transaction.price,
                    "date": transaction.date,
                    "fees": transaction.fees
                })
            
            elif transaction.transaction_type.lower() == "sell":
                # Calculate gains based on accounting method
                remaining_quantity = transaction.quantity
                total_cost_basis = 0
                total_proceeds = transaction.quantity * transaction.price
                
                if accounting_method == "FIFO":
                    # Use oldest lots first
                    holdings[symbol].sort(key=lambda x: x["date"])
                elif accounting_method == "LIFO":
                    # Use newest lots first
                    holdings[symbol].sort(key=lambda x: x["date"], reverse=True)
                
                while remaining_quantity > 0 and holdings[symbol]:
                    lot = holdings[symbol][0]
                    
                    if lot["quantity"] <= remaining_quantity:
                        # Use entire lot
                        total_cost_basis += lot["quantity"] * lot["cost_basis"]
                        if summary.include_fees:
                            total_cost_basis += lot["fees"]
                        remaining_quantity -= lot["quantity"]
                        holdings[symbol].pop(0)
                    else:
                        # Use partial lot
                        used_quantity = remaining_quantity
                        total_cost_basis += used_quantity * lot["cost_basis"]
                        if summary.include_fees:
                            total_cost_basis += (used_quantity / lot["quantity"]) * lot["fees"]
                        lot["quantity"] -= used_quantity
                        remaining_quantity = 0
                
                # Calculate gain/loss
                gain_loss = total_proceeds - total_cost_basis
                
                # Determine short/long term (using 12 months as threshold)
                days_held = (transaction.date - holdings[symbol][0]["date"]).days if holdings[symbol] else 0
                is_long_term = days_held >= 365
                
                if gain_loss > 0:
                    summary.total_realized_gains += gain_loss
                    if is_long_term:
                        summary.long_term_gains += gain_loss
                    else:
                        summary.short_term_gains += gain_loss
                else:
                    summary.total_realized_losses += abs(gain_loss)
                
                summary.total_fees += transaction.fees
        
        summary.net_capital_gains = summary.total_realized_gains - summary.total_realized_losses
        
        # Estimate tax owed based on country
        if country == "AU" and summary.long_term_gains > 0:
            # Apply 50% CGT discount for long-term gains
            discounted_gains = summary.long_term_gains * 0.5
            summary.estimated_tax_owed = (discounted_gains + summary.short_term_gains) * 0.325  # Medium rate
        elif country == "NZ":
            # Generally no CGT in NZ unless considered a trader
            summary.estimated_tax_owed = 0
        elif country == "US":
            # Simplified calculation
            summary.estimated_tax_owed = (summary.short_term_gains * 0.37) + (summary.long_term_gains * 0.15)
        
        return summary 
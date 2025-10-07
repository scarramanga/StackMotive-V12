import os
import hmac
import hashlib
import base64
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

from server.services.http_client import create_client
from server.utils.observability import log_import_event


class KuCoinService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        api_passphrase: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("KUCOIN_API_KEY")
        self.api_secret = api_secret or os.getenv("KUCOIN_API_SECRET")
        self.api_passphrase = api_passphrase or os.getenv("KUCOIN_API_PASSPHRASE")
        
        sandbox = os.getenv("KUCOIN_SANDBOX", "false").lower() == "true"
        self.base_url = (
            "https://openapi-sandbox.kucoin.com"
            if sandbox
            else "https://api.kucoin.com"
        )

    def _generate_signature(
        self, timestamp: str, method: str, endpoint: str, body: str = ""
    ) -> str:
        if not self.api_secret:
            raise ValueError("KUCOIN_API_SECRET not configured")

        str_to_sign = timestamp + method + endpoint + body
        signature = base64.b64encode(
            hmac.new(
                self.api_secret.encode(), str_to_sign.encode(), hashlib.sha256
            ).digest()
        ).decode()
        return signature

    def _get_headers(
        self, method: str, endpoint: str, body: str = ""
    ) -> Dict[str, str]:
        if not all([self.api_key, self.api_secret, self.api_passphrase]):
            raise ValueError("KuCoin API credentials not fully configured")

        timestamp = str(int(time.time() * 1000))
        signature = self._generate_signature(timestamp, method, endpoint, body)

        encrypted_passphrase = base64.b64encode(
            hmac.new(
                self.api_secret.encode(), self.api_passphrase.encode(), hashlib.sha256
            ).digest()
        ).decode()

        return {
            "KC-API-SIGN": signature,
            "KC-API-TIMESTAMP": timestamp,
            "KC-API-KEY": self.api_key,
            "KC-API-PASSPHRASE": encrypted_passphrase,
            "KC-API-KEY-VERSION": "2",
            "Content-Type": "application/json",
        }

    async def get_accounts(self, user_id: int) -> Dict[str, Any]:
        start_time = time.time()
        
        try:
            endpoint = "/api/v1/accounts"
            headers = self._get_headers("GET", endpoint)

            client = create_client(self.base_url)
            response = await client.get(endpoint, headers=headers)
            response.raise_for_status()
            data = response.json()

            if data.get("code") != "200000":
                error_msg = data.get("msg", "Unknown KuCoin API error")
                log_import_event(
                    source="kucoin",
                    user_id=user_id,
                    items_imported=0,
                    duration_ms=int((time.time() - start_time) * 1000),
                    status="error",
                    error=error_msg,
                )
                return {"error": error_msg}

            accounts = data.get("data", [])
            holdings = []
            cash_balances = {}

            for account in accounts:
                account_type = account.get("type", "").lower()
                if account_type not in [
                    "trade",
                    "main",
                    "margin",
                    "futures",
                ]:
                    continue

                currency = account.get("currency", "")
                balance = float(account.get("balance", 0))
                available = float(account.get("available", 0))

                if balance > 0:
                    if currency in ["USDT", "USD", "USDC", "DAI"]:
                        cash_key = (
                            f"{currency}_{account_type}"
                            if account_type != "trade"
                            else currency
                        )
                        cash_balances[cash_key] = (
                            cash_balances.get(cash_key, 0) + balance
                        )
                    else:
                        holdings.append(
                            {
                                "symbol": currency,
                                "quantity": balance,
                                "available": available,
                                "accountType": account_type,
                                "source": "kucoin",
                            }
                        )

            result = {
                "holdings": holdings,
                "cashBalances": cash_balances,
                "totalCash": sum(cash_balances.values()),
                "source": "kucoin",
                "asOf": datetime.utcnow().isoformat() + "Z",
            }

            log_import_event(
                source="kucoin",
                user_id=user_id,
                items_imported=len(holdings),
                duration_ms=int((time.time() - start_time) * 1000),
                status="success",
            )

            return result

        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
            log_import_event(
                source="kucoin",
                user_id=user_id,
                items_imported=0,
                duration_ms=int((time.time() - start_time) * 1000),
                status="error",
                error=error_msg,
            )
            return {"error": error_msg}
        except Exception as e:
            error_msg = str(e)
            log_import_event(
                source="kucoin",
                user_id=user_id,
                items_imported=0,
                duration_ms=int((time.time() - start_time) * 1000),
                status="error",
                error=error_msg,
            )
            return {"error": error_msg}

    async def get_fills(
        self, user_id: int, symbol: Optional[str] = None, limit: int = 50
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        try:
            endpoint = f"/api/v1/fills?pageSize={limit}"
            if symbol:
                endpoint += f"&symbol={symbol}"

            headers = self._get_headers("GET", endpoint)

            client = create_client(self.base_url)
            response = await client.get(endpoint, headers=headers)
            response.raise_for_status()
            data = response.json()

            if data.get("code") != "200000":
                error_msg = data.get("msg", "Unknown KuCoin API error")
                log_import_event(
                    source="kucoin_fills",
                    user_id=user_id,
                    items_imported=0,
                    duration_ms=int((time.time() - start_time) * 1000),
                    status="error",
                    error=error_msg,
                )
                return {"error": error_msg}

            fills_data = data.get("data", {})
            items = fills_data.get("items", [])

            fills = []
            for item in items:
                fills.append(
                    {
                        "tradeId": item.get("tradeId"),
                        "orderId": item.get("orderId"),
                        "symbol": item.get("symbol"),
                        "side": item.get("side"),
                        "price": float(item.get("price", 0)),
                        "size": float(item.get("size", 0)),
                        "funds": float(item.get("funds", 0)),
                        "fee": float(item.get("fee", 0)),
                        "feeRate": float(item.get("feeRate", 0)),
                        "feeCurrency": item.get("feeCurrency"),
                        "liquidity": item.get("liquidity"),
                        "createdAt": item.get("createdAt"),
                    }
                )

            result = {
                "fills": fills,
                "source": "kucoin",
                "asOf": datetime.utcnow().isoformat() + "Z",
            }

            log_import_event(
                source="kucoin_fills",
                user_id=user_id,
                items_imported=len(fills),
                duration_ms=int((time.time() - start_time) * 1000),
                status="success",
            )

            return result

        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
            log_import_event(
                source="kucoin_fills",
                user_id=user_id,
                items_imported=0,
                duration_ms=int((time.time() - start_time) * 1000),
                status="error",
                error=error_msg,
            )
            return {"error": error_msg}
        except Exception as e:
            error_msg = str(e)
            log_import_event(
                source="kucoin_fills",
                user_id=user_id,
                items_imported=0,
                duration_ms=int((time.time() - start_time) * 1000),
                status="error",
                error=error_msg,
            )
            return {"error": error_msg}

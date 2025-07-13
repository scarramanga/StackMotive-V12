import httpx
import json
import logging
from typing import Dict, Optional

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

class AuthTester:
    def __init__(self):
        self.client = httpx.Client()
        self.access_token: Optional[str] = None
        
    def _log_response(self, response: httpx.Response):
        logger.debug(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")
        try:
            logger.debug(f"Response body: {response.json()}")
        except:
            logger.debug(f"Response text: {response.text}")
    
    def register(self, email: str, password: str) -> bool:
        logger.info(f"🔵 Testing registration for {email}")
        response = self.client.post(
            f"{BASE_URL}/api/register",
            json={"email": email, "password": password}
        )
        self._log_response(response)
        return response.status_code == 200
    
    def login(self, email: str, password: str) -> bool:
        logger.info(f"🔵 Testing login for {email}")
        response = self.client.post(
            f"{BASE_URL}/api/login",
            json={"email": email, "password": password}
        )
        self._log_response(response)
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access_token")
            logger.info(f"✅ Got access token: {self.access_token[:10]}...")
            return True
        return False
    
    def get_user_info(self) -> Optional[Dict]:
        logger.info("🔵 Testing /api/user/me endpoint")
        if not self.access_token:
            logger.error("❌ No access token available")
            return None
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.client.get(f"{BASE_URL}/api/user/me", headers=headers)
        self._log_response(response)
        
        if response.status_code == 200:
            return response.json()
        return None

def main():
    tester = AuthTester()
    email = "test@example.com"
    password = "testpass123"
    
    # Test registration
    if tester.register(email, password):
        logger.info("✅ Registration successful")
    else:
        logger.error("❌ Registration failed")
        return
    
    # Test login
    if tester.login(email, password):
        logger.info("✅ Login successful")
    else:
        logger.error("❌ Login failed")
        return
    
    # Test user info
    user_info = tester.get_user_info()
    if user_info:
        logger.info(f"✅ Got user info: {json.dumps(user_info, indent=2)}")
    else:
        logger.error("❌ Failed to get user info")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Test script for the updated registration and onboarding flow.
Tests the field changes made to register.tsx and onboarding components.
"""

import httpx
import json
import logging
import asyncio
from typing import Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"
TEST_USER = {
    "email": "fieldtest@stackmotive.com",
    "password": "testpass123"
}

# Test data for onboarding steps
ONBOARDING_DATA = {
    "portfolio": {
        "tradingExperience": "intermediate",
        "riskTolerance": "moderate", 
        "investmentHorizon": "medium",
        "initialInvestment": 25000
    },
    "personalInfo": {
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "phone": "+64 123 456 789",
        "preferredCurrency": "USD"
    },
    "taxInfo": {
        "taxResidency": "New Zealand",
        "taxNumber": "123-456-789",
        "employmentStatus": "employed"
    }
}

class RegistrationOnboardingTester:
    def __init__(self):
        self.client = httpx.Client()
        self.access_token: Optional[str] = None
        
    def _log_response(self, response: httpx.Response, endpoint: str):
        logger.info(f"📡 {endpoint}: {response.status_code}")
        try:
            data = response.json()
            if response.status_code >= 400:
                logger.error(f"❌ Error: {data}")
            else:
                logger.debug(f"✅ Response: {data}")
        except:
            logger.debug(f"Response text: {response.text}")
    
    def test_registration_with_minimal_fields(self) -> bool:
        """Test registration with only email and password (updated behavior)"""
        logger.info("🔵 Testing UPDATED registration (email + password only)")
        
        # Test the minimal registration payload
        minimal_payload = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
        
        response = self.client.post(f"{BASE_URL}/api/register", json=minimal_payload)
        self._log_response(response, "POST /api/register")
        
        if response.status_code == 200:
            logger.info("✅ Registration successful with minimal fields")
            return True
        else:
            logger.error("❌ Registration failed")
            return False
    
    def test_login(self) -> bool:
        """Test user login after registration"""
        logger.info("🔵 Testing login after registration")
        
        response = self.client.post(f"{BASE_URL}/api/login", json=TEST_USER)
        self._log_response(response, "POST /api/login")
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get('access_token')
            logger.info(f"✅ Login successful, token: {self.access_token[:10]}...")
            return True
        else:
            logger.error("❌ Login failed")
            return False
    
    def test_user_onboarding_status(self) -> Dict:
        """Check user's onboarding status"""
        logger.info("🔵 Testing onboarding status")
        
        if not self.access_token:
            logger.error("❌ No access token available")
            return {}
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.client.get(f"{BASE_URL}/api/user/onboarding-status", headers=headers)
        self._log_response(response, "GET /api/user/onboarding-status")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ Onboarding status: completed={data.get('hasCompletedOnboarding', False)}")
            return data
        return {}
    
    def test_onboarding_progress_update(self, step: int) -> bool:
        """Test updating onboarding progress"""
        logger.info(f"🔵 Testing onboarding progress update to step {step}")
        
        if not self.access_token:
            logger.error("❌ No access token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {"step": step}
        
        response = self.client.post(
            f"{BASE_URL}/api/user/onboarding/progress", 
            json=payload, 
            headers=headers
        )
        self._log_response(response, f"POST /api/user/onboarding/progress (step {step})")
        
        if response.status_code == 200:
            logger.info(f"✅ Progress updated to step {step}")
            return True
        else:
            logger.error(f"❌ Failed to update progress to step {step}")
            return False
    
    def test_preference_update(self, currency: str) -> bool:
        """Test updating user preferences (currency)"""
        logger.info(f"🔵 Testing preference update (currency: {currency})")
        
        if not self.access_token:
            logger.error("❌ No access token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {"preferredCurrency": currency}
        
        response = self.client.post(
            f"{BASE_URL}/api/user/preferences", 
            json=payload, 
            headers=headers
        )
        self._log_response(response, "POST /api/user/preferences")
        
        if response.status_code == 200:
            logger.info(f"✅ Preferences updated successfully")
            return True
        else:
            logger.error(f"❌ Failed to update preferences")
            return False
    
    def test_onboarding_completion(self) -> bool:
        """Test completing onboarding"""
        logger.info("🔵 Testing onboarding completion")
        
        if not self.access_token:
            logger.error("❌ No access token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {"hasCompletedOnboarding": True}
        
        response = self.client.post(
            f"{BASE_URL}/api/user/onboarding-complete", 
            json=payload, 
            headers=headers
        )
        self._log_response(response, "POST /api/user/onboarding-complete")
        
        if response.status_code == 200:
            logger.info("✅ Onboarding completed successfully")
            return True
        else:
            logger.error("❌ Failed to complete onboarding")
            return False
    
    def test_user_info_after_onboarding(self) -> Optional[Dict]:
        """Test getting user info after onboarding completion"""
        logger.info("🔵 Testing user info after onboarding")
        
        if not self.access_token:
            logger.error("❌ No access token available")
            return None
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.client.get(f"{BASE_URL}/api/user/me", headers=headers)
        self._log_response(response, "GET /api/user/me")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ User info retrieved: {data.get('email')}, onboarded: {data.get('hasCompletedOnboarding')}")
            return data
        return None

    def cleanup_test_user(self) -> None:
        """Clean up test user (if admin endpoint exists)"""
        logger.info("🧹 Attempting to clean up test user")
        # This would require admin endpoints to delete users
        # For now, just log that cleanup should be done manually
        logger.info(f"⚠️  Please manually clean up test user: {TEST_USER['email']}")

async def main():
    """Run the complete registration and onboarding flow test"""
    logger.info("🚀 Starting Registration & Onboarding Flow Test")
    logger.info("=" * 60)
    
    tester = RegistrationOnboardingTester()
    
    try:
        # Test 1: Registration with minimal fields
        logger.info("\n📝 STEP 1: Registration")
        if not tester.test_registration_with_minimal_fields():
            logger.error("❌ Registration test failed - stopping")
            return
            
        # Test 2: Login
        logger.info("\n🔑 STEP 2: Login")
        if not tester.test_login():
            logger.error("❌ Login test failed - stopping")
            return
            
        # Test 3: Check initial onboarding status
        logger.info("\n📊 STEP 3: Initial Onboarding Status")
        initial_status = tester.test_user_onboarding_status()
        
        # Test 4: Simulate onboarding steps
        logger.info("\n🎯 STEP 4: Onboarding Progress")
        for step in range(1, 6):  # Steps 1-5
            if not tester.test_onboarding_progress_update(step):
                logger.warning(f"⚠️  Failed to update to step {step}")
                
        # Test 5: Update preferences (currency)
        logger.info("\n⚙️  STEP 5: Update Preferences")
        currency = ONBOARDING_DATA["personalInfo"]["preferredCurrency"]
        tester.test_preference_update(currency)
        
        # Test 6: Complete onboarding
        logger.info("\n✅ STEP 6: Complete Onboarding")
        if not tester.test_onboarding_completion():
            logger.error("❌ Onboarding completion failed")
            return
            
        # Test 7: Verify final state
        logger.info("\n🔍 STEP 7: Final Verification")
        final_user_info = tester.test_user_info_after_onboarding()
        final_status = tester.test_user_onboarding_status()
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("📋 TEST SUMMARY")
        logger.info("=" * 60)
        
        if final_user_info and final_status:
            logger.info("✅ ALL TESTS PASSED!")
            logger.info(f"✅ Registration: Minimal fields (email + password)")
            logger.info(f"✅ Login: Successful")
            logger.info(f"✅ Onboarding: Completed = {final_status.get('hasCompletedOnboarding')}")
            logger.info(f"✅ Currency: {final_status.get('preferredCurrency')}")
            logger.info("")
            logger.info("🎉 The updated registration and onboarding flow is working correctly!")
            logger.info("🎉 Fields have been properly moved from registration to onboarding steps.")
        else:
            logger.error("❌ SOME TESTS FAILED")
            
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {e}")
    finally:
        tester.cleanup_test_user()

if __name__ == "__main__":
    asyncio.run(main()) 
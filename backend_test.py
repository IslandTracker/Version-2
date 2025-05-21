import requests
import unittest
import uuid
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if 'REACT_APP_BACKEND_URL' in line:
            BACKEND_URL = line.split('=')[1].strip()
            break

# Ensure we have a valid backend URL
if not BACKEND_URL:
    raise ValueError("Could not find REACT_APP_BACKEND_URL in frontend/.env")

logger.info(f"Using backend URL: {BACKEND_URL}")

class MaldivesIslandTrackerAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = BACKEND_URL
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.test_user_email = "test@example.com"  # Using the predefined test user
        self.test_user_password = "test123"
        self.test_user_name = "Test User"

    def test_01_root_endpoint(self):
        """Test the root endpoint"""
        logger.info("Testing root endpoint")
        response = requests.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        logger.info("Root endpoint test passed")

    def test_02_get_islands(self):
        """Test getting the list of islands"""
        logger.info("Testing get islands endpoint")
        response = requests.get(f"{self.api_url}/islands")
        self.assertEqual(response.status_code, 200)
        islands = response.json()
        self.assertIsInstance(islands, list)
        self.assertGreater(len(islands), 0)
        
        # Check island structure
        first_island = islands[0]
        self.assertIn("id", first_island)
        self.assertIn("name", first_island)
        self.assertIn("atoll", first_island)
        self.assertIn("type", first_island)
        
        # Save an island ID for later tests
        self.island_id = first_island["id"]
        logger.info(f"Found {len(islands)} islands")
        logger.info("Get islands test passed")

    def test_03_get_island_by_id(self):
        """Test getting a specific island by ID"""
        if not hasattr(self, 'island_id'):
            self.test_02_get_islands()
            
        logger.info(f"Testing get island by ID: {self.island_id}")
        response = requests.get(f"{self.api_url}/islands/{self.island_id}")
        self.assertEqual(response.status_code, 200)
        island = response.json()
        self.assertEqual(island["id"], self.island_id)
        logger.info("Get island by ID test passed")

    def test_04_login_user(self):
        """Test user login with the predefined test user"""
        logger.info(f"Testing user login with email: {self.test_user_email}")
        login_data = {
            "username": self.test_user_email,
            "password": self.test_user_password
        }
        response = requests.post(f"{self.api_url}/token", data=login_data)
        self.assertEqual(response.status_code, 200)
        token_data = response.json()
        self.assertIn("access_token", token_data)
        self.assertIn("token_type", token_data)
        self.token = token_data["access_token"]
        logger.info("User login test passed")

    def test_05_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            self.test_04_login_user()
            
        logger.info("Testing get current user endpoint")
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.api_url}/users/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        user = response.json()
        self.assertEqual(user["email"], self.test_user_email)
        logger.info("Get current user test passed")

    def test_06_log_visit(self):
        """Test logging an island visit"""
        if not self.token or not hasattr(self, 'island_id'):
            self.test_04_login_user()
            self.test_02_get_islands()
            
        logger.info(f"Testing log visit for island ID: {self.island_id}")
        visit_data = {
            "island_id": self.island_id,
            "visit_date": datetime.utcnow().isoformat(),
            "notes": "Test visit from API test",
            "photo_urls": []
        }
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(f"{self.api_url}/visits", json=visit_data, headers=headers)
        self.assertEqual(response.status_code, 200)
        visit = response.json()
        self.assertEqual(visit["island_id"], self.island_id)
        logger.info("Log visit test passed")

    def test_07_get_user_visits(self):
        """Test getting user visits"""
        if not self.token:
            self.test_04_login_user()
            
        logger.info("Testing get user visits endpoint")
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.api_url}/visits", headers=headers)
        self.assertEqual(response.status_code, 200)
        visits = response.json()
        self.assertIsInstance(visits, list)
        logger.info(f"Found {len(visits)} visits")
        logger.info("Get user visits test passed")

    def test_08_invalid_login(self):
        """Test login with invalid credentials"""
        logger.info("Testing login with invalid credentials")
        login_data = {
            "username": "invalid@example.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{self.api_url}/token", data=login_data)
        self.assertEqual(response.status_code, 401)
        logger.info("Invalid login test passed")

    def test_09_unauthorized_access(self):
        """Test accessing protected endpoint without authentication"""
        logger.info("Testing unauthorized access to protected endpoint")
        response = requests.get(f"{self.api_url}/users/me")
        self.assertEqual(response.status_code, 401)
        logger.info("Unauthorized access test passed")

def run_tests():
    """Run all tests"""
    logger.info("Starting API tests")
    test_suite = unittest.TestLoader().loadTestsFromTestCase(MaldivesIslandTrackerAPITest)
    test_result = unittest.TextTestRunner().run(test_suite)
    logger.info("API tests completed")
    return test_result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)

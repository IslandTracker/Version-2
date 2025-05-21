
import requests
import sys
import json
from datetime import datetime

class IslandLoggerAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if isinstance(data, dict):
                    response = requests.post(url, json=data, headers=headers)
                else:
                    # For form data
                    response = requests.post(url, data=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_debug_login(self, email, password):
        """Test the debug login endpoint"""
        success, response = self.run_test(
            "Debug Login",
            "POST",
            "api/debug-login",
            200,
            data={"email": email, "password": password}
        )
        print(f"Debug login response: {json.dumps(response, indent=2)}")
        return success, response

    def test_token_login(self, email, password):
        """Test login with OAuth2 token endpoint"""
        # Create form data for OAuth2 password flow
        import requests
        
        url = f"{self.base_url}/api/token"
        form_data = {
            'username': email,
            'password': password
        }
        
        headers = {
            'Accept': 'application/json'
        }
        
        print(f"Sending token request to: {url}")
        print(f"With data: {form_data}")
        
        self.tests_run += 1
        print(f"\n🔍 Testing Token Login...")
        
        try:
            response = requests.post(url, data=form_data, headers=headers)
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
                return success, response_data
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ Token obtained: {self.token[:10]}...")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user with token"""
        if not self.token:
            print("❌ No token available, skipping user test")
            return False, {}
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/users/me",
            200
        )
        
        if success:
            print(f"User info: {json.dumps(response, indent=2)}")
            return True, response
        return False, {}

def main():
    # Get the backend URL from environment or use default
    backend_url = "https://22f74010-0a66-4434-8eb7-7520c7d0adc2.preview.emergentagent.com"
    
    # Setup tester
    tester = IslandLoggerAPITester(backend_url)
    
    # Test credentials
    admin_email = "superadmin@islandlogger.mv"
    admin_password = "super123"
    
    print(f"🚀 Testing Island Logger API at {backend_url}")
    
    # Test debug login
    debug_success, debug_response = tester.test_debug_login(admin_email, admin_password)
    if not debug_success or not debug_response.get('success', False):
        print("❌ Debug login failed, stopping tests")
        return 1
        
    # Check if user is admin
    is_admin = debug_response.get('is_admin', False)
    print(f"👤 User is admin: {is_admin}")
    
    # Test token login
    if not tester.test_token_login(admin_email, admin_password):
        print("❌ Token login failed, stopping tests")
        return 1
    
    # Test getting current user
    user_success, user_data = tester.test_get_current_user()
    if user_success:
        # Verify admin status
        if user_data.get('is_admin') == True:
            print("✅ User has admin privileges")
        else:
            print("❌ User does not have admin privileges")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())

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
        self.admin_token = None
        self.test_user_email = "test@example.com"  # Using the predefined test user
        self.test_user_password = "test123"
        self.test_user_name = "Test User"
        self.admin_email = "superadmin@islandlogger.mv"  # Using the predefined admin user
        self.admin_password = "super123"

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
        # Verify error message is returned
        error_data = response.json()
        self.assertIn("detail", error_data)
        logger.info("Invalid login test passed")
        
    def test_08a_admin_invalid_login(self):
        """Test admin login with invalid credentials"""
        logger.info("Testing admin login with invalid credentials")
        login_data = {
            "username": "superadmin@islandlogger.mv",
            "password": "wrongpassword"
        }
        response = requests.post(f"{self.api_url}/token", data=login_data)
        self.assertEqual(response.status_code, 401)
        # Verify error message is returned
        error_data = response.json()
        self.assertIn("detail", error_data)
        logger.info("Admin invalid login test passed")

    def test_09_unauthorized_access(self):
        """Test accessing protected endpoint without authentication"""
        logger.info("Testing unauthorized access to protected endpoint")
        response = requests.get(f"{self.api_url}/users/me")
        self.assertEqual(response.status_code, 401)
        logger.info("Unauthorized access test passed")

    # Blog functionality tests
    def test_10_get_blog_posts(self):
        """Test getting the list of blog posts"""
        logger.info("Testing get blog posts endpoint")
        response = requests.get(f"{self.api_url}/blog-posts")
        self.assertEqual(response.status_code, 200)
        posts = response.json()
        self.assertIsInstance(posts, list)
        self.assertGreater(len(posts), 0)
        
        # Check blog post structure
        first_post = posts[0]
        self.assertIn("id", first_post)
        self.assertIn("title", first_post)
        self.assertIn("slug", first_post)
        self.assertIn("content", first_post)
        self.assertIn("author", first_post)
        
        # Save a blog post ID and slug for later tests
        self.blog_post_id = first_post["id"]
        self.blog_post_slug = first_post["slug"]
        logger.info(f"Found {len(posts)} blog posts")
        logger.info("Get blog posts test passed")

    def test_11_get_blog_post_by_id(self):
        """Test getting a specific blog post by ID"""
        if not hasattr(self, 'blog_post_id'):
            self.test_10_get_blog_posts()
            
        logger.info(f"Testing get blog post by ID: {self.blog_post_id}")
        response = requests.get(f"{self.api_url}/blog-posts/{self.blog_post_id}")
        self.assertEqual(response.status_code, 200)
        post = response.json()
        self.assertEqual(post["id"], self.blog_post_id)
        logger.info("Get blog post by ID test passed")

    def test_12_get_blog_post_by_slug(self):
        """Test getting a specific blog post by slug"""
        if not hasattr(self, 'blog_post_slug'):
            self.test_10_get_blog_posts()
            
        logger.info(f"Testing get blog post by slug: {self.blog_post_slug}")
        response = requests.get(f"{self.api_url}/blog-posts/slug/{self.blog_post_slug}")
        self.assertEqual(response.status_code, 200)
        post = response.json()
        self.assertEqual(post["slug"], self.blog_post_slug)
        logger.info("Get blog post by slug test passed")

    def test_13_get_blog_categories(self):
        """Test getting blog categories"""
        logger.info("Testing get blog categories endpoint")
        response = requests.get(f"{self.api_url}/blog-categories")
        self.assertEqual(response.status_code, 200)
        categories = response.json()
        self.assertIsInstance(categories, list)
        self.assertGreater(len(categories), 0)
        logger.info(f"Found {len(categories)} blog categories")
        logger.info("Get blog categories test passed")

    def test_14_get_blog_tags(self):
        """Test getting blog tags"""
        logger.info("Testing get blog tags endpoint")
        response = requests.get(f"{self.api_url}/blog-tags")
        self.assertEqual(response.status_code, 200)
        tags = response.json()
        self.assertIsInstance(tags, list)
        self.assertGreater(len(tags), 0)
        logger.info(f"Found {len(tags)} blog tags")
        logger.info("Get blog tags test passed")

    # Admin functionality tests
    def test_15_admin_login(self):
        """Test admin login with the predefined admin user"""
        logger.info(f"Testing admin login with email: {self.admin_email}")
        login_data = {
            "username": self.admin_email,
            "password": self.admin_password
        }
        response = requests.post(f"{self.api_url}/token", data=login_data)
        self.assertEqual(response.status_code, 200)
        token_data = response.json()
        self.assertIn("access_token", token_data)
        self.assertIn("token_type", token_data)
        self.admin_token = token_data["access_token"]
        
        # Verify this is an admin user
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.api_url}/users/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        user = response.json()
        self.assertEqual(user["email"], self.admin_email)
        self.assertTrue(user["is_admin"])
        logger.info("Admin login test passed")

    def test_16_admin_get_users(self):
        """Test admin getting the list of users"""
        if not self.admin_token:
            self.test_15_admin_login()
            
        logger.info("Testing admin get users endpoint")
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.api_url}/admin/users", headers=headers)
        self.assertEqual(response.status_code, 200)
        users = response.json()
        self.assertIsInstance(users, list)
        self.assertGreater(len(users), 0)
        logger.info(f"Found {len(users)} users")
        logger.info("Admin get users test passed")

    def test_17_admin_create_blog_post(self):
        """Test admin creating a new blog post"""
        if not self.admin_token:
            self.test_15_admin_login()
            
        logger.info("Testing admin create blog post endpoint")
        test_post_slug = f"test-blog-post-{uuid.uuid4()}"
        blog_post_data = {
            "id": str(uuid.uuid4()),
            "title": "Test Blog Post",
            "slug": test_post_slug,
            "content": "This is a test blog post created by the API test.",
            "summary": "Test blog post summary",
            "author": "API Test",
            "featured_image": "https://example.com/test-image.jpg",
            "tags": ["test", "api"],
            "category": "Test",
            "is_published": True,
            "view_count": 0,
            "is_featured": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.post(f"{self.api_url}/admin/blog-posts", json=blog_post_data, headers=headers)
        self.assertEqual(response.status_code, 200)
        post = response.json()
        self.assertEqual(post["slug"], test_post_slug)
        
        # Save the created blog post ID for later tests
        self.created_blog_post_id = post["id"]
        logger.info(f"Created blog post with ID: {self.created_blog_post_id}")
        logger.info("Admin create blog post test passed")

    def test_18_admin_update_blog_post(self):
        """Test admin updating a blog post"""
        if not hasattr(self, 'created_blog_post_id'):
            self.test_17_admin_create_blog_post()
            
        if not self.admin_token:
            self.test_15_admin_login()
            
        logger.info(f"Testing admin update blog post endpoint for post ID: {self.created_blog_post_id}")
        
        # First, get the current blog post
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.api_url}/blog-posts/{self.created_blog_post_id}")
        self.assertEqual(response.status_code, 200)
        current_post = response.json()
        
        # Update the blog post
        updated_title = f"Updated Test Blog Post {uuid.uuid4()}"
        current_post["title"] = updated_title
        
        response = requests.put(
            f"{self.api_url}/admin/blog-posts/{self.created_blog_post_id}", 
            json=current_post, 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        updated_post = response.json()
        self.assertEqual(updated_post["title"], updated_title)
        logger.info("Admin update blog post test passed")

    def test_19_admin_delete_blog_post(self):
        """Test admin deleting a blog post"""
        if not hasattr(self, 'created_blog_post_id'):
            self.test_17_admin_create_blog_post()
            
        if not self.admin_token:
            self.test_15_admin_login()
            
        logger.info(f"Testing admin delete blog post endpoint for post ID: {self.created_blog_post_id}")
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.delete(f"{self.api_url}/admin/blog-posts/{self.created_blog_post_id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        
        # Verify the blog post was deleted
        response = requests.get(f"{self.api_url}/blog-posts/{self.created_blog_post_id}")
        self.assertEqual(response.status_code, 404)
        logger.info("Admin delete blog post test passed")

    def test_20_non_admin_access_denied(self):
        """Test that non-admin users cannot access admin endpoints"""
        if not self.token:
            self.test_04_login_user()
            
        logger.info("Testing non-admin access to admin endpoint")
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.api_url}/admin/users", headers=headers)
        self.assertEqual(response.status_code, 403)
        logger.info("Non-admin access denied test passed")

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

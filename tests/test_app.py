"""
test_app.py - Automated Unit & Integration Tests for User Profile Card Generator.
Validates POST request handling, server-side data sanitization,
error responses, and metadata enrichment.
"""

import unittest
import json
import app


class ProfileCardGeneratorTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.app.config["TESTING"] = True
        cls.client = app.app.test_client()

    def test_homepage_loads(self):
        """Test GET / renders the main application HTML page."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Profile Card Generator", response.data)

    def test_generate_profile_success(self):
        """Test POST /api/profile/generate with valid full payload."""
        payload = {
            "name": "Jane Doe",
            "role": "Full-Stack Engineer",
            "bio": "Building scalable web services and reactive user interfaces.",
            "avatar_url": "https://example.com/avatar.jpg",
            "location": "Boston, MA",
            "email": "jane@example.com",
            "skills": "Python, Flask, JavaScript, Docker",
            "github": "https://github.com/janedoe",
            "theme": "emerald",
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["card"]["name"], "Jane Doe")
        self.assertEqual(data["card"]["role"], "Full-Stack Engineer")
        self.assertEqual(data["card"]["theme"], "emerald")
        self.assertIn("Python", data["card"]["skills"])
        self.assertEqual(data["card"]["social"]["github"], "https://github.com/janedoe")
        self.assertIn("stats", data["card"])
        self.assertGreater(data["card"]["stats"]["bio_word_count"], 0)

    def test_generate_profile_missing_name_returns_400(self):
        """Test that omitting the required 'name' field returns 400 Bad Request."""
        payload = {
            "name": "   ",
            "role": "Developer",
            "bio": "Some bio",
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertIn("name", data["error"].lower())

    def test_fallback_avatar_generated_when_url_omitted(self):
        """Test that an initials-based fallback avatar is auto-generated if omitted."""
        payload = {
            "name": "Bruce Wayne",
            "bio": "Vigilante engineer",
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        avatar_url = data["card"]["avatar_url"]
        self.assertIn("ui-avatars.com", avatar_url)
        self.assertIn("Bruce%20Wayne", avatar_url)

    def test_skills_parsing_and_trimming(self):
        """Test that comma-separated skills are parsed into clean individual items."""
        payload = {
            "name": "Alan Turing",
            "skills": " Logic , Cryptography,  Mathematics , Algorithms ",
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        skills = data["card"]["skills"]
        self.assertEqual(skills, ["Logic", "Cryptography", "Mathematics", "Algorithms"])

    def test_invalid_email_format_returns_400(self):
        """Test that a malformed email triggers validation error."""
        payload = {
            "name": "Test User",
            "email": "not-an-email",
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("email", data["error"].lower())

    def test_excessive_bio_length_returns_400(self):
        """Test that bio exceeding 400 characters triggers validation error."""
        payload = {
            "name": "Wordy User",
            "bio": "A" * 401,
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("too long", data["error"].lower())

    def test_url_prefixing_for_social_links(self):
        """Test that links without http/https protocol get safely prefixed with https://."""
        payload = {
            "name": "Web User",
            "github": "github.com/myprofile",
            "website": "myportfolio.dev",
        }
        response = self.client.post(
            "/api/profile/generate",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["card"]["social"]["github"], "https://github.com/myprofile")
        self.assertEqual(data["card"]["social"]["website"], "https://myportfolio.dev")

    def test_get_presets_endpoint(self):
        """Test GET /api/presets returns preset profile samples."""
        response = self.client.get("/api/presets")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(len(data["presets"]), 0)

    def test_health_endpoint(self):
        """Test GET /api/health endpoint returns healthy status."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")


if __name__ == "__main__":
    unittest.main()

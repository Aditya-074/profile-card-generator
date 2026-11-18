"""
app.py - Backend server for User Profile Card Generator.
Focuses on processing HTTP POST requests, server-side data validation,
enriching input payloads, and returning formatted profile cards to the client.
"""

from flask import Flask, render_template, request, jsonify
import urllib.parse
from datetime import datetime, timezone
import re

app = Flask(__name__)


def sanitize_text(text, default=""):
    """Strip whitespace and return sanitized string."""
    if not text:
        return default
    return str(text).strip()


def validate_url(url):
    """Basic validation for web URLs."""
    if not url:
        return None
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "https://" + url
    return url


def generate_fallback_avatar(name):
    """Generate a clean initials-based avatar URL using UI Avatars."""
    safe_name = urllib.parse.quote(name or "User")
    return f"https://ui-avatars.com/api/?name={safe_name}&background=4f46e5&color=ffffff&size=256&bold=true"


def process_skills(skills_input):
    """Parse comma-separated or list skills into cleaned unique badges."""
    if not skills_input:
        return []
    if isinstance(skills_input, str):
        raw_items = [s.strip() for s in skills_input.split(",") if s.strip()]
    elif isinstance(skills_input, list):
        raw_items = [str(s).strip() for s in skills_input if str(s).strip()]
    else:
        raw_items = []

    # Limit to top 8 skills for visual card balance
    return raw_items[:8]


# Preset profiles for fast demonstration
PRESET_PROFILES = [
    {
        "id": "preset-1",
        "name": "Sarah Connor",
        "role": "Senior Cloud Architect",
        "bio": "Specializing in distributed systems, Kubernetes automation, and building resilient microservices on AWS & GCP. Passionate open-source contributor and technical mentor.",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        "location": "Seattle, WA",
        "email": "sarah.connor@example.com",
        "github": "https://github.com/sarahconnor",
        "linkedin": "https://linkedin.com/in/sarahconnor",
        "twitter": "https://twitter.com/sarah_cloud",
        "website": "https://sarahconnor.dev",
        "skills": "Go, Kubernetes, Python, Terraform, Docker, Microservices, AWS",
        "theme": "indigo",
    },
    {
        "id": "preset-2",
        "name": "Alex Rivera",
        "role": "Creative UI/UX Designer & Frontend Dev",
        "bio": "Designing intuitive interfaces that balance elegance with functional speed. Crafting accessible design systems and delighting users through motion design.",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "location": "Austin, TX",
        "email": "alex.rivera@example.com",
        "github": "https://github.com/alexrivera-ui",
        "linkedin": "https://linkedin.com/in/alexrivera",
        "twitter": "https://twitter.com/alex_ux",
        "website": "https://alexrivera.design",
        "skills": "Figma, React, Tailwind CSS, TypeScript, Motion Design, Accessibility",
        "theme": "emerald",
    },
    {
        "id": "preset-3",
        "name": "Maya Patel",
        "role": "AI / Machine Learning Engineer",
        "bio": "Building scalable LLM pipelines, fine-tuning neural networks, and developing real-time computer vision models for production applications.",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "location": "San Francisco, CA",
        "email": "maya.patel@example.com",
        "github": "https://github.com/mayapatel-ai",
        "linkedin": "https://linkedin.com/in/mayapatel",
        "twitter": "https://twitter.com/maya_ml",
        "website": "https://mayapatel.ai",
        "skills": "PyTorch, Python, HuggingFace, FastAPI, LangChain, Transformers",
        "theme": "violet",
    },
]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Serve the single-page application."""
    return render_template("index.html")


@app.route("/api/profile/generate", methods=["POST"])
def generate_profile_card():
    """
    Primary POST endpoint: Processes user submitted profile data,
    performs server validation, enriches the information,
    and returns a formatted profile card payload.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "success": False,
            "error": "Invalid request. Expected application/json request body."
        }), 400

    # Required field validation
    name = sanitize_text(payload.get("name"))
    if not name:
        return jsonify({
            "success": False,
            "error": "Field 'name' is required and cannot be empty."
        }), 400

    if len(name) > 60:
        return jsonify({
            "success": False,
            "error": "Name is too long (maximum 60 characters)."
        }), 400

    bio = sanitize_text(payload.get("bio"), "No bio provided.")
    if len(bio) > 400:
        return jsonify({
            "success": False,
            "error": "Bio is too long (maximum 400 characters)."
        }), 400

    role = sanitize_text(payload.get("role"), "Developer & Creator")
    location = sanitize_text(payload.get("location"), "Remote")
    email = sanitize_text(payload.get("email"), "")

    # Basic email format check if provided
    if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify({
            "success": False,
            "error": "Please provide a valid email address format."
        }), 400

    # Image URL handling & fallback
    avatar_url = sanitize_text(payload.get("avatar_url"))
    if avatar_url:
        avatar_url = validate_url(avatar_url)
    else:
        avatar_url = generate_fallback_avatar(name)

    # Social links
    github = validate_url(sanitize_text(payload.get("github")))
    linkedin = validate_url(sanitize_text(payload.get("linkedin")))
    twitter = validate_url(sanitize_text(payload.get("twitter")))
    website = validate_url(sanitize_text(payload.get("website")))

    # Skills parsing
    skills = process_skills(payload.get("skills"))

    # Theme selection
    allowed_themes = ["indigo", "emerald", "sunset", "violet", "cyberpunk", "rose"]
    theme = sanitize_text(payload.get("theme"), "indigo").lower()
    if theme not in allowed_themes:
        theme = "indigo"

    # Enriched metadata
    stats = {
        "bio_word_count": len(bio.split()),
        "bio_character_count": len(bio),
        "skills_count": len(skills),
        "social_links_count": sum(1 for link in [github, linkedin, twitter, website] if link),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
    }

    formatted_card = {
        "name": name,
        "role": role,
        "bio": bio,
        "avatar_url": avatar_url,
        "location": location,
        "email": email,
        "social": {
            "github": github,
            "linkedin": linkedin,
            "twitter": twitter,
            "website": website,
        },
        "skills": skills,
        "theme": theme,
        "stats": stats,
    }

    return jsonify({
        "success": True,
        "message": "Profile card successfully processed and generated.",
        "card": formatted_card,
    }), 200


@app.route("/api/presets", methods=["GET"])
def get_presets():
    """Return sample profiles for immediate testing."""
    return jsonify({
        "success": True,
        "presets": PRESET_PROFILES,
    }), 200


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health status check."""
    return jsonify({
        "status": "healthy",
        "service": "user-profile-card-generator",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200


@app.errorhandler(404)
def not_found_handler(err):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error_handler(err):
    return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("  🚀 User Profile Card Generator running!")
    print("  🌐 Open in your browser: http://127.0.0.1:5000")
    print("  ⚡ POST Endpoint: http://127.0.0.1:5000/api/profile/generate")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)

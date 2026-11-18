# User Profile Card Generator 🪪

A responsive full-stack web application demonstrating **HTTP POST request handling**, client-server data flow, server-side data validation, and dynamic card generation.

Users enter profile details (name, headline, bio, avatar URL, skills, contact, and social links), and the Python backend validates, sanitizes, enriches, and returns a formatted profile card payload rendered dynamically on the frontend.

---

## 📌 Architectural Flow (Client-Server POST Cycle)

```
[ User Browser / Client UI ]
            │
            │  1. User fills form & clicks "Generate Profile Card"
            │  2. JavaScript packages inputs into JSON
            │  3. fetch('/api/profile/generate', { method: 'POST', body: JSON })
            ▼
[ Python Backend (Flask) ]
            │
            │  4. Validates required fields (name, length constraints)
            │  5. Sanitizes URLs & formats protocol headers (https://)
            │  6. Generates initials-based fallback avatar if URL empty
            │  7. Parses skill chips & calculates metadata statistics
            │  8. Returns HTTP 200 OK with formatted card JSON payload
            ▼
[ Client UI (DOM Update) ]
            │
            │  9. Renders formatted card with theme styles & badge chips
            │ 10. Logs full transaction in the live HTTP Inspector drawer
```

---

## ✨ Features

- **Form-Based Card Generation**: Input name, role, bio, avatar, location, email, skills, and social links.
- **Server-Side Validation**: Python validates name presence, field lengths, and email format.
- **Auto Fallback Avatar**: Generates clean initials-based avatar when no image URL is provided.
- **Live HTTP Inspector Drawer**: An interactive on-screen drawer displaying raw HTTP request payloads, response codes (`200 OK`, `400 Bad Request`), and JSON data in real time.
- **Custom Color Themes**: Six card color themes (Indigo, Emerald, Sunset, Violet, Cyberpunk, Rose).
- **Sample Presets**: One-click dropdown to load pre-configured profiles (Cloud Architect, UI Designer, AI Engineer).
- **Export Utilities**: One-click buttons to Copy Card JSON, Copy Card HTML, or Print / Save to PDF.
- **Dark & Light Mode**: Persistent theme toggle remembered across sessions.
- **Automated Tests**: Unit test suite verifying POST handling, validation rules, and error states.

---

## 📂 Project Structure

```text
├── app.py                 # Flask server & REST API endpoints
├── requirements.txt       # Python dependencies
├── .gitignore             # Git ignored files & caches
├── README.md              # Documentation & setup guide
├── templates/
│   └── index.html         # Application single-page template
├── static/
│   ├── css/
│   │   └── style.css      # Styling, color themes & responsive layouts
│   └── js/
│       └── app.js         # Client controller & DOM rendering logic
└── tests/
    └── test_app.py        # Automated test suite (10 test cases)
```

---

## 🛠️ Quickstart Guide

### Prerequisites

- Python 3.8 or higher installed on your system.

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Set up a virtual environment (optional but recommended)**:
   ```bash
   # Windows:
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the application**:
   ```bash
   python app.py
   ```

5. **Open in browser**:
   Navigate to `http://127.0.0.1:5000`

---

## 🧪 Running Automated Tests

Run the test suite with Python's built-in `unittest` runner:

```bash
python -m unittest tests/test_app.py
```

All 10 tests validate endpoints, edge cases, fallback avatars, and bad request handlers.

---

## 📡 API Reference

### `POST /api/profile/generate`

Processes user profile data and returns a structured card payload.

**Sample Request Body (JSON)**:
```json
{
  "name": "Jane Doe",
  "role": "Full-Stack Engineer",
  "bio": "Building scalable web applications with Python and JavaScript.",
  "avatar_url": "https://example.com/avatar.jpg",
  "location": "Boston, MA",
  "email": "jane@example.com",
  "skills": "Python, Flask, JavaScript, Docker",
  "github": "https://github.com/janedoe",
  "theme": "indigo"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Profile card successfully processed and generated.",
  "card": {
    "name": "Jane Doe",
    "role": "Full-Stack Engineer",
    "bio": "Building scalable web applications with Python and JavaScript.",
    "avatar_url": "https://example.com/avatar.jpg",
    "location": "Boston, MA",
    "email": "jane@example.com",
    "skills": ["Python", "Flask", "JavaScript", "Docker"],
    "theme": "indigo",
    "social": {
      "github": "https://github.com/janedoe",
      "linkedin": null,
      "twitter": null,
      "website": null
    },
    "stats": {
      "bio_word_count": 8,
      "bio_character_count": 62,
      "skills_count": 4,
      "social_links_count": 1,
      "generated_at": "2026-11-18 08:27:00 UTC"
    }
  }
}
```

**Validation Error (`400 Bad Request`)**:
```json
{
  "success": false,
  "error": "Field 'name' is required and cannot be empty."
}
```

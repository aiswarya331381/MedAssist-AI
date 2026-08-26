# MedAssist AI

**AI-Assisted Preliminary Health Screening**

MedAssist AI is a full-stack, domain-specific healthcare screening platform.
Users describe symptoms, select severity and duration, optionally attach an
image, and receive a structured, AI-assisted preliminary screening — possible
conditions, confidence levels, urgency, risk flags, and precautions — along
with a downloadable PDF report.

> **MedAssist AI is not a replacement for a doctor.** It never claims to
> provide a medical diagnosis. Always consult a qualified healthcare
> professional, and seek immediate medical attention for emergencies.

---

## 1. Features

- Firebase Authentication (Google Sign-In + Email/Password)
- Protected dashboard with symptom intake form
- Optional image upload for visible symptoms (drag-and-drop, 5MB limit)
- Optional voice input via the browser's SpeechRecognition API
- Three-tier AI provider cascade: **OpenAI → OpenRouter → Local Fallback**
- Normalized response schema regardless of which provider answered
- Plain-language ("simple name") + medical term for every condition
- Urgency levels (Low / Medium / High / Critical) with critical-symptom detection
- Risk flag warnings for dangerous symptom combinations
- Practical, safe precautions (no medication dosing advice)
- Nearby hospitals via browser geolocation + Google Maps
- Professional, downloadable PDF report (jsPDF)
- Fully responsive design (desktop / tablet / mobile)
- Accessible markup: labels, alt text, focus states, ARIA attributes

## 2. Tech Stack

**Frontend:** React, React Router, Axios, Firebase Authentication, jsPDF, CSS
**Backend:** Python, Flask, Flask-CORS, Requests, Pillow, python-dotenv
**AI:** OpenAI API (primary) → OpenRouter API (secondary) → local rule-based
fallback engine (final)

> Gemini / `google-generativeai` is intentionally **not** used anywhere in
> this project. MongoDB is intentionally **not** used — Firebase is used
> only for authentication, and no patient database is created.

## 3. Architecture

```
React (Dashboard, Symptom Form)
        |
        v
Flask REST API  (/analyze)
        |
        v
   OpenAI API  --(fails)-->  OpenRouter API  --(fails)-->  Local Fallback Engine
        |                          |                              |
        +--------------------------+------------------------------+
                                    |
                                    v
                     Normalized JSON response
                                    |
                                    v
                                 React UI
```

The Flask backend always normalizes whatever comes back from any provider
into one consistent schema, so the frontend never needs to know which
provider actually answered:

```json
{
  "conditions": [
    { "name": "", "simple_name": "", "confidence": "", "reason": "" }
  ],
  "urgency": "Low | Medium | High | Critical",
  "risk_flags": [],
  "precautions": [],
  "disclaimer": "This analysis is AI-assisted and not a medical diagnosis. Please consult a qualified healthcare professional.",
  "mode": "ai | openrouter | offline_fallback"
}
```

## 4. Folder Structure

```
MedAssist-AI/
  frontend/
    package.json
    .env.example
    public/
      index.html
    src/
      components/
        HomePage.jsx / .css
        LoginPage.jsx / .css
        RegisterPage.jsx / .css
        Dashboard.jsx / .css
        SymptomForm.jsx / .css
        ResultsPanel.jsx / .css
        ProtectedRoute.jsx
      utils/
        firebase.js
        pdfGenerator.js
      App.js / App.css
      index.js / index.css
  backend/
    app.py
    ai_service.py
    openai_service.py
    openrouter_service.py
    fallback_engine.py
    fallback.json
    requirements.txt
    .env.example
  README.md
```

## 5. Installation

### 5.1 Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4o-mini

PORT=5000
```

Run the backend:

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

### 5.2 Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` with your Firebase web app config and backend URL:

```
REACT_APP_API_URL=http://localhost:5000

REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Run the frontend:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

### 5.3 Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Add a Web App to the project and copy the config values into `frontend/.env`.
3. In **Authentication → Sign-in method**, enable:
   - Email/Password
   - Google
4. In **Authentication → Settings → Authorized domains**, add `localhost` (already present by default) and your deployed domain when you host the app.

### 5.4 OpenAI Setup

1. Create an API key at [platform.openai.com](https://platform.openai.com/).
2. Set `OPENAI_API_KEY` in `backend/.env`.
3. Set `OPENAI_MODEL` to any current chat-completions-capable model you have access to (e.g. a GPT-4-family model). Use a vision-capable model if you want image analysis to run through OpenAI.

### 5.5 OpenRouter Setup

1. Create an API key at [openrouter.ai](https://openrouter.ai/).
2. Set `OPENROUTER_API_KEY` in `backend/.env`.
3. Set `OPENROUTER_MODEL` to any current chat-completion model available on OpenRouter.

Both `OPENAI_MODEL` and `OPENROUTER_MODEL` are fully configurable — change
them any time without touching the React code.

## 6. Environment Variables Summary

**backend/.env**

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI secret API key (server-side only) |
| `OPENAI_MODEL` | OpenAI model identifier |
| `OPENROUTER_API_KEY` | OpenRouter secret API key (server-side only) |
| `OPENROUTER_MODEL` | OpenRouter model identifier |
| `PORT` | Port the Flask server listens on |

**frontend/.env**

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Base URL of the Flask backend |
| `REACT_APP_FIREBASE_*` | Standard Firebase Web SDK config values |

API keys for OpenAI/OpenRouter are **never** placed in the frontend and are
only ever read by the Flask backend from environment variables.

## 7. API Endpoints

### `GET /health`

Simple liveness check.

```json
{ "status": "ok", "service": "MedAssist AI Backend" }
```

### `POST /analyze`

Accepts either `application/json` or `multipart/form-data` (required when
attaching an image).

Fields: `symptoms` (string, required), `severity` (`Low` | `Medium` | `High`,
required), `duration` (string, required), `image` (file, optional — JPG,
PNG, or WEBP, max 5MB).

Returns the normalized response schema described in section 3.

## 8. Provider Fallback System

1. **OpenAI** is tried first using the official OpenAI Python SDK.
2. If OpenAI fails for any reason (auth error, rate limit, server error,
   timeout, network failure, invalid/unparseable response), the backend
   automatically tries **OpenRouter**.
3. If OpenRouter also fails, the backend falls back to a **local,
   rule-based matching engine** (`fallback_engine.py` + `fallback.json`)
   that never depends on any external service.
4. The response `mode` field (`ai`, `openrouter`, or `offline_fallback`)
   tells the frontend which path was used, and the UI displays a small
   notice when offline fallback results are shown.

The local fallback engine uses keyword + synonym matching (e.g. "stomach
ache" → "abdominal pain") against a small knowledge base of common
conditions, and always returns the same normalized schema as the AI
providers. If no reasonable match is found, it returns a safe "no close
match" result instead of guessing.

## 9. PDF Reports

Reports are generated entirely client-side with `jsPDF` — no data is sent to
a third-party PDF service. The report includes the reported symptoms,
severity, duration, AI provider mode, possible conditions (simple + medical
names, confidence, reasoning), urgency, risk flags, precautions, and the
medical disclaimer. The PDF is only generated and downloaded when the user
explicitly clicks **Download Report**.

## 10. Security

- OpenAI/OpenRouter API keys live only in `backend/.env` and are read only
  by the Flask backend — never sent to or embedded in the React bundle.
- All symptom/severity/duration/image inputs are validated on the backend
  (type, size, required fields) in addition to frontend validation.
- Uploaded images are validated with Pillow to confirm they are genuine
  image files before being used.
- The backend never logs symptoms, images, or other personal health
  information — only high-level operational messages (e.g. "OpenAI provider
  failed, trying OpenRouter").
- Raw technical error details are never returned to the client; users see a
  friendly message instead.

## 11. Privacy

- Uploaded images are processed in memory for the single analysis request
  and are not persisted to disk or any database.
- No patient database is created. Firebase is used exclusively for
  authentication.
- Precise geolocation (used for "Nearby Hospitals") is only used transiently
  to open a Google Maps search and is never stored.

## 12. Limitations

- MedAssist AI provides **preliminary, AI-assisted** screening only. It is
  not a diagnostic tool and cannot replace clinical examination, testing,
  or professional medical judgment.
- Confidence levels are estimates based on limited, self-reported
  information and may not reflect the true likelihood of any condition.
- The local fallback engine's knowledge base is intentionally small and
  only covers common conditions — it is not a substitute for the AI
  providers.
- Image analysis quality depends entirely on the capabilities of the
  configured AI model/provider.

## 13. Medical Disclaimer

> MedAssist AI provides AI-assisted preliminary health information and does
> not replace professional medical diagnosis, treatment, or emergency care.
> **For emergency symptoms, seek immediate medical attention.**

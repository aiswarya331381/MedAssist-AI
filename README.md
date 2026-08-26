# 🏥 MedAssist AI

An AI-powered healthcare assistance platform for preliminary symptom screening, health guidance, and nearby hospital discovery.

---

## Features

* 🤖 AI-powered symptom analysis
* 🩺 Preliminary health screening with possible conditions and confidence levels
* ⚠️ Urgency and risk flag detection
* 🖼️ Optional image upload for visible symptoms
* 🎤 Voice input using browser SpeechRecognition API
* 🏥 Nearby hospitals using geolocation and Google Maps
* 📄 Downloadable health reports using jsPDF
* 🔐 Firebase authentication with Google and Email/Password
* 🔄 AI provider fallback: OpenAI → OpenRouter → Local Fallback
* 📱 Responsive user interface

---

## Tech Stack

### Frontend

* React.js
* React Router
* Axios
* Firebase Authentication
* jsPDF
* CSS

### Backend

* Python
* Flask
* Flask-CORS
* Requests
* Pillow
* python-dotenv

### AI

* OpenAI API
* OpenRouter API
* Local Rule-Based Fallback Engine

### Maps & Authentication

* Google Maps
* Browser Geolocation API
* Firebase Authentication

---

## Installation

### Backend Setup

```bash
cd backend
python -m venv venv
```

**Windows:**

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` from `.env.example` and add your API keys.

Run the backend:

```bash
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` from `.env.example` and add your Firebase configuration and backend URL.

Run the frontend:

```bash
npm start
```

---

## AI Provider Fallback

MedAssist AI uses a three-level fallback system:

**OpenAI → OpenRouter → Local Fallback Engine**

If the primary AI provider is unavailable, the application automatically attempts the next provider to provide a more reliable user experience.

---

> ⚕️ **Medical Disclaimer:** MedAssist AI provides AI-assisted preliminary health information and is not a substitute for professional medical diagnosis or treatment. For emergency symptoms, seek immediate medical attention.

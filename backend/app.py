"""
app.py

MedAssist AI - Flask backend entry point.

Exposes:
    GET  /health   -> simple liveness check
    POST /analyze  -> runs the AI provider cascade and returns a normalized
                       health-screening result

IMPORTANT: This backend never logs symptoms, images, or personal
information. It also never exposes OPENAI_API_KEY / OPENROUTER_API_KEY to
the client.
"""

import io
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

from ai_service import run_analysis

load_dotenv()

app = Flask(__name__)
CORS(app)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
VALID_SEVERITIES = {"low", "medium", "high"}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "MedAssist AI Backend"}), 200


def _error_response(message, status_code=400):
    return jsonify({"error": message}), status_code


def _validate_and_read_image(file_storage):
    """
    Validates an uploaded image (type + size) and returns (bytes, mime) or
    raises ValueError with a user-safe message.
    """
    mime = file_storage.mimetype
    if mime not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Unsupported image type. Please upload JPG, PNG, or WEBP.")

    raw = file_storage.read()
    if len(raw) > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("Image is too large. Maximum allowed size is 5 MB.")

    # Verify it's actually a valid, readable image (also strips any
    # malformed / malicious payloads disguised as images).
    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()
    except Exception:
        raise ValueError("The uploaded file is not a valid image.")

    return raw, mime


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        image_bytes = None
        image_mime = None

        if request.content_type and "multipart/form-data" in request.content_type:
            symptoms = (request.form.get("symptoms") or "").strip()
            severity = (request.form.get("severity") or "").strip()
            duration = (request.form.get("duration") or "").strip()

            image_file = request.files.get("image")
            if image_file and image_file.filename:
                try:
                    image_bytes, image_mime = _validate_and_read_image(image_file)
                except ValueError as ve:
                    return _error_response(str(ve), 400)
        else:
            data = request.get_json(silent=True) or {}
            symptoms = (data.get("symptoms") or "").strip()
            severity = (data.get("severity") or "").strip()
            duration = (data.get("duration") or "").strip()

        if not symptoms or len(symptoms) < 3:
            return _error_response("Please describe your symptoms in more detail.", 400)

        if severity.lower() not in VALID_SEVERITIES:
            return _error_response("Please select a valid severity level.", 400)

        if not duration:
            return _error_response("Please provide the duration of your symptoms.", 400)

        result = run_analysis(
            symptoms=symptoms,
            severity=severity,
            duration=duration,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )

        return jsonify(result), 200

    except Exception:
        # Never expose raw technical errors to the client.
        print("[MedAssist] Unexpected error in /analyze (details omitted from client response).")
        return _error_response(
            "Unable to connect to the AI service. Please try again.", 500
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

"""
openrouter_service.py

Handles all communication with the OpenRouter API (SECONDARY AI provider,
used only when OpenAI is unavailable or fails).
"""

import base64
import json
import os

import requests

from openai_service import SYSTEM_PROMPT

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _build_user_content(symptoms, severity, duration, image_bytes, image_mime):
    text_block = (
        f"Symptoms: {symptoms}\n"
        f"Severity: {severity}\n"
        f"Duration: {duration}\n"
    )

    if image_bytes:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{image_mime};base64,{b64}"
        return [
            {"type": "text", "text": text_block},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]

    return text_block


def analyze_with_openrouter(symptoms, severity, duration, image_bytes=None, image_mime=None):
    """
    Calls the OpenRouter API and returns a parsed dict matching the
    normalized schema, or raises an exception on any failure so the caller
    can fall back to the local rule-based engine.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY")
    model = os.environ.get("OPENROUTER_MODEL")

    if not api_key or not model:
        raise RuntimeError("OpenRouter is not configured.")

    user_content = _build_user_content(symptoms, severity, duration, image_bytes, image_mime)

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.3,
        "max_tokens": 900,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://medassist-ai.local",
        "X-Title": "MedAssist AI",
    }

    response = requests.post(
        OPENROUTER_URL, headers=headers, data=json.dumps(payload), timeout=30
    )

    if response.status_code != 200:
        raise RuntimeError(f"OpenRouter returned status {response.status_code}")

    body = response.json()
    content = body["choices"][0]["message"]["content"]

    # Some models wrap JSON in markdown fences despite instructions -- strip them.
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    parsed = json.loads(cleaned)
    return parsed

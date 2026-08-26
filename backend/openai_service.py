"""
openai_service.py

Handles all communication with the OpenAI API (PRIMARY AI provider).
Never exposes the API key outside of this backend process.
"""

import base64
import json
import os

from openai import OpenAI

SYSTEM_PROMPT = """You are MedAssist AI, a healthcare-oriented AI assistant providing preliminary symptom screening.

Your purpose is to help users understand their symptoms in simple language.
You are NOT a doctor and must not claim to diagnose the user.

Analyze the symptoms, severity, duration, and optional image together.

Predict up to 3 likely conditions. Prioritize common conditions before rare
conditions unless the symptoms strongly indicate a rare condition. Do not
invent a diagnosis simply to fill three slots -- if evidence is weak, return
fewer conditions or none, and explain that professional evaluation is
recommended.

For every condition provide:
- medical name
- simple, plain-language name a non-medical person can understand
- confidence (as a short label or percentage, must be realistic -- do not
  use very high confidence unless evidence strongly supports it)
- a simple, clear explanation

Identify dangerous symptoms separately as risk flags (a list of short
strings). Determine urgency: one of "Low", "Medium", "High", "Critical".
"Critical" should ONLY be used for obvious emergency warning signs such as
severe difficulty breathing, severe chest pain, stroke-like symptoms, loss
of consciousness, seizure, heavy uncontrolled bleeding, severe allergic
reaction, blue lips, or severe confusion.

Provide 3-5 practical, safe precautions. Do not provide unsafe medication
instructions. Do not prescribe prescription medication or dosages.

Always include the disclaimer: "This analysis is AI-assisted and not a
medical diagnosis. Please consult a qualified healthcare professional."

Return ONLY valid JSON matching exactly this schema, with no extra
commentary, no markdown fences, and no additional keys:

{
  "conditions": [
    {"name": "", "simple_name": "", "confidence": "", "reason": ""}
  ],
  "urgency": "",
  "risk_flags": [],
  "precautions": [],
  "disclaimer": "This analysis is AI-assisted and not a medical diagnosis. Please consult a qualified healthcare professional."
}
"""

# Models known to support image (vision) input via the Chat Completions /
# Responses style multimodal content array. This list is only used to decide
# whether we attempt to attach an image -- if it's wrong, the API call will
# simply fail and the app will gracefully move to the next provider.
VISION_CAPABLE_HINTS = ["gpt-4o", "gpt-4.1", "gpt-4-turbo", "o4", "o3", "vision"]


def _model_supports_vision(model_name):
    if not model_name:
        return False
    lowered = model_name.lower()
    return any(hint in lowered for hint in VISION_CAPABLE_HINTS)


def _build_user_content(symptoms, severity, duration, image_bytes, image_mime, allow_vision):
    text_block = (
        f"Symptoms: {symptoms}\n"
        f"Severity: {severity}\n"
        f"Duration: {duration}\n"
    )

    if image_bytes and allow_vision:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{image_mime};base64,{b64}"
        return [
            {"type": "text", "text": text_block},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]

    if image_bytes and not allow_vision:
        text_block += (
            "\n(Note: an image was provided by the user, but this model does "
            "not support image analysis, so continue using text information only.)"
        )

    return text_block


def analyze_with_openai(symptoms, severity, duration, image_bytes=None, image_mime=None):
    """
    Calls the OpenAI API and returns a parsed dict matching the normalized
    schema, or raises an exception on any failure (network error, invalid
    key, invalid JSON, rate limit, etc.) so the caller can fall back to
    OpenRouter.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL")

    if not api_key or not model:
        raise RuntimeError("OpenAI is not configured.")

    client = OpenAI(api_key=api_key)

    allow_vision = _model_supports_vision(model)
    user_content = _build_user_content(
        symptoms, severity, duration, image_bytes, image_mime, allow_vision
    )

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.3,
        max_tokens=900,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response from OpenAI.")

    parsed = json.loads(content)
    return parsed

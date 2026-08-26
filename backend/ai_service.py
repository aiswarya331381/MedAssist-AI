"""
ai_service.py

Orchestrates the provider cascade:

    OpenAI  -->  OpenRouter  -->  Local fallback

and normalizes whatever comes back into one consistent schema that the
frontend can always rely on, regardless of which provider actually
produced the result.
"""

from openai_service import analyze_with_openai
from openrouter_service import analyze_with_openrouter
from fallback_engine import analyze_fallback, DISCLAIMER

VALID_URGENCY = {"Low", "Medium", "High", "Critical"}


def _normalize_response(raw, mode):
    """
    Take a loosely-structured dict (from OpenAI or OpenRouter) and coerce it
    into the strict normalized schema used throughout the app.
    """
    conditions = []
    for item in raw.get("conditions", []) or []:
        if not isinstance(item, dict):
            continue
        conditions.append(
            {
                "name": str(item.get("name", "")).strip(),
                "simple_name": str(item.get("simple_name", item.get("name", ""))).strip(),
                "confidence": str(item.get("confidence", "Unknown")).strip(),
                "reason": str(item.get("reason", "")).strip(),
            }
        )

    urgency = str(raw.get("urgency", "Low")).strip().capitalize()
    if urgency not in VALID_URGENCY:
        urgency = "Low"

    risk_flags = [str(x).strip() for x in (raw.get("risk_flags") or []) if str(x).strip()]
    precautions = [str(x).strip() for x in (raw.get("precautions") or []) if str(x).strip()]

    disclaimer = raw.get("disclaimer") or DISCLAIMER

    normalized = {
        "conditions": conditions[:3],
        "urgency": urgency,
        "risk_flags": risk_flags,
        "precautions": precautions[:5],
        "disclaimer": disclaimer,
        "mode": mode,
    }
    return normalized


def run_analysis(symptoms, severity, duration, image_bytes=None, image_mime=None):
    """
    Runs the full provider cascade and always returns a normalized dict.
    Never raises -- any unexpected failure ultimately resolves to the local
    fallback engine so the user always receives a useful response.
    """

    # 1. Try OpenAI first.
    try:
        raw = analyze_with_openai(symptoms, severity, duration, image_bytes, image_mime)
        return _normalize_response(raw, mode="ai")
    except Exception as exc:  # noqa: BLE001 - intentionally broad, cascades to next provider
        print(f"[MedAssist] OpenAI provider failed, trying OpenRouter. Reason: {type(exc).__name__}")

    # 2. Try OpenRouter second.
    try:
        raw = analyze_with_openrouter(symptoms, severity, duration, image_bytes, image_mime)
        return _normalize_response(raw, mode="openrouter")
    except Exception as exc:  # noqa: BLE001 - intentionally broad, cascades to fallback
        print(f"[MedAssist] OpenRouter provider failed, using offline fallback. Reason: {type(exc).__name__}")

    # 3. Final local fallback -- never fails.
    try:
        return analyze_fallback(symptoms, severity, duration)
    except Exception as exc:  # noqa: BLE001 - absolute last resort safety net
        print(f"[MedAssist] Fallback engine error: {type(exc).__name__}")
        return {
            "conditions": [],
            "urgency": "Low",
            "risk_flags": [],
            "precautions": [
                "Monitor your symptoms",
                "Stay hydrated and rest",
                "Consult a healthcare professional",
            ],
            "disclaimer": DISCLAIMER,
            "mode": "offline_fallback",
            "fallback_reason": "AI service unavailable. Results are based on local symptom matching.",
        }

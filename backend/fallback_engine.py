"""
fallback_engine.py

Local, rule-based symptom matching engine used as the FINAL fallback when
both OpenAI and OpenRouter are unavailable. It never calls any external
service. It reads its knowledge base from fallback.json and returns a
response in the SAME normalized schema used everywhere else in the app.
"""

import json
import os
import re

DISCLAIMER = (
    "This analysis is AI-assisted and not a medical diagnosis. "
    "Please consult a qualified healthcare professional."
)

_DATA_PATH = os.path.join(os.path.dirname(__file__), "fallback.json")

# Symptoms that, if mentioned by the user, should raise urgency / risk flags
# regardless of which condition matches.
CRITICAL_KEYWORDS = {
    "difficulty breathing": "Difficulty breathing",
    "shortness of breath": "Shortness of breath",
    "cant breathe": "Severe difficulty breathing",
    "chest pain": "Chest pain",
    "loss of consciousness": "Loss of consciousness",
    "fainted": "Loss of consciousness",
    "seizure": "Seizure",
    "heavy bleeding": "Heavy uncontrolled bleeding",
    "uncontrolled bleeding": "Heavy uncontrolled bleeding",
    "blue lips": "Blue lips (cyanosis)",
    "severe confusion": "Severe confusion",
    "stroke": "Stroke-like symptoms",
    "slurred speech": "Stroke-like symptoms",
    "face drooping": "Stroke-like symptoms",
    "severe allergic reaction": "Severe allergic reaction",
    "anaphylaxis": "Severe allergic reaction",
    "throat swelling": "Throat swelling",
}


def _load_data():
    with open(_DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _normalize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _apply_synonyms(text, synonyms):
    for phrase, replacement in synonyms.items():
        if phrase in text:
            text = text.replace(phrase, replacement)
    return text


def _score_condition(user_text, condition):
    matched = []
    for symptom in condition["symptoms"]:
        if symptom in user_text:
            matched.append(symptom)
    if not matched:
        return 0.0, matched
    score = len(matched) / max(len(condition["symptoms"]), 1)
    return score, matched


def _confidence_label(score):
    if score >= 0.55:
        return "Moderate"
    if score >= 0.35:
        return "Low-Moderate"
    return "Low"


def _detect_risk_flags(user_text):
    flags = []
    for keyword, label in CRITICAL_KEYWORDS.items():
        if keyword in user_text:
            if label not in flags:
                flags.append(label)
    return flags


def _urgency_from(severity, risk_flags, best_score):
    severity = (severity or "").lower()
    if risk_flags:
        return "Critical"
    if severity == "high" and best_score >= 0.35:
        return "High"
    if severity == "high":
        return "Medium"
    if severity == "medium":
        return "Medium"
    return "Low"


def analyze_fallback(symptoms, severity, duration):
    """
    Analyze symptoms using local, offline rule-based matching.
    Returns a dict in the standard normalized response schema.
    """
    data = _load_data()
    synonyms = data.get("synonyms", {})
    conditions = data.get("conditions", [])

    raw_text = symptoms or ""
    normalized = _normalize(raw_text)
    normalized = _apply_synonyms(normalized, synonyms)

    risk_flags = _detect_risk_flags(normalized)

    scored = []
    for condition in conditions:
        score, matched = _score_condition(normalized, condition)
        if score > 0:
            scored.append((score, condition, matched))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_matches = scored[:3]

    if not top_matches:
        return {
            "conditions": [],
            "urgency": _urgency_from(severity, risk_flags, 0.0),
            "risk_flags": risk_flags,
            "precautions": [
                "Monitor your symptoms closely",
                "Stay hydrated and get adequate rest",
                "Consult a healthcare professional for a proper evaluation",
            ],
            "disclaimer": DISCLAIMER,
            "mode": "offline_fallback",
            "fallback_reason": "No close match found in the local symptom database.",
        }

    result_conditions = []
    all_precautions = []
    best_score = top_matches[0][0]

    for score, condition, matched in top_matches:
        result_conditions.append(
            {
                "name": condition["medical_name"],
                "simple_name": condition["simple_name"],
                "confidence": _confidence_label(score),
                "reason": (
                    f"Matched based on reported symptoms: {', '.join(matched)}."
                ),
            }
        )
        for p in condition.get("precautions", []):
            if p not in all_precautions:
                all_precautions.append(p)

    urgency = _urgency_from(severity, risk_flags, best_score)

    return {
        "conditions": result_conditions,
        "urgency": urgency,
        "risk_flags": risk_flags,
        "precautions": all_precautions[:5],
        "disclaimer": DISCLAIMER,
        "mode": "offline_fallback",
        "fallback_reason": "AI service unavailable. Results are based on local symptom matching.",
    }

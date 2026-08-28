import React, { useState } from "react";
import { generateReportPDF } from "../utils/pdfGenerator";
import "./ResultsPanel.css";

const URGENCY_STYLES = {
  Low: { color: "#1FA774", bg: "#EAFAF3", label: "Low" },
  Medium: { color: "#97730F", bg: "#FFF8EA", label: "Medium" },
  High: { color: "#C2600B", bg: "#FFF1E4", label: "High" },
  Critical: { color: "#D94A4A", bg: "#FDECEC", label: "Critical" },
};

const MODE_BADGE = {
  ai: { label: "AI Analysis (OpenAI)", className: "badge-ai" },
  gemini: { label: "AI Analysis (Gemini)", className: "badge-ai" },
  openrouter: { label: "AI Analysis (OpenRouter)", className: "badge-ai" },
  offline_fallback: { label: "Offline Analysis", className: "badge-offline" },
};

function confidenceToPercent(confidence) {
  if (typeof confidence === "number") return Math.min(Math.max(confidence, 0), 100);
  const numMatch = String(confidence).match(/(\d+)/);
  if (numMatch) return Math.min(parseInt(numMatch[1], 10), 100);
  const map = { high: 85, moderate: 60, "low-moderate": 45, low: 25, unknown: 20 };
  return map[String(confidence).toLowerCase()] ?? 40;
}

function ResultsPanel({ isAnalyzing, loadingStepIndex, loadingSteps, result, errorMessage, lastInput }) {
  const [hospitalMessage, setHospitalMessage] = useState("");

  const handleFindHospitals = () => {
    setHospitalMessage("");
    if (!navigator.geolocation) {
      setHospitalMessage("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/search/hospitals+near+me/@${latitude},${longitude},14z`;
        window.open(url, "_blank", "noopener,noreferrer");
      },
      () => {
        setHospitalMessage(
          "Location access was denied. Please enable location permissions to find nearby hospitals, or search manually on Google Maps."
        );
      }
    );
  };

  const handleDownloadReport = () => {
    if (!result || !lastInput) return;
    generateReportPDF({
      symptoms: lastInput.symptoms,
      severity: lastInput.severity,
      duration: lastInput.duration,
      mode: result.mode,
      conditions: result.conditions,
      urgency: result.urgency,
      riskFlags: result.risk_flags,
      precautions: result.precautions,
      disclaimer: result.disclaimer,
    });
  };

  // Empty state
  if (!isAnalyzing && !result && !errorMessage) {
    return (
      <div className="results-card empty-state slide-up">
        <div className="empty-icon">🩺</div>
        <h3>No Analysis Yet</h3>
        <p>
          Fill in the Symptom Assessment form and click <strong>Analyze Symptoms</strong> to
          receive your AI-assisted screening report here.
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="results-card loading-state slide-up">
        <div className="loader-spinner" />
        <h3>Analyzing Your Information</h3>
        <ul className="loading-steps">
          {loadingSteps.map((step, idx) => (
            <li key={step} className={idx <= loadingStepIndex ? "loading-step-active" : ""}>
              <span className="loading-step-dot" />
              {step}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="results-card error-state slide-up">
        <div className="empty-icon">⚠️</div>
        <h3>Something Went Wrong</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  const urgencyStyle = URGENCY_STYLES[result.urgency] || URGENCY_STYLES.Low;
  const modeBadge = MODE_BADGE[result.mode] || MODE_BADGE.offline_fallback;

  return (
    <div className="results-panel">
      <div className="results-card summary-card slide-up">
        <div className="summary-top">
          <h2>AI Analysis Summary</h2>
          <span className={`mode-badge ${modeBadge.className}`}>{modeBadge.label}</span>
        </div>

        {result.mode === "offline_fallback" && (
          <div className="offline-notice">
            Offline analysis — AI service unavailable. Results are based on local symptom
            matching.
          </div>
        )}

        <div
          className="urgency-banner"
          style={{ backgroundColor: urgencyStyle.bg, color: urgencyStyle.color }}
        >
          <span>Urgency Level</span>
          <strong>{result.urgency}</strong>
        </div>

        {result.urgency === "Critical" && (
          <div className="critical-alert">
            Seek immediate medical attention. This may be a medical emergency.
          </div>
        )}
      </div>

      <div className="results-card slide-up">
        <h3 className="section-heading">Possible Conditions</h3>
        {(!result.conditions || result.conditions.length === 0) && (
          <p className="no-match-text">
            No close match found. Professional evaluation is recommended.
          </p>
        )}
        {result.conditions &&
          result.conditions.map((cond, idx) => {
            const pct = confidenceToPercent(cond.confidence);
            return (
              <div className="condition-card" key={`${cond.name}-${idx}`}>
                <div className="condition-header">
                  <span className="condition-index">#{idx + 1}</span>
                  <div>
                    <div className="condition-simple-name">{cond.simple_name || cond.name}</div>
                    <div className="condition-medical-name">
                      Medical term: {cond.name || "N/A"}
                    </div>
                  </div>
                  <span className="condition-confidence-label">{cond.confidence}</span>
                </div>
                <div className="confidence-bar-track">
                  <div className="confidence-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="condition-reason">{cond.reason}</p>
              </div>
            );
          })}
      </div>

      {result.risk_flags && result.risk_flags.length > 0 && (
        <div className="results-card risk-card slide-up">
          <h3 className="section-heading risk-heading">⚠ Warning Signs</h3>
          <ul className="risk-list">
            {result.risk_flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {result.precautions && result.precautions.length > 0 && (
        <div className="results-card slide-up">
          <h3 className="section-heading">Recommended Precautions</h3>
          <ul className="precaution-list">
            {result.precautions.map((item) => (
              <li key={item}>
                <span className="precaution-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="results-card slide-up">
        <p className="disclaimer-text">{result.disclaimer}</p>

        <div className="action-row">
          <button className="btn btn-outline" onClick={handleFindHospitals}>
            📍 Nearby Hospitals
          </button>
          <button className="btn btn-primary" onClick={handleDownloadReport}>
            ⬇ Download Report
          </button>
        </div>
        {hospitalMessage && <p className="hospital-message">{hospitalMessage}</p>}
      </div>
    </div>
  );
}

export default ResultsPanel;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import SymptomForm from "./SymptomForm";
import ResultsPanel from "./ResultsPanel";
import { logout } from "../utils/firebase";
import "./Dashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const LOADING_STEPS = [
  "Validating symptoms",
  "Analyzing health information",
  "Assessing possible conditions",
  "Preparing report",
];

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [lastInput, setLastInput] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const runLoadingSequence = () => {
    setLoadingStepIndex(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < LOADING_STEPS.length) {
        setLoadingStepIndex(step);
      } else {
        clearInterval(interval);
      }
    }, 900);
    return interval;
  };

  const handleAnalyze = async ({ symptoms, severity, duration, imageFile }) => {
    setErrorMessage("");
    setResult(null);
    setIsAnalyzing(true);
    setLastInput({ symptoms, severity, duration });

    const interval = runLoadingSequence();

    try {
      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append("symptoms", symptoms);
        formData.append("severity", severity);
        formData.append("duration", duration);
        formData.append("image", imageFile);

        response = await axios.post(`${API_URL}/analyze`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await axios.post(`${API_URL}/analyze`, {
          symptoms,
          severity,
          duration,
        });
      }

      setResult(response.data);
    } catch (err) {
      const backendMessage = err?.response?.data?.error;
      setErrorMessage(
        backendMessage || "Unable to connect to the AI service. Please try again."
      );
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              ✚
            </span>
            <span className="brand-name">MedAssist AI</span>
          </div>
          <div className="dashboard-header-right">
            <span className="dashboard-title-tag">Dashboard</span>
            <div className="user-chip" title={user?.email || "User"}>
              <span className="user-avatar">
                {(user?.email || "U").charAt(0).toUpperCase()}
              </span>
              <span className="user-email">{user?.email || "Signed in"}</span>
            </div>
            <button className="btn btn-outline logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-heading">
          <h1>AI Health Screening</h1>
          <p>
            Describe your symptoms and provide additional information for a preliminary
            AI-assisted assessment.
          </p>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-col-left">
            <SymptomForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </section>

          <section className="dashboard-col-right">
            <ResultsPanel
              isAnalyzing={isAnalyzing}
              loadingStepIndex={loadingStepIndex}
              loadingSteps={LOADING_STEPS}
              result={result}
              errorMessage={errorMessage}
              lastInput={lastInput}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

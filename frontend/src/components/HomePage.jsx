import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const FEATURES = [
  {
    icon: "🩺",
    title: "Symptom Analysis",
    desc: "Describe your symptoms in plain language, including severity and duration, for a structured assessment.",
  },
  {
    icon: "🧠",
    title: "AI-Assisted Insights",
    desc: "Multi-provider AI screening (OpenAI, OpenRouter) with an offline fallback so you always get a useful result.",
  },
  {
    icon: "⚠️",
    title: "Risk Assessment",
    desc: "Clear urgency levels and warning-sign detection to help you understand how quickly you should seek care.",
  },
  {
    icon: "📄",
    title: "Downloadable Reports",
    desc: "Generate a clean, professional PDF report of your screening to share with a healthcare provider.",
  },
];

const STEPS = [
  { n: "01", title: "Enter Symptoms", desc: "Describe what you're experiencing in your own words." },
  { n: "02", title: "Add Details", desc: "Select severity and how long you've had the symptoms." },
  { n: "03", title: "Optional Image", desc: "Upload a photo for visible symptoms like rashes or swelling." },
  { n: "04", title: "AI Analysis", desc: "Our provider cascade analyzes your information securely." },
  { n: "05", title: "Structured Result", desc: "Review possible conditions, urgency, and risk flags." },
  { n: "06", title: "Download Report", desc: "Save a professional PDF to share with your doctor." },
];

function HomePage({ user }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              ✚
            </span>
            <span className="brand-name">MedAssist AI</span>
          </div>
          <nav className="home-nav" aria-label="Primary">
            <a href="#home">Home</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#about">About</a>
          </nav>
          <div className="home-header-actions">
            <Link to={user ? "/dashboard" : "/login"} className="btn btn-outline">
              {user ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-inner">
          <div className="hero-text slide-up">
            <span className="badge">AI-POWERED HEALTHCARE</span>
            <h1>
              Understand Your Symptoms.
              <br />
              Get Clearer Health Guidance.
            </h1>
            <p className="hero-subtext">
              MedAssist AI uses AI-assisted screening to analyze symptoms, assess urgency,
              identify possible conditions, and provide practical precautions — all in one
              secure, easy-to-use platform.
            </p>
            <div className="hero-actions">
              <Link to={user ? "/dashboard" : "/login"} className="btn btn-primary">
                Get Started
              </Link>
              <a href="#how-it-works" className="btn btn-ghost">
                How It Works
              </a>
            </div>
          </div>

          <div className="hero-visual fade-in" aria-hidden="true">
            <svg viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg">
              <circle cx="210" cy="210" r="200" fill="#E7F6F3" />
              <circle cx="210" cy="210" r="150" fill="#FFFFFF" />
              <rect x="170" y="110" width="80" height="200" rx="18" fill="#11B5A4" />
              <rect x="110" y="170" width="200" height="80" rx="18" fill="#008C83" />
              <circle cx="210" cy="210" r="40" fill="#FFFFFF" />
              <path
                d="M190 210 L204 224 L232 196"
                stroke="#008C83"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="95" cy="95" r="14" fill="#1FA774" opacity="0.85" />
              <circle cx="335" cy="330" r="18" fill="#E7A928" opacity="0.85" />
              <circle cx="345" cy="90" r="10" fill="#D94A4A" opacity="0.7" />
            </svg>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-inner">
          <h2 className="section-title">What You Get</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="section-inner">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            A simple, guided flow from symptom entry to a structured screening report.
          </p>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div className="step-card" key={s.n}>
                <span className="step-number">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="section-inner about-inner">
          <h2 className="section-title">About MedAssist AI</h2>
          <p>
            MedAssist AI is an AI-assisted healthcare screening platform with structured symptom
            analysis, multimodal input, provider fallback, authentication, and report generation.
            It is designed to help people better understand their symptoms before seeking
            professional care — it does not replace a doctor.
          </p>
          <div className="disclaimer-box">
            <strong>Medical Disclaimer:</strong> MedAssist AI provides AI-assisted preliminary
            health information and does not replace professional medical diagnosis, treatment, or
            emergency care. For emergency symptoms, seek immediate medical attention.
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="section-inner footer-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              ✚
            </span>
            <span className="brand-name">MedAssist AI</span>
          </div>
          <p>© {new Date().getFullYear()} MedAssist AI. AI-assisted screening, not a diagnosis.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

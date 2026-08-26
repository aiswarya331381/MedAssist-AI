import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../utils/firebase";
import "./LoginPage.css";

function friendlyAuthError(code) {
  const map = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] || "Unable to sign in. Please try again.";
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="brand brand-light">
            <span className="brand-icon" aria-hidden="true">
              ✚
            </span>
            <span className="brand-name">MedAssist AI</span>
          </div>
          <h2>AI-Assisted Preliminary Health Screening</h2>
          <p>
            Sign in to describe your symptoms, receive structured AI-assisted insights, and
            download a professional screening report.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card fade-in">
          <div className="brand auth-card-brand">
            <span className="brand-icon" aria-hidden="true">
              ✚
            </span>
            <span className="brand-name">MedAssist AI</span>
          </div>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue</p>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleEmailLogin} noValidate>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don&apos;t have an account? <Link to="/register">Create Account</Link>
          </p>
          <p className="auth-back-link">
            <Link to="/">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

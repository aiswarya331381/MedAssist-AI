import React, { useEffect, useRef, useState } from "react";
import "./SymptomForm.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function SymptomForm({ onAnalyze, isAnalyzing }) {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [formError, setFormError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const validateAndSetImage = (file) => {
    setImageError("");
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError("Unsupported file type. Please upload JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image is too large. Maximum allowed size is 5 MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetImage(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!symptoms.trim() || symptoms.trim().length < 3) {
      setFormError("Please describe your symptoms in more detail.");
      return;
    }
    if (!severity) {
      setFormError("Please select a severity level.");
      return;
    }
    if (!duration.trim()) {
      setFormError("Please enter how long you've had these symptoms.");
      return;
    }

    onAnalyze({ symptoms: symptoms.trim(), severity, duration: duration.trim(), imageFile });
  };

  return (
    <div className="symptom-card slide-up">
      <h2>Symptom Assessment</h2>
      <p className="symptom-card-subtitle">
        Fill in the details below for a preliminary AI-assisted screening.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="symptoms">
          Symptoms
          {speechSupported && (
            <button
              type="button"
              className={`mic-btn ${isListening ? "mic-btn-active" : ""}`}
              onClick={toggleVoiceInput}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              disabled={isAnalyzing}
            >
              🎤
            </button>
          )}
        </label>
        <textarea
          id="symptoms"
          rows={5}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Example: itchy red rash on my arm with mild fever for 3 days..."
          disabled={isAnalyzing}
        />

        <label htmlFor="severity">Severity</label>
        <div className="severity-options" role="radiogroup" aria-label="Severity">
          {["Low", "Medium", "High"].map((level) => (
            <button
              type="button"
              key={level}
              className={`severity-chip severity-${level.toLowerCase()} ${
                severity === level ? "severity-chip-selected" : ""
              }`}
              onClick={() => setSeverity(level)}
              disabled={isAnalyzing}
              aria-pressed={severity === level}
            >
              {level}
            </button>
          ))}
        </div>

        <label htmlFor="duration">Duration</label>
        <input
          id="duration"
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 3 days, 2 weeks"
          disabled={isAnalyzing}
        />

        <label htmlFor="image-upload">Image (optional)</label>
        <p className="image-hint">
          Optional — upload an image only for visible symptoms such as rashes, swelling,
          redness, or skin irritation.
        </p>

        {!imagePreview && (
          <div
            className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload symptom image"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
          >
            <span className="dropzone-icon">📷</span>
            <span>Drag &amp; drop an image, or click to browse</span>
            <span className="dropzone-meta">JPG, PNG, WEBP — up to 5MB</span>
          </div>
        )}

        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isAnalyzing}
          style={{ display: "none" }}
        />

        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Symptom preview" />
            <button
              type="button"
              className="remove-image-btn"
              onClick={removeImage}
              disabled={isAnalyzing}
            >
              Remove Image
            </button>
          </div>
        )}

        {imageError && <div className="form-error">{imageError}</div>}
        {formError && <div className="form-error">{formError}</div>}

        <button type="submit" className="btn btn-primary analyze-btn" disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : "Analyze Symptoms"}
        </button>
      </form>
    </div>
  );
}

export default SymptomForm;

// pdfGenerator.js
//
// Generates a professional, downloadable PDF health screening report using
// jsPDF. The PDF is only created/downloaded when the user explicitly clicks
// "Download Report" -- it never auto-downloads.

import jsPDF from "jspdf";

const TEAL = [0, 140, 131];
const DARK_TEAL = [0, 107, 101];
const DARK_TEXT = [22, 51, 49];
const SECONDARY_TEXT = [96, 122, 119];
const SOFT_TEAL = [231, 246, 243];
const DANGER = [217, 74, 74];
const WARNING = [231, 169, 40];
const SUCCESS = [31, 167, 116];

function urgencyColor(urgency) {
  switch ((urgency || "").toLowerCase()) {
    case "low":
      return SUCCESS;
    case "medium":
      return WARNING;
    case "high":
      return [230, 126, 34];
    case "critical":
      return DANGER;
    default:
      return SECONDARY_TEXT;
  }
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function generateReportPDF(reportData) {
  const {
    symptoms,
    severity,
    duration,
    mode,
    conditions = [],
    urgency,
    riskFlags = [],
    precautions = [],
    disclaimer,
  } = reportData;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 0;

  // Header band
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MedAssist AI", marginX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Preliminary Health Screening Report", marginX, 64);

  const generatedAt = new Date();
  doc.setFontSize(9);
  doc.text(
    `Generated: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`,
    marginX,
    80
  );

  y = 120;
  doc.setTextColor(...DARK_TEXT);

  // Patient input summary card
  doc.setFillColor(...SOFT_TEAL);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 100, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Reported Information", marginX + 16, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SECONDARY_TEXT);

  let innerY = y + 42;
  doc.setTextColor(...DARK_TEXT);
  doc.setFont("helvetica", "bold");
  doc.text("Symptoms:", marginX + 16, innerY);
  doc.setFont("helvetica", "normal");
  innerY = addWrappedText(
    doc,
    symptoms || "N/A",
    marginX + 90,
    innerY,
    pageWidth - marginX * 2 - 106
  );

  innerY = y + 62;
  doc.setFont("helvetica", "bold");
  doc.text("Severity:", marginX + 16, innerY);
  doc.setFont("helvetica", "normal");
  doc.text(severity || "N/A", marginX + 90, innerY);

  doc.setFont("helvetica", "bold");
  doc.text("Duration:", marginX + 260, innerY);
  doc.setFont("helvetica", "normal");
  doc.text(duration || "N/A", marginX + 330, innerY);

  innerY = y + 82;
  doc.setFont("helvetica", "bold");
  doc.text("AI Provider Mode:", marginX + 16, innerY);
  doc.setFont("helvetica", "normal");
  const modeLabel =
    mode === "ai" ? "AI (OpenAI)" : mode === "openrouter" ? "AI (OpenRouter)" : "Offline Fallback";
  doc.text(modeLabel, marginX + 130, innerY);

  y += 120;

  // Urgency banner
  const uColor = urgencyColor(urgency);
  doc.setFillColor(...uColor);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 34, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Urgency Level: ${urgency || "N/A"}`, marginX + 16, y + 22);

  y += 54;
  doc.setTextColor(...DARK_TEXT);

  // Possible conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Possible Conditions", marginX, y);
  y += 16;

  if (!conditions || conditions.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SECONDARY_TEXT);
    doc.text(
      "No close match found. Professional evaluation is recommended.",
      marginX,
      y + 8
    );
    y += 26;
  } else {
    conditions.forEach((cond, idx) => {
      const boxHeight = 76;
      if (y + boxHeight > 760) {
        doc.addPage();
        y = 48;
      }
      doc.setDrawColor(220, 230, 228);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(marginX, y, pageWidth - marginX * 2, boxHeight, 8, 8, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...DARK_TEAL);
      doc.text(`#${idx + 1}  ${cond.simple_name || cond.name}`, marginX + 14, y + 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...SECONDARY_TEXT);
      doc.text(`Medical term: ${cond.name || "N/A"}`, marginX + 14, y + 34);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_TEXT);
      doc.text(`Confidence: ${cond.confidence || "N/A"}`, marginX + 14, y + 48);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...SECONDARY_TEXT);
      addWrappedText(
        doc,
        cond.reason || "",
        marginX + 14,
        y + 62,
        pageWidth - marginX * 2 - 28,
        10
      );

      y += boxHeight + 10;
    });
  }

  // Risk flags
  if (riskFlags && riskFlags.length > 0) {
    if (y + 60 > 760) {
      doc.addPage();
      y = 48;
    }
    doc.setFillColor(253, 235, 235);
    const boxH = 26 + riskFlags.length * 14;
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, boxH, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DANGER);
    doc.text("Warning Signs / Risk Flags", marginX + 14, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    riskFlags.forEach((flag, i) => {
      doc.text(`- ${flag}`, marginX + 14, y + 32 + i * 14);
    });
    y += boxH + 14;
  }

  // Precautions
  if (precautions && precautions.length > 0) {
    if (y + 60 > 760) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK_TEXT);
    doc.text("Recommended Precautions", marginX, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    precautions.forEach((item) => {
      if (y > 770) {
        doc.addPage();
        y = 48;
      }
      doc.setTextColor(...SUCCESS);
      doc.text("✓", marginX, y);
      doc.setTextColor(...DARK_TEXT);
      y = addWrappedText(doc, item, marginX + 16, y, pageWidth - marginX * 2 - 16, 14);
    });
    y += 10;
  }

  // Disclaimer
  if (y + 60 > 780) {
    doc.addPage();
    y = 48;
  }
  doc.setDrawColor(...WARNING);
  doc.setFillColor(255, 249, 235);
  const disclaimerText =
    disclaimer ||
    "This analysis is AI-assisted and not a medical diagnosis. Please consult a qualified healthcare professional.";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - marginX * 2 - 20);
  const disclaimerBoxH = 20 + disclaimerLines.length * 12;
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, disclaimerBoxH, 8, 8, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...DARK_TEXT);
  doc.text(disclaimerLines, marginX + 12, y + 16);

  doc.save(`MedAssist-Report-${generatedAt.toISOString().slice(0, 10)}.pdf`);
}

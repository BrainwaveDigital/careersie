import React, { useState } from "react";
import { ExportButton } from "../components/export/ExportButton";
import { PdfPreview } from "../components/export/PdfPreview";

const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "text", label: "Plain Text" },
];

export default function ExportPage() {
  const [format, setFormat] = useState("pdf");
  const [previewSrc, setPreviewSrc] = useState("");
  const [textPreview, setTextPreview] = useState("");

  // Placeholder handlers for demo
  const handleGenerate = () => {
    if (format === "pdf") {
      setPreviewSrc("/api/export/pdf/sample.pdf");
      setTextPreview("");
    } else if (format === "docx") {
      setPreviewSrc("");
      setTextPreview("");
    } else if (format === "text") {
      setPreviewSrc("");
      setTextPreview("{\n  \"name\": \"Jane Doe\",\n  \"summary\": \"Sample\"\n}");
    }
  };

  const handleDownload = () => {
    if (format === "pdf") {
      window.open("/api/export/pdf/sample.pdf", "_blank");
    } else if (format === "docx") {
      window.open("/api/export/docx/sample.docx", "_blank");
    } else if (format === "text") {
      const blob = new Blob([textPreview], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 24 }}>
      <h1>Export Profile</h1>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="format">Format: </label>
        <select
          id="format"
          value={format}
          onChange={e => setFormat(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {EXPORT_FORMATS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      <ExportButton label="Generate" onClick={handleGenerate} style={{ marginRight: 12 }} />
      <ExportButton label="Download" onClick={handleDownload} />
      <div style={{ marginTop: 32 }}>
        {format === "pdf" && previewSrc && (
          <PdfPreview src={previewSrc} height={500} />
        )}
        {format === "docx" && (
          <div>DOCX export is available for download only.</div>
        )}
        {format === "text" && textPreview && (
          <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 4 }}>
            {textPreview}
          </pre>
        )}
      </div>
    </div>
  );
}

import React from "react";

interface ExportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ label, ...props }) => (
  <button
    {...props}
    style={{
      padding: "0.5em 1.2em",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 4,
      fontWeight: 600,
      cursor: "pointer",
      ...props.style
    }}
  >
    {label}
  </button>
);

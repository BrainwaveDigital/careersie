import React from 'react';

const formats = [
  { value: 'pdf', label: 'PDF (ATS-friendly)' },
  { value: 'docx', label: 'DOCX' },
  { value: 'linkedin', label: 'LinkedIn Text' },
  { value: 'seek', label: 'Seek Format' },
  { value: 'text', label: 'Plain Text' },
];

interface FormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ selectedFormat, onFormatChange }) => {
  return (
    <div className="format-selector">
      <label htmlFor="format">Select Export Format:</label>
      <select
        id="format"
        value={selectedFormat}
        onChange={(e) => onFormatChange(e.target.value)}
      >
        {formats.map((format) => (
          <option key={format.value} value={format.value}>
            {format.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormatSelector;
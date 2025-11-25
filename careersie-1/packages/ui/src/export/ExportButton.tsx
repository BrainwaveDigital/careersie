import React from 'react';

interface ExportButtonProps {
  format: 'pdf' | 'docx' | 'linkedin' | 'seek' | 'text';
  onExport: (format: 'pdf' | 'docx' | 'linkedin' | 'seek' | 'text') => void;
  loading: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ format, onExport, loading }) => {
  return (
    <button
      onClick={() => onExport(format)}
      disabled={loading}
      className={`export-button ${loading ? 'loading' : ''}`}
    >
      {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
    </button>
  );
};

export default ExportButton;
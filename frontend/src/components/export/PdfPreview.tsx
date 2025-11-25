import React from "react";

interface PdfPreviewProps {
  src: string;
  height?: string | number;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ src, height = 600 }) => {
  return (
    <iframe
      src={src}
      title="PDF Preview"
      width="100%"
      height={height}
      style={{ border: "1px solid #ccc", borderRadius: 4 }}
    />
  );
};

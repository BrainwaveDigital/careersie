import React from 'react';

interface FormatBadgeProps {
  format: 'pdf' | 'docx' | 'linkedin' | 'seek' | 'text';
}

const FormatBadge: React.FC<FormatBadgeProps> = ({ format }) => {
  const formatStyles: { [key: string]: string } = {
    pdf: 'bg-blue-500 text-white',
    docx: 'bg-green-500 text-white',
    linkedin: 'bg-indigo-500 text-white',
    seek: 'bg-yellow-500 text-black',
    text: 'bg-gray-500 text-white',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${formatStyles[format]}`}>
      {format.toUpperCase()}
    </span>
  );
};

export default FormatBadge;
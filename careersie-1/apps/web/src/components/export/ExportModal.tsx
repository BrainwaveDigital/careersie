import React, { useState } from 'react';
import axios from 'axios';

export default function ExportModal({ userId, isOpen, onClose }) {
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [settings, setSettings] = useState({ theme: 'light', includeStories: true });

  async function handleExport() {
    setLoading(true);
    try {
      const res = await axios.post(`/api/export/${format}`, { userId, formatOptions: settings });
      setFileUrl(res.data.fileUrl);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    } finally {
      setLoading(false);
    }
  }

  return isOpen ? (
    <div className="modal">
      <h3>Export</h3>
      <label>Format</label>
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="pdf">PDF</option>
        <option value="docx">DOCX</option>
        <option value="linkedin">LinkedIn</option>
        <option value="seek">Seek</option>
        <option value="text">Plain text</option>
      </select>

      <label>Include stories</label>
      <input type="checkbox" checked={settings.includeStories} onChange={(e) => setSettings({ ...settings, includeStories: e.target.checked })} />

      <button onClick={handleExport} disabled={loading}>Export</button>

      {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer">Download file</a>}
      <button onClick={onClose}>Close</button>
    </div>
  ) : null;
}
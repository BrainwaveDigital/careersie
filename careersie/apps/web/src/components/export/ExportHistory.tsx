import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExportHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('/api/export/history');
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching export history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div>Loading export history...</div>;
  }

  return (
    <div>
      <h2>Export History</h2>
      {history.length === 0 ? (
        <p>No export history found.</p>
      ) : (
        <ul>
          {history.map((exportItem) => (
            <li key={exportItem.id}>
              <span>{exportItem.format}</span> - 
              <span>{new Date(exportItem.createdAt).toLocaleString()}</span> - 
              <a href={exportItem.fileUrl} target="_blank" rel="noopener noreferrer">Download</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExportHistory;
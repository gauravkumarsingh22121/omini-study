import React, { useState } from 'react';
import { extractTextFromPDF } from '../lib/pdfReader';

export function TestPdfUpload() {
  const [textPages, setTextPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setTextPages([]);

    try {
      const pages = await extractTextFromPDF(file);
      setTextPages(pages);
    } catch (err) {
      setError(err.message || 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Test PDF Extraction</h2>
      
      <input 
        type="file" 
        accept="application/pdf"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100"
      />

      {loading && <p className="mt-4 text-gray-600">Extracting text...</p>}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {textPages.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-800">Extracted Text ({textPages.length} pages):</h3>
          {textPages.map((text, index) => (
            <div key={index} className="p-4 bg-gray-50 border rounded-md">
              <h4 className="font-medium text-gray-500 mb-2">Page {index + 1}</h4>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

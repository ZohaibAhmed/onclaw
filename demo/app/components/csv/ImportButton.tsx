'use client';

import { useState } from 'react';

interface CSVRow {
  [key: string]: string;
}

export default function CSVImportButton() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    setHeaders(headers);
    
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return rows;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setCsvData(parsed);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setCsvData([]);
    setHeaders([]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {isLoading ? 'Loading...' : 'Import CSV'}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
        </label>
        
        {csvData.length > 0 && (
          <button
            onClick={clearData}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Clear Data
          </button>
        )}
      </div>

      {csvData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              CSV Data ({csvData.length} rows)
            </h3>
          </div>
          
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 100).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 100 && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                Showing first 100 rows of {csvData.length} total rows
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
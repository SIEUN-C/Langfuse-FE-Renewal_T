//src/Pages/Dashboards/DownloadButtion.jsx

import React from 'react';
import { DownloadIcon } from 'lucide-react';

const DownloadButton = ({ 
  data = [], 
  fileName = "chart-data", 
  className = "" 
}) => {
  
  const downloadCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to download');
      return;
    }

    try {
      // CSV 헤더 생성
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','), // 헤더 행
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // 값이 문자열이고 쉼표나 따옴표가 포함된 경우 따옴표로 감싸기
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Blob 생성 및 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download data');
    }
  };

  return (
    <button
      onClick={downloadCSV}
      className={`flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 ${className}`}
      aria-label="Download chart data"
      title="Download as CSV"
    >
      <DownloadIcon size={16} />
    </button>
  );
};

export default DownloadButton;
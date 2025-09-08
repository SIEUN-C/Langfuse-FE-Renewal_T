//src/Pages/Dashboards/DownloadButton.jsx

import React from 'react';
import { DownloadIcon } from 'lucide-react';

/**
 * 차트 데이터 CSV 다운로드 버튼
 * 배열 형태의 데이터를 CSV 파일로 다운로드
 * 
 * @param {Array} data - 다운로드할 데이터 배열
 * @param {string} fileName - 다운로드 파일명 (기본: "chart-data")
 * @param {string} className - 추가 CSS 클래스
 */
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
      // 첫 번째 객체의 키를 헤더로 사용
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','), // 헤더 행
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // CSV 이스케이프 처리: 쉼표나 따옴표가 포함된 경우
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // 브라우저 다운로드 처리
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
        URL.revokeObjectURL(url); // 메모리 정리
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
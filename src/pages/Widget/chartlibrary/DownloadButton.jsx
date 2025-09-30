// src/Pages/Widget/chart-library/DownloadButton.jsx
// 차트 데이터를 CSV 파일로 다운로드하는 버튼 컴포넌트

import React, { useState } from "react";
import { Download, Check } from "lucide-react";
import styles from './chart-library.module.css';

/**
 * DownloadButton - 차트 데이터를 CSV 파일로 내보내는 버튼 컴포넌트
 * 원본 Langfuse의 DownloadButton과 동일한 기능 제공
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object[]} props.data - 내보낼 데이터 객체 배열
 * @param {string} [props.fileName="chart-data"] - 다운로드될 파일명
 * @param {string} [props.className] - 추가 CSS 클래스명
 * @returns {React.ReactElement} CSV 내보내기 기능이 있는 다운로드 버튼
 */
export function DownloadButton({
  data,
  fileName = "chart-data",
  className,
}) {
  const [isDownloaded, setIsDownloaded] = useState(false);

  /**
   * CSV 값에서 특수문자를 이스케이프 처리
   * 쉼표, 따옴표, 줄바꿈이 포함된 값을 안전하게 처리
   * 
   * @param {any} value - 이스케이프할 값
   * @returns {string} 이스케이프 처리된 문자열
   */
  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? "");
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  /**
   * 브라우저에서 파일 다운로드를 실행
   * Blob을 생성하고 임시 링크를 통해 다운로드 트리거
   * 
   * @param {string} csvContent - CSV 형식의 문자열 데이터
   */
  const triggerDownload = (csvContent) => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // 다운로드 완료 표시 (1초간 체크마크 표시)
    setIsDownloaded(true);
    setTimeout(() => {
      setIsDownloaded(false);
    }, 1000);
  };

  /**
   * 데이터를 CSV 형식으로 변환하고 다운로드 실행
   * 첫 번째 객체의 키를 헤더로 사용
   */
  const downloadCsv = () => {
    if (data.length === 0) {
      triggerDownload("");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => escapeCsvValue(row[h])).join(","),
      ),
    ];

    const csvContent = csvRows.join("\n");
    triggerDownload(csvContent);
  };

  // CSS 클래스 조합 (필터로 빈 값 제거)
  const buttonClassName = [
    styles.downloadButton,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      onClick={() => {
        if (isDownloaded) {
          return;
        }
        downloadCsv();
      }}
      className={buttonClassName}
      aria-label="Download chart data as CSV"
      title="Download CSV"
      disabled={isDownloaded}
    >
      {isDownloaded ? <Check size={16} /> : <Download size={16} />}
    </button>
  );
}
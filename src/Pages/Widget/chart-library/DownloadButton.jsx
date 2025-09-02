import React, { useState } from "react";
import { Download, Check } from "lucide-react";
import styles from './chart-library.module.css';

/**
 * DownloadButton component for exporting chart data as CSV
 * 
 * @param {Object} props - Component props
 * @param {Object[]} props.data - Array of data objects to export
 * @param {string} [props.fileName="chart-data"] - Name of the downloaded file
 * @param {string} [props.className] - Additional CSS class names
 * @returns {React.ReactElement} Download button with CSV export functionality
 */
export function DownloadButton({
  data,
  fileName = "chart-data",
  className,
}) {
  const [isDownloaded, setIsDownloaded] = useState(false);

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

    // Show checkmark for 1 second
    setIsDownloaded(true);
    setTimeout(() => {
      setIsDownloaded(false);
    }, 1000);
  };

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
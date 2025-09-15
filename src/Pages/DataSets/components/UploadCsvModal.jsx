// src/Pages/Evaluation/DataSets/components/UploadCsvModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from '../uploadCsvModal.module.css';
import { X, Upload } from 'lucide-react';
import ImportCsvView from './ImportCsvView';

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function UploadCsvModal({ isOpen, onClose, onImportSuccess }) {
    const [csvData, setCsvData] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setCsvData(null);
            setIsDragging(false);
        }
    }, [isOpen]);

    const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const onDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const parseCSV = (text) => {
        const rows = []; let row = []; let current = ""; let inQuotes = false; const pushCell = () => { row.push(current); current = ""; }; const pushRow = () => { rows.push(row); row = []; }; for (let i = 0; i < text.length; i++) { const c = text[i]; if (inQuotes) { if (c === '"') { if (text[i + 1] === '"') { current += '"'; i++; } else inQuotes = false; } else current += c; } else { if (c === '"') inQuotes = true; else if (c === ",") pushCell(); else if (c === "\n") { pushCell(); pushRow(); } else if (c === "\r") { /* ignore */ } else current += c; } } pushCell(); if (row.length > 1 || row[0] !== "") pushRow(); while (rows.length && rows[rows.length - 1].every((x) => x === "")) rows.pop(); const headers = rows.shift() ?? []; return { headers, rows };
    };

    const readCsvFile = (file) => {
        if (!/\.csv($|\b)/i.test(file.name) && file.type !== "text/csv") {
            alert("Please select a CSV file."); return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = parseCSV(String(reader.result || ""));
                if (parsed.rows.length === 0) { alert("No rows found in the CSV."); return; }
                setCsvData({ headers: parsed.headers, rows: parsed.rows, fileName: file.name });
            } catch {
                alert("Failed to parse CSV. Please check the format.");
            }
        };
        reader.onerror = () => alert("Failed to read the file.");
        reader.readAsText(file);
    };

    const handleFileSelect = (file) => {
        if (file) {
            readCsvFile(file);
        }
    };

    // 👇 onImport 함수를 async로 만들고, onImportSuccess를 await합니다.
    const handleImport = async (items) => {
        await onImportSuccess(items); // 부모의 데이터 처리 및 새로고침이 끝날 때까지 기다립니다.
        onClose(); // 모든 작업이 끝난 후 모달을 닫습니다.
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {csvData ? (
                    <ImportCsvView
                        csvData={csvData}
                        onCancel={() => setCsvData(null)}
                        onImport={handleImport} // 수정된 핸들러를 전달합니다.
                    />
                ) : (
                    <>
                        <div className={styles.header}>
                            <h2 className={styles.title}>Upload CSV</h2>
                            <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
                        </div>
                        <div className={styles.body}>
                            <div className={styles.uploadCard}>
                                <div className={styles.uploadHeader}>
                                    <h3 className={styles.uploadTitle}>Add items to dataset</h3>
                                    <p className={styles.uploadSubtitle}>Add items to dataset by uploading a file, add items manually or via our SDKs/API</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className={styles.fileInputHidden}
                                    accept=".csv"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                                <div
                                    className={cx(styles.dropArea, isDragging && styles.isDragging)}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={24} />
                                    <span className={styles.dropText}>Click to select a CSV file</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
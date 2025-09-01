// src/Pages/Evaluation/DataSets/components/DatasetDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import styles from "../datasetDetail.module.css";
import sharedStyles from "../datasetsShared.module.css";
import * as api from "../datasetsApi";
import ImportCsvView from "./ImportCsvView";
import RowActions from "./RowActions";
import NewItemModal from "./NewItemModal";
import UploadCsvModal from "./UploadCsvModal";
import { Upload, Search, Filter, Columns, ChevronDown, Download, MoreVertical, Plus, ChevronUp, Info, Rows3, FlaskConical, Edit, Copy, Trash2 } from "lucide-react";

const cx = (...xs) => xs.filter(Boolean).join(" ");

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
    d.getDate()
  )} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function DatasetDetail({ dataset, onBack, onEdit, onDuplicate, onDelete }) {
  const { setHeader } = useOutletContext();
  const [tab, setTab] = useState("items");
  const [runs, setRuns] = useState(null);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const fileInputRef = useRef(null);
  const headerMenuRef = useRef(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const name = dataset?.name ?? "";
      if (!name) throw new Error("Invalid dataset name");
      const [runsResp, itemsResp] = await Promise.all([
        api.listDatasetRuns(name),
        api.listDatasetItems(name)
      ]);
      setRuns(runsResp || []);
      setItems(itemsResp || []);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.name]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const left = (
      <div className={styles.headerStack}>
        <div className={styles.titleRow}>
          <button className={styles.datasetBadge} onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.badgeIcon}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
            Dataset
          </button>
          <span className={styles.dsTitle}>{dataset?.name ?? ""}</span>
          <span className={styles.headInfoIcon} aria-hidden>i</span>
        </div>
        <div className={styles.tabBar}>
          <button className={`${styles.tabLink} ${tab === "runs" ? styles.tabLinkActive : ""}`} onClick={() => setTab("runs")}>
            Runs {Array.isArray(runs) && runs.length > 0 && (<span className={styles.countPill}>{runs.length}</span>)}
          </button>
          <button className={`${styles.tabLink} ${tab === "items" ? styles.tabLinkActive : ""}`} onClick={() => setTab("items")}>
            Items {Array.isArray(items) && items.length > 0 && (<span className={styles.countPill}>{items.length}</span>)}
          </button>
        </div>
      </div>
    );

    let rightActions;
    if (tab === 'runs') {
      rightActions = (
        <div className={styles.actionsRow}>
          <button className={`${styles.headerBtn} ${styles.headerBtnLight}`}><FlaskConical size={16} className={styles.btnIcon} /> New dataset run</button>
          <button className={`${styles.headerBtn} ${styles.headerBtnDark}`}>Select evaluators <ChevronDown size={14} className={styles.btnChevron} /></button>
          <button className={`${styles.headerBtn} ${styles.headerBtnDark}`}>Charts <ChevronDown size={14} className={styles.btnChevron} /></button>
          <span className={styles.headerBadge}>2</span>
          <div className={styles.navButtonGroup}><button className={styles.navButton} title="Previous Item (K)"><ChevronUp size={16} /><span className={styles.keyHint}>K</span></button><button className={styles.navButton} title="Next Item (J)"><ChevronDown size={16} /><span className={styles.keyHint}>J</span></button></div>
          <button className={styles.squareBtn} title="More"><MoreVertical size={16} /></button>
        </div>
      );
    } else if (tab === 'items') {
      rightActions = (
        <div className={styles.actionsRow}>
          <button className={`${styles.headerBtn} ${styles.headerBtnPrimary}`} onClick={() => setIsNewItemModalOpen(true)}>
            <Plus size={16} className={styles.btnIcon} /> New item
          </button>
          <button className={`${styles.headerBtn} ${styles.headerBtnPrimary}`} onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={16} className={styles.btnIcon} /> Upload CSV
          </button>
          <div className={styles.headerMenuContainer} ref={headerMenuRef}>
            <button className={styles.squareBtn} title="More actions" onClick={() => setIsHeaderMenuOpen(prev => !prev)}>
              <MoreVertical size={16} />
            </button>
            {isHeaderMenuOpen && (
              <div className={styles.headerMenu}>
                <button className={styles.headerMenuItem} onClick={() => { onEdit(); setIsHeaderMenuOpen(false); }}>
                  <Edit size={14} /> Edit
                </button>
                <button className={styles.headerMenuItem} onClick={() => { onDuplicate(); setIsHeaderMenuOpen(false); }}>
                  <Copy size={14} /> Duplicate
                </button>
                <button className={`${styles.headerMenuItem} ${styles.dangerItem}`} onClick={() => { onDelete(); setIsHeaderMenuOpen(false); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    setHeader({ title: left, rightActions: rightActions, showInfoDot: false });
    return () => setHeader({ title: undefined, rightActions: undefined, showInfoDot: true });
  }, [dataset?.name, tab, runs, items, onBack, setHeader, isHeaderMenuOpen, onEdit, onDuplicate, onDelete]);

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileSelect(file); };
  const parseCSV = (text) => { const rows = []; let row = []; let current = ""; let inQuotes = false; const pushCell = () => { row.push(current); current = ""; }; const pushRow = () => { rows.push(row); row = []; }; for (let i = 0; i < text.length; i++) { const c = text[i]; if (inQuotes) { if (c === '"') { if (text[i + 1] === '"') { current += '"'; i++; } else inQuotes = false; } else current += c; } else { if (c === '"') inQuotes = true; else if (c === ",") pushCell(); else if (c === "\n") { pushCell(); pushRow(); } else if (c === "\r") { /* ignore */ } else current += c; } } pushCell(); if (row.length > 1 || row[0] !== "") pushRow(); while (rows.length && rows[rows.length - 1].every((x) => x === "")) rows.pop(); const headers = rows.shift() ?? []; return { headers, rows }; };
  const readCsvFile = (file) => { setItemsError(null); if (!/\.csv($|\b)/i.test(file.name) && file.type !== "text/csv") { setItemsError("Please select a CSV file."); return; } const reader = new FileReader(); reader.onload = () => { try { const parsed = parseCSV(String(reader.result || "")); if (parsed.rows.length === 0) { setItemsError("No rows found in the CSV."); return; } setCsvData({ headers: parsed.headers, rows: parsed.rows, fileName: file.name }); } catch { setItemsError("Failed to parse CSV. Please check the format."); } }; reader.onerror = () => setItemsError("Failed to read the file."); reader.readAsText(file); };
  const handleFileSelect = (file) => { if (file) { readCsvFile(file); setIsUploadModalOpen(false); } };

  const handleImport = async (importedItems) => {
    if (!dataset?.name) {
      alert("Dataset name is not available.");
      return;
    }
    try {
      await api.createDatasetItems(dataset.name, importedItems);
      alert(`${importedItems.length} items imported successfully!`);
      // 👇 fetchDetails() 대신 페이지를 새로고침합니다.
      window.location.reload();
    } catch (e) {
      console.error("Failed to import items:", e);
      alert(`Failed to import items: ${e.message}`);
    }
  };

  if (error) return <div className={sharedStyles.alertError}>{error}</div>;
  if (loading && !items && !runs) return <div style={{ padding: 12 }}>Loading…</div>;

  const renderItemsTab = () => {
    if (csvData) {
      return (<ImportCsvView csvData={csvData} onCancel={() => setCsvData(null)} onImport={handleImport} />);
    }

    if (!items || items.length === 0) {
      return (
        <main className={styles.itemsEmptyContainer}>
          <div className={styles.itemsEmptyContent}>
            <div className={styles.uploadCard}>
              <div className={styles.uploadHeader}>
                <h3 className={styles.uploadTitle}>Add items to dataset</h3>
                <div className={styles.uploadSubtitle}>Add items to dataset by uploading a file, add items manually or via our SDKs/API</div>
              </div>
              <div className={styles.uploadBody}>
                <input type="file" ref={fileInputRef} className={styles.fileInputHidden} accept=".csv" onChange={(e) => handleFileSelect(e.target.files[0])} />
                <div className={cx(styles.dropArea, isDragging && styles.isDragging)} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} />
                  <div className={styles.dropText}>Click to select a CSV file</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      );
    }

    const itemsColumns = ["Item id", "Source", "Status", "Created At", "Input", "Expected Output", "Metadata", "Actions"];
    return (
      <div className={styles.itemsTableRoot}>
        <div className={styles.itemsToolbar}>
          <div className={styles.searchGroup}>
            <div className={styles.searchInputWrapper}>
              <button className={styles.searchIconBtn}><Search size={16} /></button>
              <input placeholder="Search (ID)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className={styles.searchTypeBtn}>
              <span className={styles.searchTypeBtnText}>IDs <Info size={12} /></span><ChevronDown size={16} />
            </button>
          </div>
          <button className={styles.filterButton}>Filters <ChevronDown size={16} /></button>
          <div className={styles.itemsToolbarRight}>
            <button className={styles.filterButton}><span>Columns</span><div className={styles.chipBadge}>8/8</div></button>
            <button className={styles.iconBtn} title="Export"><Download size={16} /></button>
          </div>
        </div>
        <div className={styles.itemsTableWrap}>
          <table className={styles.itemsTable}>
            <thead className={styles.itemsThead}>
              <tr>{itemsColumns.map(col => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><button className={styles.itemIdButton}>{item.id}</button></td>
                  <td>{item.source || '-'}</td>
                  <td><span className={styles.statusPill}>{item.status || 'Active'}</span></td>
                  <td>{fmtDate(item.createdAt)}</td>
                  <td><div className={styles.cellTextBox}>{typeof item.input === 'object' ? JSON.stringify(item.input) : item.input}</div></td>
                  <td><div className={styles.cellTextBox}>{typeof item.expectedOutput === 'object' ? JSON.stringify(item.expectedOutput) : item.expectedOutput}</div></td>
                  <td><div className={styles.cellTextBox}>{typeof item.metadata === 'object' ? JSON.stringify(item.metadata) : item.metadata}</div></td>
                  <td className={styles.actionsCell}>
                    <button className={styles.iconBtn} onClick={() => setOpenMenuId(prev => prev === item.id ? null : item.id)}>
                      <MoreVertical size={16} />
                    </button>
                    <RowActions open={openMenuId === item.id} onClose={() => setOpenMenuId(null)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.itemsFooter}>
          <div className={styles.rowsPerPage}><span>Rows per page</span><select><option>50</option></select></div>
          <div className={styles.pageInfo}><span>Page</span><input type="text" value="1" readOnly /><span>of 1</span></div>
          <div className={styles.pagers}><button className={styles.ghostBtn} disabled>{"<<"}</button><button className={styles.ghostBtn} disabled>{"<"}</button><button className={styles.ghostBtn} disabled>{">"}</button><button className={styles.ghostBtn} disabled>{">>"}</button></div>
        </div>
      </div>
    );
  };

  const renderRunsTab = () => {
    const runsColumns = ["Name", "Description", "Run Items", "Latency (avg)", "Total Cost (avg)", "Run-level Scores", "Aggregated Run Item...", "Created", "Metadata", "Actions"];
    return (
      <div className={styles.runsRoot}>
        <div className={styles.runsToolbar}>
          <button className={styles.filterButton}><Columns size={16} /> Columns<span className={styles.columnsBadge}>9/10</span></button>
        </div>
        <div className={styles.runsTableWrap}>
          <table className={styles.runsTable}>
            <thead className={styles.runsThead}><tr>{runsColumns.map(col => <th key={col}>{col}</th>)}</tr></thead>
            <tbody>
              {!runs || runs.length === 0 ? (
                <tr><td colSpan={runsColumns.length} className={styles.noResultsCell}><div className={styles.noResults}>No results.</div></td></tr>
              ) : (
                runs.map(run => (<tr key={run.id}>{/* ... 데이터 행 렌더링 ... */}</tr>))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.runsFooter}>
          <div className={styles.rowsPerPage}><span>Rows per page</span><select><option>50</option></select></div>
          <div className={styles.pageInfo}><span>Page</span><input type="text" value="1" readOnly /><span>of {runs?.length > 0 ? '1' : '0'}</span></div>
          <div className={styles.pagers}><button className={styles.ghostBtn} disabled>{"<<"}</button><button className={styles.ghostBtn} disabled>{"<"}</button><button className={styles.ghostBtn} disabled>{">"}</button><button className={styles.ghostBtn} disabled>{">>"}</button></div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.detailPage}>
      {tab === "runs" ? renderRunsTab() : renderItemsTab()}

      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        datasetName={dataset.name}
        onSubmitSuccess={() => {
          setIsNewItemModalOpen(false);
          fetchDetails();
        }}
      />
      <UploadCsvModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportSuccess={handleImport}
      />
    </div>
  );
}
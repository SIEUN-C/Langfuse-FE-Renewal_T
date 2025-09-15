// src/Pages/Evaluation/DataSets/components/DatasetsTable.jsx
import React, { useState, useMemo } from "react";
import styles from "../datasetsTable.module.css";
import RowActions from "./RowActions";
import { Search, Columns, Rows3, MoreHorizontal, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";


function toNode(v) {
  if (v == null) return "";
  const t = typeof v;
  if (t === "string" || t === "number") return v;
  if (t === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toLocaleString();
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  if (t === "object") return JSON.stringify(v);
  return String(v);
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
    d.getDate()
  )} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function num(v, fallback = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(+v)) return +v;
  if (Array.isArray(v)) return v.length;
  return fallback;
}
function metaToStr(m) {
  if (m == null) return "";
  if (typeof m === "string") return m;
  try { return JSON.stringify(m); } catch { return String(m); }
}

const COLUMNS = [
  { key: "name", header: "Name", width: 220 },
  { key: "description", header: "Description", width: 300 },
  { key: "items", header: "Items", width: 70, align: "right", render: (r) => num(r.itemsCount ?? r.items, 0) },
  { key: "runs", header: "Runs", width: 70, align: "right", render: (r) => num(r.runsCount ?? r.runs, 0) },
  { key: "createdAt", header: "Created", width: 150, render: (r) => fmtDate(r.createdAt ?? r.created) },
  { key: "lastRunAt", header: "Last Run", width: 150, render: (r) => fmtDate(r.lastRunAt ?? r.lastRun) },
  {
    key: "metadata", header: "Metadata", width: 240, render: (r) => (
      <div className={styles.metaCell}>{metaToStr(r.metadata)}</div>
    )
  },
  { key: "actions", header: "Actions", width: 64, align: "right" },
];

export default function DatasetsTable({ rows, onRowClick, onEditRow, onDeleteRow }) {
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.name ?? "",
        r.description ?? "",
        r.id ?? "",
        r.createdAt ?? "",
        r.updatedAt ?? "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const paged = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, perPage, safePage]);


  const columnsTotal = COLUMNS.length;

  return (
    <main className={styles.main}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            placeholder="Search (Name)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.chipBtn}>
            <span>Table View</span>
            <div className={styles.chipBadge}>0</div>
          </button>
          <button className={styles.chipBtn}>
            <span>Columns</span>
            <div className={styles.chipBadge}>{columnsTotal}/{columnsTotal}</div>
          </button>
          <button className={styles.iconBtn}>
            <Rows3 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroller}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} style={{ width: c.width, textAlign: c.align ?? 'left' }}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columnsTotal} className={styles.emptyCell}>
                    No datasets found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id ?? JSON.stringify(row)} className={styles.tr}>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className={styles.td} style={{ textAlign: c.align ?? 'left' }}>
                        <div className={styles.cellContent}>
                          {c.key === "name" ? (
                            <button
                              type="button"
                              className={styles.namePill}
                              onClick={() => onRowClick?.(row)}
                              title={String(row.name ?? "")}
                            >
                              {row.name}
                            </button>
                          ) : c.key === "actions" ? (
                            <div className={styles.tdActions}>
                              <button
                                className={styles.iconBtn}
                                title="More"
                                onClick={() => setOpenMenuId((id) => (id === row.id ? null : row.id))}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              <RowActions
                                open={openMenuId === row.id}
                                onClose={() => setOpenMenuId(null)}
                                onEdit={() => { setOpenMenuId(null); onEditRow?.(row); }}
                                onDelete={() => { setOpenMenuId(null); onDeleteRow?.(row); }}
                              />
                            </div>
                          ) : (
                            c.render ? c.render(row) : toNode(row[c.key])
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footerBar}>
        <div className={styles.rowsPerPage}>
          <span>Rows per page</span>
          <select value={perPage} onChange={(e) => { const n = Number(e.target.value) || 10; setPerPage(n); setPage(1); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className={styles.pageInfo}>
          <span>Page</span>
          <input
            type="number"
            className={styles.pageInput}
            min={1}
            max={pageCount}
            value={safePage}
            onChange={(e) => setPage(Number(e.target.value))}
          />
          <span>of {pageCount}</span>
        </div>
        <div className={styles.pagerBtns}>
          <button className={styles.iconBtn} onClick={() => setPage(1)} disabled={safePage <= 1}><ChevronsLeft size={16} /></button>
          <button className={styles.iconBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}><ChevronLeft size={16} /></button>
          <button className={styles.iconBtn} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}><ChevronRight size={16} /></button>
          <button className={styles.iconBtn} onClick={() => setPage(pageCount)} disabled={safePage >= pageCount}><ChevronsRight size={16} /></button>
        </div>
      </div>
    </main>
  );
}
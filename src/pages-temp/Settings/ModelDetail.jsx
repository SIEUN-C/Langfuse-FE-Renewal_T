import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, RefreshCw, Download, ChevronDown } from "lucide-react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import styles from "./layout/ModelDetail.module.css";
import CustomPagination from "./CustomPagination";

import {
  getModel as trpcGetModel,             // models.getById
} from "./lib/ModelsApi.trpc";
import {
  fetchGenerationsPage,                  // generations.all
  fetchGenerationsCount,                 // generations.countAll
  fetchScoreColumns,                     // scores.getScoreColumns
} from "./lib/ModelsApi.trpc";

const TIME_WINDOWS = [
  { label: "Past 24 hours", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Past 7 days",   value: "7d",  ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "Past 30 days",  value: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "All",           value: "all", ms: null },
];

export default function ModelDetail() {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  const projectId = localStorage.getItem("projectId");

  // 상단 카드용 모델
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(false);

  // 하단 Observations
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [scoreCols, setScoreCols] = useState([]);

  const [pageIndex, setPageIndex] = useState(0);     // 0-based
  const [pageSize, setPageSize]   = useState(50);
  const [search, setSearch]       = useState("");
  const [timeWin, setTimeWin]     = useState("24h");
  const [env, setEnv]             = useState("default");
  const [loadingTable, setLoadingTable] = useState(false);

  const fromISO = useMemo(() => {
    const win = TIME_WINDOWS.find(w => w.value === timeWin);
    if (!win || win.ms == null) return null;
    return new Date(Date.now() - win.ms).toISOString();
  }, [timeWin]);

  // ──────────────────────────────────────
  // 모델 단건 가져오기
  // ──────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!projectId || !modelId) return;
      setLoadingModel(true);
      try {
        const res = await trpcGetModel(modelId, projectId);
        if (!alive) return;
        // tRPC result shape: res = { id, modelName, ... }
        setModel(res);
      } finally {
        if (alive) setLoadingModel(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, modelId]);

  // ──────────────────────────────────────
  // Observations 테이블 데이터 + 카운트 + 스코어컬럼
  // ──────────────────────────────────────
  const loadTable = useCallback(async () => {
    if (!projectId || !modelId) return;
    setLoadingTable(true);
    try {
      const [pageRes, countRes, scoresRes] = await Promise.all([
        fetchGenerationsPage({
          projectId,
          modelId,
          page: pageIndex,
          limit: pageSize,
          from: fromISO ?? undefined,
          environment: env,
        }),
        fetchGenerationsCount({
          projectId,
          modelId,
          from: fromISO ?? undefined,
          environment: env,
        }),
        fetchScoreColumns({
          projectId,
          from: fromISO ?? undefined,
        }),
      ]);
      setRows(pageRes?.generations ?? []);
      setTotal(Number(countRes?.totalCount ?? 0));
      setScoreCols(scoresRes?.scoreColumns ?? []);
    } finally {
      setLoadingTable(false);
    }
  }, [projectId, modelId, pageIndex, pageSize, fromISO, env]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  // ──────────────────────────────────────
  // 테이블 컬럼
  // ──────────────────────────────────────
  const columnDefs = useMemo(() => {
    const base = [
      { field: "startTime", headerName: "Start Time", valueFormatter: p => p.value ? new Date(p.value).toLocaleString() : "", width: 170 },
      { field: "type", headerName: "Type", width: 110 },
      { field: "name", headerName: "Name", width: 220 },
      { field: "input", headerName: "Input", width: 260, valueGetter: p => p.data?.input ?? "" },
      { field: "output", headerName: "Output", width: 260, valueGetter: p => p.data?.output ?? "" },
    ];
    // 스코어 컬럼을 오른쪽에 붙이기
    const score = (scoreCols || []).map(key => ({
      field: `score.${key}`,
      headerName: key,
      width: 120,
      valueGetter: p => p.data?.scores?.[key],
    }));
    return [...base, ...score];
  }, [scoreCols]);

  // ──────────────────────────────────────
  // 핸들러
  // ──────────────────────────────────────
  const onRefresh = () => loadTable();

  const onDownload = () => {
    // 간단 CSV 내보내기 (보이는 컬럼만)
    const visible = ["startTime", "type", "name", "input", "output", ...(scoreCols || []).map(k => `score.${k}`)];
    const header = visible.join(",");
    const body = rows.map(r => visible.map(k => {
      const v = k.startsWith("score.") ? r?.scores?.[k.split(".")[1]] : r?.[k] ?? (k === "input" ? r?.input : k === "output" ? r?.output : "");
      const s = typeof v === "string" ? v.replaceAll('"','""') : (v ?? "");
      return `"${s}"`;
    }).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${model?.modelName || "model"}-observations.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ──────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* 헤더 + 우측 Clone 버튼 영역은 상위 페이지에서 처리했다면 생략 가능 */}
      <div className={styles.headerRow}>
        <div className={styles.breadcrumb} onClick={() => navigate(-1)} title="Back">
          ← Models
        </div>
        <div className={styles.title}>
          {loadingModel ? "Loading…" : (model?.modelName || "")}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={() => alert("Clone: 구현 연결")}>Clone</button>
        </div>
      </div>

      {/* 상단 카드 2개 */}
      <div className={styles.cards}>
        <section className={styles.card}>
          <div className={styles.cardTitle}>Model configuration</div>
          <div className={styles.confItem}>
            <div className={styles.label}>Match Pattern</div>
            <div className={styles.valueMono}>{model?.matchPattern || "—"}</div>
          </div>
          <div className={styles.confItem}>
            <div className={styles.label}>Maintained by</div>
            <div className={styles.value}>{model?.isLangfuseManaged ? "Langfuse" : "Custom"}</div>
          </div>
          <div className={styles.confItem}>
            <div className={styles.label}>Tokenizer</div>
            <div className={styles.value}>{model?.tokenizerId || "—"}</div>
          </div>
          <div className={styles.confItem}>
            <div className={styles.label}>Tokenizer Config</div>
            <pre className={styles.jsonBox}>
              {model?.tokenizerConfig ? JSON.stringify(model.tokenizerConfig, null, 2) : "{}"}
            </pre>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardTitle}>Pricing</div>
          <div className={styles.priceRow}>
            <div className={styles.priceLabel}>input</div>
            <div className={styles.priceValue}>
              {model?.prices?.input != null ? `$${Number(model.prices.input).toFixed(6)}` : "—"}
            </div>
          </div>
          <div className={styles.priceRow}>
            <div className={styles.priceLabel}>output</div>
            <div className={styles.priceValue}>
              {model?.prices?.output != null ? `$${Number(model.prices.output).toFixed(6)}` : "—"}
            </div>
          </div>
        </section>
      </div>

      {/* 하단 Model observations */}
      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.cardTitle}>Model observations</div>
          <button className={styles.linkBtn} onClick={() => window.open(`/project/${projectId}/explorer`, "_blank")}>View all</button>
        </div>

        {/* 툴바 */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
            />
          </div>

          <div className={styles.splitGroup}>
            <button className={styles.pillBtn}>
              IDs / Names <ChevronDown size={14}/>
            </button>
            <div className={styles.selectWrap}>
              <select value={timeWin} onChange={e => { setPageIndex(0); setTimeWin(e.target.value); }}>
                {TIME_WINDOWS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div className={styles.selectWrap}>
              <span className={styles.envLabel}>Env</span>
              <select value={env} onChange={e => { setPageIndex(0); setEnv(e.target.value); }}>
                <option value="default">default</option>
                <option value="staging">staging</option>
                <option value="prod">prod</option>
              </select>
            </div>

            <div className={styles.filterChip}>
              Filters <span className={styles.badge}>1</span>
              <button className={styles.iconBtn} onClick={() => {/* clear filters */ setTimeWin("24h"); setEnv("default"); setPageIndex(0);}} title="Clear filters">×</button>
            </div>
          </div>

          <div className={styles.rightGroup}>
            <div className={styles.dropdownBtn}>Table View <ChevronDown size={14}/></div>
            <div className={styles.dropdownBtn}>Columns <span className={styles.badge}>{16 + (scoreCols?.length || 0)}/29</span></div>
            <button className={styles.iconBtn} onClick={onRefresh} title="Refresh">
              <RefreshCw size={16}/>
            </button>
            <button className={styles.iconBtn} onClick={onDownload} title="Download CSV">
              <Download size={16}/>
            </button>
          </div>
        </div>

        <div className={`ag-theme-alpine ${styles.gridWrap}`}>
          <AgGridReact
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true, sortable: true, minWidth: 80 }}
            domLayout="autoHeight"
            overlayNoRowsTemplate={'<span class="ag-overlay-loading-center">No results.</span>'}
            getRowId={p => p.data?.id}
          />
        </div>

        <div className={styles.paginationWrap}>
          <CustomPagination
            pageSizes={[10, 20, 50, 100]}
            currentIndex={pageIndex}
            pageSize={pageSize}
            totalRows={total}
            onPageChange={(i) => setPageIndex(i)}
            onLimitChange={(s) => { setPageIndex(0); setPageSize(s); }}
          />
        </div>
      </section>
    </div>
  );
}

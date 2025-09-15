// src/components/JsonDebugCard.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Copy,
  FoldVertical,
  UnfoldVertical,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import cls from "../layout/JsonDebugCard.module.css";

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const isArray = Array.isArray;
const itemsCount = (v) => (isArray(v) ? v.length : Object.keys(v || {}).length);
const itemsLabel = (v) => `${itemsCount(v)} Item${itemsCount(v) === 1 ? "" : "s"}`;

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error(e);
    alert("클립보드 복사 실패");
  }
}

const CollapseSignals = Object.freeze({ none: 0, collapse: 1, expand: 2 });
const pathId = (arr) => (arr.length ? arr.join(".") : "root");

function useCopied() {
  const [copied, setCopied] = useState({});
  const mark = useCallback((id) => {
    setCopied((m) => ({ ...m, [id]: true }));
    setTimeout(() => {
      setCopied((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    }, 1200);
  }, []);
  const is = useCallback((id) => !!copied[id], [copied]);
  return { isCopied: is, markCopied: mark };
}

const formatKeyLabel = (key, depth) => {
  if (typeof key !== "string") return key;
  if (depth === 1) return key.charAt(0).toUpperCase() + key.slice(1);
  return key;
}

function Row({
  k,
  v,
  path,
  depth,
  defaultCollapsed = false,
  collapseSignal = CollapseSignals.none,
  rootData,
  copiedApi, // { isCopied, markCopied }
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const myPath = useMemo(() => (k !== undefined ? [...path, k] : path), [path, k]);
  const complex = isObject(v) || isArray(v);

  useEffect(() => {
    if (!complex) return;
    if (collapseSignal === CollapseSignals.collapse) setCollapsed(true);
    if (collapseSignal === CollapseSignals.expand) setCollapsed(false);
  }, [collapseSignal, complex]);

  const toggleCollapse = () => {
    if (complex) setCollapsed((c) => !c);
  };

  const copyRoot = useCallback(() => {
    copy(JSON.stringify(rootData ?? v, null, 2));
    copiedApi.markCopied("root");
  }, [rootData, v, copiedApi]);

  const copyCurrent = useCallback(() => {
    const id = pathId(myPath);
    const txt = complex ? JSON.stringify(v, null, 2) : (typeof v === "string" ? v : String(v));
    copy(txt);
    copiedApi.markCopied(id);
  }, [myPath, v, complex, copiedApi]);

  const ComplexCopyChip = () => {
    const idCurrent = pathId(myPath);
    if (depth === 0) {
      return (
        <span className={cls.copyActions}>
          <button className={cls.copyBtn} title="최상위 복사 (root)" onClick={copyRoot} aria-label="최상위 복사">
            {copiedApi.isCopied("root") ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </span>
      );
    }
    return (
      <span className={cls.copyActions}>
        <button
          className={cls.copyBtn}
          title={`현재 스코프 복사 (${idCurrent})`}
          onClick={copyCurrent}
          aria-label="현재 스코프 복사"
        >
          {copiedApi.isCopied(idCurrent) ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </span>
    );
  };

  if (!complex) {
    const idCurrent = pathId(myPath);
    return (
      <div className={cls.leafRow} style={{ marginLeft: depth * 20 }}>
        <span className={cls.scope}>
          <span className={cls.leafKey}>{k}</span>
          <span className={cls.leafColon}>:</span>
          <span className={cls.valuePill}>
            <span className={cls.leafValue}>{typeof v === "string" ? `"${v}"` : String(v)}</span>
            <span className={cls.copyActions}>
              <button
                className={cls.copyBtn}
                title={`현재 값 복사 (${idCurrent})`}
                onClick={copyCurrent}
                aria-label="현재 값 복사"
              >
                {copiedApi.isCopied(idCurrent) ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </span>
          </span>
        </span>
      </div>
    );
  }

/* complex */
return (
  <div className={cls.complexContainer} style={{ marginLeft: depth * 20 }}>
    <div className={cls.complexRow}>
      <span className={cls.scope}>
        {k !== undefined && (
          <>
            <span className={cls.complexKey}>{formatKeyLabel(k, depth)}</span>
            <span className={cls.complexColon}>:</span>
          </>
        )}

        {/* ✅ 토글 표시: 접힘 → { ... } / 펼침 → { 2 Items (닫는 괄호 없음) */}
        <span
          className={cls.itemsPill}
          onClick={toggleCollapse}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleCollapse()}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsed}
          title={collapsed ? "펼치기" : "접기"}
        >
          {collapsed ? (
            // 접힘 상태: { ... }
            <>
              <span className={cls.brace}>{"{ "}</span>
              <span className={cls.ellipsis}>...</span>
              <span className={cls.brace}>{" }"}</span>
            </>
          ) : (
            // 펼침 상태: { 2 Items  (닫는 괄호는 아래 단독 줄에서 표시)
            <>
              <span className={cls.brace}>{"{"}</span>
              <span className={cls.itemsText}>{itemsLabel(v)}</span>
            </>
          )}

          <span className={cls.toggleIcon} aria-hidden>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        </span>

        <ComplexCopyChip />
      </span>
    </div>

    {!collapsed && (
      <div className={cls.complexChildren}>
        {isArray(v)
          ? v.map((item, i) => (
              <Row
                key={i}
                k={i}
                v={item}
                path={myPath}
                depth={depth + 1}
                defaultCollapsed={defaultCollapsed}
                collapseSignal={collapseSignal}
                rootData={rootData}
                copiedApi={copiedApi}
              />
            ))
          : Object.entries(v || {}).map(([ck, cv]) => (
              <Row
                key={ck}
                k={ck}
                v={cv}
                path={myPath}
                depth={depth + 1}
                defaultCollapsed={defaultCollapsed}
                collapseSignal={collapseSignal}
                rootData={rootData}
                copiedApi={copiedApi}
              />
            ))}
      </div>
    )}

    {/* 펼쳐진 상태면 닫는 괄호 단독 줄 */}
    {!collapsed && (
      <div className={cls.closingBraceRow}>
        <span className={cls.brace}>{"}"}</span>
      </div>
    )}
  </div>
);
}

export default function JsonDebugCard({ title = "Metadata", data }) {
  const [collapseSignal, setCollapseSignal] = useState(CollapseSignals.none);
  const [globalCollapsed, setGlobalCollapsed] = useState(false);
  const isEmpty = !data || (typeof data === "object" && Object.keys(data).length === 0);
  const { isCopied, markCopied } = useCopied();

  const copyAll = () => {
    copy(JSON.stringify(data, null, 2));
    markCopied("root");
  };

  const toggleCollapseAll = () => {
    if (globalCollapsed) {
      setCollapseSignal(CollapseSignals.expand);
      setGlobalCollapsed(false);
    } else {
      setCollapseSignal(CollapseSignals.collapse);
      setGlobalCollapsed(true);
    }
  };

  useEffect(() => {
    if (collapseSignal !== CollapseSignals.none) {
      const t = setTimeout(() => setCollapseSignal(CollapseSignals.none), 0);
      return () => clearTimeout(t);
    }
  }, [collapseSignal]);

  return (
    <div className={cls.card}>
      <div className={cls.header}>
        <div className={cls.headerLeft}>
          <span className={cls.title}>{title}</span>
          {!isEmpty && <span className={cls.headerBadge}>{itemsLabel(data)}</span>}
        </div>
        <div className={cls.headerActions}>
          <button
            className={cls.iconBtn}
            title={globalCollapsed ? "Expand all" : "Collapse all"}
            onClick={toggleCollapseAll}
          >
            {globalCollapsed ? <UnfoldVertical size={16} /> : <FoldVertical size={16} />}
          </button>
          <button className={cls.iconBtn} title="Copy JSON" onClick={copyAll}>
            {isCopied("root") ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className={cls.body}>
        {isEmpty ? (
          <div className={cls.empty}>{"{ }"} Empty</div>
        ) : (
          <Row
            v={data}
            path={[]}
            depth={0}
            defaultCollapsed={false}
            collapseSignal={collapseSignal}
            rootData={data}
            copiedApi={{ isCopied, markCopied }}
          />
        )}
      </div>
    </div>
  );
}

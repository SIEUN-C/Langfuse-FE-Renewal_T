import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";

// Playground API 모듈 사용
import { listLlmConnections, deleteLlmConnection } from "../Playground/lib/llmConnections"; // 
// sPlayground 모달 사용 (수정 모드 initial 지원 버전이면 그대로 사용)
import NewLlmConnectionModal from "../Playground/NewLlmConnectionModal"; // 

import common from "./layout/SettingsCommon.module.css";
import styles from "./layout/LLMConnections.module.css";

export default function LLMConnections() {
  const { projectId } = useOutletContext() || {}; // SettingsPage Outlet context 사용 
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchList = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErr("");
    try {
      const list = await listLlmConnections(projectId);
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr("Failed to load. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onAdd = () => { setEditing(null); setOpen(true); };
  const onEdit = (row) => { setEditing(row); setOpen(true); };
  const onClose = async () => { setOpen(false); setEditing(null); await fetchList(); };

  const onDelete = async (row) => {
    if (!window.confirm("Delete this connection? This cannot be undone.")) return;
    try {
      await deleteLlmConnection(row.id, { projectId });
      await fetchList();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div className={common.container}>
      <h3 className={common.title}>LLM Connections</h3>
      <p className={common.p}>
        Connect your LLM services to enable evaluations and playground features.
        Your provider will charge based on usage.
      </p>

      <div className={styles.card}>
        {/* 헤더 */}
        <div className={`${styles.row} ${styles.header}`}>
          <span>Provider</span>
          <span>Adapter</span>
          <span>Base URL</span>
          <span>API Key</span>
          <span className={styles.actionsHead}></span>
        </div>

        {/* 바디 */}
        <div className={styles.body}>
          {loading && <div className={styles.empty}>Loading…</div>}
          {err && !loading && <div className={styles.emptyError}>{err}</div>}

          {!loading && !err && rows.length === 0 && (
            <div className={styles.empty}>None</div>
          )}

          {!loading && !err && rows.length > 0 && rows.map((r) => (
            <div key={r.id} className={styles.row}>
              <span>{r.provider}</span>
              <span>{r.adapter}</span>

              {/* Base URL: 길면 가로 스크롤 */}
            <div className={styles.scrollCell} title={r.baseURL || "default"}>
            {r.baseURL || "default"}
            </div>
              {/* API Key: 길면 가로 스크롤 (원하면 ellipsis로 바꿔도 됨) */}
            <div className={styles.scrollCell} title={r.displaySecretKey || "••••••"}>
            {r.displaySecretKey || "••••••"}
            </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn} title="Edit" onClick={() => onEdit(r)}>
                  <Pencil size={16} />
                </button>
                <button className={styles.iconBtn} title="Delete" onClick={() => onDelete(r)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.addBtn} onClick={onAdd}>
        <Plus size={16} /> Add LLM Connection
      </button>

      {open && (
        <NewLlmConnectionModal
          isOpen={open}
          onClose={onClose}
          projectId={projectId}
          initial={editing || null}
        />
      )}
    </div>
  );
}

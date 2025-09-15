// src/Pages/Evaluation/DataSets/components/CreateDatasetModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../createDatasetModal.module.css";
import sharedStyles from "../datasetsShared.module.css";

function validateMetadata(raw) {
  if (!raw || raw.trim() === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(raw.trim())) return null;
  try {
    const v = JSON.parse(raw);
    const isPlainObj = typeof v === "object" && v !== null && !Array.isArray(v);
    if (isPlainObj || typeof v === "string" || typeof v === "number") return null;
    return 'Invalid input. Please provide a JSON object, double-quoted string, or number.';
  } catch {
    return 'Invalid input. Please provide a JSON object, double-quoted string, or number.';
  }
}

export default function CreateDatasetModal({
  open,
  mode,
  existingNames = [],
  initial,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [metadata, setMetadata] = useState(initial?.metadata ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setMetadata(initial?.metadata ?? "");
    setMetaError(null);
    const id = requestAnimationFrame(() => firstInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setMetaError(validateMetadata(metadata));
  }, [open, metadata]);

  const trimmed = name.trim();
  const dup = useMemo(() => {
    // 이름이 같으면 중복 검사를 하지 않도록 수정
    if (mode === 'edit' && trimmed === initial?.name) return false;
    return trimmed && existingNames.includes(trimmed);
  }, [existingNames, trimmed, mode, initial?.name]);

  const nameError = !trimmed ? "Name is required." : dup ? "A dataset with this name already exists." : null;

  const canSubmit = !nameError && !metaError && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const finalError = validateMetadata(metadata);
    if (finalError) {
      setMetaError(finalError);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        name: trimmed,
        description: description.trim() || undefined,
        metadata: metadata.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={sharedStyles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dataset-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 12px" }}>
          <h3 id="dataset-modal-title" className={styles.modalTitle}>
            {mode === "create" ? "Create new dataset" : "Update dataset"}
          </h3>
          <button aria-label="Close" className={sharedStyles.secondaryBtn} onClick={onClose} style={{ padding: "4px 8px" }}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label className={styles.label}>Name</label>
              <input
                ref={firstInputRef}
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "name-error" : undefined}
              />
              {nameError && <div id="name-error" className={styles.help} style={{ color: "#ff6b6b" }}>{nameError}</div>}
            </div>

            <div>
              <label className={styles.label}>Description (optional)</label>
              <input className={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className={styles.label}>Metadata (optional)</label>
              <input
                className={styles.input}
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                aria-invalid={!!metaError}
                aria-describedby={metaError ? "meta-error" : undefined}
              />
              {metaError && (
                <div id="meta-error" className={styles.help} style={{ color: "#ff6b6b" }}>
                  {metaError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={sharedStyles.secondaryBtn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className={sharedStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ background: "#e5e7eb", color: "#111827", borderColor: "rgba(0,0,0,.15)" }}
          >
            {submitting ? (mode === "create" ? "Creating..." : "Saving...") : (mode === "create" ? "Create dataset" : "Update dataset")}
          </button>
        </div>
      </div>
    </div>
  );
}
// src/Pages/Evaluation/DataSets/components/RowActions.jsx
import React, { useEffect, useRef } from "react";
import styles from "../rowActions.module.css";
import { Pencil, Archive, Trash2 } from 'lucide-react'; // 아이콘 import

export default function RowActions({ open, onClose, onEdit, onArchive, onDelete }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} className={styles.menu} role="menu" aria-label="Actions">
      <div className={styles.menuHeader}>Actions</div>
      <button className={styles.menuItem} onClick={onEdit}>
        <Pencil size={14} /> Edit
      </button>
      <button className={styles.menuItem} onClick={onArchive}>
        <Archive size={14} /> Archive
      </button>
      <button className={`${styles.menuItem} ${styles.dangerItem}`} onClick={onDelete}>
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}
import React, { useEffect, useRef, useState } from "react";
import styles from "./DefaultModelModal.module.css";
import { Settings2 } from 'lucide-react';
import ModelAdvancedSettingsPopover from "./ModelAdvancedSettingsPopover";

export default function DefaultModelModal({
  isOpen,
  onClose,
  onUpdate,
  provider = "test",
  modelName = "Qwen3-30B-A3B-Instruct-2507-UD-Q5_K_XL.gguf",
}) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [setting, setSetting] = useState(false);

  // ESC로 닫기 & 모달 열릴 때 첫 포커스
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.dmcOverlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.dmcModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dmc-title"
        onMouseDown={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        {/* 헤더 */}
        <div className={styles.dmcHeader}>
          <h2 id="dmc-title" className={styles.dmcTitle}>
            Default model configuration
          </h2>
          <div className={styles.dmcHeaderActions}>
            <button 
            className={styles.iconBtn}
            onClick={() => setSetting(true)}>
              <Settings2 />
            </button>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              ref={closeBtnRef}
            >
              X
            </button>
          </div>
          <ModelAdvancedSettingsPopover />
        </div>

        {/* 본문 */}
        <div className={styles.dmcBody}>
          <div className={styles.dmcField}>
            <label htmlFor="provider" className={styles.dmcLabel}>Provider</label>
            <div className={styles.dmcSelectWrap}>
              <select id="provider" defaultValue={provider} className={styles.dmcSelect}>
                <option value="test">test</option>
                <option value="openai">openai</option>
                <option value="local">local</option>
              </select>
              <span className={styles.dmcCaret} aria-hidden>▾</span>
            </div>
          </div>

          <div className={styles.dmcField}>
            <label htmlFor="model" className={styles.dmcLabel}>Model name</label>
            <div className={styles.dmcSelectWrap}>
              <select id="model" defaultValue={modelName} className={styles.dmcSelect}>
                <option>Qwen3-30B-A3B-Instruct-2507-UD-Q5_K_XL.gguf</option>
                <option>Llama-3.1-8B-Instruct</option>
                <option>Mixtral-8x7B-Instruct</option>
              </select>
              <span className={styles.dmcCaret} aria-hidden>▾</span>
            </div>
          </div>

          <p className={styles.dmcHint}>
            Select a model which supports function calling.
          </p>
        </div>

        {/* 푸터 */}
        <div className={styles.dmcFooter}>
          <button className={`${styles.btn} ${styles.ghost}`} type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.primary}`}
            type="button"
            onClick={() => onUpdate?.()}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import styles from "../layout/DangerZone.module.css";

/**
 * Danger Zone (Langfuse 레이아웃 호환)
 *
 * props:
 * - onTransfer: () => Promise<void> | void
 * - onDelete: () => Promise<void> | void
 * - loadingTransfer?: boolean
 * - loadingDelete?: boolean
 * - confirmMode?: "internal" | "none"
 *    - "internal": 컴포넌트 내부에서 window.confirm 사용
 *    - "none": 상위 컴포넌트(모달 등)에서 확인 처리
 */
export default function DangerZone({
  onTransfer,
  onDelete,
  loadingTransfer = false,
  loadingDelete = false,
  confirmMode = "none",
}) {
  const clickTransfer = async () => {
    if (confirmMode === "internal") {
      const ok = window.confirm(
        "이 프로젝트를 다른 조직으로 이전할까요?\n(해당 조직에 프로젝트 생성 권한이 있어야 합니다)"
      );
      if (!ok) return;
    }
    await onTransfer?.();
  };

  const clickDelete = async () => {
    if (confirmMode === "internal") {
      const ok = window.confirm(
        "정말 이 프로젝트를 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다."
      );
      if (!ok) return;
    }
    await onDelete?.();
  };

  return (
    <section className={styles.card} aria-labelledby="danger-zone-title">
      <h2 id="danger-zone-title" className={styles.title}>
        Danger Zone
      </h2>

      {/* Row: Transfer ownership */}
      <div className={styles.row}>
        <div className={styles.texts}>
          <div className={styles.rowTitle}>Transfer ownership</div>
          <p className={styles.desc}>
            Transfer this project to another organization where you have the ability
            to create projects.
          </p>
        </div>
        <div className={styles.action}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={clickTransfer}
            disabled={loadingTransfer}
            aria-busy={loadingTransfer || undefined}
          >
            {loadingTransfer ? "Transferring..." : "Transfer Project"}
          </button>
        </div>
      </div>

      <div className={styles.divider} role="separator" />

      {/* Row: Delete project */}
      <div className={styles.row}>
        <div className={styles.texts}>
          <div className={styles.rowTitle}>Delete this project</div>
          <p className={styles.desc}>
            Once you delete a project, there is no going back. Please be certain.
          </p>
        </div>
        <div className={styles.action}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={clickDelete}
            disabled={loadingDelete}
            aria-busy={loadingDelete || undefined}
          >
            {loadingDelete ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </div>
    </section>
  );
}

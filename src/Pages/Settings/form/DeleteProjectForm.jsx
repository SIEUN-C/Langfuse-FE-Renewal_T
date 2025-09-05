// src/Pages/Settings/form/DeleteProjectForm.jsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/Modal/Modal.jsx";
import styles from "../layout/DeleteProjectForm.module.css";

const DeleteProjectForm = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Project",
  message,
  currentProjectName,
  currentOrgName,
  currentOrgId,                 // 전달만 받아 둠 (표시/검증 용도 확장 가능)
  organizations = [],           // 조직 목록 (확장 포인트)
}) => {
  const [confirmText, setConfirmText] = useState("");

  // 모달이 열릴 때마다 확인 텍스트 초기화
  useEffect(() => {
    if (isOpen) setConfirmText("");
  }, [isOpen]);

  // 표시용 안전한 문자열
  const safeOrg = currentOrgName || "(unknown-org)";
  const safeProject = currentProjectName || "(unknown-project)";

  // Langfuse UX: "orgName/projectName" 정확히 입력해야 삭제 가능
  const expectedConfirmText = `${safeOrg}/${safeProject}`;

  // 필수 값이 없으면 삭제 비활성화
  const hasRequired = Boolean(currentOrgName && currentProjectName);
  const isDeleteDisabled =
    !hasRequired || confirmText.trim() !== expectedConfirmText;

  const handleConfirm = () => {
    if (!isDeleteDisabled) onConfirm?.();
  };

  if (!isOpen) return null;

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.formGroup}>
          {message && <p className={styles.description}>{message}</p>}
          <p className={styles.description}>
            To confirm, type "{expectedConfirmText}" in the input box
          </p>

          {!hasRequired && (
            <p className={styles.warning}>
              Organization / Project 정보가 부족합니다. 페이지를 새로고침하거나 다시 시도해 주세요.
            </p>
          )}

          <input
            id="delete-confirm-input"
            type="text"
            className={styles.input}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={expectedConfirmText}
            autoFocus
          />
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleConfirm}
            className={styles.deleteButton}
            disabled={isDeleteDisabled}
            aria-busy={isDeleteDisabled || undefined}
          >
            Delete project
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteProjectForm;

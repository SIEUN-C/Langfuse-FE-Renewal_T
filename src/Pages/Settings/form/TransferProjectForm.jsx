// src/Pages/Settings/form/TransferProjectForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import styles from "../layout/TransferProjectForm.module.css";

const TransferProjectForm = ({
  isOpen,
  onClose,
  onConfirm,
  currentProjectName,
  organizations = [],
  currentOrgName = "",
  currentOrgId = null,
}) => {
  const [selectedOrg, setSelectedOrg] = useState("");
  const [confirmText, setConfirmText] = useState("");

  // ✅ 이전 가능한 조직만 (현재 조직 제외)
  const transferableOrgs = useMemo(
    () => organizations.filter((o) => o.id !== currentOrgId),
    [organizations, currentOrgId]
  );

  useEffect(() => {
    if (!isOpen) return;

    // ESC 닫기
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    // 바디 스크롤 락
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedOrg("");
      setConfirmText("");
    }
  }, [isOpen]);

  // 조직 목록이 바뀌었을 때, 선택값이 더 이상 유효하지 않으면 리셋
  useEffect(() => {
    if (!transferableOrgs.some((o) => o.id === selectedOrg)) {
      setSelectedOrg("");
    }
  }, [transferableOrgs, selectedOrg]);

  const expectedConfirmText = `${currentOrgName}/${currentProjectName}`;
  const isSameOrgSelected = currentOrgId && selectedOrg === currentOrgId; // 가드(필터로 이미 제외되지만 안전망)
  const isTransferDisabled =
    !selectedOrg || isSameOrgSelected || confirmText !== expectedConfirmText;

  const handleConfirm = () => {
    if (!isTransferDisabled) onConfirm(selectedOrg);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose(); // 바깥 클릭 닫기
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Transfer Project</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.container}>
            {/* Warning Section */}
            <div className={styles.warningBox}>
              <AlertTriangle size={20} className={styles.warningIcon} />
              <div>
                <h4 className={styles.warningTitle}>Warning</h4>
                <p className={styles.warningText}>
                  Transferring the project will move it to a different organization:
                </p>
                <ul className={styles.warningList}>
                  <li>Members who are not part of the new organization will lose access.</li>
                  <li>
                    The project remains fully operational as API keys, settings, and data will
                    remain unchanged. All features (e.g. tracing, prompt management) will continue
                    to work without interruption.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Select Organization */}
          <div className={styles.formGroup}>
            <label htmlFor="org-select" className={styles.label}>
              Select New Organization
            </label>
            <p className={styles.description}>
              Transfer this project to another organization where you have the ability to create
              projects.
            </p>

            <select
              id="org-select"
              className={styles.select}
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              disabled={transferableOrgs.length === 0}
              aria-disabled={transferableOrgs.length === 0}
            >
              {/* placeholder: 선택 전 표시만, 드롭다운 목록에서는 보이지 않게 */}
              <option value="" disabled hidden>
                Select organization
              </option>

              {/* 현재 조직 제외된 실제 이전 가능 조직만 노출 */}
              {transferableOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            {transferableOrgs.length === 0 && (
              <p className={styles.helperWarn}>
                There is no other organization to transfer to.
              </p>
            )}

            {isSameOrgSelected && (
              <p className={styles.helperWarn}>
                You cannot transfer to the same organization.
              </p>
            )}
          </div>

          {/* Confirm */}
          <div className={styles.formGroup}>
            <label htmlFor="confirm-input" className={styles.label}>
              Confirm
            </label>
            <p className={styles.description}>
              To confirm, type "<strong>{expectedConfirmText}</strong>" in the input box
            </p>
            <input
              id="confirm-input"
              type="text"
              className={styles.input}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirmText}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button onClick={onClose} className={styles.cancelButton} type="button">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={styles.transferButton}
              disabled={isTransferDisabled}
              type="button"
            >
              Transfer project
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TransferProjectForm;

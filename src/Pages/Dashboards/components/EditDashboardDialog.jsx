import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../services/dashboardApi.js";
import styles from "./EditDashboardDialog.module.css";

/**
 * 대시보드 편집 다이얼로그 컴포넌트
 * @param {Object} props
 * @param {boolean} props.open - 다이얼로그 열림 상태
 * @param {Function} props.onOpenChange - 다이얼로그 상태 변경 핸들러
 * @param {string} props.projectId - 프로젝트 ID
 * @param {string} props.dashboardId - 대시보드 ID
 * @param {string} props.initialName - 초기 대시보드 이름
 * @param {string} props.initialDescription - 초기 대시보드 설명
 * @param {Function} props.onSuccess - 성공 시 콜백 함수
 */
export function EditDashboardDialog({
  open,
  onOpenChange,
  projectId,
  dashboardId,
  initialName = "",
  initialDescription = "",
  onSuccess,
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // props가 변경될 때 state 업데이트
  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setDescription(initialDescription || "");
      setError(null);
    }
  }, [open, initialName, initialDescription]);

  const handleSave = async () => {
    // 유효성 검사
    if (!name.trim()) {
      setError("Dashboard name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await dashboardAPI.updateDashboardMetadata(
        projectId,
        dashboardId,
        {
          name: name.trim(),
          description: description.trim(),
        }
      );

      if (result.success) {
        console.log("✅ Dashboard updated successfully");
        
        // 성공 콜백 호출 (부모 컴포넌트에서 데이터 새로고침)
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        // 다이얼로그 닫기
        onOpenChange(false);
      } else {
        setError(result.error || "Failed to update dashboard");
      }
    } catch (err) {
      console.error("Failed to update dashboard:", err);
      setError(err.message || "Failed to update dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(initialName || "");
    setDescription(initialDescription || "");
    setError(null);
    onOpenChange(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  // 다이얼로그가 닫혀있으면 렌더링하지 않음
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div 
        className={styles.dialog} 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyPress}
      >
        {/* 다이얼로그 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Dashboard</h2>
          <button 
            className={styles.closeButton}
            onClick={handleCancel}
            type="button"
          >
            ×
          </button>
        </div>

        {/* 다이얼로그 본문 */}
        <div className={styles.body}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="dashboard-name" className={styles.label}>
              Name *
            </label>
            <input
              id="dashboard-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dashboard name"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dashboard-description" className={styles.label}>
              Description
            </label>
            <textarea
              id="dashboard-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dashboard description"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 다이얼로그 푸터 */}
        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            type="button"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            type="button"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
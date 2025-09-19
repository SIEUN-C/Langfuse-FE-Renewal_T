import React from 'react';
import styles from './ColumnVisibilityModal.module.css';
import { X } from 'lucide-react';
import { useColumnVisibility } from 'hooks/useColumnVisibility';

const ColumnVisibilityModal = ({
  isOpen,
  onClose,
  columns,
  toggleColumnVisibility,
  setAllColumnsVisible,
  onRestoreDefaults
}) => {
  if (!isOpen) {
    return null;
  }

  // 필수(mandatory)가 아닌 컬럼들만 필터링하여 따로 관리합니다.
  const optionalColumns = columns.filter(col => !col.isMandatory);
  // 'Select All'의 체크 여부를 'optionalColumns' 기준으로만 판단합니다.
  const allOptionalColumnsVisible = optionalColumns.every(col => col.visible);
  const visibleColumnCount = columns.filter(c => c.visible).length;
  const allColumnsVisible = visibleColumnCount === columns.length;

  const handleSelectAllChange = (e) => {
    setAllColumnsVisible(e.target.checked);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Column Visibility</h3>
          <div className={styles.headerActions}>
            <button
              className={styles.actionButton}
              onClick={() => {
                onRestoreDefaults();
              }}>
              Restore Defaults
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.selectAllRow}>
          <label className={styles.columnItem}>
            <input
              type="checkbox"
              checked={allOptionalColumnsVisible}
              onChange={handleSelectAllChange}
            />
            <span className={styles.selectAllLabel}>
              Select All Columns
              <span className={styles.columnCount}>{visibleColumnCount}/{columns.length}</span>
            </span>
          </label>
        </div>

        <div className={styles.columnList}>
          {columns.map((col) => { // map 함수를 중괄호로 시작합니다.
            const isMandatory = col.isMandatory === true;

            return (
              <label key={col.key} className={styles.columnItem}>
                <input
                  type="checkbox"
                  checked={isMandatory || col.visible}
                  onChange={() => {
                    if (!isMandatory) {
                      toggleColumnVisibility(col.key);
                    }
                  }}
                  disabled={isMandatory}
                />
                <span>{typeof col.header === 'string' ? col.header : col.key}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ColumnVisibilityModal;
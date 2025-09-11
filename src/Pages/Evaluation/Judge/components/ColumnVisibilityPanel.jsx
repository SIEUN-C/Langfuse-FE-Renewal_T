import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import styles from './ColumnVisibilityPanel.module.css';

// 주석: 항상 표시되고 비활성화되어야 하는 컬럼들의 ID 목록입니다.
const MANDATORY_COLUMNS = ['status', 'trace', 'template'];

export const ColumnVisibilityPanel = ({
  isOpen,
  onClose,
  table, // react-table 인스턴스를 직접 받습니다.
}) => {
  if (!isOpen) {
    return null;
  }

  // 주석: 현재 화면에 보이는 컬럼의 수를 계산합니다.
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const totalColumnCount = table.getAllLeafColumns().length;

  // 주석: 'Deselect All' 버튼 클릭 시 실행될 함수입니다.
  // 필수 컬럼을 제외한 모든 컬럼을 숨깁니다.
  const handleDeselectAll = () => {
    table.getAllLeafColumns().forEach(column => {
      if (!MANDATORY_COLUMNS.includes(column.id)) {
        column.toggleVisibility(false);
      }
    });
  };

  return (
    <>
      {/* 주석: 패널이 열렸을 때 뒷 배경을 어둡게 처리하는 오버레이입니다. */}
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Column Visibility</h2>
          <div className={styles.headerActions}>
            {/* 'Restore Defaults' 버튼: 클릭 시 모든 컬럼을 다시 표시합니다. */}
            <button className={styles.iconButton} onClick={() => table.resetColumnVisibility()}>
              <RotateCcw size={16} /> Restore Defaults
            </button>
            <button className={styles.iconButton} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className={styles.body}>
          <button className={styles.deselectButton} onClick={handleDeselectAll}>
            Deselect All Columns ({visibleColumnCount}/{totalColumnCount})
          </button>
          <div className={styles.columnList}>
            {/* 주석: 테이블의 모든 컬럼을 순회하며 체크박스를 만듭니다. */}
            {table.getAllLeafColumns().map(column => {
              // 주석: 컬럼 ID가 필수 컬럼 목록에 포함되어 있는지 확인합니다.
              const isMandatory = MANDATORY_COLUMNS.includes(column.id);
              return (
                <label key={column.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    disabled={isMandatory} // 필수 컬럼은 비활성화합니다.
                  />
                  <span>{column.id}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
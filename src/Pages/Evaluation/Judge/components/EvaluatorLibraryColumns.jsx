import React from 'react';
import styles from './EvaluatorsTable.module.css';

// onUse 콜백을 주입받아 네비게이션/동작을 부모로 위임
export const getEvaluatorLibraryColumns = ({ onUse } = {}) => {

  return [
    {
      header: 'Name',
      accessor: (row) => row.name,
    },
    {
      header: 'Maintainer',
      accessor: (row) => row.partner ?? 'N/A',
    },
    {
      header: 'Last Edit',
      accessor: (row) => row.latestCreatedAt,
    },
    {
      header: 'Usage Count',
      accessor: (row) => row.usageCount,
    },
    {
      header: 'Latest Version',
      accessor: (row) => row.version,
    },
    {
      header: 'Id',
      accessor: (row) => row.id,
    },
    {
      header: 'Actions', // Actions 컬럼 헤더는 비워둠
      accessor: (row) => (
        <div className={styles.rowActions}>
          <button
            className={styles.viewButton}
            onClick={(e) => {
              e.stopPropagation();      // 행 클릭과 분리
              onUse?.(row);             // ← 부모에게 위임 (라우팅 등)
            }}
          >
            Use Evaluator
          </button>
        </div>
      ),
    },
  ];
};
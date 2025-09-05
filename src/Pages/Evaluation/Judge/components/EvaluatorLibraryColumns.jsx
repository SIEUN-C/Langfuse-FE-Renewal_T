import React from 'react';
import styles from './EvaluatorsTable.module.css'; // 메인 테이블 스타일 재활용

// 컬럼 정의를 반환하는 함수
export const getEvaluatorLibraryColumns = () => {
  const handleSetUpClick = (e, row) => {
    e.stopPropagation();
    console.log(`Setting up: ${row.name}`);
    alert(`"${row.name}" setup process initiated.`);
  };

  return [
    {
      header: 'Name',
      accessor: (row) => row.name,
    },
    {
      header: 'Maintainer',
      accessor: (row) => row.maintainer,
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
          <button onClick={(e) => handleSetUpClick(e, row)} className={styles.viewButton}>
            Use Evaluator
          </button>
        </div>
      ),
    },
  ];
};
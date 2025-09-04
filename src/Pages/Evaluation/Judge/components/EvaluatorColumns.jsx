import React from 'react';
import { Link } from 'react-router-dom';
import styles from './EvaluatorsTable.module.css'; // 기존 CSS 재활용

// 상태 뱃지 컴포넌트
const StatusBadge = ({ status }) => {
  const getStatusClassName = (s) => {
    if (s === 'RUNNING') return styles.statusRunning;
    if (s === 'COMPLETED') return styles.statusCompleted;
    return styles.statusDefault;
  };
  return (
    <span className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
      {status}
    </span>
  );
};

// 컬럼 정의를 반환하는 함수
export const getEvaluatorColumns = (projectId) => {
  const handleActionClick = (e, action, row) => {
    e.stopPropagation(); // 행 클릭 이벤트 전파 방지
    console.log(`${action} button clicked for evaluator ${row.id}`);
    // TODO: 각 액션에 맞는 로직 구현 (View 로그, 클론, 보관 등)
  };

  return [
    {
      header: 'Generated Score Name',
      accessor: (row) => row.generatedscorename,
    },
    {
      header: 'Status',
      accessor: (row) => row.status,
    },
    {
      header: 'Result',
      accessor: (row) => row.result,
    },
    {
      header: 'Logs',
      accessor: (row) => (
        <div className={styles.rowActions}>
          <Link to={`${row.id}`} className={styles.viewButton} onClick={(e) => e.stopPropagation()}>
            View
          </Link>
        </div>
      ),
    },
    {
      header: 'Referenced Evaluator',
      accessor: (row) => row.referecedevaluator,
    },
    {
      header: 'Created At',
      accessor: (row) => row.createdat,
    },
    {
      header: 'Updated At',
      accessor: (row) => row.updatedat,
    },
    {
      header: 'Target',
      accessor: (row) => row.target,
    },
    {
      header: 'Filter',
      accessor: (row) => row.filter,
    },
    {
      header: 'Id',
      accessor: (row) => row.id,
    },
    {
      header: 'Actions', // Actions 컬럼 헤더는 비워둠
      accessor: (row) => (
        <div className={styles.rowActions}>
          {/* TODO: 드롭다운 메뉴 구현 */}
          <button onClick={(e) => handleActionClick(e, 'More', row)} className={styles.moreButton}>
            ...
          </button>
        </div>
      ),
    },
  ];
};
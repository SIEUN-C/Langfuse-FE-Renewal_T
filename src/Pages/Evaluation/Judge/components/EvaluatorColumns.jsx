// src/Pages/Evaluation/Judge/components/EvaluatorColumns.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './EvaluatorsTable.module.css';

// 상태 뱃지 컴포넌트 - 다른 곳에서 import할 수 있도록 export 추가
export const StatusBadge = ({ status }) => {
  const getStatusClassName = (s) => {
    if (s === 'RUNNING') return styles.statusRunning;
    if (s === 'COMPLETED') return styles.statusCompleted;
    if (s === 'ACTIVE') return styles.statusActive;
    return styles.statusDefault;
  };
  return (
    <span className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
      {status}
    </span>
  );
};



// --- 수정: FilterDisplay가 datasetMap을 사용하도록 변경 ---
const FilterDisplay = ({ filter, datasetMap }) => {
  if (!filter || !Array.isArray(filter) || filter.length === 0) {
    return null;
  }
  // --- 추가: datasetMap이 아직 로딩 중일 수 있으므로 안전장치 추가 ---
  if (!datasetMap || datasetMap.size === 0) {
    return null;
  }

  return (
    <div>
      {filter.map((item) => {
        if (item.column === 'Dataset' && Array.isArray(item.value)) {
          return item.value.map(datasetId => {
            const datasetName = datasetMap.get(datasetId) || datasetId;
            return (
              <span key={datasetId} className={styles.filterTag}>
                Dataset any of [{datasetName}]
              </span>
            );
          });
        }
        return null;
      })}
    </div>
  );
};
// ----------------------------------------------------




// 날짜 포맷팅 함수
const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString();
};

// --- ✨ 바로 여기가 핵심입니다! 함수가 datasetMap을 받도록 수정해주세요. ---
export const getEvaluatorColumns = (projectId, datasetMap) => {
// --------------------------------------------------------------------
  const handleActionClick = (e, action, row) => {
    e.stopPropagation();
    console.log(`${action} button clicked for evaluator ${row.id}`);
    // TODO: 각 액션에 맞는 로직 구현 (View 로그, 클론, 보관 등)
  };

  return [
    {
      header: 'Generated Score Name',
      accessor: (row) => row.scoreName,
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.finalStatus} />,
    },
    {
      header: 'Result',
      accessor: () => '-',
    },
    {
      header: 'Logs',
      accessor: (row) => (
        <div className={styles.rowActions}>
          <Link to={`/project/${projectId}/evaluations/${row.id}`} className={styles.viewButton} onClick={(e) => e.stopPropagation()}>
            View
          </Link>
        </div>
      ),
    },
    {
      header: 'Referenced Evaluator',
      accessor: (row) => row.evalTemplate?.name ?? '-',
    },
    {
      header: 'Created At',
      accessor: (row) => formatDateTime(row.createdAt),
    },

    // --- 수정: 'Updated At' 컬럼 추가 ---
    // 로컬 화면과 동일하게 Created At 옆에 Updated At 컬럼을 추가합니다.
    // API 응답에 'updatedAt' 필드가 포함되어 있어야 합니다.
    {
      header: 'Updated At',
      // API 응답에 updatedAt이 없을 수도 있으므로 row.updatedAt을 확인합니다.
      accessor: (row) => formatDateTime(row.updatedAt),
    },
    // --------------------------------


    {
      header: 'Target',
      accessor: (row) => row.targetObject ?? '-',
    },
    // --- 수정: Filter 컬럼의 표시 방식을 변경 ---
    // JSON 문자열 대신 위에서 만든 FilterDisplay 컴포넌트를 사용합니다.
    // --- ✨ 수정: Filter 컬럼의 accessor를 FilterDisplay 컴포넌트로 교체 ---
    {
      header: 'Filter',
      // 이제 이 accessor는 위에서 받은 datasetMap을 정상적으로 사용할 수 있습니다.
      accessor: (row) => <FilterDisplay filter={row.filter} datasetMap={datasetMap} />,
    },
    // ---------------------------------------------------------------
    // -----------------------------------------
    {
      header: 'Id',
      accessor: (row) => row.id,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className={styles.rowActions}>
          <button onClick={(e) => handleActionClick(e, 'More', row)} className={styles.moreButton}>
            ...
          </button>
        </div>
      ),
    },
  ];
};

// --- ✨ 해결 방법 ---
// 이 파일이 React 컴포넌트 모듈임을 Vite에게 알려주는 역할만 합니다.
const EvaluatorColumns = () => null;
export default EvaluatorColumns;



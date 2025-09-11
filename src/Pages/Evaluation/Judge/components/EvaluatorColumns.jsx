// src/Pages/Evaluation/Judge/components/EvaluatorColumns.jsx

// ========================[수정 시작]========================
// 주석: 드롭다운 메뉴의 상태 관리를 위해 useState, useRef, useEffect를 import 합니다.
//       아이콘도 추가로 import 합니다.
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './EvaluatorsTable.module.css';
import { Pencil, Trash2 } from 'lucide-react'; // 아이콘 추가
// ========================[수정 끝]========================


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

// ========================[핵심 수정 1: ActionMenu 컴포넌트 분리]========================
// 주석: 오류의 원인이었던 useState, useRef, useEffect를 사용하는 로직을
//       이 ActionMenu 라는 별도의 컴포넌트로 완전히 옮겼습니다.
//       이제 Hook이 올바른 위치에서 사용되므로 오류가 발생하지 않습니다.
const ActionMenu = ({ row, onDeleteClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.rowActions} ref={dropdownRef}>
      <button onClick={handleToggle} className={styles.moreButton}>
        ...
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button className={styles.dropdownItem} onClick={(e) => e.stopPropagation()}>
            <Pencil size={14} /> Edit
          </button>
          <button 
            className={`${styles.dropdownItem} ${styles.deleteItem}`}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(row);
              setIsOpen(false);
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};
// ========================[핵심 수정 1 끝]========================


// --- 컬럼 정의 함수 ---
// 주석: onDeleteClick 핸들러를 props로 받습니다.
export const getEvaluatorColumns = (projectId, datasetMap, onDeleteClick) => {
  // ========================[핵심 수정 2: 오류 코드 삭제]========================
  // 주석: 이전에 오류를 일으켰던 useState, useRef, useEffect 관련 코드를
  //       여기서 모두 삭제했습니다. 그래서 코드가 짧아진 것입니다.
  // ========================[핵심 수정 2 끝]========================


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
      accessor: (row) => {
        // 주석: row 데이터에 jobExecutionsByState 배열이 있는지 확인합니다.
        if (!row.jobExecutionsByState || row.jobExecutionsByState.length === 0) {
          return '-';
        }

        // 주석: 배열의 각 항목에 있는 _count 값을 모두 더하여 총 결과 개수를 계산합니다.
        const totalCount = row.jobExecutionsByState.reduce(
          (sum, state) => sum + state._count, 
          0
        );

        // 주석: 총 개수가 0이면 '-'를, 0보다 크면 "N results" 형식으로 표시합니다.
        return totalCount > 0 ? `✅ ${totalCount}` : '-';
      },
    },
    // --------------------------------------------------------
    {
      header: 'Logs',
      accessor: (row) => (
        <div className={styles.rowActions}>
         {/* --- ✨ 수정: App.jsx의 기존 경로에 맞게 링크 주소를 수정했습니다 --- */}
          <Link 
            to={`/llm-as-a-judge/${row.id}`} 
            className={styles.viewButton} 
            onClick={(e) => e.stopPropagation()}
          >
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
     // ========================[핵심 수정 3: ActionMenu 컴포넌트 사용]========================
      // 주석: accessor에서 위에서 만든 ActionMenu 컴포넌트를 호출하여 렌더링합니다.
      accessor: (row) => <ActionMenu row={row} onDeleteClick={onDeleteClick} />,
      // ========================[핵심 수정 3 끝]========================
    },
  ];
};

// --- ✨ 해결 방법 ---
// 이 파일이 React 컴포넌트 모듈임을 Vite에게 알려주는 역할만 합니다.
const EvaluatorColumns = () => null;
export default EvaluatorColumns;

//추가 : Use Evaluator 버튼 활성화 << 시작
export const getEvaluatorLibraryColumns = (onUseEvaluator) => [
  { header: 'Name', accessor: row => row.name },
  { header: 'Maintainer', accessor: row => row.maintainer },
  { header: 'Last Edit', accessor: row => row.latestCreatedAt },
  { header: 'Usage Count', accessor: row => row.usageCount },
  { header: 'Latest Version', accessor: row => row.version },
  { header: 'Id', accessor: row => row.latestId }, //eunju 수정
  {
    header: 'Actions',
    accessor: row => (
      <div className={styles.rowActions}>
        <button
          onClick={(e) => { e.stopPropagation(); onUseEvaluator?.(row.latestId); }} //eunju 수정
          className={styles.viewButton}
        >
          Use Evaluator
        </button>
      </div>
    ),
  },
];
//추가 : Use Evaluator 버튼 활성화 << 끝

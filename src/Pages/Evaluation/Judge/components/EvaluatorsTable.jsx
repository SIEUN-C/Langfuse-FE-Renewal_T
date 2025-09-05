import React from 'react';
import { DataTable } from '../../../../components/DataTable/DataTable'; // DataTable 컴포넌트 경로
import { getEvaluatorColumns } from './EvaluatorColumns'; // 방금 만든 컬럼 파일 import
import styles from './EvaluatorsTable.module.css';

// --- 수정: JudgePage로부터 datasetMap을 props로 받습니다. ---
const EvaluatorsTable = ({ data, onRowClick, isLoading, datasetMap }) => {
  
  // --- 수정: getEvaluatorColumns 함수에 datasetMap을 전달합니다. ---
  const columns = getEvaluatorColumns(null, datasetMap);

  const renderEmptyState = () => (
    <div className={styles.emptyState}>No evaluators found.</div>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      onRowClick={onRowClick}
      renderEmptyState={renderEmptyState}
      isLoading={isLoading}
      showCheckbox={false} // LLM-as-a-judge 페이지에서는 체크박스 미사용
      showFavorite={false} // 즐겨찾기 미사용
    />
  );
};

export default EvaluatorsTable;
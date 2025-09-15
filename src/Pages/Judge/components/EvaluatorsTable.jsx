// import React from 'react';
import React, { useMemo } from 'react'; //eunju 수정
import { DataTable } from '../../../components/DataTable/DataTable'; // DataTable 컴포넌트 경로
import { getEvaluatorColumns } from './EvaluatorColumns'; // 방금 만든 컬럼 파일 import
import styles from './EvaluatorsTable.module.css';
// 주석: onDeleteClick을 props로 받도록 수정되었습니다.
export default function EvaluatorsTable({ data, onRowClick, isLoading, datasetMap, projectId, onDeleteClick }) {
  
  // 주석: useMemo의 의존성 배열에 onDeleteClick을 추가합니다.
  const columns = useMemo(() => getEvaluatorColumns(projectId, datasetMap, onDeleteClick), [projectId, datasetMap, onDeleteClick]);



// //eunju 수정추가
// export default function EvaluatorsTable({ data, onRowClick, isLoading, datasetMap, projectId }) {
//   const columns = useMemo(() => getEvaluatorColumns(projectId, datasetMap), [projectId, datasetMap]);


  // --- 수정: JudgePage로부터 datasetMap을 props로 받습니다. ---
  // const EvaluatorsTable = ({ data, onRowClick, isLoading, datasetMap }) => {
  // export default function EvaluatorsTable({ data, onRowClick, isLoading, datasetMap }) {
  //   const { projectId } = useProjectId();
  //   // --- 수정: getEvaluatorColumns 함수에 datasetMap을 전달합니다. ---
  //   // const columns = getEvaluatorColumns(null, datasetMap);
  //   const columns = useMemo(() => getEvaluatorColumns(projectId, datasetMap), [projectId, datasetMap]);


  // const renderEmptyState = () => (
  //   <div className={styles.emptyState}>No evaluators found.</div>
  // );


  return (
    <DataTable
      columns={columns}
      data={data}
      onRowClick={onRowClick}
      keyField="id"
      isLoading={isLoading}
      renderEmptyState={() => <div className={styles.emptyState}>No evaluators found.</div>}
      showCheckbox={false}
      showFavorite={false}
      pagination={{
      enabled: true,
      pageSize: 50,
      pageSizeOptions: [10, 20, 30, 50],
      position: "fixed-bottom"
      }}
    />
  );
}


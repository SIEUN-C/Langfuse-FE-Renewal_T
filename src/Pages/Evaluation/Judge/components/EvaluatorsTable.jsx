// import React from 'react';
import React, { useMemo } from 'react'; //eunju 수정
import { DataTable } from '../../../../components/DataTable/DataTable'; // DataTable 컴포넌트 경로
import { getEvaluatorColumns } from './EvaluatorColumns'; // 방금 만든 컬럼 파일 import
import styles from './EvaluatorsTable.module.css';


//eunju 수정추가
export default function EvaluatorsTable({ data, onRowClick, isLoading, datasetMap, projectId }) {
  const columns = useMemo(() => getEvaluatorColumns(projectId, datasetMap), [projectId, datasetMap]);


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
//   return (
//     <DataTable
//       columns={columns}
//       data={data}
//       keyField="id"
//       onRowClick={onRowClick}
//       renderEmptyState={renderEmptyState}
//       isLoading={isLoading}
//       showCheckbox={false} // LLM-as-a-judge 페이지에서는 체크박스 미사용
//       showFavorite={false} // 즐겨찾기 미사용
//     />
//   );
// };


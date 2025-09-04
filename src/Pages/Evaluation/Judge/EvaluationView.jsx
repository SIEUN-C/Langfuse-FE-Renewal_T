import React from 'react';
import { DataTable } from '../../../components/DataTable/DataTable';
import { getEvaluationViewColumns } from './components/EvaluationViewColumns'; 
// import styles from './EvaluatorLibrary.module.css'; // 이 라인을 삭제합니다.

// 라이브러리 목업 데이터
const mockLibraryEvaluators = [
  // ...(데이터는 이전과 동일)...
  { 
    id: 'view-1', 
    status: 'completed', 
    scorename: 'Correctness' 
  },
  { 
    id: 'view-2', 
    status: 'completed_2', 
    scorename: 'Helpfulness' 
  },
];

const EvaluationView = () => {
  const columns = getEvaluationViewColumns();

  return (
    // className을 지정할 필요가 없으므로 div도 삭제 가능합니다.
    <DataTable
      columns={columns}
      data={mockLibraryEvaluators}
      keyField="id"
      showCheckbox={false}
      showFavorite={false}
    />
  );
};

export default EvaluationView;
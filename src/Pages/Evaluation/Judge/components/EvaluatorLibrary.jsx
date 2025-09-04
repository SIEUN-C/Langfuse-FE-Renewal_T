import React from 'react';
import { DataTable } from '../../../../components/DataTable/DataTable';
import { getEvaluatorLibraryColumns } from './EvaluatorLibraryColumns'; 
// import styles from './EvaluatorLibrary.module.css'; // 이 라인을 삭제합니다.

// 라이브러리 목업 데이터
const mockLibraryEvaluators = [
  // ...(데이터는 이전과 동일)...
  { 
    id: 'lib-1', 
    name: 'Standard Toxicity Check', 
    description: 'Uses the Perspective API to check for toxic comments.' 
  },
  { 
    id: 'lib-2', 
    name: 'PII Detection', 
    description: 'Scans text for personally identifiable information.' 
  },
  { 
    id: 'lib-3', 
    name: 'Fact-Checking Evaluator', 
    description: 'Cross-references statements with a knowledge base.' 
  },
  { 
    id: 'lib-4', 
    name: 'Readability Score', 
    description: 'Calculates Flesch-Kincaid readability score.' 
  },
   { 
    id: 'lib-5', 
    name: 'Custom Evaluator', 
    description: 'Bring your own evaluator logic.' 
  },
];

const EvaluatorLibrary = () => {
  const columns = getEvaluatorLibraryColumns();

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

export default EvaluatorLibrary;
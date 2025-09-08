/*
  수정: 파일 전체를 아래 코드로 교체합니다.
  - 주석: DataTable 컴포넌트가 요구하는 renderEmptyState prop을 명시적으로
    전달하여 'is not a function' 오류를 최종적으로 해결했습니다.
*/
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../../components/DataTable/DataTable';
import { getEvaluationViewColumns } from './components/EvaluationViewColumns';
import useProjectId from '../../../hooks/useProjectId';
import { getEvaluationJobs } from './services/judgeApi';
import styles from './EvaluationView.module.css';

const EvaluationView = () => {
  const { evaluationId } = useParams(); 
  const { projectId } = useProjectId();
  
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const columns = useMemo(() => getEvaluationViewColumns(projectId), [projectId]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!projectId || !evaluationId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await getEvaluationJobs({ projectId, evalConfigId: evaluationId });
        setJobs(response.data || []); 
      } catch (error) {
        console.error("Failed to fetch evaluation jobs:", error);
        setJobs([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [projectId, evaluationId]);
  
  return (
    <div className={styles.container}>
       <h1 className={styles.title}>Correctness: {evaluationId}</h1>
       
       <DataTable
         columns={columns}
         data={jobs}
         keyField="jobOutputScoreId"
         showCheckbox={false}
         showFavorite={false}
         isLoading={isLoading}
         // --- ✨ 수정: DataTable이 요구하는 prop을 추가하여 오류를 해결합니다 ---
         renderEmptyState={() => "No results."}
         // --------------------------------------------------------------------
       />
    </div>
  );
};

export default EvaluationView;
// src/Pages/Evaluation/Judge/EvaluationView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
// --- ✨ 추가: 새로운 아이콘들을 import 합니다 ---
import { ChevronUp, ChevronDown, ChevronRight, Columns, LayoutGrid } from 'lucide-react';
import { DataTable } from '../../../components/DataTable/DataTable';
import { getEvaluationViewColumns } from './components/EvaluationViewColumns';
import useProjectId from '../../../hooks/useProjectId';
// --- ✨ 수정: API 함수를 하나 더 import 합니다 ---
import { getEvaluationJobs, getEvaluatorConfigById } from './services/judgeApi';
import styles from './EvaluationView.module.css';

const EvaluationView = () => {
  const { evaluationId } = useParams(); 
  const { projectId } = useProjectId();
  
  const [jobs, setJobs] = useState([]);
   // --- ✨ 추가: Evaluator 설정 정보를 저장할 state ---
  const [evaluatorConfig, setEvaluatorConfig] = useState(null);
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
        // 주석: Promise.all을 사용해 두 개의 API를 동시에 호출하여 성능을 최적화합니다.
        const [jobsResponse, configResponse] = await Promise.all([
          getEvaluationJobs({ projectId, evalConfigId: evaluationId }),
          getEvaluatorConfigById({ projectId, id: evaluationId })
        ]);
        
        setJobs(jobsResponse.data || []); 
        setEvaluatorConfig(configResponse); // 주석: 가져온 Evaluator 설정 정보를 state에 저장합니다.

      } catch (error) {
        console.error("Failed to fetch evaluation data:", error);
        setJobs([]); 
        setEvaluatorConfig(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [projectId, evaluationId]);
  
  return (
    <div className={styles.container}>
       {/* --- ✨ 수정: 기존 h1 태그를 새로운 헤더 UI 구조로 변경합니다 --- */}
       <div className={styles.headerContainer}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <span className={styles.evaluatorBadge}>🪄 Evaluator</span>
            <h1 className={styles.headerTitle}>
              {/* 주석: API로 가져온 Evaluator 이름(scoreName)을 표시하고, 없다면 ID를 보여줍니다. */}
              {evaluatorConfig?.scoreName ?? evaluationId}: {evaluationId}
            </h1>
          </div>
          {/* --- ✨ 수정: headerRight 부분에 UI 요소들을 추가합니다 --- */}
          <div className={styles.headerRight}>
            <span className={styles.resultCount}>✅ {jobs.length} results</span>
             {/* ========================[수정 시작]======================== */}
            {/*
             * 수정 내용:
             * 기존에는 'ACTIVE' 상태일 때만 뱃지를 표시했습니다.
             * 이제 evaluatorConfig.status 값이 존재할 경우 항상 뱃지를 표시하도록 변경합니다.
             * status 값에 따라 className을 동적으로 부여하여 'ACTIVE'와 'INACTIVE' 상태의 UI를 다르게 보여줍니다.
             * 텍스트도 status 값을 소문자로 변환하여 동적으로 표시합니다.
             */}
            {evaluatorConfig?.status && (
              <span
                className={
                  evaluatorConfig.status === "ACTIVE"
                    ? styles.activeStatusBadge
                    : styles.inactiveStatusBadge
                }
              >
                <span className={styles.statusDot}></span>
                {evaluatorConfig.status.toLowerCase()}
              </span>
            )}
            {/* ========================[수정 끝]======================== */}
            <div className={styles.navButtonGroup}>
              <button className={styles.navButton}>
                <ChevronUp size={16} /> K
              </button>
              <button className={styles.navButton}>
                <ChevronDown size={16} /> J
              </button>
            </div>
          </div>
          {/* ----------------------------------------------------------- */}
        </div>
        {/* --- ✨ 수정: 두 번째 headerRow 부분에 UI 요소들을 추가합니다 --- */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <button className={styles.filterButton}>
              Filters <ChevronDown size={16} />
            </button>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.columnButton}>
              <Columns size={16} />
              Columns {columns.length}/{columns.length}
            </button>
            <button className={styles.iconButton}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
        {/* ------------------------------------------------------------ */}
       </div>
       
       <DataTable
         columns={columns}
         data={jobs}
         keyField="jobOutputScoreId"
         showCheckbox={false}
         showFavorite={false}
         isLoading={isLoading}
         renderEmptyState={() => "No results."}
         pagination={{
        enabled: true,
        pageSize: 50,
        pageSizeOptions: [10, 20, 30, 50],
        position: "fixed-bottom"
      }}
       />
    </div>
  );
};

export default EvaluationView;
import React, { useState, useEffect } from "react";
import styles from "./JudgePage.module.css";
import EvaluatorsTable from "./components/EvaluatorsTable";
import EvaluatorLibrary from "./components/EvaluatorLibrary";
import EvaluationDetail from "./EvaluationDetail";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProjectId from "hooks/useProjectId";
import { Pencil } from 'lucide-react';
// --- 수정: 2개의 API 함수를 import 합니다. ---
import { getAllEvaluatorConfigs, getAllDatasetMeta } from "./services/judgeApi";
import { getDefaultModel } from './services/libraryApi';
// -------------------------------------------------------------


const JudgePage = () => {
  const [activeTab, setActiveTab] = useState("running");
  const [evaluators, setEvaluators] = useState([]);
  // --- 추가: 데이터셋 ID와 이름을 매핑할 상태 추가 ---
  const [datasetMap, setDatasetMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
  const peekId = searchParams.get('peek')
  const [defaultModel, setDefaultModel] = useState(null);

  useEffect(() => {
    // --- 수정: 두 API를 동시에 호출하도록 로직 변경 ---
    const fetchData = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        // 두 API를 동시에 호출하여 성능을 높입니다.
        const [evaluatorsResponse, datasetsResponse, modelResponse] = await Promise.all([
          getAllEvaluatorConfigs({ projectId }),
          getAllDatasetMeta({ projectId }),
          getDefaultModel(projectId),
        ]);

        // Evaluator 목록을 상태에 저장합니다.
        const configs = evaluatorsResponse.configs ?? [];
        setEvaluators(configs);

        // 데이터셋 목록을 Map 형태로 변환하여 상태에 저장합니다. (ID로 이름을 쉽게 찾기 위함)
        const datasets = datasetsResponse ?? [];
        const newDatasetMap = new Map();
        datasets.forEach(dataset => newDatasetMap.set(dataset.id, dataset.name));
        setDatasetMap(newDatasetMap);

        setDefaultModel(modelResponse);

      } catch (error) {
        console.error("데이터를 가져오는 중 에러 발생:", error);
        setEvaluators([]);
        setDatasetMap(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "running") {
      fetchData();
    }
    // ---------------------------------------------
  }, [activeTab, projectId]);



  // --- ✨ 확인 요청: 최종 데이터를 확인하기 위해 이 console.log를 추가해주세요 ---
  console.log("테이블에 전달되는 최종 데이터 (evaluators):", evaluators);
  // -------------------------------------------------------------------







  // detail 이동
  // const handleRowClick = (row) => {
  //   setSearchParams({ peek: row.id });
  // };

  const handleRowClick = (row) => {
    const next = new URLSearchParams(searchParams);
    next.set('peek', row.id);   // ← 반드시 config id
    setSearchParams(next, { replace: true });
  };

  // detail close
  const handleClosePanel = () => {
    searchParams.delete('peek');
    setSearchParams(searchParams);
  }

  // set up evaluator로 이동
  const handleSetupEvaluator = () => {
    navigate(`setup`);
  };

  // default evaluation model로 이동
  const handleOpenDefaultModel = () => {
    navigate(`default-model`)
  };

  const handleCustomEvaluator = () => {
    navigate(`custom`)
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>LLM-as-a-judge</h1>

          <div className={styles.actions}>
            {defaultModel ? (
              <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
                {defaultModel.provider} / {defaultModel.model} <Pencil size={16} />
              </button>
            ) : (
              <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
                No default model set <Pencil size={16} />
              </button>
            )}

            <button onClick={handleCustomEvaluator} className={styles.setupButton}>
              + Custom Evaluator
            </button>
            <button onClick={handleSetupEvaluator} className={styles.setupButton}>
              + Set up evaluator
            </button>
          </div>
        </header>

        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "running" ? styles.active : ""}`}
            onClick={() => setActiveTab("running")}
          >
            Running Evaluators
          </button>
          <button
            className={`${styles.tab} ${activeTab === "library" ? styles.active : ""}`}
            onClick={() => setActiveTab("library")}
          >
            Evaluator Library
          </button>
        </nav>

        <main className={styles.content}>
          {activeTab === "running" ? (
            // --- ✨ 바로 이 부분입니다! 기존 EvaluatorsTable에 datasetMap을 추가해주세요 ---
            <EvaluatorsTable
              data={evaluators}
              onRowClick={handleRowClick}
              isLoading={isLoading}
              datasetMap={datasetMap}
              projectId={projectId} //eunju projectId 추가 
            />
          ) : (
            <EvaluatorLibrary />
          )}
        </main>
      </div>

      {peekId && (
        <div className={styles.peekPanel}>
          <EvaluationDetail onClose={handleClosePanel} />
        </div>
      )}
    </div>
  );
};

export default JudgePage;
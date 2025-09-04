import React, { useState, useEffect } from "react";
import styles from "./JudgePage.module.css";
import EvaluatorsTable from "./components/EvaluatorsTable";
import EvaluatorLibrary from "./components/EvaluatorLibrary";
import EvaluationDetail from "./EvaluationDetail";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProjectId from "hooks/useProjectId";

// 임시 목업 데이터 (샘플 데이터 추가)
const mockRunningEvaluators = [
  {
    id: "eval-1",
    generatedscorename: "Sentiment Analysis Eval",
    createdAt: "2024-05-20T11:30:00Z",
    status: "COMPLETED",
  },
  {
    id: "eval-2",
    generatedscorename: "Toxicity Detection",
    createdAt: "2024-05-21T15:00:00Z",
    status: "RUNNING",
  },
  {
    id: "eval-3",
    generatedscorename: "Fact-Checking Test",
    createdAt: "2024-05-19T09:00:00Z",
    status: "COMPLETED",
  },
];
const mockArchivedEvaluators = [];

const JudgePage = () => {
  const [activeTab, setActiveTab] = useState("running");
  const [evaluators, setEvaluators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
  const peekId = searchParams.get('peek')

  useEffect(() => {
    setIsLoading(true);
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    const dataToLoad = activeTab === "running" ? mockRunningEvaluators : mockArchivedEvaluators;

    setTimeout(() => {
      setEvaluators(dataToLoad);
      setIsLoading(false);
    }, 500);
  }, [activeTab, projectId]);

  // detail 이동
  const handleRowClick = (row) => {
    setSearchParams({ peek: row.id });
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

  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>LLM-as-a-judge</h1>
          <div className={styles.actions}>
            <button onClick={handleSetupEvaluator} className={styles.setupButton}>
              + Set up evaluator
            </button>
            <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
              ✏️
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
            <EvaluatorsTable data={evaluators} onRowClick={handleRowClick} isLoading={isLoading} />
          ) : (
            <EvaluatorLibrary />
          )}
        </main>
      </div>

      {peekId && (
        <div className={styles.peekPanel}>
          <EvaluationDetail onClose={handleClosePanel}/>
        </div>
      )}
    </div>
  );
};

export default JudgePage;
import React, { useState, useEffect } from "react";
import styles from "./JudgePage.module.css";
import EvaluatorsTable from "./components/EvaluatorsTable";
import EvaluatorLibrary from "./components/EvaluatorLibrary";
import { useNavigate } from "react-router-dom";
import useProjectId from "hooks/useProjectId";

// 임시 목업 데이터 (샘플 데이터 추가)
const mockRunningEvaluators = [
  {
    id: "eval-1",
    name: "Sentiment Analysis Eval",
    createdAt: "2024-05-20T11:30:00Z",
    status: "COMPLETED",
    model: "gpt-3.5-turbo",
    dataset: "Customer Feedback Q3",
  },
  {
    id: "eval-2",
    name: "Toxicity Detection",
    createdAt: "2024-05-21T15:00:00Z",
    status: "RUNNING",
    model: "gpt-4",
    dataset: "Social Media Comments",
  },
  {
    id: "eval-3",
    name: "Fact-Checking Test",
    createdAt: "2024-05-19T09:00:00Z",
    status: "COMPLETED",
    model: "claude-2",
    dataset: "News Articles Corpus",
  },
];
const mockArchivedEvaluators = [];

const JudgePage = () => {
  const [activeTab, setActiveTab] = useState("running");
  const [evaluators, setEvaluators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useProjectId();

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

  const handleRowClick = (row) => {
    navigate(`/project/${projectId}/evaluations/${row.id}`);
  };

  const handleSetupEvaluator = () => {
    navigate(`/project/${projectId}/evaluations/setup`);
  };

  const handleOpenDefaultModel = () => console.log("Default Model 설정 클릭");

  return (
    <div className={styles.pageContainer}>
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
          className={`${styles.tab} ${activeTab === "archived" ? styles.active : ""}`}
          onClick={() => setActiveTab("archived")}
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
  );
};

export default JudgePage;
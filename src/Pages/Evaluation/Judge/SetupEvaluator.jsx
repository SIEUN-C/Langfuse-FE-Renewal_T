import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupEvaluator.module.css";

// Langfuse managed evaluators 목업 데이터 (title만 사용)
const managedEvaluators = [
  { id: "toxicity", title: "Toxicity" },
  { id: "helpfulness", title: "Helpfulness" },
  { id: "relevance", title: "Relevance" },
  { id: "coherence", title: "Coherence" },
  { id: "harmfulness", title: "Harmfulness (Jailbreak)" },
  { id: "pii", title: "PII leakage" },
  { id: "json", title: "JSON validation" },
  { id: "sql", title: "SQL syntax" },
  { id: "sentiment", title: "Sentiment" },
  { id: "custom", title: "Custom" },
];

const SetupEvaluatorPage = () => {
  const navigate = useNavigate();
  const [selectedEvaluator, setSelectedEvaluator] = useState(null);

  // 목록 클릭 -> 같은 걸 다시 누르면 선택 해제, 아니면 해당 목록 선택
  const handleSelectEvaluator = (evaluatorId) => {
    setSelectedEvaluator((prev) => (prev === evaluatorId ? null : evaluatorId));
  };

  // 목록 클릭시(setSelectedEvaluator에 값이 있을 때) 실행
  const handleUseEvaluaotr = () => {
    if (!selectedEvaluator) return;
    console.log("Continuing with evaluator:", selectedEvaluator);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}></h1>
        </header>
        <main className={styles.listContainer}>
          {managedEvaluators.map((evaluator) => (
            <div
              key={evaluator.id}
              className={`${styles.listItem} ${selectedEvaluator === evaluator.id ? styles.selected : ""}`}
              onClick={() => handleSelectEvaluator(evaluator.id)}
            >
              <h3 className={styles.listTitle}>{evaluator.title}</h3>
            </div>
          ))}
        </main>
      </div>
      <footer className={styles.footer}>
        <button className={styles.cancelButton} onClick={() => navigate(-1)}>
          + Create Custom Evaluator
        </button>
        <button className={styles.continueButton} onClick={handleUseEvaluaotr} disabled={!selectedEvaluator}>
          Use Selected Evaluator
        </button>
      </footer>
    </div>
  );
};

export default SetupEvaluatorPage;
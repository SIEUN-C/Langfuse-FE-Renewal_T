import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./EvaluationDetail.module.css";
import useProjectId from "hooks/useProjectId";

// 상세 페이지를 위한 임시 목업 데이터
const mockEvaluationDetail = {
  id: "1",
  name: "Sentiment Analysis Eval",
  createdAt: "2023-10-27T10:00:00Z",
  status: "COMPLETED",
  model: "gpt-3.5-turbo",
  dataset: "Customer Feedback Q3",
  scores: [
    { name: "Accuracy", value: 0.92 },
    { name: "F1 Score", value: 0.88 },
    { name: "Precision", value: 0.89 },
    { name: "Recall", value: 0.87 },
  ],
  results: [
    { input: "I love this product!", output: "Positive", expected: "Positive", score: 1 },
    { input: "The shipping was too slow.", output: "Positive", expected: "Negative", score: 0 },
    { input: "It's okay, not great.", output: "Neutral", expected: "Neutral", score: 1 },
  ],
};

const EvaluationDetailPage = () => {
  const { evaluationId } = useParams();
  const { projectId } = useProjectId();
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (!projectId || !evaluationId) {
      setIsLoading(false);
      return;
    }

    // TODO: evaluationId를 사용하여 API로 실제 데이터를 가져와야 합니다.
    console.log(`Fetching evaluation ${evaluationId} for project ${projectId}`);
    setTimeout(() => {
      setEvaluation(mockEvaluationDetail);
      setIsLoading(false);
    }, 500);
  }, [evaluationId, projectId]);

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!evaluation) {
    return <div className={styles.error}>Evaluation not found.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>{evaluation.name}</h1>
        <span className={`${styles.status} ${styles[evaluation.status.toLowerCase()]}`}>
          {evaluation.status}
        </span>
      </header>

      <div className={styles.metaInfo}>
        <p><strong>Model:</strong> {evaluation.model}</p>
        <p><strong>Dataset:</strong> {evaluation.dataset}</p>
        <p><strong>Created At:</strong> {new Date(evaluation.createdAt).toLocaleString()}</p>
      </div>

      <section className={styles.scoresSection}>
        <h2>Overall Scores</h2>
        <div className={styles.scoresGrid}>
          {evaluation.scores.map((score) => (
            <div key={score.name} className={styles.scoreCard}>
              <h3 className={styles.scoreName}>{score.name}</h3>
              <p className={styles.scoreValue}>{score.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.resultsSection}>
        <h2>Results</h2>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th>Input</th>
              <th>Output</th>
              <th>Expected Output</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {evaluation.results.map((result, index) => (
              <tr key={index}>
                <td>{result.input}</td>
                <td>{result.output}</td>
                <td>{result.expected}</td>
                <td>{result.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default EvaluationDetailPage;
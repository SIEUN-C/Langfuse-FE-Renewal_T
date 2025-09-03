import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupEvaluator.module.css";
import useProjectId from "hooks/useProjectId";

const SetupEvaluatorPage = () => {
  const navigate = useNavigate();
  const { projectId } = useProjectId();

  const [evaluatorName, setEvaluatorName] = useState("");
  const [dataset, setDataset] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [metrics, setMetrics] = useState({ accuracy: true, f1: false, precision: false, recall: false });

  const handleMetricChange = (e) => {
    const { name, checked } = e.target;
    setMetrics((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: API로 평가 생성 요청을 보내는 로직
    console.log("Setting up evaluator with:", { projectId, name: evaluatorName, dataset, model, metrics });
    alert("Evaluator setup initiated!");
    navigate(-1); // 이전 페이지로 돌아가기
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Set up a new Evaluator</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="evaluatorName">Evaluator Name</label>
          <input type="text" id="evaluatorName" value={evaluatorName} onChange={(e) => setEvaluatorName(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dataset">Dataset</label>
          <select id="dataset" value={dataset} onChange={(e) => setDataset(e.target.value)} required>
            <option value="" disabled>Select a dataset</option>
            <option value="Customer Feedback Q3">Customer Feedback Q3</option>
            <option value="Product Reviews 2023">Product Reviews 2023</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="model">Model</label>
          <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            <option value="gpt-4">gpt-4</option>
            <option value="claude-2">claude-2</option>
          </select>
        </div>

        <fieldset className={styles.formGroup}>
          <legend>Metrics</legend>
          <div className={styles.checkboxGroup}>
            {Object.keys(metrics).map((metric) => (
              <label key={metric}>
                <input type="checkbox" name={metric} checked={metrics[metric]} onChange={handleMetricChange} />
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className={styles.submitButton}>Run Evaluator</button>
        </div>
      </form>
    </div>
  );
};

export default SetupEvaluatorPage;
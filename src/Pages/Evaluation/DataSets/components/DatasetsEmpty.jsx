// src/Pages/Evaluation/DataSets/components/DatasetsEmpty.jsx
import React from "react";
import styles from "../datasetsEmpty.module.css";
import sharedStyles from "../datasetsShared.module.css";

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function DatasetsEmpty({ onClickNew }) {
  return (
    <div className={styles.emptyWrap}>
      <h2 className={styles.emptyTitle}>Get Started with Datasets</h2>
      <p className={styles.emptyDesc}>
        Datasets in Langfuse are collections of inputs (and expected outputs) for your LLM
        application. You can for example use them to benchmark new releases before deployment to
        production.
      </p>

      <div className={styles.emptyActions}>
        <button className={cx(sharedStyles.btn, sharedStyles.btnNewDataset)} onClick={onClickNew}>
          + New dataset
        </button>

        <a className={cx(sharedStyles.btn, sharedStyles.btnGhost)} href="https://langfuse.com/docs" target="_blank" rel="noreferrer">
          Learn More
        </a>
      </div>

      <div className={styles.emptyGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>⚡ Continuous improvement</div>
          <div className={styles.cardDesc}>
            Create datasets from production edge cases to improve your application
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>🧪 Pre-deployment testing</div>
          <div className={styles.cardDesc}>Benchmark new releases before deploying to production</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>📄 Structured testing</div>
          <div className={styles.cardDesc}>Run experiments on collections of inputs and expected outputs</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>&lt;/&gt; Custom workflows</div>
          <div className={styles.cardDesc}>Build custom workflows around your datasets via the API and SDKs</div>
        </div>
      </div>
    </div>
  );
}
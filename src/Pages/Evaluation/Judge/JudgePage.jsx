// JudgeLanding.jsx
import { useNavigate } from "react-router-dom";
import styles from "./JudgePage.module.css"; // ← 이 파일이 같은 폴더에 실제로 있어야 합니다.

export default function JudgeLanding() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          Get Started with LLM-as-a-Judge Evaluations
        </h1>
        <p className={styles.subtitle}>
          Create evaluation templates and evaluators to automatically score your
          traces with LLM-as-a-judge. Set up custom evaluation criteria and let
          AI help you measure the quality of your outputs.
        </p>

        <div className={styles.ctaRow}>
          <button
            className={styles.primaryWhite}
            onClick={() => navigate("/llm-as-a-judge/new")}
          >
            Create Evaluator
          </button>
          <a
            className={styles.secondary}
            href="https://langfuse.com/docs"
            target="_blank"
            rel="noreferrer"
          >
            Learn More
          </a>
        </div>
      </header>

      <section className={styles.features}>
        <article className={styles.card}>
          <div className={styles.cardTitle}>Automate evaluations</div>
          <div className={styles.cardDesc}>
            Use LLM-as-a-judge to automatically evaluate your traces without
            manual review
          </div>
        </article>
        <article className={styles.card}>
          <div className={styles.cardTitle}>Measure quality</div>
          <div className={styles.cardDesc}>
            Create custom evaluation criteria to measure the quality of your LLM
            outputs
          </div>
        </article>
        <article className={styles.card}>
          <div className={styles.cardTitle}>Scale efficiently</div>
          <div className={styles.cardDesc}>
            Evaluate thousands of traces automatically with customizable
            sampling rates
          </div>
        </article>
        <article className={styles.card}>
          <div className={styles.cardTitle}>Track performance</div>
          <div className={styles.cardDesc}>
            Monitor evaluation metrics over time to identify trends and
            improvements
          </div>
        </article>
      </section>
    </div>
  );
}

import React from 'react';
import styles from './EvaluatorLibrary.module.css';

// 라이브러리 목업 데이터
const mockLibraryEvaluators = [
  { id: 'lib-1', name: 'Standard Toxicity Check', description: 'Uses the Perspective API to check for toxic comments.' },
  { id: 'lib-2', name: 'PII Detection', description: 'Scans text for personally identifiable information.' },
  { id: 'lib-3', name: 'Fact-Checking Evaluator', description: 'Cross-references statements with a knowledge base.' },
  { id: 'lib-4', name: 'Readability Score', description: 'Calculates Flesch-Kincaid readability score.' },
];

const EvaluatorLibrary = () => {
  return (
    <div className={styles.libraryContainer}>
      <p className={styles.description}>
        Select an evaluator from the library to set it up for your project.
      </p>
      <div className={styles.grid}>
        {mockLibraryEvaluators.map(evaluator => (
          <div key={evaluator.id} className={styles.card}>
            <h3 className={styles.cardTitle}>{evaluator.name}</h3>
            <p className={styles.cardDescription}>{evaluator.description}</p>
            <button className={styles.setupButton}>Set up</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvaluatorLibrary;
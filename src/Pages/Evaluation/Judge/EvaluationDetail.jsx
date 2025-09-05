import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './EvaluationDetail.module.css';

// 임시 목업 데이터
const mockPeekData = {
  'eval-1': { id: 'eval-1', name: 'Sentiment Analysis Eval', status: 'COMPLETED', score: 0.92 },
  'eval-2': { id: 'eval-2', name: 'Toxicity Detection', status: 'RUNNING', score: null },
  'eval-3': { id: 'eval-3', name: 'Fact-Checking Test', status: 'COMPLETED', score: 0.88 },
};

// onClose를 prop으로 받음
const EvaluationDetail = ({ onClose }) => {
  const [searchParams] = useSearchParams();
  const peekId = searchParams.get('peek');
  const [evaluation, setEvaluation] = useState(null);

  // peekId가 바뀔 때마다 실행 (현재는 0.3초 딜레이 지연을 흉내내서 목업 데이터를 상태에 반영)
  useEffect(() => {
    if (peekId) {
      console.log('Fetching peek data for evaluation:', peekId);
      setTimeout(() => {
        setEvaluation(mockPeekData[peekId]);
      }, 300);
    } else {
      setEvaluation(null);
    }
  }, [peekId]);

  if (!peekId) {
    return (
      <div className={styles.container}>
        <p>Select an evaluation to see the details.</p>
      </div>
    );
  }

  // peekId는 있지만 데이터 로딩 전 상태
  if (!evaluation) {
    return <div className={styles.container}>Loading details...</div>;
  }

  // 화면을 그리는 JSX 부분을 아래와 같이 완전히 교체합니다.
  return (
    <div className={styles.container}>
      {/* 최상단 헤더 */}
      <div className={styles.panelHeader}>
        <span>Running evaluator</span>
        <span className={styles.evaluatorId}>{evaluation.id}</span>
        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className={styles.content}>
        {/* Configuration 헤더 */}
        <div className={styles.configHeader}>
          <div className={styles.configTitle}>
            <h1>Configuration</h1>
            <span className={`${styles.statusPill} ${styles.active}`}>active</span>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" defaultChecked />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.editMode}>
            <span>Edit Mode</span>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        {/* Referenced Evaluator */}
        <div className={styles.formSection}>
          <label className={styles.label}>Referenced Evaluator</label>
          <div className={`${styles.statusPill} ${styles.referenced}`}>
            Correctness
          </div>
        </div>
        
        {/* Generated Score Name */}
        <div className={styles.formSection}>
          <label className={styles.label}>Generated Score Name</label>
          <input type="text" className={styles.textInput} defaultValue="Correctness" />
        </div>

        {/* Target 설정 카드 */}
        <div className={styles.card}>
          <div className={styles.formSection}>
            <h2 className={styles.cardTitle}>Target</h2>
            <p className={styles.cardSubtitle}>Target data ⓘ</p>
            <div className={styles.segmentedControl}>
              <button className={styles.active}>Live tracing data</button>
              <button>Dataset runs</button>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <p className={styles.cardSubtitle}>Evaluator runs on</p>
            <div className={styles.checkboxGroup}>
              <label><input type="checkbox" defaultChecked /> New dataset run items</label>
              <label><input type="checkbox" /> Existing dataset run items</label>
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>Target filter</label>
            <div className={styles.filterRow}>
              <span>Where</span>
              <select className={styles.selectInput}><option>Dataset</option></select>
              <select className={styles.selectInput}><option>name is</option></select>
              <select className={styles.selectInput}><option>Select</option></select>
              <button className={styles.closeButtonSmall}>×</button>
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>Sampling</label>
            <div className={styles.samplingRow}>
              <input type="range" min="0" max="100" defaultValue="100" className={styles.rangeSlider} />
              <input type="text" className={styles.textInput} defaultValue="100.00 %" style={{width: '100px'}} />
            </div>
            <p className={styles.description}>This configuration will target all future dataset run items that match these filters.</p>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>Delay (seconds)</label>
            <input type="text" className={styles.textInput} defaultValue="30" />
            <p className={styles.description}>Time between first Trace/Dataset run event and evaluation execution to ensure all data is available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetail;
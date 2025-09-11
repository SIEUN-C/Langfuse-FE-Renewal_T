// src/Pages/Home/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// ===== 1단계: TracesBarListChart 테스트 =====
import TracesBarListChart from '../Dashboards/components/charts/TracesBarListChart';
// ===== 2단계: ModelCostTable 추가 =====
import ModelCostTable from '../Dashboards/components/charts/ModelCostTable';

// 아이콘
import { BarChart2, TestTube2, CheckCircle } from 'lucide-react';

// CSS
import styles from './Home.module.css';

// ===== 2단계: 추가 차트 컴포넌트들 (구현 확인 후 주석 해제) =====
// import TracesAndObservationsTimeSeriesChart from '../Dashboards/components/charts/TracesAndObservationsTimeSeriesChart';
// import ModelUsageChart from '../Dashboards/components/charts/ModelUsageChart';
// import UserChart from '../Dashboards/components/charts/UserChart';
// import ChartScores from '../Dashboards/components/charts/ChartScores';
// import LatencyTables from '../Dashboards/components/charts/LatencyTables';
// import GenerationLatencyChart from '../Dashboards/components/charts/LatencyChart';
// import ScoreAnalytics from '../Dashboards/components/charts/score-analytics/ScoreAnalytics';

// ===== 3단계: UI 컴포넌트들 (필요 시 구현) =====
// import DatePickerWithRange from '../components/DatePickerWithRange';
// import MultiSelect from '../components/MultiSelect';

/**
 * 홈 대시보드 페이지
 * 점진적 구현 - TracesBarListChart부터 시작하여 하나씩 추가
 */
const Home = () => {
  const { projectId } = useParams();
  
  // 기본 상태
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState({
    TracesBarListChart: 'testing', // 'testing' | 'success' | 'error'
    ModelCostTable: 'testing'
  });
  
  console.log('🏠 Home 컴포넌트 렌더링:', { projectId });
  
  // 임시 데이터 (API 연동 전)
  const mockData = useMemo(() => ({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
      to: new Date()
    },
    filterState: [], // 빈 필터
    agg: "24 hours" // 집계 옵션
  }), []);

  // 컴포넌트 테스트 상태 업데이트
  const updateTestStatus = (component, status) => {
    setTestResults(prev => ({
      ...prev,
      [component]: status
    }));
  };

  // TracesBarListChart 에러 핸들링
  const handleTracesChartError = (error) => {
    console.error('TracesBarListChart 에러:', error);
    updateTestStatus('TracesBarListChart', 'error');
  };

  // TracesBarListChart 성공 핸들링
  const handleTracesChartSuccess = () => {
    console.log('✅ TracesBarListChart 로딩 성공');
    updateTestStatus('TracesBarListChart', 'success');
  };

  return (
    <div className={styles.homePage}>
      {/* 개발 상태 헤더 */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Home Dashboard - Development Mode</h1>
          <div className={styles.devBadge}>
            <TestTube2 size={16} />
            Testing Phase
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.projectInfo}>
            Project: {projectId || 'No Project ID'}
          </div>
          <button className={styles.setupTracingBtn}>
            Setup Tracing
          </button>
        </div>
      </div>

      {/* 임시 필터 정보 */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersLeft}>
          <div className={styles.filterChip}>
            Past 7 days
          </div>
          <div className={styles.filterChip}>
            Environment: All
          </div>
          <div className={styles.filterChip}>
            Aggregation: {mockData.agg}
          </div>
        </div>

        <div className={styles.filtersRight}>
          <button 
            className={styles.requestChartBtn}
            onClick={() => setIsLoading(!isLoading)}
          >
            <BarChart2 size={20} />
            {isLoading ? 'Stop Loading' : 'Test Loading'}
          </button>
        </div>
      </div>

      {/* 대시보드 그리드 - 2개 컴포넌트 테스트 */}
      <div className={styles.dashboardGrid}>
        
        {/* 🧪 TracesBarListChart 테스트 영역 */}
        <div className={styles.testingCard}>
          <div className={styles.testingHeader}>
            <h2>
              <TestTube2 size={20} />
              Testing: TracesBarListChart
            </h2>
            <div className={styles.testingBadge}>
              Status: {testResults.TracesBarListChart}
            </div>
          </div>
          
          <div className={styles.chartWrapper}>
            <TracesBarListChart
              className={styles.tracesChart}
              projectId={projectId}
              globalFilterState={mockData.filterState}
              fromTimestamp={mockData.dateRange.from}
              toTimestamp={mockData.dateRange.to}
              isLoading={isLoading}
              onError={handleTracesChartError}
              onSuccess={handleTracesChartSuccess}
            />
          </div>
        </div>

        {/* 💰 ModelCostTable 테스트 영역 */}
        <div className={styles.testingCard}>
          <div className={styles.testingHeader}>
            <h2>
              <TestTube2 size={20} />
              Testing: ModelCostTable
            </h2>
            <div className={styles.testingBadge}>
              Status: {testResults.ModelCostTable}
            </div>
          </div>
          
          <div className={styles.chartWrapper}>
            <ModelCostTable
              className={styles.modelCostTable}
              projectId={projectId}
              globalFilterState={mockData.filterState}
              fromTimestamp={mockData.dateRange.from}
              toTimestamp={mockData.dateRange.to}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* 향후 구현될 차트들 - 플레이스홀더 */}
        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>📊 Traces by Time</h3>
            <p>TracesAndObservationsTimeSeriesChart</p>
            <small>구현 예정 (3단계)</small>
          </div>
        </div>

        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>🤖 Model Usage</h3>
            <p>ModelUsageChart</p>
            <small>구현 예정 (3단계)</small>
          </div>
        </div>

        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>👤 User Consumption</h3>
            <p>UserChart</p>
            <small>구현 예정 (3단계)</small>
          </div>
        </div>

        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>📈 Scores</h3>
            <p>ScoresTable</p>
            <small>구현 예정 (3단계)</small>
          </div>
        </div>
      </div>

      {/* 개발 정보 패널 */}
      <div className={styles.devInfo}>
        <details>
          <summary>🔧 개발 정보</summary>
          <div className={styles.devDetails}>
            <div><strong>Project ID:</strong> {projectId}</div>
            <div><strong>Date Range:</strong> {mockData.dateRange.from.toLocaleDateString()} ~ {mockData.dateRange.to.toLocaleDateString()}</div>
            <div><strong>Filter State:</strong> {JSON.stringify(mockData.filterState)}</div>
            <div><strong>Current Phase:</strong> TracesBarListChart + ModelCostTable 테스트</div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default Home;
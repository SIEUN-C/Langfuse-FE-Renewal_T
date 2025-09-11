import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// TracesBarListChart만 테스트
import TracesBarListChart from '../Dashboards/components/charts/TracesBarListChart';

// 아이콘
import { BarChart2 } from 'lucide-react';

// CSS - 경로도 수정 필요
import styles from './Home.module.css';


// ===== 2단계: 추가 차트 컴포넌트들 (구현 확인 필요) =====
// import TracesAndObservationsTimeSeriesChart from '../components/charts/TracesAndObservationsTimeSeriesChart';
// import ModelUsageChart from '../components/charts/ModelUsageChart';
// import UserChart from '../components/charts/UserChart';
// import ChartScores from '../components/charts/ChartScores';
// import LatencyTables from '../components/charts/LatencyTables';
// import GenerationLatencyChart from '../components/charts/GenerationLatencyChart';
// import ScoreAnalytics from '../components/charts/ScoreAnalytics';

// ===== 3단계: UI 컴포넌트들 (구현 확인 필요) =====
// import DatePickerWithRange from '../components/DatePickerWithRange';
// import MultiSelect from '../components/MultiSelect';
// import PopoverFilterBuilder from '../components/PopoverFilterBuilder';
// import Page from '../components/layouts/Page';

// ===== 4단계: API 및 유틸리티 (구현 확인 필요) =====
// import { dashboardAPI } from '../services/dashboardApi';
// import { findClosestDashboardInterval } from '../utils/dateRangeUtils';
// import { useDebounce } from '../hooks/useDebounce';


/**
 * 메인 Home 페이지 (대시보드)
 * 점진적 구현 버전 - 하나씩 컴포넌트를 추가해가며 테스트
 */
const Home = () => {
  const { projectId } = useParams();
  
  // 기본 상태들
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('Home 컴포넌트 렌더링:', { projectId });
  
  // 임시 더미 데이터 (API 구현 전까지)
  const dummyDateRange = {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date()
  };
  
  const dummyFilterState = [];
  
  return (
    <div className={styles.homePage}>
      {/* 간단한 헤더 */}
      <div className={styles.pageHeader}>
        <h1>Home - Testing TracesBarListChart</h1>
        <button className={styles.setupTracingBtn}>
          Setup Tracing
        </button>
      </div>

      {/* 임시 필터 영역 */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersLeft}>
          <div className={styles.dateDisplay}>Past 24 hours</div>
          <div className={styles.envDisplay}>Environment: All</div>
          <div className={styles.envDisplay}>Project: {projectId || 'No Project ID'}</div>
        </div>

        <div className={styles.filtersRight}>
          <button className={styles.requestChartBtn}>
            <BarChart2 size={20} />
            Request Chart
          </button>
        </div>
      </div>

      {/* 차트 그리드 - TracesBarListChart만 테스트 */}
      <div className={styles.dashboardGrid}>
        {/* TracesBarListChart 단독 테스트 */}
        <div style={{ gridColumn: 'span 2', border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ color: '#3b82f6', marginBottom: '16px' }}>Testing: TracesBarListChart</h2>
          <TracesBarListChart
            className={styles.tracesCard}
            projectId={projectId}
            globalFilterState={dummyFilterState}
            fromTimestamp={dummyDateRange.from}
            toTimestamp={dummyDateRange.to}
            isLoading={isLoading}
          />
        </div>

        {/* 나머지는 플레이스홀더 */}
        <div className={styles.chartPlaceholder}>ModelCostTable (비활성화)</div>
        <div className={styles.chartPlaceholder}>ScoresTable (비활성화)</div>
        <div className={styles.chartPlaceholder}>Traces by time (구현 예정)</div>
        <div className={styles.chartPlaceholder}>Model Usage (구현 예정)</div>
        <div className={styles.chartPlaceholder}>User consumption (구현 예정)</div>
      </div>
    </div>
  );
};

export default Home;
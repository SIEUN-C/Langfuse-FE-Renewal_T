// src/Pages/Home/Home.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// ===== 차트 컴포넌트들 =====
import TracesBarListChart from '../Dashboards/components/charts/TracesBarListChart';
import ModelCostTable from '../Dashboards/components/charts/ModelCostTable';
import LatencyChart from '../Dashboards/components/charts/LatencyChart'; // 🆕 추가

// ===== 필터 컴포넌트들 - 기존 것 활용 =====
import DateRangePicker from '../../components/DateRange/DateRangePicker';
import MultiSelectDropdown from '../../components/FilterControls/MultiSelectDropdown';
import { 
  homeFilterConfig, 
  convertHomeFiltersToLangfuse, 
  convertEnvironmentsToFilter 
} from '../../components/FilterControls/filterConfig';

import FilterControls from '../../components/FilterControls/FilterControls';
// ===== API 서비스 =====
import { dashboardAPI } from '../Dashboards/services/dashboardApi';

// ===== 유틸리티 =====
import { useDebounce } from '../Dashboards/hooks/useDebounce';

// 아이콘
import { BarChart2, TestTube2, CheckCircle, Loader } from 'lucide-react';

// CSS
import styles from './Home.module.css';

/**
 * 홈 대시보드 페이지 - 기존 컴포넌트 조합
 * 원본 Langfuse 레이아웃 매칭: 날짜 범위 + 환경 선택 + 고급 필터
 */
const Home = () => {
  const { projectId } = useParams();
  
  // ===== 기본 상태 =====
  const [isLoading, setIsLoading] = useState(false);

  // ===== 날짜 범위 상태 (기본: 최근 7일) =====
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // ===== 환경 필터 상태 =====
  const [selectedEnvironments, setSelectedEnvironments] = useState([]);

  // ===== 고급 필터 상태 =====
  const [builderFilters, setBuilderFilters] = useState(() => {
    const initialColumn = homeFilterConfig[0];
    return [
      {
        id: Date.now(),
        column: initialColumn.key,
        operator: initialColumn.operators[0],
        value: "",
        metaKey: "",
      },
    ];
  });

  // ===== 필터 옵션 데이터 =====
  const [environmentOptions, setEnvironmentOptions] = useState([]);
  const [nameOptions, setNameOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // ===== API 옵션을 기본 필터 설정에 동적 추가 =====
  const dynamicFilterConfig = useMemo(() => {
    return homeFilterConfig.map((config) => {
      if (config.key === "environment") {
        return { ...config, options: environmentOptions };
      }
      if (config.key === "traceName") {
        return { ...config, options: nameOptions };
      }
      if (config.key === "tags") {
        return { ...config, options: tagsOptions };
      }
      return config;
    });
  }, [environmentOptions, nameOptions, tagsOptions]);

  // ===== 필터 옵션 로딩 =====
  const loadFilterOptions = useCallback(async () => {
    if (!projectId) return;

    setFilterOptionsLoading(true);

    const defaultEnvironmentOptions = ["default"];
    const defaultNameOptions = [];
    const defaultTagsOptions = [];

    try {
      const [traceOptions, envOptions] = await Promise.all([
        dashboardAPI.getTraceFilterOptions(projectId),
        dashboardAPI.getEnvironmentFilterOptions(projectId),
      ]);

      // Trace 필터 옵션 처리
      if (traceOptions.success && traceOptions.data) {
        setNameOptions(traceOptions.data.name || defaultNameOptions);
        setTagsOptions(traceOptions.data.tags || defaultTagsOptions);
      } else {
        setNameOptions(defaultNameOptions);
        setTagsOptions(defaultTagsOptions);
      }

      // Environment 필터 옵션 처리
      if (envOptions.success && envOptions.data) {
        const envList = envOptions.data.map(item => typeof item === 'string' ? item : item.environment).filter(Boolean);
        setEnvironmentOptions(
          envList.length > 0 ? envList : defaultEnvironmentOptions
        );
      } else {
        setEnvironmentOptions(defaultEnvironmentOptions);
      }

      console.log('필터 옵션 로딩 완료:', {
        environments: environmentOptions.length,
        names: nameOptions.length,
        tags: tagsOptions.length
      });

    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      setEnvironmentOptions(defaultEnvironmentOptions);
      setNameOptions(defaultNameOptions);
      setTagsOptions(defaultTagsOptions);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [projectId]);

  // ===== 날짜 범위 변경 핸들러 =====
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    console.log('날짜 범위 변경:', { startDate, endDate });
    setDateRange({ startDate, endDate });
  }, []);

  // DateRangePicker용 개별 setter 함수들
  const setStartDate = (date) => {
    setDateRange(prev => ({ ...prev, startDate: date }));
  };

  const setEndDate = (date) => {
    setDateRange(prev => ({ ...prev, endDate: date }));
  };

  const setBothDates = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  // ===== 디바운스된 필터 변경 핸들러 =====
  const debouncedFilterChange = useDebounce((newFilters) => {
    console.log('필터 변경:', newFilters);
    setBuilderFilters(newFilters);
  }, 300);

  // ===== 초기 필터 옵션 로딩 =====
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // ===== 필터 상태 통합 (원본과 정확히 동일한 방식) =====
  const mergedFilterState = useMemo(() => {
    // 1. 고급 필터 변환 (userFilterState와 동일)
    const userFilters = convertHomeFiltersToLangfuse(builderFilters);

    // 2. 환경 필터 변환 (environmentFilter와 동일)  
    const environmentFilter = convertEnvironmentsToFilter(selectedEnvironments, environmentOptions);

    // 3. 원본과 동일: userFilterState + environmentFilter (시간 필터는 별도 전달)
    return [...userFilters, ...environmentFilter];
  }, [builderFilters, selectedEnvironments, environmentOptions]);

  console.log('Home 컴포넌트 렌더링:', { 
    projectId, 
    dateRange,
    selectedEnvironments: selectedEnvironments.length,
    builderFilters: builderFilters.length,
    mergedFilters: mergedFilterState.length
  });

  return (
    <div className={styles.homePage}>
      {/* 개발 상태 헤더 */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Home Dashboard</h1>
          <div className={styles.devBadge}>
            <TestTube2 size={16} />
            Clean Layout Version
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

      {/* ===== 필터 섹션 (원본 Langfuse 레이아웃 매칭) ===== */}
      <div className={styles.filterSection}>
        {/* 1. 날짜 범위 필터 */}
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setBothDates={setBothDates}
          onPresetChange={handleDateRangeChange}
        />

        {/* 2. 환경 필터 */}
        <div className={styles.envFilterContainer}>
          <span className={styles.envLabel}>Env</span>
          <MultiSelectDropdown
            options={environmentOptions}
            value={selectedEnvironments}
            onChange={setSelectedEnvironments}
            placeholder="All environments"
          />
        </div>

        {/* 3. 고급 필터 빌더 */}
        <FilterControls
          builderFilterProps={{
            filters: builderFilters,
            onFilterChange: debouncedFilterChange,
            filterConfig: dynamicFilterConfig,
          }}
        />

        {/* 필터 로딩 상태 */}
        {filterOptionsLoading && (
          <div className={styles.filterLoadingIndicator}>
            <Loader size={16} className={styles.spinner} />
            Loading...
          </div>
        )}
      </div>

      {/* 필터 상태 디버그 정보 (개발용) */}
      <div className={styles.filterDebugInfo}>
        <details>
          <summary>필터 상태 (개발용)</summary>
          <div className={styles.debugDetails}>
            <div><strong>Date Range:</strong> {dateRange.startDate.toLocaleDateString()} ~ {dateRange.endDate.toLocaleDateString()}</div>
            <div><strong>Selected Environments:</strong> {selectedEnvironments.join(', ') || 'All'}</div>
            <div><strong>Builder Filters:</strong> {builderFilters.filter(f => f.value).length}개 활성</div>
            <div><strong>Total Merged Filters:</strong> {mergedFilterState.length}개</div>
            <div><strong>Environment Options:</strong> {environmentOptions.join(', ')}</div>
          </div>
        </details>
      </div>

      {/* ===== 대시보드 그리드 - 깔끔한 카드 레이아웃 ===== */}
      <div className={styles.dashboardGrid}>
        
        {/* TracesBarListChart - DashboardCard로 자동 래핑됨 */}
        <TracesBarListChart
          className={styles.tracesChart}
          projectId={projectId}
          globalFilterState={mergedFilterState}
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />

        {/* ModelCostTable - DashboardCard로 자동 래핑됨 */}
        <ModelCostTable
          className={styles.modelCostTable}
          projectId={projectId}
          globalFilterState={mergedFilterState}
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />

        {/* 향후 구현될 차트들 - 플레이스홀더 */}
        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>Traces by Time</h3>
            <p>TracesAndObservationsTimeSeriesChart</p>
            <small>구현 예정 - 필터 연동 준비됨</small>
          </div>
        </div>

        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>Model Usage</h3>
            <p>ModelUsageChart</p>
            <small>구현 예정 - 필터 연동 준비됨</small>
          </div>
        </div>

        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>User Consumption</h3>
            <p>UserChart</p>
            <small>구현 예정 - 필터 연동 준비됨</small>
          </div>
        </div>

        <div className={styles.placeholderCard}>
          <div className={styles.placeholderContent}>
            <h3>Scores</h3>
            <p>ScoresTable</p>
            <small>구현 예정 - 필터 연동 준비됨</small>
          </div>
        </div>
      </div>

      {/* 🆕 LatencyChart - 맨 아래에 가로로 길게 배치 */}
      <div className={styles.latencyChartSection}>
        <LatencyChart
          className={styles.latencyChartWide}
          projectId={projectId}
          globalFilterState={mergedFilterState}
          agg="1 hour"
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />
      </div>

      {/* 테스트 컨트롤 패널 */}
      <div className={styles.testControls}>
        <button 
          className={styles.testButton}
          onClick={() => setIsLoading(!isLoading)}
        >
          <BarChart2 size={16} />
          {isLoading ? 'Stop Loading Test' : 'Start Loading Test'}
        </button>
        
        <button 
          className={styles.testButton}
          onClick={loadFilterOptions}
          disabled={filterOptionsLoading}
        >
          {filterOptionsLoading ? <Loader size={16} className={styles.spinner} /> : '🔄'}
          Reload Filter Options
        </button>
      </div>

      {/* 개발 정보 패널 */}
      <div className={styles.devInfo}>
        <details>
          <summary>개발 정보</summary>
          <div className={styles.devDetails}>
            <div><strong>Project ID:</strong> {projectId}</div>
            <div><strong>Date Range:</strong> {dateRange.startDate.toLocaleDateString()} ~ {dateRange.endDate.toLocaleDateString()}</div>
            <div><strong>Active Filters:</strong> {mergedFilterState.length}개</div>
            <div><strong>Current Phase:</strong> LatencyChart 추가 완료</div>
            <div><strong>Filter Options:</strong> {filterOptionsLoading ? 'Loading...' : 'Loaded'}</div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default Home;
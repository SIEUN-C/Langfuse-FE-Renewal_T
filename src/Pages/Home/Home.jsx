// src/Pages/Home/Home.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

// ===== 차트 컴포넌트들 =====
import TracesBarListChart from "../Dashboards/components/charts/TracesBarListChart";
import ModelCostTable from "../Dashboards/components/charts/ModelCostTable";
import UserChart from "../Dashboards/components/charts/UserChart";
import LatencyChart from "../Dashboards/components/charts/LatencyChart";
import LatencyTables from "../Dashboards/components/charts/LatencyTables";

// ===== 필터 컴포넌트들 =====
import DateRangePicker from "../../components/DateRange/DateRangePicker";
import MultiSelectDropdown from "../../components/FilterControls/MultiSelectDropdown";
import {
  homeFilterConfig,
  convertHomeFiltersToLangfuse,
  convertEnvironmentsToFilter,
} from "../../components/FilterControls/filterConfig";
import FilterControls from "../../components/FilterControls/FilterControls";

// ===== API 서비스 =====
import { dashboardAPI } from "../Dashboards/services/dashboardApi";

// ===== 유틸리티 =====
import { useDebounce } from "../Dashboards/hooks/useDebounce";

// 아이콘
import { BarChart2, TestTube2, CheckCircle, Loader, Clock } from "lucide-react";

// CSS
import styles from "./Home.module.css";

/**
 * 홈 대시보드 페이지 - 3x3 그리드 레이아웃
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
        const envList = envOptions.data
          .map((item) => (typeof item === "string" ? item : item.environment))
          .filter(Boolean);
        setEnvironmentOptions(
          envList.length > 0 ? envList : defaultEnvironmentOptions
        );
      } else {
        setEnvironmentOptions(defaultEnvironmentOptions);
      }

      console.log("필터 옵션 로딩 완료:", {
        environments: environmentOptions.length,
        names: nameOptions.length,
        tags: tagsOptions.length,
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
    console.log("날짜 범위 변경:", { startDate, endDate });
    setDateRange({ startDate, endDate });
  }, []);

  // DateRangePicker용 개별 setter 함수들
  const setStartDate = (date) => {
    setDateRange((prev) => ({ ...prev, startDate: date }));
  };

  const setEndDate = (date) => {
    setDateRange((prev) => ({ ...prev, endDate: date }));
  };

  const setBothDates = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  // ===== 디바운스된 필터 변경 핸들러 =====
  const debouncedFilterChange = useDebounce((newFilters) => {
    console.log("필터 변경:", newFilters);
    setBuilderFilters(newFilters);
  }, 300);

  // ===== 초기 필터 옵션 로딩 =====
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // ===== 필터 상태 통합 =====
  const mergedFilterState = useMemo(() => {
    const userFilters = convertHomeFiltersToLangfuse(builderFilters);
    const environmentFilter = convertEnvironmentsToFilter(
      selectedEnvironments,
      environmentOptions
    );
    return [...userFilters, ...environmentFilter];
  }, [builderFilters, selectedEnvironments, environmentOptions]);

  console.log("Home 컴포넌트 렌더링:", {
    projectId,
    dateRange,
    selectedEnvironments: selectedEnvironments.length,
    builderFilters: builderFilters.length,
    mergedFilters: mergedFilterState.length,
  });

  return (
    <div className={styles.homePage}>
      {/* ===== 필터 섹션 ===== */}
      <div className={styles.filterSection}>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setBothDates={setBothDates}
          onPresetChange={handleDateRangeChange}
        />

        <div className={styles.envFilterContainer}>
          <span className={styles.envLabel}>Env</span>
          <MultiSelectDropdown
            options={environmentOptions}
            value={selectedEnvironments}
            onChange={setSelectedEnvironments}
            placeholder="All environments"
          />
        </div>

        <FilterControls
          builderFilterProps={{
            filters: builderFilters,
            onFilterChange: debouncedFilterChange,
            filterConfig: dynamicFilterConfig,
          }}
        />

        {filterOptionsLoading && (
          <div className={styles.filterLoadingIndicator}>
            <Loader size={16} className={styles.spinner} />
            Loading...
          </div>
        )}
      </div>

      {/* ===== 메인 대시보드 그리드 - 3x3 레이아웃 ===== */}
      <div className={styles.dashboardGrid}>
        {/* 첫 번째 줄 */}
        <TracesBarListChart
          projectId={projectId}
          globalFilterState={mergedFilterState}
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />

        <ModelCostTable
          projectId={projectId}
          globalFilterState={mergedFilterState}
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />

        {/* 🎯 Scores 플레이스홀더를 UserChart로 교체 */}
        <UserChart
          projectId={projectId}
          globalFilterState={mergedFilterState}
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />

        {/* 두 번째 줄 - 기존 플레이스홀더들 유지 */}
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
            <h3>Scores</h3>
            <p>ChartScores</p>
            <small>구현 예정 - 필터 연동 준비됨</small>
          </div>
        </div>

        {/* 세 번째 줄 - LatencyTables 3개가 자동 배치됨 */}
        <LatencyTables
          projectId={projectId}
          globalFilterState={mergedFilterState}
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />
      </div>

      {/* LatencyChart - 맨 아래에 가로로 길게 배치 (기존 유지) */}
      <div className={styles.latencyChartSection}>
        <LatencyChart
          projectId={projectId}
          globalFilterState={mergedFilterState}
          agg="1 hour"
          fromTimestamp={dateRange.startDate}
          toTimestamp={dateRange.endDate}
          isLoading={isLoading || filterOptionsLoading}
        />
      </div>
    </div>
  );
};

export default Home;

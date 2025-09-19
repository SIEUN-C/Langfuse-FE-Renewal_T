import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

// ===== 차트 컴포넌트들 =====
import TracesAndObservationsTimeSeriesChart from "../Dashboards/components/charts/TracesAndObservationsTimeSeriesChart";
import { DashboardCard } from "../Dashboards/components/cards/DashboardCard";
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
import { dashboardAPI, widgetAPI } from "../Dashboards/services/dashboardApi";
import { dashboardDateRangeAggregationSettings } from "../Dashboards/utils/date-range-utils";

// ===== 유틸리티 =====
import { useDebounce } from "../Dashboards/hooks/useDebounce";

// 아이콘
import { Loader } from "lucide-react";

// CSS
import styles from "./Home.module.css";

const Home = () => {
  const { projectId } = useParams();

  // 기본 상태
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate: new Date() });
  
  // 필터 상태
  const [selectedEnvironments, setSelectedEnvironments] = useState([]);
  const [builderFilters, setBuilderFilters] = useState(() => { const initialColumn = homeFilterConfig[0]; return [{ id: Date.now(), column: initialColumn.key, operator: initialColumn.operators[0], value: "", metaKey: "" }]; });
  const [environmentOptions, setEnvironmentOptions] = useState([]);
  const [nameOptions, setNameOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // 'Traces by Time' 차트 상태
  const [tracesByTimeData, setTracesByTimeData] = useState(null);
  const [isTracesByTimeLoading, setIsTracesByTimeLoading] = useState(true);
  const [tracesByTimeError, setTracesByTimeError] = useState(null);

  // 필터 관련 로직 (기존과 동일)
  const dynamicFilterConfig = useMemo(() => { return homeFilterConfig.map((config) => { if (config.key === "environment") return { ...config, options: environmentOptions }; if (config.key === "traceName") return { ...config, options: nameOptions }; if (config.key === "tags") return { ...config, options: tagsOptions }; return config; }); }, [environmentOptions, nameOptions, tagsOptions]);
  const loadFilterOptions = useCallback(async () => { if (!projectId) return; setFilterOptionsLoading(true); try { const [traceOptions, envOptions] = await Promise.all([ dashboardAPI.getTraceFilterOptions(projectId), dashboardAPI.getEnvironmentFilterOptions(projectId), ]); if (traceOptions.success && traceOptions.data) { setNameOptions(traceOptions.data.name || []); setTagsOptions(traceOptions.data.tags || []); } if (envOptions.success && envOptions.data) { const envList = envOptions.data.map((item) => (typeof item === "string" ? item : item.environment)).filter(Boolean); setEnvironmentOptions(envList.length > 0 ? envList : ["default"]); } } catch (error) { console.error("Failed to fetch filter options:", error); setEnvironmentOptions(["default"]); } finally { setFilterOptionsLoading(false); } }, [projectId]);
  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);
  const handleDateRangeChange = useCallback((startDate, endDate) => setDateRange({ startDate, endDate }), []);
  const setStartDate = (date) => setDateRange((prev) => ({ ...prev, startDate: date }));
  const setEndDate = (date) => setDateRange((prev) => ({ ...prev, endDate: date }));
  const setBothDates = (startDate, endDate) => setDateRange({ startDate, endDate });
  const debouncedFilterChange = useDebounce((newFilters) => setBuilderFilters(newFilters), 300);
  const mergedFilterState = useMemo(() => { const userFilters = convertHomeFiltersToLangfuse(builderFilters); const environmentFilter = convertEnvironmentsToFilter(selectedEnvironments, environmentOptions); return [...userFilters, ...environmentFilter]; }, [builderFilters, selectedEnvironments, environmentOptions]);

  // 'Traces by Time' 데이터 로딩 useEffect
  useEffect(() => {
    const fetchTracesByTimeData = async () => {
        if (!projectId || !dateRange.startDate || !dateRange.endDate) return;
        setIsTracesByTimeLoading(true);
        setTracesByTimeError(null);
        try {
            const fromTimestamp = dateRange.startDate.toISOString();
            const toTimestamp = dateRange.endDate.toISOString();
            const timeDimension = { granularity: dashboardDateRangeAggregationSettings["7 days"]?.date_trunc || 'day' };
            const tracesQuery = { view: "traces", metrics: [{ measure: "count", aggregation: "count" }], dimensions: [], timeDimension, filters: mergedFilterState, fromTimestamp, toTimestamp, orderBy: null };
            const observationsQuery = { view: "observations", metrics: [{ measure: "count", aggregation: "count" }], dimensions: [{ field: "level" }], timeDimension, filters: mergedFilterState, fromTimestamp, toTimestamp, orderBy: null };
            const [tracesResult, observationsResult] = await Promise.all([ widgetAPI.executeQuery(projectId, tracesQuery), widgetAPI.executeQuery(projectId, observationsQuery) ]);
            if (!tracesResult.success || !observationsResult.success) { throw new Error(tracesResult.error || observationsResult.error || "Failed to fetch chart data"); }
            const transformedTraces = (tracesResult.data || []).map(item => ({ ts: new Date(item.time_dimension).getTime(), values: [{ label: 'Traces', value: Number(item.count_count) }] }));
            const transformedObservations = (observationsResult.data || []).map(item => ({ ts: new Date(item.time_dimension).getTime(), values: [{ label: item.level || 'DEFAULT', value: Number(item.count_count) }] }));
            setTracesByTimeData({ traces: transformedTraces, observations: transformedObservations });
        } catch (error) {
            console.error("Error fetching Traces by Time data:", error);
            setTracesByTimeError(error);
        } finally {
            setIsTracesByTimeLoading(false);
        }
    };
    fetchTracesByTimeData();
  }, [projectId, mergedFilterState, dateRange]);

  return (
    <div className={styles.homePage}>
      <div className={styles.filterSection}>
        <DateRangePicker startDate={dateRange.startDate} endDate={dateRange.endDate} setStartDate={setStartDate} setEndDate={setEndDate} setBothDates={setBothDates} onPresetChange={handleDateRangeChange} />
        <div className={styles.envFilterContainer}>
          <span className={styles.envLabel}>Env</span>
          <MultiSelectDropdown options={environmentOptions} value={selectedEnvironments} onChange={setSelectedEnvironments} placeholder="All environments" />
        </div>
        <FilterControls builderFilterProps={{ filters: builderFilters, onFilterChange: debouncedFilterChange, filterConfig: dynamicFilterConfig }} />
        {filterOptionsLoading && ( <div className={styles.filterLoadingIndicator}><Loader size={16} className={styles.spinner} /> Loading...</div> )}
      </div>

      <div className={styles.dashboardGrid}>
        <div className={`${styles.chartRow} ${styles.cols3}`}>
          <TracesBarListChart projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
          <ModelCostTable projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
          <div className={styles.placeholderCard}>
            <div className={styles.placeholderContent}><h3>Scores</h3><p>ChartScores</p><small>구현 예정</small></div>
          </div>
        </div>
        <div className={`${styles.chartRow} ${styles.cols2}`}>
          <DashboardCard title="Traces by Time" isLoading={isTracesByTimeLoading}>
            <TracesAndObservationsTimeSeriesChart data={tracesByTimeData} isLoading={isTracesByTimeLoading} error={tracesByTimeError} agg={"7 days"} chartType="area" />
          </DashboardCard>
          <div className={styles.placeholderCard}>
            <div className={styles.placeholderContent}><h3>Model Usage</h3><p>ModelUsageChart</p><small>구현 예정</small></div>
          </div>
        </div>
        <div className={`${styles.chartRow} ${styles.cols2}`}>
           <UserChart projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
          <div className={styles.placeholderCard}>
            <div className={styles.placeholderContent}><h3>Scores</h3><p>ChartScores</p><small>구현 예정</small></div>
          </div>
        </div>
        <div className={`${styles.chartRow} ${styles.cols3}`}>
            <LatencyTables projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
        </div>
        <div className={`${styles.chartRow} ${styles.cols1}`}>
          <LatencyChart projectId={projectId} globalFilterState={mergedFilterState} agg="1 hour" fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
        </div>
      </div>
    </div>
  );
};

export default Home;
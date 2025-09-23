import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

// ===== 차트 컴포넌트들 =====
import ScoresTable from "../Dashboards/components/charts/ScoresTable"; // 이 부분을 추가해주세요.
import TracesAndObservationsTimeSeriesChart from "../Dashboards/components/charts/TracesAndObservationsTimeSeriesChart";
import { DashboardCard } from "../Dashboards/components/cards/DashboardCard";
import TracesBarListChart from "../Dashboards/components/charts/TracesBarListChart";
import ModelCostTable from "../Dashboards/components/charts/ModelCostTable";
import UserChart from "../Dashboards/components/charts/UserChart";
import LatencyChart from "../Dashboards/components/charts/LatencyChart";
import LatencyTables from "../Dashboards/components/charts/LatencyTables";
// ▼▼▼ 1. ChartScores 컴포넌트 import 추가 ▼▼▼
import ChartScores from "../Dashboards/components/charts/ChartScores";
import ModelUsageChart from "../Dashboards/components/charts/ModelUsageChart"; // 🎯 1. ModelUsageChart import

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
// ▼▼▼ 2. 데이터 가공 함수 import 추가 ▼▼▼
import {
  extractTimeSeriesData,
  fillMissingValuesAndTransform,
} from "../Dashboards/utils/hooks";

// 아이콘
import { Loader } from "lucide-react";

// CSS
import styles from "./Home.module.css";

// ▼▼▼ 3. ChartScores 데이터 처리에 필요한 헬퍼 함수 정의 ▼▼▼
const getScoreDataTypeIcon = (dataType) => {
  const iconMap = {
    "NUMERIC": "📊",
    "CATEGORICAL": "📋",
    "BOOLEAN": "✅",
    "STRING": "📝",
  };
  return iconMap[dataType] || "📈";
};

// 🎯 [수정] 모델 목록을 가져올 때 사용할 필터 (로컬과 동일하게)
const OBSERVATION_TYPES_FILTER_FOR_MODELS = {
  type: "stringOptions",
  column: "type",
  operator: "any of",
  value: ["GENERATION", "COMPLETION", "LLM"],
};

// 🎯 [수정] 차트 데이터를 가져올 때 사용할 필터
const OBSERVATION_TYPES_FILTER_FOR_CHARTS = {
  type: "stringOptions",
  column: "type",
  operator: "any of",
  value: ["GENERATION", "AGENT", "TOOL", "CHAIN", "RETRIEVER", "EVALUATOR", "EMBEDDING", "GUARDRAIL"],
};

// Legacy API의 응답 데이터를 차트용으로 가공하는 함수
const processUnpivotedData = (apiResponse, timeKey, labelKey, valueKey) => {
    if (!apiResponse || !Array.isArray(apiResponse)) return [];
    const groupedByTime = apiResponse.reduce((acc, curr) => {
        const time = curr[timeKey];
        if (!acc[time]) acc[time] = [];
        acc[time].push(curr);
        return acc;
    }, {});
    return Object.entries(groupedByTime).map(([ts, items]) => ({
        ts: new Date(ts).getTime(),
        values: items.map(item => ({
            label: item[labelKey],
            value: Number(item[valueKey]) || 0,
        })),
    }));
};



const Home = () => {
  const { projectId } = useParams();

  // 기본 상태
  const [isLoading, setIsLoading] = useState(false);
  //const [dateRange, setDateRange] = useState({ startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate: new Date() });
  const [dateRange, setDateRange] = useState({ startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date() });
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

  // ▼▼▼▼▼ [여기부터] ScoresTable 차트 상태 추가 ▼▼▼▼▼
  const [scoresTableData, setScoresTableData] = useState(null);
  const [isScoresTableLoading, setIsScoresTableLoading] = useState(true);
  const [scoresTableError, setScoresTableError] = useState(null);
  // ▲▲▲▲▲ [여기까지] ScoresTable 차트 상태 추가 ▲▲▲▲▲

    // ▼▼▼ 4. ChartScores를 위한 상태 변수 추가 ▼▼▼
   // 'ChartScores'를 위한 상태 변수
  const [chartScoresData, setChartScoresData] = useState([]); // 초기값을 null에서 빈 배열로 변경
  const [isChartScoresLoading, setIsChartScoresLoading] = useState(true);
  const [chartScoresError, setChartScoresError] = useState(null);
  const [totalScoresCount, setTotalScoresCount] = useState(0);

 // 🎯 2. ModelUsageChart를 위한 상태 변수 추가
  const [modelUsageData, setModelUsageData] = useState(null);
  const [isModelUsageLoading, setIsModelUsageLoading] = useState(true);
  const [modelUsageError, setModelUsageError] = useState(null);
  const [allModels, setAllModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);

  



  // 필터 관련 로직 (수정함)
  const dynamicFilterConfig = useMemo(() => { return homeFilterConfig.map((config) => { if (config.key === "environment") return { ...config, options: environmentOptions }; if (config.key === "traceName") return { ...config, options: nameOptions }; if (config.key === "tags") return { ...config, options: tagsOptions }; return config; }); }, [environmentOptions, nameOptions, tagsOptions]);
  
  const loadFilterOptions = useCallback(async () => {
    if (!projectId) return;
    setFilterOptionsLoading(true);
    try {
      const [traceOptions, envOptions] = await Promise.all([
        dashboardAPI.getTraceFilterOptions(projectId),
        dashboardAPI.getEnvironmentFilterOptions(projectId),
      ]);
      if (traceOptions.success && traceOptions.data) {
        setNameOptions(traceOptions.data.name || []);
        setTagsOptions(traceOptions.data.tags || []);
      }
      if (envOptions.success && envOptions.data) {
        const envList = envOptions.data.map((item) => (typeof item === "string" ? item : item.environment)).filter(Boolean);
        setEnvironmentOptions(envList.length > 0 ? envList : ["default", "langfuse-prompt-experiment"]);
      }
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      setEnvironmentOptions(["default", "langfuse-prompt-experiment"]);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [projectId]);
  
  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  const handleDateRangeChange = useCallback((startDate, endDate) => setDateRange({ startDate, endDate }), []);
  const setStartDate = (date) => setDateRange((prev) => ({ ...prev, startDate: date }));
  const setEndDate = (date) => setDateRange((prev) => ({ ...prev, endDate: date }));
  const setBothDates = (startDate, endDate) => setDateRange({ startDate, endDate });
  const debouncedFilterChange = useDebounce((newFilters) => setBuilderFilters(newFilters), 300);

  const mergedFilterState = useMemo(() => {
    const userFilters = convertHomeFiltersToLangfuse(builderFilters);
    const environmentFilter = convertEnvironmentsToFilter(selectedEnvironments, environmentOptions);
    return [...userFilters, ...environmentFilter];
  }, [builderFilters, selectedEnvironments, environmentOptions]);


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


  // ▼▼▼▼▼ [여기부터] ScoresTable 데이터 로딩 useEffect 추가 ▼▼▼▼▼
      // ScoresTable 데이터 로딩 (최종 수정)
  useEffect(() => {
    const fetchScoresData = async () => {
      if (!projectId || !dateRange.startDate || !dateRange.endDate) return;
      setIsScoresTableLoading(true);
      setScoresTableError(null);

      // trpcGet 함수를 직접 사용하기 위해 dashboardApi.js에서 가져옴
      // (파일 상단에 import { trpcGet } from ... 가 필요할 수 있으나, 전역으로 선언되어 있다면 생략 가능)
      // 여기서는 dashboardApi.js에 있는 trpcGet을 직접 호출하는 형식으로 가정함.
      // 실제로는 dashboardApi.js를 수정해야 할 수도 있음.
      async function trpcGet(path, inputObj) {
          const input = encodeURIComponent(JSON.stringify({ json: inputObj || {} }));
          const res = await fetch(`/api/trpc/${path}?input=${input}`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
          const json = await res.json();
          return json?.result?.data?.json ?? json?.result?.data ?? json;
      }

      try {
        const baseFilter = [
            ...mergedFilterState,
            { type: "datetime", column: "scoreTimestamp", operator: ">", value: dateRange.startDate.toISOString() },
            { type: "datetime", column: "scoreTimestamp", operator: "<", value: dateRange.endDate.toISOString() },
        ];
        
        const basePayload = {
            projectId,
            from: "traces_scores",
            select: [{"column":"scoreName"},{"column":"scoreId","agg":"COUNT"},{"column":"value","agg":"AVG"},{"column":"scoreSource"},{"column":"scoreDataType"}],
            groupBy: [{"type":"string","column":"scoreName"},{"type":"string","column":"scoreSource"},{"type":"string","column":"scoreDataType"}],
            orderBy: [{"column":"scoreId","direction":"DESC","agg":"COUNT"}],
            queryName:"score-aggregate"
        };
        
        const [metricsResult, zeroValueResult, oneValueResult] = await Promise.all([
          trpcGet("dashboard.chart", { ...basePayload, filter: baseFilter }),
          trpcGet("dashboard.chart", { ...basePayload, select: [{"column":"scoreName"},{"column":"scoreId","agg":"COUNT"},{"column":"scoreSource"},{"column":"scoreDataType"}], filter: [...baseFilter, { column: "value", operator: "=", value: 0, type: "number" }] }),
          trpcGet("dashboard.chart", { ...basePayload, select: [{"column":"scoreName"},{"column":"scoreId","agg":"COUNT"},{"column":"scoreSource"},{"column":"scoreDataType"}], filter: [...baseFilter, { column: "value", operator: "=", value: 1, type: "number" }] }),
        ]);

        const metricsData = metricsResult || [];
        const zeroData = zeroValueResult || [];
        const oneData = oneValueResult || [];
        
        const processedData = metricsData.map(metric => {
          const keyFn = item => item.scoreName === metric.scoreName && item.scoreSource === metric.scoreSource && item.scoreDataType === metric.scoreDataType;
          const zeroMatch = zeroData.find(keyFn);
          const oneMatch = oneData.find(keyFn);

          return {
            ...metric,
            zeroValueScore: zeroMatch?.countScoreId || 0,
            oneValueScore: oneMatch?.countScoreId || 0,
          };
        });
        
        setScoresTableData(processedData);

      } catch (error) {
        console.error("Error fetching Scores Table data:", error);
        setScoresTableError(error);
      } finally {
        setIsScoresTableLoading(false);
      }
    };
    fetchScoresData();
  }, [projectId, mergedFilterState, dateRange]); // mergedFilterState 다시 추가
  // ▲▲▲▲▲ [여기까지] ScoresTable 데이터 로딩 useEffect 추가 ▲▲▲▲▲


// ▼▼▼ 5. ChartScores 데이터 로딩을 위한 useEffect 추가 ▼▼▼
// 'ChartScores' 데이터 로딩을 위한 useEffect
useEffect(() => {
  const fetchChartScoresData = async () => {
    if (!projectId || !dateRange.startDate || !dateRange.endDate) return;
    setIsChartScoresLoading(true);
    setChartScoresError(null);
    try {
      const fromTimestamp = dateRange.startDate.toISOString();
      const toTimestamp = dateRange.endDate.toISOString();
      
      // ▼▼▼ [수정] 여기를 'hour'에서 'day'로 변경 ▼▼▼
      const timeDimension = { granularity: "day" }; 

      const query = {
        view: "scores-numeric",
        dimensions: [
          { field: "name" },
          { field: "dataType" },
          { field: "source" },
        ],
        metrics: [{ measure: "value", aggregation: "avg" }],
        filters: mergedFilterState,
        timeDimension, // 수정된 timeDimension 사용
        fromTimestamp,
        toTimestamp,
        orderBy: null,
      };

      const result = await widgetAPI.executeQuery(projectId, query);
      if (!result.success) { throw new Error(result.error || "Failed to fetch chart scores data"); }
      
      // ▼▼▼ [수정] API 응답 데이터가 배열이 아닐 경우를 대비한 방어 코드 추가 ▼▼▼
      const rawData = result.data;
      const processedData = Array.isArray(rawData) && rawData.length > 0
        ? fillMissingValuesAndTransform(
          extractTimeSeriesData(rawData, "time_dimension", [
            {
              uniqueIdentifierColumns: [
                { accessor: "data_type", formatFct: (value) => getScoreDataTypeIcon(value) },
                { accessor: "name" },
                { accessor: "source", formatFct: (value) => `(${value.toLowerCase()})` },
              ],
              valueColumn: "avg_value",
            },
          ]),
        )
        : [];
      setChartScoresData(processedData);
    } catch (error) {
      console.error("Error fetching Chart Scores data:", error);
      setChartScoresError(error);
    } finally {
      setIsChartScoresLoading(false);
    }
  };
  fetchChartScoresData();
}, [projectId, mergedFilterState, dateRange]);



// 🎯 3. ModelUsageChart의 모델 목록을 가져오는 로직 (useModelSelection 훅 대체)
 // ModelUsageChart 데이터 로딩
  useEffect(() => {
    const fetchModelData = async () => {
      if (!projectId || !dateRange.startDate || !dateRange.endDate || environmentOptions.length === 0) return;

      setIsModelUsageLoading(true);
      setModelUsageError(null);

      try {
        const fromTimestamp = dateRange.startDate.toISOString();
        const toTimestamp = dateRange.endDate.toISOString();
        
        // 🎯 1. 모델 목록 가져오기 (최신 API 사용, environment 필터 없음)
        const modelsResult = await widgetAPI.executeQuery(projectId, {
            view: "observations",
            dimensions: [{ field: "providedModelName" }],
            metrics: [],
            filters: [OBSERVATION_TYPES_FILTER_FOR_MODELS],
            timeDimension: null, fromTimestamp, toTimestamp, orderBy: null,
        });

        if (!modelsResult.success) throw new Error(`Failed to fetch model list: ${modelsResult.error}`);
        
        const availableModels = (modelsResult.data || []).map(item => item.providedModelName).filter(Boolean);
        setAllModels(availableModels.map(m => ({ model: m })));
        setSelectedModels(availableModels);
        
        if (availableModels.length === 0) {
            setModelUsageData({ costByModel: [], costByType: [], unitsByModel: [], unitsByType: [] });
            setIsModelUsageLoading(false);
            return;
        }

        // 🎯 2. 차트 데이터 요청을 위한 공통 필터 준비 (여기에는 environment 필터 포함)
        const userFilters = convertHomeFiltersToLangfuse(builderFilters);
        const environmentFilter = selectedEnvironments.length > 0
          ? convertEnvironmentsToFilter(selectedEnvironments, environmentOptions)
          : [{ type: "stringOptions", column: "environment", operator: "any of", value: environmentOptions }];
        const modelFilter = { column: "providedModelName", operator: "any of", value: availableModels, type: "stringOptions" };
        const modelFilterLegacy = { type: "stringOptions", column: "model", operator: "any of", value: availableModels };

        const chartBaseFilterNewApi = [...userFilters, ...environmentFilter, OBSERVATION_TYPES_FILTER_FOR_CHARTS, modelFilter];
        const chartBaseFilterLegacyApi = [
            { type: "datetime", column: "startTime", operator: ">", value: fromTimestamp },
            { type: "datetime", column: "startTime", operator: "<", value: toTimestamp },
            ...userFilters, ...environmentFilter, OBSERVATION_TYPES_FILTER_FOR_CHARTS, modelFilterLegacy
        ];
        
        async function trpcGet(path, inputObj) {
            const input = encodeURIComponent(JSON.stringify({ json: inputObj || {} }));
            const res = await fetch(`/api/trpc/${path}?input=${input}`, { credentials: "include" });
            if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
            const json = await res.json();
            return json?.result?.data?.json ?? json?.result?.data ?? json;
        }

        // 🎯 3. 각 탭에 맞는 API로 데이터 요청
        const [costByModelRes, unitsByModelRes, costByTypeRes, unitsByTypeRes] = await Promise.all([
          // "By Model" 탭들은 최신 API 사용
          widgetAPI.executeQuery(projectId, { view: "observations", dimensions: [{ field: "providedModelName" }], metrics: [{ measure: "totalCost", aggregation: "sum" }], filters: chartBaseFilterNewApi, timeDimension: { granularity: "day" }, fromTimestamp, toTimestamp, orderBy: null }),
          widgetAPI.executeQuery(projectId, { view: "observations", dimensions: [{ field: "providedModelName" }], metrics: [{ measure: "totalTokens", aggregation: "sum" }], filters: chartBaseFilterNewApi, timeDimension: { granularity: "day" }, fromTimestamp, toTimestamp, orderBy: null }),
          // "By Type" 탭들은 구형 API 사용
          trpcGet("dashboard.chart", { projectId, from: "traces_observations", select: [{ column: "calculatedTotalCost", agg: "SUM" }], filter: chartBaseFilterLegacyApi, groupBy: [{ type: "datetime", column: "startTime", temporalUnit: "day" }, { type: "string", column: "key" }], queryName: "observations-cost-by-type-timeseries" }),
          trpcGet("dashboard.chart", { projectId, from: "traces_observations", select: [{ column: "totalTokens", agg: "SUM" }], filter: chartBaseFilterLegacyApi, groupBy: [{ type: "datetime", column: "startTime", temporalUnit: "day" }, { type: "string", column: "key" }], queryName: "observations-usage-by-type-timeseries" })
        ]);

        const processNewApiData = (response, valueColumn, labelColumn) => {
            if (!response.success || !Array.isArray(response.data)) return [];
            return fillMissingValuesAndTransform(extractTimeSeriesData(response.data, "time_dimension", [{
                uniqueIdentifierColumns: [{ accessor: labelColumn }],
                valueColumn: valueColumn,
            }]));
        };
        
        setModelUsageData({
            costByModel: processNewApiData(costByModelRes, "sum_totalCost", "providedModelName"),
            unitsByModel: processNewApiData(unitsByModelRes, "sum_totalTokens", "providedModelName"),
            costByType: processUnpivotedData(costByTypeRes, "intervalStart", "key", "sum"),
            unitsByType: processUnpivotedData(unitsByTypeRes, "intervalStart", "key", "sum"),
        });

      } catch (error) {
        console.error("Error fetching model usage data:", error);
        setModelUsageError(error);
      } finally {
        setIsModelUsageLoading(false);
      }
    };
    fetchModelData();
  }, [projectId, builderFilters, selectedEnvironments, environmentOptions, dateRange]);

  const isAllModelsSelected = useMemo(() => allModels.length > 0 && allModels.length === selectedModels.length, [allModels, selectedModels]);
  const modelSelectorText = useMemo(() => {
    if (isAllModelsSelected || selectedModels.length === 0) return "All models";
    if (selectedModels.length === 1) return selectedModels[0];
    return `${selectedModels.length} models`;
  }, [isAllModelsSelected, selectedModels]);
  
  const handleSelectAllModels = useCallback(() => {
    setSelectedModels(isAllModelsSelected ? [] : allModels.map(m => m.model));
  }, [isAllModelsSelected, allModels]);



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
                {/* ▼▼▼▼▼ [여기] 첫 번째 chartRow 레이아웃을 수정 ▼▼▼▼▼ */}
        <div className={`${styles.chartRow} ${styles.cols3}`}>
          <TracesBarListChart projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
          <ModelCostTable projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
          <DashboardCard title="Scores" isLoading={isScoresTableLoading} error={scoresTableError}>
            <ScoresTable data={scoresTableData} isLoading={isScoresTableLoading} />
          </DashboardCard>
        </div>
        {/* ▲▲▲▲▲ [여기까지] 수정 ▲▲▲▲▲ */}

        <div className={`${styles.chartRow} ${styles.cols2}`}>
          <DashboardCard title="Traces by Time" isLoading={isTracesByTimeLoading}>
            <TracesAndObservationsTimeSeriesChart data={tracesByTimeData} isLoading={isTracesByTimeLoading} error={tracesByTimeError} agg={"7 days"} chartType="area" />
          </DashboardCard>
          {/* 🎯 5. Placeholder를 실제 ModelUsageChart 컴포넌트로 교체 */}
           <DashboardCard title="Model Usage" isLoading={isModelUsageLoading} error={modelUsageError}>
            <ModelUsageChart
              data={modelUsageData}
              isLoading={isModelUsageLoading}
              agg="1 day"
              allModels={allModels}
              selectedModels={selectedModels}
              setSelectedModels={setSelectedModels}
              isAllSelected={isAllModelsSelected}
              buttonText={modelSelectorText}
              handleSelectAll={handleSelectAllModels}
            />
          </DashboardCard>
        </div>
        <div className={`${styles.chartRow} ${styles.cols2}`}>
            <UserChart projectId={projectId} globalFilterState={mergedFilterState} fromTimestamp={dateRange.startDate} toTimestamp={dateRange.endDate} isLoading={isLoading || filterOptionsLoading} />
          {/* 🎯 [수정] 이 부분을 우리가 만든 ChartScores로 교체합니다. */}
          <DashboardCard title="Scores" description="Moving average per score" isLoading={isChartScoresLoading} error={chartScoresError}>
            <ChartScores
              data={chartScoresData}
              isLoading={isChartScoresLoading}
              agg="1 day" // 데이터 단위가 day로 바뀌었으므로 agg도 맞춰줍니다.
              totalCount={totalScoresCount}
           />
          </DashboardCard>
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
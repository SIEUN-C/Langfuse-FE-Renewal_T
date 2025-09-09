// src/Pages/Widget/pages/EditWidget.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { startCase } from "lodash";
import styles from './NewWidget.module.css';
import { 
  getViewOptions, 
  getMeasureOptions, 
  getAggregationOptions, 
  getAvailableMeasures, 
  getAvailableAggregations,
  getDimensionOptions,
  isValidViewMeasureAggregation,
  getMeasuresForView,
  getDefaultAggregationForMeasure
} from '../services/viewMappings';

// 차트 라이브러리 import
import Chart from '../chart-library/Chart.jsx';

// API 서비스 import
import api from '../services/index.js';

// 수정: 올바른 DateRangePicker import
import DateRangePicker from "../components/DateRangePicker";
import { widgetFilterConfig } from '../../../components/FilterControls/filterConfig.js';

// 공통 컴포넌트 imports
import FiltersEditor from '../components/FiltersEditor';
import IntegratedMetricsSelector from '../components/IntegratedMetricsSelector';
import PivotControls from '../components/PivotControls';

// 아이콘 import
import { 
  BarChart,
  PieChart,
  LineChart,
  BarChartHorizontal,
  Hash,
  BarChart3,
  Table,
  Plus,
  X,
  ArrowLeft
} from "lucide-react";

// 히스토그램을 포함한 집계 옵션
const AGGREGATION_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "p50", label: "P50" },
  { value: "p75", label: "P75" },
  { value: "p90", label: "P90" },
  { value: "p95", label: "P95" },
  { value: "p99", label: "P99" },
  { value: "histogram", label: "Histogram" }
];

// 기본 UI 컴포넌트들 (NewWidget과 동일)
const Card = ({ children, className = "" }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className={styles.cardHeader}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`${styles.cardContent} ${className}`}>{children}</div>
);

const CardTitle = ({ children }) => (
  <h3 className={styles.cardTitle}>{children}</h3>
);

const CardDescription = ({ children }) => (
  <p className={styles.cardDescription}>{children}</p>
);

const CardFooter = ({ children }) => (
  <div className={styles.cardFooter}>{children}</div>
);

const Select = ({ value, onValueChange, children, disabled = false }) => (
  <select 
    className={styles.select} 
    value={value} 
    onChange={(e) => onValueChange(e.target.value)}
    disabled={disabled}
  >
    {children}
  </select>
);

const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

const SelectGroup = ({ children }) => (
  <optgroup>{children}</optgroup>
);

const SelectLabel = ({ children }) => (
  <option disabled>{children}</option>
);

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className={styles.label}>{children}</label>
);

const Input = ({ type = "text", value, onChange, placeholder, className = "", ...props }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`${styles.input} ${className}`}
    {...props}
  />
);

const Button = ({ children, onClick, className = "", disabled = false, variant = "primary", size = "default" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.button} ${styles[variant]} ${className}`}
  >
    {children}
  </button>
);

// 차트 타입 설정 (NewWidget과 동일)
const chartTypes = [
  {
    group: "total-value",
    name: "Big Number",
    value: "NUMBER",
    icon: Hash,
    supportsBreakdown: false,
  },
  {
    group: "time-series",
    name: "Line Chart",
    value: "LINE_TIME_SERIES",
    icon: LineChart,
    supportsBreakdown: true,
  },
  {
    group: "time-series",
    name: "Vertical Bar Chart",
    value: "BAR_TIME_SERIES",
    icon: BarChart,
    supportsBreakdown: true,
  },
  {
    group: "total-value",
    name: "Horizontal Bar Chart",
    value: "HORIZONTAL_BAR",
    icon: BarChartHorizontal,
    supportsBreakdown: true,
  },
  {
    group: "total-value",
    name: "Vertical Bar Chart",
    value: "VERTICAL_BAR",
    icon: BarChart,
    supportsBreakdown: true,
  },
  {
    group: "total-value",
    name: "Histogram",
    value: "HISTOGRAM",
    icon: BarChart3,
    supportsBreakdown: false,
  },
  {
    group: "total-value",
    name: "Pie Chart",
    value: "PIE",
    icon: PieChart,
    supportsBreakdown: true,
  },
  {
    group: "total-value",
    name: "Pivot Table",
    value: "PIVOT_TABLE",
    icon: Table,
    supportsBreakdown: true,
  },
];

// View 선언 (NewWidget과 동일)
const viewDeclarations = {
  traces: {
    description: "Trace-level data",
    measures: {
      count: { description: "Number of traces", unit: "traces", type: "number" },
      latency: { description: "Average latency", unit: "ms", type: "number" },
      totalCost: { description: "Total cost", unit: "USD", type: "number" },
      totalTokens: { description: "Total tokens", unit: "tokens", type: "number" },
      duration: { description: "Duration", unit: "ms", type: "number" }
    },
    dimensions: {
      environment: { description: "Environment", type: "string" },
      traceName: { description: "Trace name", type: "string" },
      release: { description: "Release", type: "string" },
      version: { description: "Version", type: "string" },
      user: { description: "User ID", type: "string" },
      session: { description: "Session ID", type: "string" }
    }
  },
  observations: {
    description: "Observation-level data",
    measures: {
      count: { description: "Number of observations", unit: "observations", type: "number" },
      latency: { description: "Average latency", unit: "ms", type: "number" },
      cost: { description: "Cost", unit: "USD", type: "number" },
      input_tokens: { description: "Input tokens", unit: "tokens", type: "number" },
      output_tokens: { description: "Output tokens", unit: "tokens", type: "number" }
    },
    dimensions: {
      environment: { description: "Environment", type: "string" },
      observationName: { description: "Observation name", type: "string" },
      release: { description: "Release", type: "string" },
      version: { description: "Version", type: "string" },
      user: { description: "User ID", type: "string" },
      session: { description: "Session ID", type: "string" }
    }
  },
  "scores-numeric": {
    description: "Numeric score data",
    measures: {
      count: { description: "Number of scores", unit: "scores", type: "number" },
      value: { description: "Score value", unit: "score", type: "number" }
    },
    dimensions: {
      environment: { description: "Environment", type: "string" },
      scoreName: { description: "Score name", type: "string" },
      release: { description: "Release", type: "string" },
      version: { description: "Version", type: "string" },
      user: { description: "User ID", type: "string" },
      session: { description: "Session ID", type: "string" }
    }
  },
  "scores-categorical": {
    description: "Categorical score data",
    measures: {
      count: { description: "Number of scores", unit: "scores", type: "number" },
      scores_count: { description: "Scores count", unit: "scores", type: "number" }
    },
    dimensions: {
      environment: { description: "Environment", type: "string" },
      scoreName: { description: "Score name", type: "string" },
      stringValue: { description: "String value", type: "string" },
      release: { description: "Release", type: "string" },
      version: { description: "Version", type: "string" },
      user: { description: "User ID", type: "string" },
      session: { description: "Session ID", type: "string" }
    }
  }
};

// 유틸리티 함수들 (NewWidget과 동일)
const isTimeSeriesChart = (t) => ["LINE_TIME_SERIES", "BAR_TIME_SERIES"].includes(String(t));

const formatMetricName = (metricName) => {
  const cleanedName = metricName === "count_count" ? "Count" : metricName;
  return startCase(cleanedName);
};

const buildWidgetName = ({ aggregation, measure, dimension, view, metrics, isMultiMetric = false }) => {
  let base;

  if (isMultiMetric && metrics && metrics.length > 0) {
    const metricDisplay = metrics.map(formatMetricName).join(", ");
    base = metricDisplay;
  } else {
    const meas = formatMetricName(measure);
    if (measure.toLowerCase() === "count") {
      base = meas;
    } else {
      const agg = startCase(aggregation.toLowerCase());
      base = `${agg} ${meas}`;
    }
  }

  if (dimension && dimension !== "") {
    base += ` by ${startCase(dimension)}`;
  }
  base += ` (${startCase(view)})`;
  return base;
};

const buildWidgetDescription = ({ aggregation, measure, dimension, view, filters, metrics, isMultiMetric = false }) => {
  const viewLabel = startCase(view);
  let sentence;

  if (isMultiMetric && metrics && metrics.length > 0) {
    const metricDisplay = metrics.map(formatMetricName).join(", ");
    sentence = `Shows ${metricDisplay.toLowerCase()} of ${viewLabel}`;
  } else {
    const measLabel = formatMetricName(measure);

    if (measure.toLowerCase() === "count") {
      sentence = `Shows the count of ${viewLabel}`;
    } else {
      const aggLabel = startCase(aggregation.toLowerCase());
      sentence = `Shows the ${aggLabel.toLowerCase()} ${measLabel.toLowerCase()} of ${viewLabel}`;
    }
  }

  if (dimension && dimension !== "") {
    sentence += ` by ${startCase(dimension).toLowerCase()}`;
  }

  if (filters && filters.length > 0) {
    if (filters.length <= 2) {
      const cols = filters.map((f) => startCase(f.column || f.field)).join(" and ");
      sentence += `, filtered by ${cols}`;
    } else {
      sentence += `, filtered by ${filters.length} conditions`;
    }
  }

  return sentence;
};

// 필터 변환 함수들 (NewWidget과 동일)
const transformFiltersToWidgetFormat = (builderFilters) => {
  return builderFilters.map(filter => {
    const columnConfig = widgetFilterConfig.find(config => config.key === filter.column);
    let columnType = columnConfig?.type || 'string';
    
    if (columnType === 'categorical') {
      columnType = 'string';
    }
    
    let columnName = filter.column;
    switch (filter.column) {
      case 'session':
        columnName = 'sessionId';
        break;
      case 'user':
        columnName = 'userId';
        break;
      case 'traceName':
        columnName = 'name';
        break;
      default:
        columnName = filter.column;
        break;
    }
    
    let operator;
    switch (filter.operator) {
      case 'anyOf':
        operator = '=';
        break;
      case 'noneOf':
        operator = 'does not contain';
        break;
      case 'contains':
        operator = 'contains';
        break;
      default:
        operator = '=';
        break;
    }
    
    return {
      column: columnName,
      type: columnType,
      operator: operator,
      value: Array.isArray(filter.values) ? filter.values.join(',') : filter.values || '',
      metaKey: filter.metaKey || ''
    };
  });
};

// 위젯 데이터를 UI 형식으로 변환하는 함수
const transformWidgetToUIFormat = (widget) => {
  console.log("변환할 위젯 데이터:", widget);

  const transformedData = {
    // 기본 정보
    name: widget.name || "Untitled Widget",
    description: widget.description || "",
    view: widget.view || "traces",
    chartType: widget.chartType || "LINE_TIME_SERIES",
    
    // 메트릭 처리
    metrics: widget.metrics || [{ measure: "count", agg: "count" }],
    
    // 차원 처리
    dimensions: widget.dimensions || [],
    
    // 필터 처리 - API 형식을 UI 형식으로 변환
    filters: (widget.filters || []).map(filter => ({
      id: Date.now() + Math.random(),
      column: filter.column,
      operator: filter.operator === '=' ? 'anyOf' : 
                filter.operator === 'does not contain' ? 'noneOf' :
                filter.operator === 'contains' ? 'contains' : 'anyOf',
      values: typeof filter.value === 'string' ? 
              filter.value.split(',').map(v => v.trim()).filter(Boolean) : 
              Array.isArray(filter.value) ? filter.value : [],
      metaKey: filter.metaKey || ''
    })),
    
    // 차트 설정
    chartConfig: widget.chartConfig || { type: widget.chartType || "LINE_TIME_SERIES" }
  };

  console.log("변환된 UI 데이터:", transformedData);
  return transformedData;
};

export default function EditWidget() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: urlProjectId, widgetId } = useParams();

  // 프로젝트 ID 해결
  const projectId = urlProjectId || searchParams.get("projectId") || "demo-project";

  // getDimensionsForView 함수 정의
  const getDimensionsForView = useCallback((view) => {
    const viewDeclaration = viewDeclarations[view];
    if (!viewDeclaration) return [];
    
    return Object.entries(viewDeclaration.dimensions)
      .map(([key, meta]) => ({
        value: key,
        label: startCase(key),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  // 위젯 로딩 상태
  const [originalWidget, setOriginalWidget] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [widgetError, setWidgetError] = useState(null);

  // 폼 상태 - 기본 정보
  const [widgetName, setWidgetName] = useState("");
  const [widgetDescription, setWidgetDescription] = useState("");
  const [autoLocked, setAutoLocked] = useState(false);

  // 폼 상태 - 데이터 선택
  const [selectedView, setSelectedView] = useState("traces");
  const [selectedMeasure, setSelectedMeasure] = useState("count");
  const [selectedAggregation, setSelectedAggregation] = useState("count");
  const [selectedDimension, setSelectedDimension] = useState(""); 

  // 피벗 테이블 전용
  const [selectedMetrics, setSelectedMetrics] = useState([{
    id: "count_count",
    measure: "count",
    aggregation: "count",
    label: "Count Count"
  }]);
  const [pivotDimensions, setPivotDimensions] = useState([]);

  // 시각화 설정
  const [selectedChartType, setSelectedChartType] = useState("LINE_TIME_SERIES");
  const [rowLimit, setRowLimit] = useState(100);
  const [histogramBins, setHistogramBins] = useState(10);

  // 피벗 테이블 정렬
  const [defaultSortColumn, setDefaultSortColumn] = useState("");
  const [defaultSortOrder, setDefaultSortOrder] = useState("DESC");
  const [showSubtotals, setShowSubtotals] = useState(false);

  // 필터와 날짜
  const [userFilterState, setUserFilterState] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  // 로딩과 저장
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [saving, setSaving] = useState(false);

  // API 초기화
  useEffect(() => {
    if (projectId) {
      api.setProjectId(projectId);
    }
  }, [projectId]);

  // 위젯 데이터 로딩
  useEffect(() => {
    const loadWidget = async () => {
      if (!projectId || !widgetId) {
        setWidgetError("Project ID and Widget ID are required");
        setWidgetLoading(false);
        return;
      }

      try {
        setWidgetLoading(true);
        setWidgetError(null);

        console.log("위젯 로딩 시작:", { projectId, widgetId });

        // dashboardWidgets.get API 호출
        const response = await api.trpcGet("dashboardWidgets.get", {
          projectId,
          widgetId
        });

        console.log("위젯 로딩 응답:", response);

        if (response) {
          setOriginalWidget(response);
          
          // 위젯 데이터를 UI 형식으로 변환하여 폼에 설정
          const uiData = transformWidgetToUIFormat(response);
          
          // 기본 정보 설정
          setWidgetName(uiData.name);
          setWidgetDescription(uiData.description);
          setSelectedView(uiData.view);
          setSelectedChartType(uiData.chartType);
          
          // 메트릭 설정
          if (uiData.metrics && uiData.metrics.length > 0) {
            const firstMetric = uiData.metrics[0];
            setSelectedMeasure(firstMetric.measure || "count");
            setSelectedAggregation(firstMetric.agg || firstMetric.aggregation || "count");
            
            if (uiData.chartType === "PIVOT_TABLE") {
              const formattedMetrics = uiData.metrics.map((metric, index) => ({
                id: `${metric.agg || metric.aggregation}_${metric.measure}_${index}`,
                measure: metric.measure,
                aggregation: metric.agg || metric.aggregation,
                label: `${startCase(metric.agg || metric.aggregation)} ${startCase(metric.measure)}`
              }));
              setSelectedMetrics(formattedMetrics);
            }
          }
          
          // 차원 설정
          if (uiData.dimensions && uiData.dimensions.length > 0) {
            if (uiData.chartType === "PIVOT_TABLE") {
              setPivotDimensions(uiData.dimensions.map(d => d.field || d));
            } else {
              setSelectedDimension(uiData.dimensions[0]?.field || uiData.dimensions[0] || "");
            }
          }
          
          // 필터 설정
          setUserFilterState(uiData.filters);
          
          // 차트 설정
          if (uiData.chartConfig) {
            if (uiData.chartConfig.bins) {
              setHistogramBins(uiData.chartConfig.bins);
            }
            if (uiData.chartConfig.row_limit) {
              setRowLimit(uiData.chartConfig.row_limit);
            }
            if (uiData.chartConfig.defaultSort) {
              setDefaultSortColumn(uiData.chartConfig.defaultSort.column || "");
              setDefaultSortOrder(uiData.chartConfig.defaultSort.order || "DESC");
            }
          }
          
          setAutoLocked(true); // 로딩된 데이터는 자동 업데이트 비활성화
          
        } else {
          throw new Error("Widget not found");
        }
      } catch (error) {
        console.error("위젯 로딩 실패:", error);
        setWidgetError(error.message || "Failed to load widget");
      } finally {
        setWidgetLoading(false);
      }
    };

    loadWidget();
  }, [projectId, widgetId]);

  // 차트 타입 변경 핸들러 (NewWidget과 동일)
  const handleChartTypeChange = (newChartType) => {
    console.log("차트 타입 변경:", selectedChartType, "→", newChartType);
    
    const oldChartType = selectedChartType;
    setSelectedChartType(newChartType);
    
    if (newChartType === "HISTOGRAM") {
      console.log("히스토그램 차트로 변경됨, aggregation을 histogram으로 설정");
      setSelectedAggregation("histogram");
      
      if (selectedMetrics && selectedMetrics.length > 0) {
        const updatedMetrics = selectedMetrics.map((metric, index) => {
          const measureLabel = getMeasuresForView(selectedView).find(m => m.value === metric.measure)?.label || metric.measure;
          return {
            ...metric,
            aggregation: "histogram",
            id: `histogram_${metric.measure}_${index}`,
            label: `Histogram ${measureLabel}`
          };
        });
        setSelectedMetrics(updatedMetrics);
      }
    } else if (oldChartType === "HISTOGRAM" && newChartType !== "HISTOGRAM") {
      console.log("히스토그램에서 다른 차트로 변경됨, 기본 집계로 복원");
      
      const defaultAgg = getDefaultAggregationForMeasure(selectedMeasure, selectedView, false);
      setSelectedAggregation(defaultAgg);
      
      if (selectedMetrics && selectedMetrics.length > 0) {
        const updatedMetrics = selectedMetrics.map((metric, index) => {
          const defaultAgg = getDefaultAggregationForMeasure(metric.measure, selectedView, false);
          const measureLabel = getMeasuresForView(selectedView).find(m => m.value === metric.measure)?.label || metric.measure;
          const aggLabel = AGGREGATION_OPTIONS.find(a => a.value === defaultAgg)?.label || defaultAgg;
          
          return {
            ...metric,
            aggregation: defaultAgg,
            id: `${defaultAgg}_${metric.measure}_${index}`,
            label: `${aggLabel} ${measureLabel}`
          };
        });
        setSelectedMetrics(updatedMetrics);
      }
    }
    
    if (newChartType === "PIVOT_TABLE") {
      if (!selectedMetrics || selectedMetrics.length === 0) {
        setSelectedMetrics([{
          measure: selectedMeasure || "count",
          aggregation: selectedAggregation || "count",
          id: `${selectedAggregation || "count"}_${selectedMeasure || "count"}_0`,
          label: `${selectedAggregation || "Count"} ${selectedMeasure || "Count"}`
        }]);
      }
    } else if (oldChartType === "PIVOT_TABLE" && newChartType !== "PIVOT_TABLE") {
      if (selectedMetrics && selectedMetrics.length > 0) {
        const firstMetric = selectedMetrics[0];
        setSelectedMeasure(firstMetric.measure);
        setSelectedAggregation(firstMetric.aggregation);
      }
    }
  };

  // 사용 가능한 차원 (NewWidget과 동일)
  const availableDimensions = useMemo(() => {
    const viewDeclaration = viewDeclarations[selectedView];
    return Object.entries(viewDeclaration.dimensions)
      .map(([key]) => ({
        value: key,
        label: startCase(key),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedView]);

  const updatePivotDimension = (index, value) => {
    const newDimensions = [...pivotDimensions];
    if (value && value !== "") {
      newDimensions[index] = value;
    } else {
      newDimensions.splice(index);
    }
    setPivotDimensions(newDimensions);
  };

  // 쿼리 빌드 (NewWidget과 동일)
  const query = useMemo(() => {
    const fromTimestamp = startDate;
    const toTimestamp = endDate;

    const queryDimensions = selectedChartType === "PIVOT_TABLE"
      ? pivotDimensions.map((field) => ({ field }))
      : selectedDimension !== ""
        ? [{ field: selectedDimension }]
        : [];

    const queryMetrics = selectedChartType === "PIVOT_TABLE"
      ? selectedMetrics
          .filter((metric) => metric.measure && metric.measure !== "")
          .map((metric) => ({
            measure: metric.measure,
            aggregation: metric.aggregation,
          }))
      : [{ measure: selectedMeasure, aggregation: selectedAggregation }];

    const transformedFilters = transformFiltersToWidgetFormat(userFilterState.filter(f => 
      f.column && (f.values && f.values.length > 0)
    ));

    return {
      view: selectedView,
      dimensions: queryDimensions,
      metrics: queryMetrics,
      filters: transformedFilters,
      timeDimension: isTimeSeriesChart(selectedChartType) ? { granularity: "auto" } : null,
      fromTimestamp: fromTimestamp.toISOString(),
      toTimestamp: toTimestamp.toISOString(),
      chartType: selectedChartType,
      chartConfig: selectedChartType === "HISTOGRAM"
        ? { type: selectedChartType, bins: histogramBins }
        : selectedChartType === "PIVOT_TABLE"
          ? {
              type: selectedChartType,
              dimensions: pivotDimensions,
              row_limit: rowLimit,
              defaultSort: defaultSortColumn && defaultSortColumn !== ""
                ? { column: defaultSortColumn, order: defaultSortOrder }
                : undefined,
            }
          : { type: selectedChartType, row_limit: rowLimit },
    };
  }, [
    selectedView, selectedDimension, selectedAggregation, selectedMeasure, selectedMetrics,
    userFilterState, startDate, endDate, selectedChartType, histogramBins, pivotDimensions, rowLimit,
    defaultSortColumn, defaultSortOrder
  ]);

  // 미리보기 데이터 가져오기 (NewWidget과 동일)
  const refreshPreview = useCallback(async () => {
    if (!projectId) {
      setPreviewError("Project ID is required");
      return;
    }
    
    setLoading(true);
    setPreviewError("");

    try {
      const response = await api.executeQuery(query);
      if (response.success && response.data) {
        const chartData = response.data.chartData || [];
        
        const transformedData = chartData.map((item, index) => ({
          time_dimension: item.time_dimension || item.timestamp || item.date,
          dimension: item.dimension || item.name || item[selectedDimension] || `Item ${index + 1}`,
          metric: typeof item.metric === 'number' ? item.metric : 
                  typeof item.value === 'number' ? item.value :
                  Object.values(item).find(v => typeof v === 'number') || 0,
          ...item
        }));
        
        setPreviewData(transformedData);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewError(error?.message || String(error));
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, query, selectedDimension]);

  // 미리보기 새로고침 (NewWidget과 동일)
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [refreshPreview]);

  // 차원 재설정 (NewWidget과 동일)
  useEffect(() => {
    if (
      chartTypes.find((c) => c.value === selectedChartType)?.supportsBreakdown === false &&
      selectedDimension !== ""
    ) {
      setSelectedDimension("");
    }
  }, [selectedChartType, selectedDimension]);

  // 피벗 테이블 차원 재설정 (NewWidget과 동일)
  useEffect(() => {
    if (selectedChartType !== "PIVOT_TABLE" && pivotDimensions.length > 0) {
      setPivotDimensions([]);
    }
  }, [selectedChartType, pivotDimensions.length]);

  // 다중 메트릭 재설정 (NewWidget과 동일)
  useEffect(() => {
    if (selectedChartType !== "PIVOT_TABLE" && selectedMetrics.length > 1) {
      setSelectedMetrics(selectedMetrics.slice(0, 1));
    }
  }, [selectedChartType, selectedMetrics]);

  // 위젯 업데이트 핸들러
// handleUpdate 함수와 handleCancel 함수 수정
const handleUpdate = async () => {
  if (!projectId || !widgetId) {
    alert("Project ID and Widget ID are required");
    return;
  }
  
  setSaving(true);
  console.log("🚀 위젯 업데이트 시작");
  
  try {
    // 위젯 데이터 준비
    const activeFilters = userFilterState.filter(f => 
      f.column && (f.values && f.values.length > 0)
    );
    
    console.log("📊 현재 선택된 차트 타입:", selectedChartType);
    
    // 차트 설정 강화
    let chartConfig;
    
    switch(selectedChartType) {
      case "HISTOGRAM":
        chartConfig = { type: "HISTOGRAM", bins: histogramBins };
        break;
      case "PIVOT_TABLE":
       chartConfig = {
        type: "PIVOT_TABLE",
        dimensions: pivotDimensions,
        row_limit: rowLimit,
        defaultSort: defaultSortColumn && defaultSortColumn !== ""
          ? { column: defaultSortColumn, order: defaultSortOrder }
          : undefined,
      };
        break;
      case "NUMBER":
        chartConfig = { type: "NUMBER" };
        break;
      case "PIE":
        chartConfig = { type: "PIE", row_limit: rowLimit };
        break;
      case "HORIZONTAL_BAR":
        chartConfig = { type: "HORIZONTAL_BAR", row_limit: rowLimit };
        break;
      case "VERTICAL_BAR":
        chartConfig = { type: "VERTICAL_BAR", row_limit: rowLimit };
        break;
      case "LINE_TIME_SERIES":
        chartConfig = { type: "LINE_TIME_SERIES", row_limit: rowLimit };
        break;
      case "BAR_TIME_SERIES":
        chartConfig = { type: "BAR_TIME_SERIES", row_limit: rowLimit };
        break;
      default:
        chartConfig = { type: selectedChartType, row_limit: rowLimit };
        break;
    }
    
    const widgetData = {
      projectId,
      widgetId,
      name: widgetName,
      description: widgetDescription,
      view: selectedView,
      dimensions: selectedChartType === "PIVOT_TABLE"
        ? pivotDimensions.map((field) => ({ field }))
        : selectedDimension !== ""
          ? [{ field: selectedDimension }]
          : [],
      metrics: selectedChartType === "PIVOT_TABLE"
        ? selectedMetrics
            .filter((metric) => metric.measure && metric.measure !== "")
            .map((metric) => ({
              measure: metric.measure,
              agg: metric.aggregation,
            }))
        : [{ measure: selectedMeasure, agg: selectedAggregation }],
      filters: transformFiltersToWidgetFormat(activeFilters),
      chartType: selectedChartType,
      chartConfig: chartConfig,
    };

    console.log("📋 최종 위젯 업데이트 데이터:", widgetData);

    // dashboardWidgets.update API 호출
    console.log("📡 API 호출 시작... (위젯 업데이트)");
    const response = await api.trpcPost("dashboardWidgets.update", widgetData);
    
    console.log("📨 API 응답:", response);
    
    if (response) {
      console.log("🎉 위젯 업데이트 성공!");
      alert("위젯이 성공적으로 업데이트되었습니다!");
      
      // 대시보드에서 온 경우 해당 대시보드로, 아니면 대시보드 메인 페이지의 Widgets 탭으로 이동
      const dashboardId = searchParams.get("dashboardId");
      if (dashboardId) {
        navigate(`/project/${projectId}/dashboards/${dashboardId}`);
      } else {
        // 대시보드 메인 페이지로 이동 (Widgets 탭이 기본으로 열림)
        navigate(`/project/${projectId}/dashboards`);
      }
    } else {
      throw new Error('Failed to update widget');
    }
  } catch (error) {
    console.error("💥 업데이트 에러:", error);
    alert(`업데이트 실패:\n${error.message || error}`);
  } finally {
    setSaving(false);
    console.log("🔚 업데이트 프로세스 완료");
  }
};

const handleCancel = () => {
  // 대시보드에서 온 경우 해당 대시보드로, 아니면 대시보드 메인 페이지의 Widgets 탭으로 이동
  const dashboardId = searchParams.get("dashboardId");
  if (dashboardId) {
    navigate(`/project/${projectId}/dashboards/${dashboardId}`);
  } else {
    // 대시보드 메인 페이지로 이동 (Widgets 탭이 기본으로 열림)
    navigate(`/project/${projectId}/dashboards`);
  }
};
  // 로딩 중
  if (widgetLoading) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.leftPane}>
          <div className={styles.section}>
            <h2 className={styles.previewTitle}>Loading Widget...</h2>
            <p className={styles.previewDesc}>Please wait while we load the widget data</p>
          </div>
        </div>
        <div className={styles.rightPane}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (widgetError) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Widget</CardTitle>
            <CardDescription>{widgetError}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate(-1)} variant="secondary">
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!projectId || !widgetId) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>Missing Parameters</CardTitle>
            <CardDescription>Project ID and Widget ID are required.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate(-1)} variant="secondary">
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      {/* 왼쪽 폼 */}
      <div className={styles.leftPane}>
        <div className={styles.section}>
          <div className={styles.flexRow} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className={styles.previewTitle}>Edit Widget</h2>
              <p className={styles.previewDesc}>Modify your widget configuration and preview changes</p>
            </div>
            <Button onClick={handleCancel} variant="secondary" size="sm">
              <ArrowLeft size={16} />
              Cancel
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Data Selection</h3>

          {/* View Selection */}
          <div className={styles.block}>
            <Label htmlFor="view-select">View</Label>
            <Select value={selectedView} onValueChange={(value) => {
              if (value !== selectedView) {
                const newView = value;
                const newViewDeclaration = viewDeclarations[newView];

                setSelectedMeasure("count");
                setSelectedAggregation("count");
                setSelectedDimension("");

                if (selectedChartType === "PIVOT_TABLE") {
                  const validMetrics = selectedMetrics.filter(
                    (metric) => metric.measure in newViewDeclaration.measures
                  );

                  if (validMetrics.length === 0) {
                    validMetrics.push({
                      id: "count_count",
                      measure: "count",
                      aggregation: "count",
                      label: "Count Count",
                    });
                  }

                  setSelectedMetrics(validMetrics);

                  const validDimensions = pivotDimensions.filter(
                    (dimension) => dimension in newViewDeclaration.dimensions
                  );
                  setPivotDimensions(validDimensions);
                }

                if (newView !== "scores-categorical") {
                  setUserFilterState((prev) => prev.filter((filter) => filter.column !== "stringValue"));
                }
                if (newView !== "scores-numeric") {
                  setUserFilterState((prev) => prev.filter((filter) => filter.column !== "value"));
                }
              }
              setSelectedView(value);
            }} id="view-select">
              {Object.keys(viewDeclarations).map((view) => (
                <SelectItem key={view} value={view}>
                  {startCase(view)} - {viewDeclarations[view].description}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* 메트릭 선택 - IntegratedMetricsSelector 사용 */}
          <IntegratedMetricsSelector
            view={selectedView}
            chartType={selectedChartType}
            selectedMeasure={selectedMeasure}
            selectedAggregation={selectedAggregation}
            onMeasureChange={setSelectedMeasure}
            onAggregationChange={setSelectedAggregation}
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
            disabled={loading}
          />

          {/* 필터 섹션 - FiltersEditor 사용 */}
          <div className={styles.block}>
            <Label>Filters</Label>
            <FiltersEditor
              styles={styles}
              filters={userFilterState}
              setFilters={setUserFilterState}
              getDimensionsForView={getDimensionsForView}
              view={selectedView}
            />
          </div>

          {/* 일반 차트 분해 차원 */}
          {chartTypes.find((c) => c.value === selectedChartType)?.supportsBreakdown &&
            selectedChartType !== "PIVOT_TABLE" && (
            <div className={styles.block}>
              <Label htmlFor="dimension-select">
                Breakdown Dimension (Optional)
              </Label>
          <Select value={selectedDimension} onValueChange={setSelectedDimension} id="dimension-select">
          <SelectItem value="">None</SelectItem>
          {availableDimensions.map((dimension) => {
            const meta = viewDeclarations[selectedView]?.dimensions?.[dimension.value];
            return (
              <SelectItem key={dimension.value} value={dimension.value}>
                {dimension.label} {meta?.description && `- ${meta.description}`}
              </SelectItem>
            );
          })}
        </Select>
            </div>
          )}

         {selectedChartType === "PIVOT_TABLE" && (
            <PivotControls
            view={selectedView}
            selectedMetrics={selectedMetrics}
            pivotDimensions={pivotDimensions}
            onPivotDimensionsChange={setPivotDimensions}
            sortColumn={defaultSortColumn}
            onSortColumnChange={setDefaultSortColumn}
            sortOrder={defaultSortOrder}
            onSortOrderChange={setDefaultSortOrder}
            showSubtotals={showSubtotals}
            onShowSubtotalsChange={setShowSubtotals}
            rowLimit={rowLimit}
            onRowLimitChange={setRowLimit}
            disabled={loading}
            maxDimensions={2}
            />
            )}

        </div>

        <div className={styles.section}>
          <h3>Visualization</h3>

          {/* 위젯 이름 */}
          <div className={styles.block}>
            <Label htmlFor="widget-name">Name</Label>
            <Input
              id="widget-name"
              value={widgetName}
              onChange={(e) => {
                setWidgetName(e.target.value);
              }}
              placeholder="Enter widget name"
            />
          </div>

          {/* 위젯 설명 */}
          <div className={styles.block}>
            <Label htmlFor="widget-description">Description</Label>
            <Input
              id="widget-description"
              value={widgetDescription}
              onChange={(e) => {
                setWidgetDescription(e.target.value);
              }}
              placeholder="Enter widget description"
            />
          </div>

          {/* 차트 타입 선택 */}
          <div className={styles.block}>
            <Label htmlFor="chart-type-select">Chart Type</Label>
            <Select value={selectedChartType} onValueChange={handleChartTypeChange} id="chart-type-select">
              <SelectGroup>
                <SelectLabel>Time Series</SelectLabel>
                {chartTypes
                  .filter((item) => item.group === "time-series")
                  .map((chart) => (
                    <SelectItem key={chart.value} value={chart.value}>
                      {chart.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Total Value</SelectLabel>
                {chartTypes
                  .filter((item) => item.group === "total-value")
                  .map((chart) => (
                    <SelectItem key={chart.value} value={chart.value}>
                      {chart.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </Select>
          </div>

          {/* 날짜 범위 */}
          <div className={styles.block}>
            <Label htmlFor="date-select">Date Range</Label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>

          {/* 히스토그램 빈 */}
          {selectedChartType === "HISTOGRAM" && (
            <div className={styles.block}>
              <Label htmlFor="histogram-bins">Number of Bins (1-100)</Label>
              <Input
                id="histogram-bins"
                type="number"
                min={1}
                max={100}
                value={histogramBins}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 100) {
                    setHistogramBins(value);
                  }
                }}
                placeholder="Enter number of bins (1-100)"
              />
            </div>
          )}

          {/* 분해 차트의 행 제한 */}
          {chartTypes.find((c) => c.value === selectedChartType)?.supportsBreakdown &&
            !isTimeSeriesChart(selectedChartType) && (
            <div className={styles.block}>
              <Label htmlFor="row-limit">Breakdown Row Limit (0-1000)</Label>
              <Input
                id="row-limit"
                type="number"
                min={0}
                max={1000}
                value={rowLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 1000) {
                    setRowLimit(value);
                  }
                }}
                placeholder="Enter breakdown row limit (0-1000)"
              />
            </div>
          )}
        </div>

        <div className={styles.flexRow} style={{ gap: '12px' }}>
          <Button 
            onClick={handleCancel} 
            variant="secondary"
            disabled={saving}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={loading || saving}
            className={styles.primaryBtn}
            style={{ flex: 2 }}
          >
            {saving ? "Updating..." : "Update Widget"}
          </Button>
        </div>
      </div>

      {/* Right Preview Pane */}
      <div className={styles.rightPane}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>{widgetName}</h3>
          <p className={styles.previewDesc}>{widgetDescription}</p>
          {previewData.length > 0 && (
            <div className={styles.helperText}>
              Data points: {previewData.length}
            </div>
          )}
        </div>

        <div className={styles.chartContainer}>
          {loading ? (
            <div className={styles.preview}>
              <div>Loading preview...</div>
            </div>
          ) : previewError ? (
            <div className={styles.preview}>
              <div>
                <strong>Preview Error</strong>
                <p>{previewError}</p>
                <Button 
                  variant="secondary" 
                  onClick={refreshPreview}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : previewData.length > 0 ? (
            <Chart
              chartType={selectedChartType}
              data={previewData}
              rowLimit={rowLimit}
              chartConfig={
                selectedChartType === "PIVOT_TABLE"
                  ? {
                      type: selectedChartType,
                      dimensions: pivotDimensions,
                      row_limit: rowLimit,
                      metrics: selectedMetrics
                        .filter((m) => m.measure && m.measure !== "")
                        .map((metric) => metric.id),
                      defaultSort:
                        defaultSortColumn && defaultSortColumn !== ""
                          ? { column: defaultSortColumn, order: defaultSortOrder }
                          : undefined,
                    }
                  : selectedChartType === "HISTOGRAM"
                    ? { type: selectedChartType, bins: histogramBins }
                    : { type: selectedChartType, row_limit: rowLimit }
              }
                sortState={
                  selectedChartType === "PIVOT_TABLE" &&
                  defaultSortColumn &&
                  defaultSortColumn !== ""
                    ? { column: defaultSortColumn, order: defaultSortOrder }
                    : undefined
                }
              onSortChange={undefined}
              isLoading={loading}
            />
          ) : (
            <div className={styles.preview}>
              <p>No data to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

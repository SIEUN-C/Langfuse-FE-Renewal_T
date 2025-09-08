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
  X
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



// 기본 UI 컴포넌트들
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



// 차트 타입 설정
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

// View 선언
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

// 집계 옵션
const metricAggregations = ["count", "sum", "avg", "min", "max", "p95", "histogram"];

// 상수
const MAX_PIVOT_TABLE_DIMENSIONS = 2;
const MAX_PIVOT_TABLE_METRICS = 10;

// 유틸리티 함수들
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

  // "none" 체크 제거
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

  // "none" 체크 제거
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


// 필터 변환 함수들
const transformFiltersToWidgetFormat = (builderFilters) => {
  return builderFilters.map(filter => {
    const columnConfig = widgetFilterConfig.find(config => config.key === filter.column);
    let columnType = columnConfig?.type || 'string';
    
    if (columnType === 'categorical') {
      columnType = 'string';
    }
    
    // 서버가 허용하는 컬럼명으로 매핑
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
      // 필요시 다른 매핑도 추가
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
      column: columnName, // 매핑된 컬럼명 사용
      type: columnType,
      operator: operator,
      value: Array.isArray(filter.values) ? filter.values.join(',') : filter.values || '',
      metaKey: filter.metaKey || ''
    };
  });
};

// DashboardModal 컴포넌트
function DashboardModal({
  isOpen,
  onClose,
  onSave,
  projectId,
  api,
}) {
  const [dashboards, setDashboards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDashboards = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("대시보드 목록 조회 시작:", { projectId });

        const response = await api.getAllDashboards({
          projectId,
          orderBy: { column: "updatedAt", order: "DESC" },
          page: 0,
          limit: 100,
        });

        console.log("대시보드 API 응답:", response);

        const items =
          response?.dashboards ||
          response?.data?.dashboards ||
          response?.json?.dashboards ||
          response?.items ||
          response?.data ||
          [];

        console.log("추출된 대시보드 목록:", items);

        const userDashboards = Array.isArray(items) 
          ? items.filter((dashboard) => {
              return (
                dashboard.owner !== "LANGFUSE" &&
                !dashboard.name?.toLowerCase().includes("langfuse")
              );
            })
          : [];

        console.log("필터링된 사용자 대시보드:", userDashboards);
        setDashboards(userDashboards);
      } catch (error) {
        console.error("대시보드 로드 실패:", error);
        setError(`대시보드 목록을 불러올 수 없습니다: ${error.message}`);
        setDashboards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [isOpen, projectId, api]);

  if (!isOpen) return null;

  const handleSkip = () => {
    console.log("Skip 선택 - 대시보드 없이 위젯만 저장");
    onSave(null);
  };

  const handleAddToDashboard = () => {
    if (selectedId) {
      console.log("대시보드에 추가 선택:", selectedId);
      onSave(selectedId);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: "#020817",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, color: "#f8fafc" }}>
              Select dashboard to add widget to
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: "24px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* 바디 - 테이블 형식 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0",
            minHeight: "200px",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                color: "#94a3b8",
              }}
            >
              대시보드 목록을 불러오는 중...
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                color: "#ef4444",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  background: "#1e293b",
                  border: "none",
                  borderRadius: "4px",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                새로고침
              </button>
            </div>
          ) : dashboards.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              <p>대시보드가 없습니다.</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                먼저 대시보드를 생성해주세요.
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboards.map((dashboard) => (
                  <tr
                    key={dashboard.id}
                    style={{
                      borderBottom: "1px solid #1e293b",
                      cursor: "pointer",
                      backgroundColor:
                        selectedId === dashboard.id ? "#1e3a8a" : "transparent",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => setSelectedId(dashboard.id)}
                    onMouseEnter={(e) => {
                      if (selectedId !== dashboard.id) {
                        e.currentTarget.style.backgroundColor = "#1e293b";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedId !== dashboard.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 20px",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    >
                      {dashboard.name}
                    </td>
                    <td
                      style={{
                        padding: "12px 20px",
                        color: "#94a3b8",
                        fontSize: "13px",
                      }}
                    >
                      {dashboard.description || "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px 20px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      {new Date(dashboard.updatedAt).toLocaleDateString(
                        "ko-KR"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 - Skip과 Add to Dashboard */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Skip
          </button>

          <button
            onClick={handleAddToDashboard}
            disabled={!selectedId}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              backgroundColor: selectedId ? "#3b82f6" : "#1e293b",
              border: "none",
              color: selectedId ? "#ffffff" : "#64748b",
              fontSize: "14px",
              fontWeight: "600",
              cursor: selectedId ? "pointer" : "not-allowed",
              opacity: selectedId ? 1 : 0.5,
            }}
          >
            Add to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewWidget() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: urlProjectId } = useParams();

  // 프로젝트 ID 해결
  const projectId = urlProjectId || searchParams.get("projectId") || "demo-project";

  // getDimensionsForView 함수 정의 (컴포넌트 내 최상단에 위치)
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

  // 폼 상태 - 기본 정보
  const [widgetName, setWidgetName] = useState("Count (Traces)");
  const [widgetDescription, setWidgetDescription] = useState("Shows the count of traces");
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
  const [defaultSortColumn, setDefaultSortColumn] = useState(""); // "none" → ""
  const [defaultSortOrder, setDefaultSortOrder] = useState("DESC");

  const [showSubtotals, setShowSubtotals] = useState(false);


  // 필터와 날짜 - FiltersEditor 형식으로 변경
  const [userFilterState, setUserFilterState] = useState([{
    column: 'environment',
    operator: 'anyOf',
    values: []
  }]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  // 로딩과 모달
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // 차트 타입 변경 핸들러 (히스토그램 자동감지 포함)
  const handleChartTypeChange = (newChartType) => {
    console.log("차트 타입 변경:", selectedChartType, "→", newChartType);
    
    const oldChartType = selectedChartType;
    setSelectedChartType(newChartType);
    
    // 히스토그램으로 변경되는 경우 집계를 histogram으로 강제 설정
    if (newChartType === "HISTOGRAM") {
      console.log("히스토그램 차트로 변경됨, aggregation을 histogram으로 설정");
      setSelectedAggregation("histogram");
      
      // 다중 메트릭 모드인 경우 모든 메트릭의 집계를 histogram으로 변경
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
      // 히스토그램에서 다른 차트로 변경되는 경우 기본 집계로 복원
      console.log("히스토그램에서 다른 차트로 변경됨, 기본 집계로 복원");
      
      // 단일 메트릭 모드인 경우
      const defaultAgg = getDefaultAggregationForMeasure(selectedMeasure, selectedView, false);
      setSelectedAggregation(defaultAgg);
      
      // 다중 메트릭 모드인 경우
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
    
    // 기존 피벗 테이블 로직 유지
    if (newChartType === "PIVOT_TABLE") {
      // 피벗 테이블로 변경되는 경우 다중 메트릭 모드로 전환
      if (!selectedMetrics || selectedMetrics.length === 0) {
        setSelectedMetrics([{
          measure: selectedMeasure || "count",
          aggregation: selectedAggregation || "count",
          id: `${selectedAggregation || "count"}_${selectedMeasure || "count"}_0`,
          label: `${selectedAggregation || "Count"} ${selectedMeasure || "Count"}`
        }]);
      }
    } else if (oldChartType === "PIVOT_TABLE" && newChartType !== "PIVOT_TABLE") {
      // 피벗 테이블에서 다른 차트로 변경되는 경우 단일 메트릭 모드로 전환
      if (selectedMetrics && selectedMetrics.length > 0) {
        const firstMetric = selectedMetrics[0];
        setSelectedMeasure(firstMetric.measure);
        setSelectedAggregation(firstMetric.aggregation);
      }
    }
  };

  // API 초기화
  useEffect(() => {
    if (projectId) {
      api.setProjectId(projectId);
    }
  }, [projectId]);

  // 사용 가능한 차원
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
    if (value && value !== "") { // "none" 체크 제거
      newDimensions[index] = value;
    } else {
      newDimensions.splice(index);
    }
    setPivotDimensions(newDimensions);
  };

  // 쿼리 빌드
  const query = useMemo(() => {
    const fromTimestamp = startDate;
    const toTimestamp = endDate;

    const queryDimensions = selectedChartType === "PIVOT_TABLE"
      ? pivotDimensions.map((field) => ({ field }))
      : selectedDimension !== "" // "none" → ""
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

    // 필터를 위젯 형식으로 변환
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
              defaultSort: defaultSortColumn && defaultSortColumn !== "none"
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

  // 미리보기 데이터 가져오기
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
        
        // 데이터를 차트 라이브러리 형식으로 변환
        const transformedData = chartData.map((item, index) => ({
          time_dimension: item.time_dimension || item.timestamp || item.date,
          dimension: item.dimension || item.name || item[selectedDimension] || `Item ${index + 1}`,
          metric: typeof item.metric === 'number' ? item.metric : 
                  typeof item.value === 'number' ? item.value :
                  Object.values(item).find(v => typeof v === 'number') || 0,
          // 원본 데이터도 포함
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

  // 미리보기 새로고침
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [refreshPreview]);

  // 차원 재설정
    useEffect(() => {
      if (
        chartTypes.find((c) => c.value === selectedChartType)?.supportsBreakdown === false &&
        selectedDimension !== "" // "none" → ""
      ) {
        setSelectedDimension(""); // "none" → ""
      }
    }, [selectedChartType, selectedDimension]);

  // 피벗 테이블 차원 재설정
  useEffect(() => {
    if (selectedChartType !== "PIVOT_TABLE" && pivotDimensions.length > 0) {
      setPivotDimensions([]);
    }
  }, [selectedChartType, pivotDimensions.length]);

  // 다중 메트릭 재설정
  useEffect(() => {
    if (selectedChartType !== "PIVOT_TABLE" && selectedMetrics.length > 1) {
      setSelectedMetrics(selectedMetrics.slice(0, 1));
    }
  }, [selectedChartType, selectedMetrics]);

  // 위젯 이름 자동 업데이트
  useEffect(() => {
    if (autoLocked) return;

    const dimensionForNaming = selectedChartType === "PIVOT_TABLE" && pivotDimensions.length > 0
      ? pivotDimensions.map(startCase).join(" and ")
      : selectedDimension;

    const isPivotTable = selectedChartType === "PIVOT_TABLE";
    const validMetricsForNaming = selectedMetrics.filter((m) => m.measure && m.measure !== "");
    const metricNames = isPivotTable && validMetricsForNaming.length > 0
      ? validMetricsForNaming.map((m) => m.id)
      : undefined;

    const suggested = buildWidgetName({
      aggregation: isPivotTable ? "count" : selectedAggregation,
      measure: isPivotTable ? "count" : selectedMeasure,
      dimension: dimensionForNaming,
      view: selectedView,
      metrics: metricNames,
      isMultiMetric: isPivotTable && validMetricsForNaming.length > 0,
    });

    setWidgetName(suggested);
  }, [
    autoLocked, selectedAggregation, selectedMeasure, selectedMetrics, selectedDimension,
    selectedView, selectedChartType, pivotDimensions
  ]);

  // 위젯 설명 자동 업데이트
  useEffect(() => {
    if (autoLocked) return;

    const dimensionForDescription = selectedChartType === "PIVOT_TABLE" && pivotDimensions.length > 0
      ? pivotDimensions.map(startCase).join(" and ")
      : selectedDimension;

    const isPivotTable = selectedChartType === "PIVOT_TABLE";
    const validMetricsForDescription = selectedMetrics.filter((m) => m.measure && m.measure !== "");
    const metricNames = isPivotTable && validMetricsForDescription.length > 0
      ? validMetricsForDescription.map((m) => m.id)
      : undefined;

    // 활성 필터 개수 계산 (값이 있는 필터만)
    const activeFilters = userFilterState.filter(f => 
      f.column && (f.values && f.values.length > 0)
    );

    const suggested = buildWidgetDescription({
      aggregation: isPivotTable ? "count" : selectedAggregation,
      measure: isPivotTable ? "count" : selectedMeasure,
      dimension: dimensionForDescription,
      view: selectedView,
      filters: activeFilters,
      metrics: metricNames,
      isMultiMetric: isPivotTable && validMetricsForDescription.length > 0,
    });

    setWidgetDescription(suggested);
  }, [
    autoLocked, selectedAggregation, selectedMeasure, selectedMetrics, selectedDimension,
    selectedView, userFilterState, selectedChartType, pivotDimensions
  ]);

  // ✅ 수정된 저장 핸들러 - 위젯 생성 후 대시보드에 자동 추가
  const handleSaveWithDashboard = async (dashboardId) => {
    if (!projectId) {
      alert("Project ID is required");
      return;
    }
    
    setSaving(true);
    console.log("🚀 위젯 저장 시작");
    
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
          defaultSort: defaultSortColumn && defaultSortColumn !== "" // "none" → ""
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
        name: widgetName,
        description: widgetDescription,
        view: selectedView,
        dimensions: selectedChartType === "PIVOT_TABLE"
          ? pivotDimensions.map((field) => ({ field }))
          : selectedDimension !== "" // "none" → ""
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

      console.log("📋 최종 위젯 데이터:", widgetData);

      // ✅ 위젯만 생성 (dashboardId 제거)
      console.log("📡 API 호출 시작... (위젯만 생성)");
      const response = await api.createWidget(widgetData);
      
      console.log("📨 API 응답:", response);
      
      if (response.success) {
        // ✅ 위젯 ID 추출
        let widgetId = null;
        
        if (response.data?.widget?.widget?.id) {
          widgetId = response.data.widget.widget.id;
        } else if (response.data?.widget?.id) {
          widgetId = response.data.widget.id;
        } else if (response.data?.id) {
          widgetId = response.data.id;
        }
        
        console.log("🎉 위젯 생성 성공! ID:", widgetId);
        
        if (dashboardId && widgetId) {
          // ✅ 대시보드에 추가하기 위해 state와 함께 이동
          console.log("🔄 대시보드로 이동하며 위젯 추가:", dashboardId);
          navigate(`/project/${projectId}/dashboards/${dashboardId}`, {
            state: { 
              addWidgetId: widgetId,
              refreshDashboard: true 
            }
          });
          alert("위젯이 생성되었습니다! 대시보드에 추가됩니다.");
        } else if (widgetId) {
          // ✅ 위젯만 저장한 경우
          console.log("🔄 대시보드 목록으로 이동");
          navigate(`/project/${projectId}/dashboards`);
          alert("위젯이 저장되었습니다!");
        } else {
          throw new Error("위젯 ID를 가져올 수 없습니다.");
        }
      } else {
        console.error("❌ API 실패:", response.error);
        throw new Error(response.error || 'Failed to create widget');
      }
    } catch (error) {
      console.error("💥 저장 에러:", error);
      alert(`저장 실패:\n${error.message || error}`);
    } finally {
      setSaving(false);
      setShowDashboardModal(false);
      console.log("🔚 저장 프로세스 완료");
    }
  };

  const handleSave = () => setShowDashboardModal(true);

  if (!projectId) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>Project ID Required</CardTitle>
            <CardDescription>This page requires a project ID.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
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
          <h2 className={styles.previewTitle}>Widget Configuration</h2>
          <p className={styles.previewDesc}>Configure your widget by selecting data and visualization options</p>
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

                // 필터 정리
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
          <SelectItem value="">None</SelectItem> {/* "none" → "" */}
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
            maxDimensions={MAX_PIVOT_TABLE_DIMENSIONS}
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
                if (!autoLocked) setAutoLocked(true);
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
                if (!autoLocked) setAutoLocked(true);
                setWidgetDescription(e.target.value);
              }}
              placeholder="Enter widget description"
            />
          </div>

          {/* 차트 타입 선택 - 수정된 부분 */}
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

        <Button 
          onClick={handleSave} 
          disabled={loading || saving}
          className={styles.primaryBtn}
        >
          {saving ? "저장 중..." : "Save Widget"}
        </Button>
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
                  defaultSortColumn !== "" // "none" → ""
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

      {/* 대시보드 선택 모달 */}
      <DashboardModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        onSave={handleSaveWithDashboard}
        projectId={projectId}
        api={api}
      />
    </div>
  );
}
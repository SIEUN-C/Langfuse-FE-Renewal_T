// src/Pages/Widget/components/PivotControls.jsx
import React, { useMemo } from "react";
import { startCase } from "lodash";
import styles from "../pages/NewWidget.module.css";
import { getMeasuresForView } from '../services/viewMappings';

// View별 차원 정의 확장 (Langfuse 실제 원본과 일치)
const getViewDimensions = (view) => {
  const viewDeclarations = {
    traces: {
      dimensions: {
        environment: { description: "Environment", type: "string" },
        id: { description: "Trace ID", type: "string" },
        name: { description: "Name of the trace", type: "string" },
        release: { description: "Release", type: "string" },
        sessionId: { description: "Session ID", type: "string" },
        tags: { description: "Tags", type: "arrayOptions" },
        timestampMonth: { description: "Timestamp Month", type: "string" },
        userId: { description: "User ID", type: "string" },
        version: { description: "Version", type: "string" },
        metadata: { description: "Custom metadata", type: "stringObject" }
      }
    },
    observations: {
      dimensions: {
        environment: { description: "Environment", type: "string" },
        id: { description: "Observation ID", type: "string" },
        name: { description: "Name of the observation", type: "string" },
        type: { description: "Observation type (GENERATION, SPAN, EVENT)", type: "string" },
        model: { description: "Model used", type: "string" },
        release: { description: "Release", type: "string" },
        sessionId: { description: "Session ID", type: "string" },
        tags: { description: "Tags", type: "arrayOptions" },
        timestampMonth: { description: "Timestamp Month", type: "string" },
        userId: { description: "User ID", type: "string" },
        version: { description: "Version", type: "string" },
        metadata: { description: "Custom metadata", type: "stringObject" }
      }
    },
    "scores-numeric": {
      dimensions: {
        environment: { description: "Environment", type: "string" },
        id: { description: "Score ID", type: "string" },
        name: { description: "Score name", type: "string" },
        release: { description: "Release", type: "string" },
        sessionId: { description: "Session ID", type: "string" },
        tags: { description: "Tags", type: "arrayOptions" },
        timestampMonth: { description: "Timestamp Month", type: "string" },
        userId: { description: "User ID", type: "string" },
        version: { description: "Version", type: "string" },
        metadata: { description: "Custom metadata", type: "stringObject" }
      }
    },
    "scores-categorical": {
      dimensions: {
        environment: { description: "Environment", type: "string" },
        id: { description: "Score ID", type: "string" },
        name: { description: "Score name", type: "string" },
        stringValue: { description: "Categorical value", type: "string" },
        release: { description: "Release", type: "string" },
        sessionId: { description: "Session ID", type: "string" },
        tags: { description: "Tags", type: "arrayOptions" },
        timestampMonth: { description: "Timestamp Month", type: "string" },
        userId: { description: "User ID", type: "string" },
        version: { description: "Version", type: "string" },
        metadata: { description: "Custom metadata", type: "stringObject" }
      }
    }
  };

  const viewConfig = viewDeclarations[view];
  if (!viewConfig) return [];

  return Object.entries(viewConfig.dimensions).map(([key, meta]) => ({
    value: key,
    label: startCase(key),
    description: meta.description,
    type: meta.type
  }));
};

// 메트릭 라벨 생성 함수
const AGGREGATION_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "p50", label: "P50 (Median)" },
  { value: "p75", label: "P75" },
  { value: "p90", label: "P90" },
  { value: "p95", label: "P95" },
  { value: "p99", label: "P99" },
  { value: "histogram", label: "Histogram" }
];

const formatMetricLabel = (metric, view = "traces") => {
  const measures = getMeasuresForView(view);
  const measureLabel = measures.find(m => m.value === metric.measure)?.label || startCase(metric.measure);
  const aggLabel = AGGREGATION_OPTIONS.find(a => a.value === metric.aggregation)?.label || startCase(metric.aggregation);
  
  if (metric.measure === "count" && metric.aggregation === "count") {
    return "Count";
  }
  
  return `${aggLabel} ${measureLabel}`;
};

export default function PivotControls({
  // 필수 props
  view = "traces",
  selectedMetrics = [],
  
  // 피벗 차원 제어
  pivotDimensions = [],
  onPivotDimensionsChange,
  
  // 정렬 제어
  sortColumn = "",
  onSortColumnChange,
  sortOrder = "DESC",
  onSortOrderChange,
  
  // 옵션 제어 (사용하지 않지만 호환성을 위해 유지)
  showSubtotals = false,
  onShowSubtotalsChange,
  rowLimit = 100,
  onRowLimitChange,
  
  // 비활성화 상태
  disabled = false,
  
  // 최대 차원 수
  maxDimensions = 2
}) {
  // view에 맞는 차원 옵션 가져오기
  const dimensionOptions = useMemo(() => {
    const dimensions = getViewDimensions(view);
    return [
      { value: "", label: "Select dimension...", disabled: true },
      ...dimensions.sort((a, b) => a.label.localeCompare(b.label))
    ];
  }, [view]);

  // 메트릭 기반 정렬 옵션 생성 (선택된 메트릭에 따라 동적 변화)
  const sortOptions = useMemo(() => {
    const metricOptions = selectedMetrics
      .filter(m => m.measure && m.measure !== "")
      .map(metric => ({
        value: metric.id || `${metric.aggregation}_${metric.measure}`,
        label: formatMetricLabel(metric, view)
      }));

    return [
      { value: "", label: "No default sort" },
      ...metricOptions
    ];
  }, [selectedMetrics, view]);

  // 피벗 차원 업데이트 함수
  const updatePivotDimension = (index, value) => {
    const newDimensions = [...pivotDimensions];
    
    if (value && value !== "") {
      newDimensions[index] = value;
    } else {
      // 빈 값 선택 시 해당 인덱스부터 뒤의 모든 차원 제거
      newDimensions.splice(index);
    }
    
    // 중복 제거
    const uniqueDimensions = newDimensions.filter((dim, idx) => 
      newDimensions.indexOf(dim) === idx && dim && dim !== ""
    );
    
    onPivotDimensionsChange?.(uniqueDimensions);
  };

  // 사용 가능한 차원 필터링
  const getAvailableDimensions = (currentIndex) => {
    const selectedDimensions = pivotDimensions.filter((dim, idx) => 
      idx !== currentIndex && dim && dim !== ""
    );
    
    return dimensionOptions.filter(dim => 
      dim.disabled || 
      dim.value === "" || 
      !selectedDimensions.includes(dim.value)
    );
  };

  // Langfuse 스타일: 기본적으로 2개 행 표시, Add Dimension 버튼 없음
  const displayRows = Math.max(2, pivotDimensions.length);

  return (
    <div className={styles.section}>
      <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>
        Pivot Table Configuration
      </h4>
      
      {/* 행 차원 설정 - Langfuse 방식: 기본 2개 행, Add 버튼 없음 */}
      <div className={styles.block}>
        <label className={styles.label} style={{ margin: "0 0 8px 0" }}>
          Row Dimensions
        </label>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: displayRows }, (_, index) => {
            const currentValue = pivotDimensions[index] || "";
            const availableOptions = getAvailableDimensions(index);

            return (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ minWidth: "60px", fontSize: "14px", color: "#6b7280" }}>
                  Row {index + 1}:
                </span>
                <select
                  className={styles.select}
                  value={currentValue}
                  onChange={(e) => updatePivotDimension(index, e.target.value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                >
                  {availableOptions.map((option, optionIndex) => (
                    <option 
                      key={`${option.value || 'empty'}_${optionIndex}`}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                      {option.description && option.value !== "" ? 
                        ` - ${option.description}` : ""
                      }
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        
        {pivotDimensions.length > 0 && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
            차원 순서: {pivotDimensions.map(dim => startCase(dim)).join(" → ")}
          </div>
        )}
      </div>

      {/* 기본 정렬 설정 - 선택된 메트릭에 따라 동적 변화 */}
      <div className={styles.block}>
        <label className={styles.label} style={{ marginBottom: "8px" }}>
          Default Sort Configuration
        </label>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ flex: 2 }}>
            <select
              className={styles.select}
              value={sortColumn || ""}
              onChange={(e) => onSortColumnChange?.(e.target.value)}
              disabled={disabled}
            >
              {sortOptions.map((option, sortIndex) => (
                <option key={`sort_${option.value || 'none'}_${sortIndex}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <select
              className={styles.select}
              value={sortOrder}
              onChange={(e) => onSortOrderChange?.(e.target.value)}
              disabled={disabled || !sortColumn || sortColumn === ""}
            >
              <option value="DESC">Descending (Z-A)</option>
              <option value="ASC">Ascending (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

    </div>
  );
}
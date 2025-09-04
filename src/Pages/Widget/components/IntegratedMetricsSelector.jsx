// src/Pages/Widget/components/IntegratedMetricsSelector.jsx
import React from "react";
import styles from "./IntegratedMetricsSelector.module.css";

// 메트릭 옵션을 뷰별로 정의
const MEASURE_OPTIONS_BY_VIEW = {
  traces: [
    { value: "count", label: "Count", requiresAggregation: false },
    { value: "latency", label: "Latency", requiresAggregation: true },
    { value: "totalCost", label: "Total Cost", requiresAggregation: true },
    { value: "totalTokens", label: "Total Tokens", requiresAggregation: true },
    { value: "duration", label: "Duration", requiresAggregation: true },
    { value: "input_tokens", label: "Input Tokens", requiresAggregation: true },
    { value: "output_tokens", label: "Output Tokens", requiresAggregation: true },
  ],
  observations: [
    { value: "count", label: "Count", requiresAggregation: false },
    { value: "latency", label: "Latency", requiresAggregation: true },
    { value: "duration", label: "Duration", requiresAggregation: true },
    { value: "cost", label: "Cost", requiresAggregation: true },
    { value: "input_tokens", label: "Input Tokens", requiresAggregation: true },
    { value: "output_tokens", label: "Output Tokens", requiresAggregation: true },
  ],
  "scores-numeric": [
    { value: "count", label: "Count", requiresAggregation: false },
    { value: "score", label: "Score", requiresAggregation: true },
  ],
  "scores-categorical": [
    { value: "count", label: "Count", requiresAggregation: false },
    { value: "scores_count", label: "Scores Count", requiresAggregation: true },
  ],
};

// 집계 옵션 정의
const AGGREGATION_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "p50", label: "P50" },
  { value: "p90", label: "P90" },
  { value: "p95", label: "P95" },
  { value: "p99", label: "P99" },
  { value: "histogram", label: "Histogram" },
];

const IntegratedMetricsSelector = ({
  view,
  chartType,
  // 단일 메트릭 모드
  selectedMeasure,
  selectedAggregation,
  onMeasureChange,
  onAggregationChange,
  // 다중 메트릭 모드 (피벗 테이블용)
  selectedMetrics,
  onMetricsChange,
  disabled = false,
}) => {
  const measures = MEASURE_OPTIONS_BY_VIEW[view] || MEASURE_OPTIONS_BY_VIEW.traces;
  const isPivotTable = chartType === "PIVOT_TABLE";
  const isHistogram = chartType === "HISTOGRAM";

  // 단일 메트릭 렌더링
  const renderSingleMetric = () => {
    const selectedMeasureOption = measures.find(m => m.value === selectedMeasure);
    const showAggregation = selectedMeasureOption?.requiresAggregation && !isHistogram;
    
    // 히스토그램의 경우 집계를 histogram으로 강제 설정
    React.useEffect(() => {
      if (isHistogram && selectedAggregation !== "histogram") {
        onAggregationChange("histogram");
      }
    }, [isHistogram, selectedAggregation, onAggregationChange]);

    return (
      <div className={styles.section}>
        <label className={styles.label}>Metric</label>
        <div className={styles.flexRow}>
          <select
            className={styles.select}
            value={selectedMeasure}
            onChange={(e) => {
              const newMeasure = e.target.value;
              onMeasureChange(newMeasure);
              
              // measure가 count인 경우 집계를 count로 설정
              if (newMeasure === "count") {
                onAggregationChange("count");
              } else if (selectedAggregation === "count" && newMeasure !== "count") {
                // count가 아닌 measure에서 집계가 count인 경우 기본값으로 변경
                onAggregationChange("sum");
              }
            }}
            disabled={disabled}
          >
            {measures.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {showAggregation && (
            <select
              className={styles.select}
              value={selectedAggregation}
              onChange={(e) => onAggregationChange(e.target.value)}
              disabled={disabled || isHistogram}
              title={isHistogram ? "Aggregation is automatically set to histogram" : ""}
            >
              {AGGREGATION_OPTIONS
                .filter(agg => {
                  // 히스토그램이 아닌 경우 histogram 집계 제외
                  if (!isHistogram && agg.value === "histogram") return false;
                  // 히스토그램인 경우 histogram 집계만 허용
                  if (isHistogram && agg.value !== "histogram") return false;
                  return true;
                })
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          )}
        </div>
        
        {isHistogram && (
          <div className={styles.helperText}>
            Aggregation is automatically set to "histogram" for histogram charts
          </div>
        )}
      </div>
    );
  };

  // 다중 메트릭 렌더링 (피벗 테이블용)
  const renderMultipleMetrics = () => {
    const updateMetric = (index, field, value) => {
      const newMetrics = [...selectedMetrics];
      if (!newMetrics[index]) {
        newMetrics[index] = { measure: "count", aggregation: "count" };
      }
      
      newMetrics[index] = {
        ...newMetrics[index],
        [field]: value
      };
      
      // measure가 count인 경우 집계를 count로 강제 설정
      if (field === "measure" && value === "count") {
        newMetrics[index].aggregation = "count";
      }
      
      // ID 업데이트
      newMetrics[index].id = `${newMetrics[index].aggregation}_${newMetrics[index].measure}`;
      newMetrics[index].label = `${newMetrics[index].aggregation} ${newMetrics[index].measure}`;
      
      onMetricsChange(newMetrics);
    };

    const addMetric = () => {
      const newMetrics = [...selectedMetrics, { 
        measure: "count", 
        aggregation: "count",
        id: `count_count_${selectedMetrics.length}`,
        label: "Count Count"
      }];
      onMetricsChange(newMetrics);
    };

    const removeMetric = (index) => {
      if (selectedMetrics.length > 1) {
        const newMetrics = selectedMetrics.filter((_, i) => i !== index);
        onMetricsChange(newMetrics);
      }
    };

    // 사용 가능한 메트릭 필터링
    const getAvailableMetrics = (currentIndex) => {
      return measures.filter(measure => {
        if (measure.value === "count") {
          // count는 한번만 사용 가능
          return !selectedMetrics.some((m, i) => i !== currentIndex && m.measure === "count");
        }
        
        // 다른 measure는 서로 다른 집계와 함께 사용 가능
        const usedAggregationsForMeasure = selectedMetrics
          .filter((m, i) => i !== currentIndex && m.measure === measure.value)
          .map(m => m.aggregation);
        
        const availableAggregations = AGGREGATION_OPTIONS
          .filter(agg => agg.value !== "histogram")
          .filter(agg => !usedAggregationsForMeasure.includes(agg.value));
        
        return availableAggregations.length > 0;
      });
    };

    const getAvailableAggregations = (currentIndex, measureValue) => {
      if (measureValue === "count") {
        return [{ value: "count", label: "Count" }];
      }
      
      const usedAggregations = selectedMetrics
        .filter((m, i) => i !== currentIndex && m.measure === measureValue)
        .map(m => m.aggregation);
      
      return AGGREGATION_OPTIONS
        .filter(agg => agg.value !== "histogram")
        .filter(agg => !usedAggregations.includes(agg.value));
    };

    return (
      <div className={styles.section}>
        <div className={styles.flexRow}>
          <label className={styles.label}>Metrics</label>
          {selectedMetrics.length < 10 && (
            <button
              type="button"
              className={styles.button}
              onClick={addMetric}
              disabled={disabled}
            >
              + Add Metric
            </button>
          )}
        </div>
        
        <div className={styles.flexCol}>
          {selectedMetrics.map((metric, index) => {
            const availableMetrics = getAvailableMetrics(index);
            const availableAggregations = getAvailableAggregations(index, metric.measure);
            const measureOption = measures.find(m => m.value === metric.measure);
            
            return (
              <div key={index} className={styles.metricRow}>
                <select
                  className={styles.select}
                  value={metric.measure || ""}
                  onChange={(e) => updateMetric(index, "measure", e.target.value)}
                  disabled={disabled}
                >
                  <option value="">Select measure</option>
                  {availableMetrics.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {measureOption?.requiresAggregation && (
                  <select
                    className={styles.select}
                    value={metric.aggregation || "sum"}
                    onChange={(e) => updateMetric(index, "aggregation", e.target.value)}
                    disabled={disabled || metric.measure === "count"}
                  >
                    {availableAggregations.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {selectedMetrics.length > 1 && (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.dangerButton}`}
                    onClick={() => removeMetric(index)}
                    disabled={disabled}
                    title="Remove metric"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.metricsSelector}>
      {isPivotTable ? renderMultipleMetrics() : renderSingleMetric()}
    </div>
  );
};

export default IntegratedMetricsSelector;

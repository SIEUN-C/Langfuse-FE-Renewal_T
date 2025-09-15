// src/Pages/Widget/components/IntegratedMetricsSelector.jsx
import React from "react";
import styles from "./IntegratedMetricsSelector.module.css";
// 수정된 import - 새로운 viewMappings 함수들 사용
import { getMeasuresForView, getAggregationsForMeasureAndChart, getSupportedAggregationsForChart } from '../services/viewMappings';

// Langfuse 공식 API 스펙에 맞는 집계 옵션 (라벨링용) - histogram 추가
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
  { value: "histogram", label: "Histogram" } // 히스토그램 옵션 추가
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
  // viewMappings에서 measures 가져오기
  const measures = getMeasuresForView(view);
  const isPivotTable = chartType === "PIVOT_TABLE";
  const isHistogram = chartType === "HISTOGRAM";
  
  // scores view에서는 히스토그램이어도 기존 집계 옵션 유지
  const isScoresView = view === "scores-categorical" || view === "scores-numeric";
  const shouldForceHistogram = isHistogram && !isScoresView;

  // 히스토그램 차트일 때 aggregation을 histogram으로 강제 설정 (scores view 제외)
  React.useEffect(() => {
    console.log("히스토그램 useEffect 실행:", {
      isHistogram,
      isScoresView,
      shouldForceHistogram,
      selectedAggregation,
      chartType,
      view
    });
    
    if (shouldForceHistogram && selectedAggregation !== "histogram") {
      console.log("히스토그램으로 집계 변경:", selectedAggregation, "→ histogram");
      onAggregationChange("histogram");
    }
  }, [shouldForceHistogram, selectedAggregation, onAggregationChange, chartType, view]);

  // measure 변경 시 히스토그램인 경우 집계도 함께 변경
  const handleMeasureChange = (newMeasure) => {
    console.log("Measure 변경:", selectedMeasure, "→", newMeasure, "shouldForceHistogram:", shouldForceHistogram);
    
    onMeasureChange(newMeasure);
    
    // 새로운 measure에 맞는 기본 집계 설정
    if (shouldForceHistogram) {
      // 히스토그램인 경우 항상 histogram 집계 (scores view 제외)
      console.log("히스토그램이므로 집계를 histogram으로 설정");
      onAggregationChange("histogram");
    } else {
      // 히스토그램이 아니거나 scores view인 경우 차트 타입에 맞는 집계 사용
      const availableAggregations = getSupportedAggregationsForChart(chartType, newMeasure, view);
      if (availableAggregations.length > 0 && !availableAggregations.includes(selectedAggregation)) {
        onAggregationChange(availableAggregations[0]);
      }
    }
  };

  // 단일 메트릭 렌더링
  const renderSingleMetric = () => {
    const selectedMeasureOption = measures.find(m => m.value === selectedMeasure);
    const showAggregation = selectedMeasureOption?.requiresAggregation && !shouldForceHistogram;
    
    // 차트 타입에 맞는 집계 옵션만 가져오기
    const availableAggregations = shouldForceHistogram 
      ? ["histogram"] 
      : getSupportedAggregationsForChart(chartType, selectedMeasure, view);
    
    console.log("renderSingleMetric:", {
      selectedMeasure,
      selectedAggregation,
      isHistogram,
      isScoresView,
      shouldForceHistogram,
      chartType,
      view,
      showAggregation,
      availableAggregations
    });
    
    return (
      <div className={styles.section}>
        <label className={styles.label}>Metric</label>
        <div className={styles.flexRow}>
          <select
            className={styles.select}
            value={selectedMeasure}
            onChange={(e) => handleMeasureChange(e.target.value)}
            disabled={disabled}
          >
            {measures.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* shouldForceHistogram이 아니고 집계가 필요한 경우만 집계 드롭다운 표시 */}
          {!shouldForceHistogram && showAggregation && availableAggregations.length > 1 && (
            <select
              className={styles.select}
              value={selectedAggregation}
              onChange={(e) => onAggregationChange(e.target.value)}
              disabled={disabled}
            >
              {AGGREGATION_OPTIONS
                .filter(agg => availableAggregations.includes(agg.value))
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          )}

          {/* shouldForceHistogram인 경우만 집계 정보 표시 */}
          {shouldForceHistogram && (
            <div className={styles.aggregationDisplay}>
              <span className={styles.aggregationLabel}>Histogram</span>
            </div>
          )}
        </div>
        
        {shouldForceHistogram && (
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
      
      // measure가 변경되면 집계도 업데이트
      if (field === "measure") {
        const availableAggregations = getSupportedAggregationsForChart(chartType, value, view);
        newMetrics[index].aggregation = availableAggregations[0] || "count";
      }
      
      // ID 업데이트
      const measureLabel = measures.find(m => m.value === newMetrics[index].measure)?.label || newMetrics[index].measure;
      const aggLabel = AGGREGATION_OPTIONS.find(a => a.value === newMetrics[index].aggregation)?.label || newMetrics[index].aggregation;
      
      newMetrics[index].id = `${newMetrics[index].aggregation}_${newMetrics[index].measure}_${index}`;
      newMetrics[index].label = `${aggLabel} ${measureLabel}`;
      
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
        
        const availableAggregations = getSupportedAggregationsForChart(chartType, measure.value, view);
        const remainingAggregations = availableAggregations.filter(agg => 
          !usedAggregationsForMeasure.includes(agg)
        );
        
        return remainingAggregations.length > 0;
      });
    };

    const getAvailableAggregations = (currentIndex, measureValue) => {
      // 차트 타입에 맞는 집계만 반환
      const availableAggregations = getSupportedAggregationsForChart(chartType, measureValue, view);
      
      if (measureValue === "count") {
        return [{ value: "count", label: "Count" }];
      }
      
      const usedAggregations = selectedMetrics
        .filter((m, i) => i !== currentIndex && m.measure === measureValue)
        .map(m => m.aggregation);
      
      return AGGREGATION_OPTIONS
        .filter(agg => {
          return availableAggregations.includes(agg.value) && 
                 !usedAggregations.includes(agg.value);
        });
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
                
                {measureOption?.requiresAggregation && availableAggregations.length > 1 && (
                  <select
                    className={styles.select}
                    value={metric.aggregation || "count"}
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
        
        {selectedMetrics.length >= 10 && (
          <div className={styles.helperText}>
            Maximum 10 metrics allowed
          </div>
        )}
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
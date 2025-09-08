// src/Pages/Widget/services/viewMappings.js
// Langfuse 공식 API 스펙에 맞는 완전한 viewMappings 중앙집중 관리

// 모든 집계 옵션 정의 (히스토그램 포함)
export const ALL_AGGREGATIONS = [
  "count", "sum", "avg", "min", "max", 
  "p50", "p75", "p90", "p95", "p99", "histogram"
];

// View별 measures와 지원 집계 정의
export const VIEW_MAPPINGS = {
  traces: {
    label: "Traces",
    measures: {
      count: { 
        label: "Count", 
        requiresAggregation: false, 
        aggregations: ["count", "histogram"] 
      },
      observationsCount: { 
        label: "Observations Count", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      scoresCount: { 
        label: "Scores Count", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      latency: { 
        label: "Latency", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      totalTokens: { 
        label: "Total Tokens", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      totalCost: { 
        label: "Total Cost", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      }
    }
  },
  observations: {
    label: "Observations", 
    measures: {
      count: { 
        label: "Count", 
        requiresAggregation: false, 
        aggregations: ["count", "histogram"] 
      },
      latency: { 
        label: "Latency", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      totalTokens: { 
        label: "Total Tokens", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      inputTokens: { 
        label: "Input Tokens", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      outputTokens: { 
        label: "Output Tokens", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      totalCost: { 
        label: "Total Cost", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      inputCost: { 
        label: "Input Cost", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      outputCost: { 
        label: "Output Cost", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      timeToFirstToken: { 
        label: "Time to First Token", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      },
      countScores: { 
        label: "Count Scores", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      }
    }
  },
  "scores-numeric": {
    label: "Numeric Scores",
    measures: {
      count: { 
        label: "Count", 
        requiresAggregation: false, 
        aggregations: ["count", "histogram"] 
      },
      value: { 
        label: "Value", 
        requiresAggregation: true, 
        aggregations: ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"] 
      }
    }
  },
  "scores-categorical": {
    label: "Categorical Scores",
    measures: {
      count: { 
        label: "Count", 
        requiresAggregation: false, 
        aggregations: ["count", "histogram"] 
      }
    }
  }
};

// View에 따른 measures 목록 반환 (select option 형식)
export const getMeasuresForView = (view) => {
  const viewConfig = VIEW_MAPPINGS[view];
  if (!viewConfig) return [];
  
  return Object.entries(viewConfig.measures).map(([key, config]) => ({
    value: key,
    label: config.label,
    requiresAggregation: config.requiresAggregation
  }));
};

// 특정 measure에 대한 가능한 집계 옵션 반환
export const getAggregationsForMeasure = (measure, view = null) => {
  if (!measure) return ["count"];
  
  // 모든 view를 검색하여 해당 measure의 집계 찾기
  for (const [viewKey, viewConfig] of Object.entries(VIEW_MAPPINGS)) {
    if (view && viewKey !== view) continue; // view가 지정된 경우 해당 view만 검색
    
    if (viewConfig.measures[measure]) {
      return viewConfig.measures[measure].aggregations;
    }
  }
  
  // 기본값 반환 (count measure는 count만, 나머지는 기본 집계들)
  if (measure === "count") {
    return ["count", "histogram"];
  }
  
  return ["sum", "avg", "min", "max", "p50", "p75", "p90", "p95", "p99", "histogram"];
};

// View가 특정 measure를 지원하는지 확인
export const isMeasureSupportedByView = (view, measure) => {
  const viewConfig = VIEW_MAPPINGS[view];
  return viewConfig && viewConfig.measures[measure] !== undefined;
};

// View가 특정 measure + aggregation 조합을 지원하는지 확인
export const isAggregationSupportedByMeasure = (view, measure, aggregation) => {
  const viewConfig = VIEW_MAPPINGS[view];
  if (!viewConfig || !viewConfig.measures[measure]) return false;
  
  return viewConfig.measures[measure].aggregations.includes(aggregation);
};

// 모든 view 목록 반환 (select option 형식)
export const getAllViews = () => {
  return Object.entries(VIEW_MAPPINGS).map(([key, config]) => ({
    value: key,
    label: config.label
  }));
};

// 특정 view의 기본 measure 반환
export const getDefaultMeasureForView = (view) => {
  const measures = getMeasuresForView(view);
  return measures.length > 0 ? measures[0].value : "count";
};

// 특정 measure의 기본 집계 반환
export const getDefaultAggregationForMeasure = (measure, view = null, isHistogram = false) => {
  // 히스토그램 차트인 경우 항상 histogram 반환
  if (isHistogram) {
    return "histogram";
  }
  
  const aggregations = getAggregationsForMeasure(measure, view);
  
  // 히스토그램이 아닌 경우 histogram 제외하고 첫 번째 집계 반환
  const nonHistogramAggregations = aggregations.filter(agg => agg !== "histogram");
  return nonHistogramAggregations.length > 0 ? nonHistogramAggregations[0] : "count";
};

// 차트 타입별 지원하는 집계 확인 - 핵심 함수
export const getSupportedAggregationsForChart = (chartType, measure, view = null) => {
  const allAggregations = getAggregationsForMeasure(measure, view);
  
  switch (chartType) {
    case "HISTOGRAM":
      // 히스토그램은 histogram 집계만 지원
      return allAggregations.includes("histogram") ? ["histogram"] : [];
    
    case "PIVOT_TABLE":
      // 피벗 테이블은 histogram 제외한 모든 집계 지원 (Langfuse 방식)
      return allAggregations.filter(agg => agg !== "histogram");
    
    default:
      // 다른 차트 타입들은 histogram 제외한 모든 집계 지원 (Langfuse 방식)
      return allAggregations.filter(agg => agg !== "histogram");
  }
};

// IntegratedMetricsSelector에서 사용할 집계 옵션 반환 (차트 타입 고려)
export const getAggregationsForMeasureAndChart = (measure, view = null, chartType = null) => {
  if (chartType) {
    return getSupportedAggregationsForChart(chartType, measure, view);
  }
  return getAggregationsForMeasure(measure, view);
};

// 기존 config/viewMappings.js의 함수들과 호환성 유지
export const getViewOptions = () => getAllViews();

export const getMeasureOptions = (viewName) => {
  const measures = getMeasuresForView(viewName);
  return measures.map(m => ({
    value: m.value,
    label: m.label,
    description: m.label
  }));
};

export const getAggregationOptions = (viewName, measureName) => {
  const aggregations = getAggregationsForMeasure(measureName, viewName);
  return aggregations.map(agg => ({
    value: agg,
    label: agg.charAt(0).toUpperCase() + agg.slice(1),
    description: agg
  }));
};

export const getAvailableMeasures = (viewName) => {
  return getMeasuresForView(viewName).map(m => m.value);
};

export const getAvailableAggregations = (viewName, measureName) => {
  return getAggregationsForMeasure(measureName, viewName);
};

export const getDimensionOptions = (viewName) => {
  // 이 함수는 기존 viewDeclarations에서 가져와야 함
  // 현재는 빈 배열 반환
  return [];
};

export const isValidViewMeasureAggregation = (viewName, measureName, aggregation) => {
  return isAggregationSupportedByMeasure(viewName, measureName, aggregation);
};

// 디버깅을 위한 전체 매핑 출력
export const debugViewMappings = () => {
  console.log("VIEW_MAPPINGS:", VIEW_MAPPINGS);
  console.log("Available views:", getAllViews());
  
  Object.keys(VIEW_MAPPINGS).forEach(view => {
    console.log(`${view} measures:`, getMeasuresForView(view));
    
    Object.keys(VIEW_MAPPINGS[view].measures).forEach(measure => {
      console.log(`  ${view}.${measure} aggregations:`, getAggregationsForMeasure(measure, view));
      console.log(`  ${view}.${measure} non-histogram aggregations:`, getSupportedAggregationsForChart("LINE_TIME_SERIES", measure, view));
    });
  });
};
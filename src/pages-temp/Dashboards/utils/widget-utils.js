// src/Pages/Dashboards/utils/widget-utils.js
// 위젯 관련 유틸리티 함수들 (원본에서 변환)

/**
 * 문자열의 각 단어 첫글자를 대문자로 만드는 함수 (lodash startCase 대체)
 */
function startCase(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase 분리
      .replace(/[-_]/g, ' ') // 대시와 언더스코어를 공백으로
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // 각 단어 첫글자 대문자
  }
  
  /**
   * 메트릭 이름을 표시용으로 포맷팅
   * count_count -> Count, avg_latency -> Avg Latency
   */
  export function formatMetricName(metricName) {
    if (!metricName || typeof metricName !== 'string') {
      return 'Unknown Metric';
    }
  
    // count_count는 단순히 Count로 표시
    const cleanedName = metricName === "count_count" ? "Count" : metricName;
    return startCase(cleanedName);
  }
  
  /**
   * 시계열 차트 여부 확인
   */
  export function isTimeSeriesChart(chartType) {
    if (!chartType || typeof chartType !== 'string') {
      return false;
    }
    
    switch (chartType) {
      case "LINE_TIME_SERIES":
      case "BAR_TIME_SERIES":
        return true;
      case "HORIZONTAL_BAR":
      case "VERTICAL_BAR":
      case "PIE":
      case "HISTOGRAM":
      case "NUMBER":
      case "PIVOT_TABLE":
        return false;
      default:
        return false;
    }
  }
  
  /**
   * 뷰별 필터 매핑 정보
   */
  const viewMappings = {
    traces: [
      { uiTableName: "Trace Name", viewName: "name" },
      { uiTableName: "Observation Name", viewName: "observationName" },
      { uiTableName: "Score Name", viewName: "scoreName" },
      { uiTableName: "Tags", viewName: "tags" },
      { uiTableName: "User", viewName: "userId" },
      { uiTableName: "Session", viewName: "sessionId" },
      { uiTableName: "Metadata", viewName: "metadata" },
      { uiTableName: "Release", viewName: "release" },
      { uiTableName: "Version", viewName: "version" },
      { uiTableName: "Environment", viewName: "environment" },
    ],
    observations: [
      { uiTableName: "Trace Name", viewName: "traceName" },
      { uiTableName: "Observation Name", viewName: "name" },
      { uiTableName: "Score Name", viewName: "scoreName" },
      { uiTableName: "User", viewName: "userId" },
      { uiTableName: "Session", viewName: "sessionId" },
      { uiTableName: "Metadata", viewName: "metadata" },
      { uiTableName: "Type", viewName: "type" },
      { uiTableName: "Tags", viewName: "tags" },
      { uiTableName: "Model", viewName: "providedModelName" },
      { uiTableName: "Environment", viewName: "environment" },
      { uiTableName: "Release", viewName: "traceRelease" },
      { uiTableName: "Version", viewName: "traceVersion" },
    ],
    "scores-numeric": [
      { uiTableName: "Score Name", viewName: "name" },
      { uiTableName: "Score Source", viewName: "source" },
      { uiTableName: "Score Value", viewName: "value" },
      { uiTableName: "Scores Data Type", viewName: "dataType" },
      { uiTableName: "Tags", viewName: "tags" },
      { uiTableName: "Environment", viewName: "environment" },
      { uiTableName: "User", viewName: "userId" },
      { uiTableName: "Session", viewName: "sessionId" },
      { uiTableName: "Metadata", viewName: "metadata" },
      { uiTableName: "Trace Name", viewName: "traceName" },
      { uiTableName: "Observation Name", viewName: "observationName" },
      { uiTableName: "Release", viewName: "traceRelease" },
      { uiTableName: "Version", viewName: "traceVersion" },
    ],
    "scores-categorical": [
      { uiTableName: "Score Name", viewName: "name" },
      { uiTableName: "Score Source", viewName: "source" },
      { uiTableName: "Score String Value", viewName: "stringValue" },
      { uiTableName: "Scores Data Type", viewName: "dataType" },
      { uiTableName: "Tags", viewName: "tags" },
      { uiTableName: "Environment", viewName: "environment" },
      { uiTableName: "User", viewName: "userId" },
      { uiTableName: "Session", viewName: "sessionId" },
      { uiTableName: "Metadata", viewName: "metadata" },
      { uiTableName: "Trace Name", viewName: "traceName" },
      { uiTableName: "Observation Name", viewName: "observationName" },
      { uiTableName: "Release", viewName: "traceRelease" },
      { uiTableName: "Version", viewName: "traceVersion" },
    ],
  };
  
  /**
   * 대시보드 컬럼 정의 (간소화 버전)
   * 실제로는 더 복잡하지만 기본적인 필터링만 지원
   */
  const dashboardColumnDefinitions = [
    { uiTableName: "Trace Name", uiTableId: "traceName" },
    { uiTableName: "User", uiTableId: "user" },
    { uiTableName: "Environment", uiTableId: "environment" },
    { uiTableName: "Tags", uiTableId: "tags" },
    { uiTableName: "Release", uiTableId: "release" },
    { uiTableName: "Version", uiTableId: "version" },
  ];
  
  /**
   * 레거시 UI 테이블 필터인지 확인
   */
  const isLegacyUiTableFilter = (filter) => {
    return dashboardColumnDefinitions
      .concat([
        { uiTableName: "Session", uiTableId: "sessionId" },
        { uiTableName: "Observation Name", uiTableId: "observationName" },
        { uiTableName: "Metadata", uiTableId: "metadata" },
        { uiTableName: "Score Value", uiTableId: "value" },
        { uiTableName: "Score String Value", uiTableId: "stringValue" },
      ])
      .some((columnDef) => columnDef.uiTableName === filter.column);
  };
  
  /**
   * 레거시 UI 테이블 필터를 뷰 필터로 변환
   */
  export function mapLegacyUiTableFilterToView(view, filters) {
    if (!filters || !Array.isArray(filters)) {
      return [];
    }
  
    return filters.flatMap((filter) => {
      // 레거시 필터가 아니면 그대로 반환
      if (!isLegacyUiTableFilter(filter)) {
        return [filter];
      }
  
      // 매핑에서 일치하는 항목 찾기
      const mapping = viewMappings[view];
      if (!mapping) {
        return [];
      }
  
      const definition = mapping.find(
        (def) => def.uiTableName === filter.column
      );
  
      // 일치하는 항목이 없으면 무시
      if (!definition) {
        return [];
      }
  
      // 컬럼명을 변환하여 반환
      return [{ ...filter, column: definition.viewName }];
    });
  }
  
  /**
   * 다중 메트릭 이름 포맷팅 (3개까지 표시, 나머지는 "+ X more")
   */
  export function formatMultipleMetricNames(metricNames) {
    if (!metricNames || metricNames.length === 0) return "No Metrics";
    if (metricNames.length === 1) return formatMetricName(metricNames[0]);
  
    const formattedNames = metricNames.map(formatMetricName);
  
    if (metricNames.length <= 3) {
      return formattedNames.join(", ");
    }
  
    const firstThree = formattedNames.slice(0, 3).join(", ");
    const remaining = metricNames.length - 3;
    return `${firstThree} + ${remaining} more`;
  }
  
  /**
   * 차트 타입별 표시 이름
   */
  export function getChartTypeDisplayName(chartType) {
    switch (chartType) {
      case "LINE_TIME_SERIES":
        return "Line Chart (Time Series)";
      case "BAR_TIME_SERIES":
        return "Bar Chart (Time Series)";
      case "HORIZONTAL_BAR":
        return "Horizontal Bar Chart (Total Value)";
      case "VERTICAL_BAR":
        return "Vertical Bar Chart (Total Value)";
      case "PIE":
        return "Pie Chart (Total Value)";
      case "NUMBER":
        return "Big Number (Total Value)";
      case "HISTOGRAM":
        return "Histogram (Total Value)";
      case "PIVOT_TABLE":
        return "Pivot Table (Total Value)";
      default:
        return "Unknown Chart Type";
    }
  }
  
  /**
   * 시간 차원별 데이터 그룹핑 (차트용)
   */
  export const groupDataByTimeDimension = (data) => {
    if (!data || !Array.isArray(data)) return [];
  
    const timeGroups = data.reduce((acc, item) => {
      const time = item.time_dimension || "Unknown";
      if (!acc[time]) {
        acc[time] = {};
      }
  
      const dimension = item.dimension || "Unknown";
      acc[time][dimension] = item.metric || 0;
  
      return acc;
    }, {});
  
    return Object.entries(timeGroups).map(([time, dimensions]) => ({
      time_dimension: time,
      ...dimensions,
    }));
  };
  
  /**
   * 데이터에서 고유 차원 추출
   */
  export const getUniqueDimensions = (data) => {
    if (!data || !Array.isArray(data)) return [];
  
    const uniqueDimensions = new Set();
    data.forEach((item) => {
      if (item.dimension) {
        uniqueDimensions.add(item.dimension);
      }
    });
    return Array.from(uniqueDimensions);
  };
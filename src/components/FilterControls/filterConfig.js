// src/components/FilterControls/filterConfig.js

const commonStringOperators = ["=", "contains", "does not contain", "starts with", "ends with"];
const commonNumericOperators = ["=", ">", "<", ">=", "<="];
const commonCategoricalOperators = ["any of", "none of"];
const allCategoricalOperators = ["any of", "none of", "all of"];
const dateTimeOperators = [">", "<", ">=", "<="];

export const promptsFilterConfig = [
  { key: "Name", label: "Name", type: "string", operators: commonStringOperators },
  { key: "Version", label: "Version", type: "number", operators: commonNumericOperators },
  { key: "CreatedAt", label: "Created At", type: "date", operators: commonNumericOperators },
  { key: "UpdatedAt", label: "Updated At", type: "date", operators: commonNumericOperators },
  { key: "Type", label: "Type", type: "categorical", operators: commonCategoricalOperators, options: ["chat", "text"] },
  { key: "Labels", label: "Labels", type: "categorical", operators: allCategoricalOperators, options: ["latest", "production"] },
  { key: "Tags", label: "Tags", type: "categorical", operators: allCategoricalOperators, options: [] }, // Tags는 동적으로 가져올 수 있으므로 비워둡니다.
  { key: "Config", label: "Config", type: "string", operators: commonStringOperators, hasMetaKey: true },
];

export const tracingFilterConfig = [
  { key: "ID", label: "ID", type: "string", operators: commonStringOperators },
  { key: "Name", label: "Name", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "Timestamp", label: "Timestamp", type: "date", operators: commonNumericOperators },
  { key: "UserID", label: "User ID", type: "string", operators: commonStringOperators },
  { key: "SessionID", label: "Session ID", type: "string", operators: commonStringOperators },
  { key: "Metadata", label: "Metadata", type: "string", operators: commonStringOperators, hasMetaKey: true },
  { key: "Version", label: "Version", type: "string", operators: commonStringOperators },
  { key: "Release", label: "Release", type: "string", operators: commonStringOperators },
  { key: "Level", label: "Level", type: "categorical", operators: commonCategoricalOperators, options: ["DEBUG", "DEFAULT", "WARNING", "ERROR"] },
  { key: "Tags", label: "Tags", type: "categorical", operators: allCategoricalOperators, options: [] },
  { key: "InputTokens", label: "Input Tokens", type: "number", operators: commonNumericOperators },
  { key: "OutputTokens", label: "Output Tokens", type: "number", operators: commonNumericOperators },
  { key: "TotalTokens", label: "Total Tokens", type: "number", operators: commonNumericOperators },
  { key: "Tokens", label: "Tokens", type: "number", operators: commonNumericOperators },
  { key: "ErrorLevelCount", label: "Error Level Count", type: "number", operators: commonNumericOperators },
  { key: "WarningLevelCount", label: "Warning Level Count", type: "number", operators: commonNumericOperators },
  { key: "DefaultLevelCount", label: "Default Level Count", type: "number", operators: commonNumericOperators },
  { key: "DebugLevelCount", label: "Debug Level Count", type: "number", operators: commonNumericOperators },
  { key: "ScoresNumeric", label: "Scores (numeric)", type: "number", operators: commonNumericOperators, hasMetaKey: true },
  { key: "ScoresCategorical", label: "Scores (categorical)", type: "categorical", operators: commonCategoricalOperators, hasMetaKey: true, options: [] },
  { key: "Latency", label: "Latency (s)", type: "number", operators: commonNumericOperators },
  { key: "InputCost", label: "Input Cost ($)", type: "number", operators: commonNumericOperators },
  { key: "OutputCost", label: "Output Cost ($)", type: "number", operators: commonNumericOperators },
  { key: "TotalCost", label: "Total Cost ($)", type: "number", operators: commonNumericOperators },
];

export const sessionsFilterConfig = [
  { key: "id", label: "ID", type: "string", operators: commonNumericOperators },
  { key: "userids", label: "User IDs", type: "string", operators: allCategoricalOperators, options: [] },
  { key: "sessionduration", label: "Session Duration (s)", type: "numeric", operators: commonNumericOperators },
  { key: "createdat", label: "Created At", type: "date", operators: commonNumericOperators },
  { key: "tracescount", label: "Traces Count", type: "numeric", operators: commonNumericOperators },
  { key: "inputcost", label: "Input Cost ($)", type: "numeric", operators: commonNumericOperators },
  { key: "outputcost", label: "Output Cost ($)", type: "numeric", operators: commonNumericOperators },
  { key: "totalcost", label: "Total Cost ($)", type: "numeric", operators: commonNumericOperators },
  { key: "inputtokens", label: "Input Tokens", type: "numeric", operators: commonNumericOperators },
  { key: "outputtokens", label: "Output Tokens", type: "numeric", operators: commonNumericOperators },
  { key: "totaltokens", label: "Total Tokens", type: "numeric", operators: commonNumericOperators },
  { key: "usage", label: "Usage", type: "numeric", operators: commonNumericOperators },
  { key: "tracetags", label: "Trace Tags", type: "string", operators: allCategoricalOperators, options: [] },
  { key: "scores(numeric)", label: "Scores (numeric)", type: "numeric", operators: commonNumericOperators, hasMetaKey: true },
  { key: "scores(categorical)", label: "Scores (categorical)", type: "categorical", operators: commonCategoricalOperators, hasMetaKey: true, options: [] },
];

// 새로 추가: 대시보드 필터 설정 (FilterBuilder와 호환되도록 수정)
export const dashboardFilterConfig = [
  { key: "environment", label: "Environment", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "traceName", label: "Trace Name", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "observationName", label: "Observation Name", type: "string", operators: commonStringOperators },
  { key: "scoreName", label: "Score Name", type: "string", operators: commonStringOperators },
  { key: "tags", label: "Tags", type: "categorical", operators: allCategoricalOperators, options: [] },
  { key: "user", label: "User", type: "string", operators: commonStringOperators },
  { key: "session", label: "Session", type: "string", operators: commonStringOperators },
  { key: "metadata", label: "Metadata", type: "string", operators: commonStringOperators, hasMetaKey: true },
  { key: "release", label: "Release", type: "string", operators: commonStringOperators },
  { key: "version", label: "Version", type: "string", operators: commonStringOperators },
];

// Widget용 필터 설정 - 위젯에서 사용되는 실제 dimension 이름들과 매핑
export const widgetFilterConfig = [
  { key: "environment", label: "Environment", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "name", label: "Trace Name", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "traceName", label: "Trace Name", type: "categorical", operators: commonCategoricalOperators, options: [] }, // 별칭
  { key: "observationName", label: "Observation Name", type: "string", operators: commonStringOperators },
  { key: "scoreName", label: "Score Name", type: "string", operators: commonStringOperators },
  { key: "tags", label: "Tags", type: "categorical", operators: allCategoricalOperators, options: [] },
  { key: "user", label: "User", type: "string", operators: commonStringOperators },
  { key: "userId", label: "User ID", type: "string", operators: commonStringOperators },
  { key: "session", label: "Session", type: "string", operators: commonStringOperators },
  { key: "sessionId", label: "Session ID", type: "string", operators: commonStringOperators },
  { key: "metadata", label: "Metadata", type: "string", operators: commonStringOperators, hasMetaKey: true },
  { key: "release", label: "Release", type: "string", operators: commonStringOperators },
  { key: "version", label: "Version", type: "string", operators: commonStringOperators },
  { key: "model", label: "Model", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "type", label: "Type", type: "categorical", operators: commonCategoricalOperators, options: ["GENERATION", "SPAN", "EVENT"] },
  { key: "level", label: "Level", type: "categorical", operators: commonCategoricalOperators, options: ["DEBUG", "DEFAULT", "WARNING", "ERROR"] },
  { key: "inputTokens", label: "Input Tokens", type: "number", operators: commonNumericOperators },
  { key: "outputTokens", label: "Output Tokens", type: "number", operators: commonNumericOperators },
  { key: "totalTokens", label: "Total Tokens", type: "number", operators: commonNumericOperators },
  { key: "inputCost", label: "Input Cost ($)", type: "number", operators: commonNumericOperators },
  { key: "outputCost", label: "Output Cost ($)", type: "number", operators: commonNumericOperators },
  { key: "totalCost", label: "Total Cost ($)", type: "number", operators: commonNumericOperators },
  { key: "latency", label: "Latency (s)", type: "number", operators: commonNumericOperators },
  { key: "scoresNumeric", label: "Scores (numeric)", type: "number", operators: commonNumericOperators, hasMetaKey: true },
  { key: "scoresCategorical", label: "Scores (categorical)", type: "categorical", operators: commonCategoricalOperators, hasMetaKey: true, options: [] },
  { key: "timestamp", label: "Timestamp", type: "date", operators: dateTimeOperators },
];

// ===== 새로 추가: Home 페이지 전용 필터 설정 =====
// 원본 Dashboard 페이지의 filterColumns와 정확히 일치
export const homeFilterConfig = [
  {
    key: "traceName",
    label: "Trace Name", 
    type: "stringOptions", // 원본과 동일
    operators: commonCategoricalOperators,
    options: [], // 동적으로 설정됨
    internal: "internalValue"
  },
  {
    key: "tags",
    label: "Tags",
    type: "arrayOptions", // 원본과 동일
    operators: allCategoricalOperators,
    options: [], // 동적으로 설정됨  
    internal: "internalValue"
  },
  {
    key: "user", 
    label: "User",
    type: "string", // 원본과 동일
    operators: commonStringOperators,
    internal: "internalValue"
  },
  {
    key: "release",
    label: "Release", 
    type: "string", // 원본과 동일
    operators: commonStringOperators,
    internal: "internalValue"
  },
  {
    key: "version",
    label: "Version",
    type: "string", // 원본과 동일 
    operators: commonStringOperators,
    internal: "internalValue"
  },
];

// ===== Home 필터 변환 함수 =====
/**
 * Home 페이지의 FilterBuilder 필터를 Langfuse API 형식으로 변환
 * 원본의 userFilterState 처리 방식과 동일
 */
export const convertHomeFiltersToLangfuse = (builderFilters) => {
  return builderFilters
    .filter(filter => String(filter.value || '').trim() !== '') // 값이 있는 것만
    .map((filter) => {
      const config = homeFilterConfig.find(c => c.key === filter.column);
      const filterType = config?.type || "string";

      // 원본과 동일한 변환 로직
      let apiFilter = {
        column: filter.column,
        type: filterType,
        operator: filter.operator,
        value: filter.value,
        ...(filter.metaKey && { key: filter.metaKey }),
      };

      // stringOptions와 arrayOptions 타입 처리
      if ((filterType === "stringOptions" || filterType === "arrayOptions") && typeof filter.value === "string") {
        apiFilter.value = filter.value ? filter.value.split(",") : [];
      }

      return apiFilter;
    });
};

// ===== 환경 필터 변환 함수 (원본의 convertSelectedEnvironmentsToFilter와 동일) =====
export const convertEnvironmentsToFilter = (selectedEnvironments, environmentOptions) => {
  // 전체 선택이거나 빈 선택인 경우 필터 없음
  if (selectedEnvironments.length === 0 || selectedEnvironments.length === environmentOptions.length) {
    return [];
  }

  return [
    {
      type: "stringOptions",
      column: "environment", 
      operator: "any of",
      value: selectedEnvironments
    }
  ];
};

// ✅ 위젯용 연산자 매핑 함수 추가
export const getWidgetOperatorMapping = () => {
  return {
    // 문자열 연산자
    "=": "equals",
    "contains": "contains", 
    "does not contain": "notContains",
    "starts with": "startsWith",
    "ends with": "endsWith",
    
    // 숫자/날짜 연산자
    ">": "greaterThan",
    "<": "lessThan", 
    ">=": "greaterThanOrEqual",
    "<=": "lessThanOrEqual",
    
    // 카테고리컬 연산자
    "any of": "anyOf",
    "none of": "noneOf", 
    "all of": "allOf"
  };
};

// ✅ 위젯 필터 구성 가져오기 헬퍼 함수
export const getWidgetFilterConfigForDimension = (dimensionKey) => {
  return widgetFilterConfig.find(config => 
    config.key === dimensionKey || 
    config.key === dimensionKey.toLowerCase() ||
    config.label.toLowerCase().replace(/[^a-z0-9]/g, '') === dimensionKey.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
};
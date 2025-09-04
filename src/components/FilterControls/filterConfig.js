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

// src/components/FilterControls/filterConfig.js 파일 맨 끝에 추가할 내용
// (기존 변수들을 재사용하므로 새로 선언하지 않음)

// Widget용 필터 설정 추가
export const widgetFilterConfig = [
  { key: "environment", label: "Environment", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "name", label: "Trace Name", type: "categorical", operators: commonCategoricalOperators, options: [] },
  { key: "observationName", label: "Observation Name", type: "string", operators: commonStringOperators },
  { key: "scoreName", label: "Score Name", type: "string", operators: commonStringOperators },
  { key: "tags", label: "Tags", type: "categorical", operators: allCategoricalOperators, options: [] },
  { key: "userId", label: "User", type: "string", operators: commonStringOperators },
  { key: "sessionId", label: "Session", type: "string", operators: commonStringOperators },
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
  { key: "timestamp", label: "Timestamp", type: "date", operators: commonNumericOperators },
];

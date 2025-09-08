// src/Pages/Widget/services/metricsApi.js
// ⚠️ 개발/테스트 용: 브라우저에 secretKey가 노출됩니다. 운영은 서버 프록시 권장.

const publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY;
const secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY;
const baseUrl =
  import.meta.env.VITE_LANGFUSE_BASE_URL || "http://localhost:3000";

if (!publicKey || !secretKey || !baseUrl) {
  console.error("[metricsApi] .env의 VITE_LANGFUSE_* 변수가 비었습니다.");
}

export function toISO(d) {
  try {
    const x = d instanceof Date ? d : new Date(d);
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function autoGranularity(fromISO, toISO_) {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO_).getTime();
  const diffH = Math.max(1, (to - from) / 36e5);
  if (diffH <= 6) return "minute";
  if (diffH <= 72) return "hour";
  if (diffH <= 24 * 45) return "day";
  if (diffH <= 24 * 120) return "week";
  return "month";
}

export async function fetchMetrics(params) {
  const qs = encodeURIComponent(JSON.stringify(params));
  const url = `${baseUrl}/api/public/metrics?query=${qs}`;

  const headers = new Headers();
  headers.append("Authorization", "Basic " + btoa(`${publicKey}:${secretKey}`));

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[MetricsAPI ${res.status}] ${body || "Request failed"}`);
  }
  return res.json();
}

// Langfuse 공식 API executeQuery 함수 추가
export async function executeQuery(queryParams) {
  try {
    console.log("[metricsApi] Executing query:", queryParams);
    
    // Langfuse query 스키마에 맞게 변환
    const langfuseQuery = {
      view: queryParams.view || "traces",
      dimensions: queryParams.dimensions || [],
      metrics: queryParams.metrics || [{ measure: "count", aggregation: "count" }],
      filters: queryParams.filters || [],
      timeDimension: queryParams.timeDimension,
      fromTimestamp: queryParams.fromTimestamp,
      toTimestamp: queryParams.toTimestamp,
      orderBy: queryParams.orderBy || null
    };

    console.log("[metricsApi] Langfuse query:", langfuseQuery);
    
    const response = await fetchMetrics(langfuseQuery);
    
    return {
      success: true,
      data: {
        chartData: response.data || [],
        metadata: response.metadata || {}
      }
    };
  } catch (error) {
    console.error("[metricsApi] Query execution failed:", error);
    return {
      success: false,
      error: error.message || 'Query execution failed'
    };
  }
}

/** 미리보기 전용 */
export async function fetchMetricsForPreview(opts) {
  const { viewType, metric, startDate, endDate, filters = [] } = opts;

  // Langfuse 공식 views에 맞게 수정
  const view = ["traces", "observations", "scores-numeric", "scores-categorical"].includes(viewType)
    ? viewType
    : "traces";

  // Langfuse 공식 measures에 맞게 수정
  const metricMap = {
    count: { measure: "count", aggregation: "count" },
    observationsCount: { measure: "observationsCount", aggregation: "count" },
    scoresCount: { measure: "scoresCount", aggregation: "count" },
    latency: { measure: "latency", aggregation: "avg" },
    totalCost: { measure: "totalCost", aggregation: "sum" },
    totalTokens: { measure: "totalTokens", aggregation: "sum" },
    timeToFirstToken: { measure: "timeToFirstToken", aggregation: "avg" },
    countScores: { measure: "countScores", aggregation: "count" },
    value: { measure: "value", aggregation: "avg" },
    // 기존 호환성을 위한 매핑
    observations_count: { measure: "observationsCount", aggregation: "count" },
    scores_count: { measure: "scoresCount", aggregation: "count" },
    total_cost: { measure: "totalCost", aggregation: "sum" },
    total_tokens: { measure: "totalTokens", aggregation: "sum" },
    duration: { measure: "latency", aggregation: "avg" },
    cost: { measure: "totalCost", aggregation: "sum" },
    input_tokens: { measure: "totalTokens", aggregation: "sum" },
    output_tokens: { measure: "totalTokens", aggregation: "sum" },
  };
  const metricCfg = metricMap[metric] || metricMap.count;

  const fromISO = toISO(startDate);
  const toISO_ = toISO(endDate);
  const gran = autoGranularity(fromISO, toISO_);

  // Langfuse singleFilter에 맞는 operator 매핑
  const OP_MAP = {
    is: "=",
    "is equal to": "=",
    "=": "=", 
    "is not": "!=",
    "!=": "!=",
    contains: "contains",
    "does not contain": "not_contains",
    in: "in",
    "not in": "not_in",
    anyOf: "in",
    noneOf: "not_in",
    ">": ">",
    "<": "<",
    ">=": ">=",
    "<=": "<=",
  };

  const lfFilters = (filters || []).map((f) => {
    const op = OP_MAP[f.operator] || "=";
    let val = f.value;
    if (typeof val === "string" && (op === "in" || op === "not_in")) {
      val = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return {
      column: f.column,
      operator: op,
      value: val,
      type: Array.isArray(val) ? "arrayOptions" : typeof val,
    };
  });

  const params = {
    view,
    metrics: [metricCfg],
    fromTimestamp: fromISO,
    toTimestamp: toISO_,
    filters: lfFilters,
    timeDimension: { granularity: gran },
  };

  const { data } = await fetchMetrics(params);

  return data.map((row) => {
    const keys = Object.keys(row);
    const timeKey = keys.find((k) => /time|timestamp|date/i.test(k)) || keys[0];
    const numKey =
      keys.find((k) => typeof row[k] === "number") || keys[1] || keys[0];
    return { name: row[timeKey] ?? "", value: Number(row[numKey] ?? 0) };
  });
}
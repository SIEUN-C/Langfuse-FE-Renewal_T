// src/Pages/Widget/services/preview.js
import { FiltersAPI } from "./filters.js";

export class PreviewAPI extends FiltersAPI {
  constructor(projectId = null) {
    super(projectId); // ✅ 부모(FiltersAPI)에 projectId 전달
  }

  // 서버가 기대하는 뷰 키로 정규화
  normalizeView(view) {
    if (!view) return "traces";
    const v = view.toString().trim().toLowerCase();
    const map = {
      traces: "traces",
      observations: "observations",
      "scores numeric": "scores-numeric",
      "scores_numeric": "scores-numeric",
      "scores-numeric": "scores-numeric",
      "scores categorical": "scores-categorical",
      "scores_categorical": "scores-categorical",
      "scores-categorical": "scores-categorical",
    };
    return map[v] || "traces";
  }

  toAPIChartType(type) {
    const map = {
      line: "LINE_TIME_SERIES",
      "vertical-bar": "BAR_TIME_SERIES",
      bar: "VERTICAL_BAR",
      number: "NUMBER",
      "horizontal-bar": "HORIZONTAL_BAR",
      "vertical-bar-total": "VERTICAL_BAR",
      histogram: "HISTOGRAM",
      pie: "PIE",
      table: "PIVOT_TABLE",
      LINE_TIME_SERIES: "LINE_TIME_SERIES",
      BAR_TIME_SERIES: "BAR_TIME_SERIES",
      VERTICAL_BAR: "VERTICAL_BAR",
      HORIZONTAL_BAR: "HORIZONTAL_BAR",
      NUMBER: "NUMBER",
      HISTOGRAM: "HISTOGRAM",
      PIE: "PIE",
      PIVOT_TABLE: "PIVOT_TABLE",
    };
    return map[type] || "NUMBER";
  }

  buildChartConfig(chartType, chartConfig) {
    const type = this.toAPIChartType(chartType);
    return chartConfig && typeof chartConfig === "object"
      ? { type, ...chartConfig }
      : { type };
  }

  sanitizeFilters(inputFilters = [], columns = []) {
    const alias = { user: "userId", session: "sessionId", traceName: "name" };
    const opMap = {
      contains: "CONTAINS",
      "not contains": "NOT_CONTAINS",
      not_contains: "NOT_CONTAINS",
      in: "IN",
      not_in: "NOT_IN",
      "=": "=",
      "is equal to": "=",
      is: "=",
      "!=": "!=",
      ">": ">",
      "<": "<",
      ">=": ">=",
      "<=": "<=",
    };

    const colMeta = Object.fromEntries(
      (columns || []).map((c) => [c.id || c.column || c.name, c])
    );

    const cleaned = (inputFilters || [])
      .map((f) => {
        const rawCol = f.field ?? f.column ?? f.id ?? f.name;
        if (!rawCol) return null;

        const column = alias[rawCol] || rawCol;

        let operator = (f.operator || f.op || "contains")
          .toString()
          .toLowerCase();
        operator = opMap[operator] || "CONTAINS";

        let value = f.value ?? f.values ?? (f.list ? [...f.list] : undefined);
        if (
          (operator === "IN" || operator === "NOT_IN") &&
          typeof value === "string"
        ) {
          value = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        const type = colMeta[rawCol]?.type || "string";
        if (type === "arrayOptions" && !Array.isArray(value))
          value = value != null ? [value] : [];

        return { column, operator, value };
      })
      .filter(
        (f) =>
          f &&
          f.column &&
          f.operator &&
          !(
            f.value == null ||
            (typeof f.value === "string" && f.value.trim() === "") ||
            (Array.isArray(f.value) && f.value.length === 0)
          )
      );

    const seen = new Set();
    return cleaned.filter((f) => {
      const k = `${f.column}|${f.operator}|${JSON.stringify(f.value)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  async executeQuery(params = {}, columns = []) {
    const {
      view = "traces",
      dimensions = [],
      metrics = [{ measure: "count", aggregation: "count" }],
      filters = [],
      fromTimestamp,
      toTimestamp,
      chartType = "LINE_TIME_SERIES",
      timeDimension = { granularity: "auto" },
      orderBy = [],
      chartConfig = null,
    } = params;

    console.log("=== PreviewAPI executeQuery 시작 ===");
    console.log("파라미터:", params);

    const serialized =
      typeof this.serializeFilters === "function"
        ? this.serializeFilters(filters, columns)
        : filters;

    const cleanFilters = this.sanitizeFilters(serialized, columns);

    const dims = (dimensions || []).map((d) =>
      typeof d === "string" ? { field: d } : d
    );
    const normalizedMetrics = (metrics || []).map((m) => ({
      measure: m?.measure ?? m?.columnId ?? "count",
      aggregation: m?.aggregation ?? "count",
    }));

    const payload = {
      projectId: this.projectId,
      query: {
        view: this.normalizeView(view),
        dimensions: dims,
        metrics: normalizedMetrics,
        filters: cleanFilters,
        timeDimension: timeDimension || { granularity: "auto" },
        fromTimestamp:
          fromTimestamp || new Date(Date.now() - 7 * 86400000).toISOString(),
        toTimestamp: toTimestamp || new Date().toISOString(),
        chartConfig: this.buildChartConfig(chartType, chartConfig),
        orderBy: Array.isArray(orderBy) ? orderBy : [],
      },
    };

    console.log("API 페이로드:", payload);

    const endpoints = ["dashboard.executeQuery"];
    for (const endpoint of endpoints) {
      try {
        console.log(`API 호출 시도: ${endpoint}`);
        const data = await this.trpcGet(endpoint, payload);
        console.log("API 응답:", data);
        
        if (data) {
          const processedData = this.processChartData(data, this.toAPIChartType(chartType));
          console.log("처리된 데이터:", processedData);
          return processedData;
        }
      } catch (error) {
        console.log(`차트 API 실패: ${endpoint}`, error?.message || error);
      }
    }
    
    console.log("API 실패, 목업 데이터 사용");
    return this.getMockChartData(this.toAPIChartType(chartType), params);
  }

  processChartData(data, chartType) {
    console.log("=== processChartData 시작 ===");
    console.log("원본 API 데이터:", data);
    console.log("차트 타입:", chartType);

    const raw = data?.chartData || data?.data || data?.series || data?.results || [];
    let chartData = [];

    if (Array.isArray(raw) && raw.length > 0) {
      console.log("원시 데이터 배열:", raw);
      
      chartData = raw
        .map((p, i) => {
          console.log(`원시 데이터 ${i}:`, p);
          
          if (Array.isArray(p)) {
            const result = { 
              x: p[0], 
              y: Number(p[1]) || 0,
              metric: Number(p[1]) || 0,
              dimension: p[0],
              time_dimension: p[0]
            };
            console.log(`배열 데이터 ${i} 변환:`, result);
            return result;
          }
          
          const x = p.time || p.timestamp || p.date || p.bucket || p.x || p.name || `Point ${i + 1}`;
          const y = Number(p.value ?? p.y ?? p.count ?? p.total ?? p.metric ?? 0);
          
          const result = { 
            x, 
            y, 
            metric: y, // chart-library가 기대하는 metric 필드
            dimension: x, // chart-library가 기대하는 dimension 필드
            time_dimension: p.time || p.timestamp || p.date, // 시간 차원
            value: y, // 호환성을 위한 추가 필드들
            count: y,
            total: y,
            ...p // 원본 데이터 보존
          };
          
          console.log(`객체 데이터 ${i} 변환:`, result);
          return result;
        })
        .filter(Boolean);
    }

    console.log("변환된 chartData:", chartData);

    // 데이터가 없으면 목업 데이터 생성
    if (chartData.length === 0) {
      console.log("데이터가 없어 목업 데이터 생성");
      chartData = this.generateMockChartData(chartType);
    }
    
    const value =
      typeof data?.value === "number"
        ? data.value
        : chartData.reduce((s, d) => s + (d?.y || d?.metric || 0), 0);

    const result = {
      success: true,
      data: {
        value,
        chartType,
        chartData,
        rawData: data,
        isMockData: chartData.length === 0 || !data,
      },
    };

    console.log("최종 processChartData 결과:", result);
    console.log("=== processChartData 완료 ===");
    return result;
  }

  generateMockChartData(chartType) {
    console.log("목업 데이터 생성, 차트 타입:", chartType);
    
    const now = new Date();
    const d = (days) => {
      const t = new Date(now);
      t.setDate(t.getDate() - days);
      return t.toISOString().split("T")[0];
    };

    let mockData = [];

    switch (chartType) {
      case "LINE_TIME_SERIES":
      case "BAR_TIME_SERIES":
        mockData = [6, 5, 4, 3, 2, 1, 0].map((k) => ({
          x: d(k),
          y: 0,
          metric: 0,
          dimension: d(k),
          time_dimension: d(k),
          value: 0
        }));
        break;
      case "PIE":
      case "VERTICAL_BAR":
      case "HORIZONTAL_BAR":
        mockData = [
          { x: "Production", y: 0 },
          { x: "Staging", y: 0 },
          { x: "Development", y: 0 },
        ].map(item => ({
          ...item,
          metric: item.y,
          dimension: item.x,
          value: item.y,
          count: item.y
        }));
        break;
      case "NUMBER":
        mockData = [{
          x: "Total",
          y: 0,
          metric: 0,
          dimension: "Total",
          value: 0
        }];
        break;
      default:
        mockData = [
          { x: "Sample 1", y: 0 },
          { x: "Sample 2", y: 0 },
          { x: "Sample 3", y: 0 },
        ].map(item => ({
          ...item,
          metric: item.y,
          dimension: item.x,
          value: item.y,
          count: item.y
        }));
    }

    console.log("생성된 목업 데이터 (실제 API 연결 테스트용):", mockData);
    return mockData;
  }

  getMockChartData(chartType, params = {}) {
    const chartData = this.generateMockChartData(chartType);
    const value = chartData.reduce((s, d) => s + (d?.y || d?.metric || 0), 0);
    
    const result = {
      success: true,
      data: {
        value: chartType === "NUMBER" ? value : value,
        chartType,
        chartData,
        rawData: { mockData: true, params },
        isMockData: true,
      },
    };

    console.log("getMockChartData 결과:", result);
    return result;
  }

  // 기본 serialize (FiltersAPI가 override하므로 백업 역할)
  serializeFilters(filters) {
    if (!Array.isArray(filters)) return [];
    return filters.map((f) => ({
      field: f.field || f.column || f.id || f.name,
      operator: f.operator || "contains",
      value: f.value ?? f.values,
      type: f.type || "string",
    }));
  }
}
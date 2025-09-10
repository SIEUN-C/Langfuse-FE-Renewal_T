// src/Pages/Widget/hooks/useWidgetPreview.js - 완전 수정버전
import { useEffect, useState } from "react";
import api from "../services"; // index.js에서 가져오기

export default function useWidgetPreview(config, columns = []) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState({
    count: 0,
    formattedChartData: [],
  });

  useEffect(() => {
    let alive = true;
    
    const executePreview = async () => {
      try {
        console.log("=== useWidgetPreview 시작 ===");
        console.log("Config:", config);
        console.log("Columns:", columns);
        
        setLoading(true);

        // 🔥 DashboardWidget의 쿼리 구조와 동일하게 수정
        const queryParams = {
          view: config.view || "traces",
          dimensions: config.dimensions || [],
          metrics: (config.metrics || []).map((m) => ({
            measure: m.measure || m.columnId || "count",
            aggregation: m.aggregation || m.agg || "count",
          })),
          filters: config.filters || [],
          fromTimestamp: config?.dateRange?.from?.toISOString?.() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          toTimestamp: config?.dateRange?.to?.toISOString?.() || new Date().toISOString(),
          timeDimension: config.chartType && ["LINE_TIME_SERIES", "BAR_TIME_SERIES"].includes(config.chartType) 
            ? { granularity: "auto" } 
            : null,
          orderBy: config.chartType === "PIVOT_TABLE" && config.sortState
            ? [{ field: config.sortState.column, direction: config.sortState.order.toLowerCase() }]
            : [],
          chartConfig: config.chartConfig || { type: config.chartType || "LINE_TIME_SERIES" }
        };

        console.log("쿼리 파라미터:", queryParams);

        // 🔥 widgetAPI.executeQuery와 동일한 API 호출
        const result = await api.executeQuery("demo-project", queryParams);
        
        console.log("API 결과:", result);

        if (!alive) return;

        if (result.success && result.data) {
          // 🔥 DashboardWidget과 동일한 데이터 처리
          const rawData = result.data || [];
          
          console.log("원시 데이터:", rawData);
          
          // 🔥 DashboardWidget의 transformedData와 동일한 변환 로직
          const formattedChartData = rawData.map((item) => {
            // PIVOT_TABLE용 변환
            if (config.chartType === "PIVOT_TABLE") {
              return {
                dimension: config.dimensions?.length > 0
                  ? config.dimensions[0]?.field || "dimension"
                  : "dimension",
                metric: 0,
                time_dimension: item["time_dimension"],
                ...item,
              };
            }

            // 일반 차트용 변환
            const metric = config.metrics?.slice().shift() || {
              measure: "count",
              agg: "count",
            };
            const metricField = `${metric.agg}_${metric.measure}`;
            const metricValue = item[metricField];

            const dimensionField = config.dimensions?.slice().shift()?.field || "none";

            return {
              dimension: item[dimensionField] !== undefined
                ? (() => {
                    const val = item[dimensionField];
                    if (typeof val === "string") return val;
                    if (val === null || val === undefined || val === "")
                      return "n/a";
                    if (Array.isArray(val)) return val.join(", ");
                    return String(val);
                  })()
                : `${metric.agg}_${metric.measure}`,
              metric: Array.isArray(metricValue)
                ? metricValue
                : Number(metricValue || 0),
              time_dimension: item["time_dimension"],
            };
          });

          console.log("변환된 차트 데이터:", formattedChartData);

          setPreviewData({
            count: formattedChartData.length,
            formattedChartData: formattedChartData,
          });
        } else {
          console.warn("API 실패 또는 빈 데이터:", result);
          setPreviewData({ 
            count: 0, 
            formattedChartData: [],
            error: result.error
          });
        }
      } catch (error) {
        console.error("useWidgetPreview 에러:", error);
        if (alive) {
          setPreviewData({ 
            count: 0, 
            formattedChartData: [],
            error: error.message
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    // 🔥 설정이 유효할 때만 실행
    if (config && config.view) {
      executePreview();
    } else {
      setLoading(false);
      setPreviewData({ count: 0, formattedChartData: [] });
    }

    return () => {
      alive = false;
    };
  }, [
    // 🔥 의존성 배열 최적화 - 필수 값들만 추적
    config.view,
    JSON.stringify(config.dimensions || []),
    JSON.stringify(config.metrics || []),
    JSON.stringify(config.filters || []),
    config?.dateRange?.from?.toISOString?.(),
    config?.dateRange?.to?.toISOString?.(),
    config.chartType,
    JSON.stringify(columns || []),
  ]);

  return { loading, previewData };
}
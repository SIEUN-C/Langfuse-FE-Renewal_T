// src/Pages/Widget/hooks/useWidgetPreview.js - 수정됨
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

        // 🔥 핵심 수정: api.executeQuery 직접 호출
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
          chartType: config.chartType || "LINE_TIME_SERIES",
          timeDimension: config.chartType && ["LINE_TIME_SERIES", "BAR_TIME_SERIES"].includes(config.chartType) 
            ? { granularity: "auto" } 
            : null,
          orderBy: [],
          chartConfig: config.chartConfig || { type: config.chartType || "LINE_TIME_SERIES" }
        };

        console.log("쿼리 파라미터:", queryParams);

        // 🔥 실제 API 호출
        const result = await api.executeQuery(queryParams);
        
        console.log("API 결과:", result);

        if (!alive) return;

        if (result.success && result.data) {
          // 🔥 데이터 변환 및 설정
          const rawData = result.data.chartData || result.data.data || [];
          
          console.log("원시 데이터:", rawData);
          
          // 차트 라이브러리가 기대하는 형식으로 변환
          const formattedChartData = rawData.map((item, index) => {
            console.log(`데이터 포인트 ${index}:`, item);
            
            // 다양한 데이터 형식 지원
            if (Array.isArray(item)) {
              return {
                time_dimension: item[0],
                dimension: item[0],
                metric: Number(item[1]) || 0,
                value: Number(item[1]) || 0,
                x: item[0],
                y: Number(item[1]) || 0
              };
            }
            
            // 객체 형식 데이터 처리
            const metric = item.metric || item.value || item.count || item.total || item.y || 0;
            const dimension = item.dimension || item.name || item.label || item.x || item.time_dimension || `Point ${index + 1}`;
            
            return {
              time_dimension: item.time_dimension || item.timestamp || item.date || item.time,
              dimension: dimension,
              metric: Number(metric),
              value: Number(metric),
              count: Number(metric),
              total: Number(metric),
              x: dimension,
              y: Number(metric),
              // 원본 데이터도 포함
              ...item
            };
          });

          console.log("변환된 차트 데이터:", formattedChartData);

          setPreviewData({
            count: result.data.value || formattedChartData.length,
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
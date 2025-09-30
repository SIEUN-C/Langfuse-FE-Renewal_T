// src/Pages/Widget/components/ChartPreview.jsx - DashboardWidget과 완전 동일한 변환 로직 적용
import React, { useMemo } from "react";
import Chart from "../chart-library/Chart.jsx";
import chartStyles from '../chart-library/chartLibrary.module.css';
import { formatMetricName } from "../../Dashboards/utils/widgetUtils.js";

export default function ChartPreview({
  chartType = "LINE_TIME_SERIES",
  data = [],
  chartConfig = {},
  loading = false,
  error = "",
  rowLimit = 100,
  // DashboardWidget과 동일한 위젯 정보를 받도록 추가
  widget = null, // { metrics: [...], dimensions: [...], chartType: "..." }
}) {
  console.log("=== ChartPreview 렌더링 ===");
  console.log("Props:", { chartType, data: data?.length, chartConfig, loading, error, rowLimit, widget });

  // 🔥 핵심 수정: DashboardWidget.jsx와 완전히 동일한 데이터 변환 로직
  const transformedData = useMemo(() => {
    console.log("=== ChartPreview 데이터 변환 시작 ===");
    console.log("원본 데이터:", data);
    console.log("차트 타입:", chartType);
    console.log("위젯 정보:", widget);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log("데이터가 배열이 아니거나 비어있음:", typeof data);
      return [];
    }

    // 🔥 DashboardWidget.jsx의 transformedData와 완전히 동일한 로직
    return data.map((item) => {
      // PIVOT_TABLE용 변환 - DashboardWidget과 동일
      if (chartType === "PIVOT_TABLE") {
        return {
          dimension:
            widget?.dimensions && widget.dimensions.length > 0
              ? widget.dimensions[0]?.field || "dimension"
              : "dimension",
          metric: 0,
          time_dimension: item["time_dimension"],
          ...item,
        };
      }

      // 일반 차트용 변환 - DashboardWidget과 완전히 동일
      const metric = widget?.metrics?.slice().shift() || {
        measure: "count",
        agg: "count",
      };
      const metricField = `${metric.agg}_${metric.measure}`;
      const metricValue = item[metricField];

      const dimensionField =
        widget?.dimensions?.slice().shift()?.field || "none";

      return {
        dimension:
          item[dimensionField] !== undefined
            ? (() => {
                const val = item[dimensionField];
                if (typeof val === "string") return val;
                if (val === null || val === undefined || val === "")
                  return "n/a";
                if (Array.isArray(val)) return val.join(", ");
                return String(val);
              })()
            : formatMetricName(metricField),
        metric: Array.isArray(metricValue)
          ? metricValue
          : Number(metricValue || 0),
        time_dimension: item["time_dimension"],
      };
    });

    console.log("최종 변환된 데이터:", result);
    console.log("=== ChartPreview 데이터 변환 완료 ===");
    
    return result;
  }, [data, chartType, widget]);

  // 로딩 상태 - DashboardWidget과 동일
  if (loading) {
    return (
      <div className={chartStyles.chartContainer}>
        <div className={chartStyles.loading}>
          <div style={{ 
            display: 'inline-block', 
            width: '20px', 
            height: '20px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 2s linear infinite'
          }}></div>
          <span style={{ marginLeft: '10px' }}>Loading chart...</span>
        </div>
      </div>
    );
  }

  // 에러 상태 - DashboardWidget과 동일
  if (error) {
    return (
      <div className={chartStyles.chartContainer}>
        <div className={chartStyles.error}>
          <div>Chart Error</div>
          <div>⚠️ {String(error)}</div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 - DashboardWidget과 동일
  if (!transformedData || transformedData.length === 0) {
    return (
      <div className={chartStyles.chartContainer}>
        <div className={chartStyles.empty}>
          <div>No data available</div>
          <div>Execute a query to see chart data</div>
        </div>
      </div>
    );
  }

  // 🔥 Chart 컴포넌트 렌더링 - DashboardWidget과 완전히 동일
  console.log("Chart 컴포넌트에 전달할 데이터:", {
    chartType,
    dataLength: transformedData.length,
    sampleData: transformedData.slice(0, 3),
    rowLimit,
    chartConfig
  });

  return (
    <div className={chartStyles.chartContainer}>
      <Chart
        chartType={chartType}
        data={transformedData}
        rowLimit={
          chartType === "LINE_TIME_SERIES" ||
          chartType === "BAR_TIME_SERIES"
            ? 100
            : chartConfig?.row_limit || rowLimit
        }
        chartConfig={{
          ...chartConfig,
          // PIVOT_TABLE용 추가 설정 - DashboardWidget과 동일
          ...(chartType === "PIVOT_TABLE" && {
            dimensions:
              widget?.dimensions?.map((dim) => dim.field) || [],
            metrics:
              widget?.metrics?.map(
                (metric) => `${metric.agg}_${metric.measure}`
              ) || [],
          }),
        }}
        // PIVOT_TABLE용 정렬 관련 props는 프리뷰에서는 생략 (DashboardWidget과 동일)
        isLoading={loading}
      />
    </div>
  );
}
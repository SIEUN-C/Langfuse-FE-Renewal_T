// src/Pages/Widget/components/ChartPreview.jsx - 수정됨
import React, { useMemo } from "react";
import Chart from "../chart-library/Chart.jsx";
import chartStyles from '../chart-library/chart-library.module.css';

export default function ChartPreview({
  chartType = "LINE_TIME_SERIES",
  data = [],
  chartConfig = {},
  loading = false,
  error = "",
  rowLimit = 100,
}) {
  console.log("=== ChartPreview 렌더링 ===");
  console.log("Props:", { chartType, data, chartConfig, loading, error, rowLimit });

  // 🔥 데이터 변환 로직 개선
  const transformedData = useMemo(() => {
    console.log("=== ChartPreview 데이터 변환 시작 ===");
    console.log("원본 데이터:", data);
    console.log("차트 타입:", chartType);
    
    if (!Array.isArray(data)) {
      console.log("데이터가 배열이 아님:", typeof data);
      return [];
    }
    
    const result = data.map((item, index) => {
      console.log(`아이템 ${index}:`, item);
      
      // 🔥 PIVOT_TABLE의 경우 원본 데이터를 그대로 전달
      if (chartType === "PIVOT_TABLE") {
        console.log(`PIVOT_TABLE용 아이템 ${index} 반환:`, item);
        return item;
      }

      // 🔥 이미 올바른 형식인지 확인
      if (item.metric !== undefined && item.dimension !== undefined) {
        console.log(`이미 올바른 형식 ${index}:`, item);
        return item;
      }

      // 🔥 메트릭 값 추출 - 우선순위 개선
      let metricValue = 0;
      
      if (typeof item.y === 'number' && !isNaN(item.y)) {
        metricValue = item.y;
      } else if (typeof item.metric === 'number' && !isNaN(item.metric)) {
        metricValue = item.metric;
      } else if (typeof item.value === 'number' && !isNaN(item.value)) {
        metricValue = item.value;
      } else if (typeof item.count === 'number' && !isNaN(item.count)) {
        metricValue = item.count;
      } else if (typeof item.total === 'number' && !isNaN(item.total)) {
        metricValue = item.total;
      } else {
        // 모든 숫자 필드에서 0이 아닌 값 찾기
        const numericFields = Object.keys(item).filter(key => 
          typeof item[key] === 'number' && !isNaN(item[key]) && item[key] !== 0
        );
        
        if (numericFields.length > 0) {
          metricValue = item[numericFields[0]];
        }
      }

      // 🔥 차원 값 추출 - 우선순위 개선
      let dimensionValue = item.dimension || 
                          item.name || 
                          item.x || 
                          item.bucket || 
                          item.label ||
                          item.category ||
                          `Point ${index + 1}`;

      // 🔥 시간 차원 값 추출
      let timeDimensionValue = item.time_dimension || 
                              item.timestamp || 
                              item.date || 
                              item.time ||
                              item.x;

      // 🔥 chart-library의 DataPoint 형식에 맞게 변환
      const transformedItem = {
        time_dimension: timeDimensionValue,
        dimension: dimensionValue,
        metric: metricValue,
        // 호환성을 위한 추가 필드들
        value: metricValue,
        count: metricValue,
        total: metricValue,
        y: metricValue,
        x: dimensionValue,
        name: dimensionValue,
        // 원본 데이터도 포함
        ...item
      };

      console.log(`변환된 아이템 ${index}:`, transformedItem);
      return transformedItem;
    });

    console.log("최종 변환된 데이터:", result);
    console.log("=== ChartPreview 데이터 변환 완료 ===");
    
    return result;
  }, [data, chartType]);

  // 🔥 로딩 상태
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

  // 🔥 에러 상태
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

  // 🔥 데이터가 없는 경우
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

  // 🔥 차트 렌더링
  console.log("Chart 컴포넌트에 전달할 데이터:", {
    chartType,
    dataLength: transformedData.length,
    sampleData: transformedData.slice(0, 3),
    rowLimit,
    chartConfig
  });

  return (
    <div className={chartStyles.container}>
      <div className={chartStyles.chartContent}>
        <Chart
          chartType={chartType}
          data={transformedData}
          rowLimit={rowLimit}
          chartConfig={chartConfig}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
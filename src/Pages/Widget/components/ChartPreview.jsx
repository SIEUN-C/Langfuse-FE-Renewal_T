// src/Pages/Widget/components/ChartPreview.jsx
import React, { useMemo } from "react";
import Chart from "../chart-library/Chart.jsx";
import styles from './ChartPreview.module.css';

export default function ChartPreview({
  chartType = "LINE_TIME_SERIES",
  data = [],
  chartConfig = {},
  loading = false,
  error = "",
  rowLimit = 100,
}) {
  // 팀원의 chart-library에서 기대하는 DataPoint 형식으로 변환
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
      
      // PIVOT_TABLE의 경우 원본 데이터를 그대로 전달
      if (chartType === "PIVOT_TABLE") {
        console.log(`PIVOT_TABLE용 아이템 ${index} 반환:`, item);
        return item;
      }

      // 메트릭 값 추출 - 우선순위대로 확인
      let metricValue = 0;
      
      // PreviewAPI에서 생성한 y 값이 가장 우선
      if (typeof item.y === 'number' && !isNaN(item.y)) {
        metricValue = item.y;
        console.log(`아이템 ${index} - y 값 사용:`, metricValue);
      } else if (typeof item.value === 'number' && !isNaN(item.value)) {
        metricValue = item.value;
        console.log(`아이템 ${index} - value 값 사용:`, metricValue);
      } else if (typeof item.count === 'number' && !isNaN(item.count)) {
        metricValue = item.count;
        console.log(`아이템 ${index} - count 값 사용:`, metricValue);
      } else if (typeof item.metric === 'number' && !isNaN(item.metric)) {
        metricValue = item.metric;
        console.log(`아이템 ${index} - metric 값 사용:`, metricValue);
      } else if (typeof item.total === 'number' && !isNaN(item.total)) {
        metricValue = item.total;
        console.log(`아이템 ${index} - total 값 사용:`, metricValue);
      } else {
        // 모든 숫자 필드에서 0이 아닌 값 찾기
        const numericFields = Object.keys(item).filter(key => 
          typeof item[key] === 'number' && !isNaN(item[key]) && item[key] !== 0
        );
        
        if (numericFields.length > 0) {
          metricValue = item[numericFields[0]];
          console.log(`아이템 ${index} - ${numericFields[0]} 값 사용:`, metricValue);
        } else {
          console.log(`아이템 ${index} - 메트릭 값을 찾을 수 없음, 0 사용`);
        }
      }

      // 차원 값 추출
      let dimensionValue = item.dimension || 
                          item.name || 
                          item.x || 
                          item.bucket || 
                          item.label ||
                          `Point ${index + 1}`;

      // 시간 차원 값 추출
      let timeDimensionValue = item.time_dimension || 
                              item.timestamp || 
                              item.date || 
                              item.time ||
                              item.x;

      // chart-library의 DataPoint 형식에 맞게 변환
      const transformedItem = {
        // time_dimension: 시간 기반 차트용
        time_dimension: timeDimensionValue,
        
        // dimension: 카테고리 기반 차트용  
        dimension: dimensionValue,
        
        // metric: 수치 값 (chart-library에서 기대하는 형식)
        metric: metricValue,

        // 원본 데이터도 포함 (chart-library에서 필요할 수 있음)
        ...item
      };

      console.log(`변환된 아이템 ${index}:`, transformedItem);
      return transformedItem;
    });

    console.log("최종 변환된 데이터:", result);
    console.log("=== ChartPreview 데이터 변환 완료 ===");
    
    return result;
  }, [data, chartType]);

  // 로딩 상태 - 랭퓨즈 스타일
  if (loading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <span>Loading chart...</span>
        </div>
      </div>
    );
  }

  // 에러 상태 - 랭퓨즈 스타일
  if (error) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorTitle}>Chart Error</div>
          <div className={styles.errorMessage}>⚠️ {String(error)}</div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 - 랭퓨즈 스타일
  if (!transformedData || transformedData.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <div>No data available</div>
          <div className={styles.emptyHint}>
            Execute a query to see chart data
          </div>
        </div>
      </div>
    );
  }

  // 팀원의 chart-library 사용
  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
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
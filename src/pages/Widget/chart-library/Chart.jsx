//src/Pages/Widget/chart-library/Chart.jsx

import React, { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import LineChartTimeSeries from "./LineChartTimeSeries.jsx";
import VerticalBarChartTimeSeries from "./VerticalBarChartTimeSeries.jsx";
import HorizontalBarChart from "./HorizontalBarChart.jsx";
import VerticalBarChart from "./VerticalBarChart.jsx";
import PieChart from "./PieChart.jsx";
import HistogramChart from "./HistogramChart.jsx";
import BigNumber from "./BigNumber.jsx";
import PivotTable from "./PivotTable.jsx";
import styles from './chartLibrary.module.css';

/**
 * 메인 차트 컴포넌트
 * chartType에 따라 적절한 차트 컴포넌트로 라우팅
 * 
 * @param {string} chartType - 차트 타입
 * @param {Array} data - 차트 데이터
 * @param {number} rowLimit - 최대 표시 행 수
 * @param {Object} chartConfig - 차트 설정
 * @param {Object} sortState - 정렬 상태 (PIVOT_TABLE용)
 * @param {Function} onSortChange - 정렬 변경 핸들러
 * @param {boolean} isLoading - 로딩 상태
 */
export const Chart = ({
  chartType,
  data,
  rowLimit,
  chartConfig,
  sortState,
  onSortChange,
  isLoading = false,
}) => {
  const [forceRender, setForceRender] = useState(false);
  
  // 대용량 데이터 경고 (2000개 이상)
  const shouldWarn = data.length > 2000 && !forceRender;

  // 시간 차원 데이터 포맷팅
  const renderedData = useMemo(() => {
    return data.map((item) => {
      return {
        ...item,
        time_dimension: item.time_dimension
          ? new Date(item.time_dimension).toLocaleTimeString("en-US", {
              year: "2-digit",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
      };
    });
  }, [data]);

  // 차트 타입별 컴포넌트 렌더링
  const renderChart = () => {
    switch (chartType) {
      case "LINE_TIME_SERIES":
        return <LineChartTimeSeries data={renderedData} />;
      case "BAR_TIME_SERIES":
        return <VerticalBarChartTimeSeries data={renderedData} />;
      case "HORIZONTAL_BAR":
        return <HorizontalBarChart data={renderedData.slice(0, rowLimit)} />;
      case "VERTICAL_BAR":
        return <VerticalBarChart data={renderedData.slice(0, rowLimit)} />;
      case "PIE":
        return <PieChart data={renderedData.slice(0, rowLimit)} />;
      case "HISTOGRAM":
        return <HistogramChart data={renderedData} />;
      case "NUMBER":
        return <BigNumber data={renderedData} />;
      case "PIVOT_TABLE": {
        const pivotConfig = {
          dimensions: chartConfig?.dimensions ?? [],
          metrics: chartConfig?.metrics ?? ["metric"],
          rowLimit: chartConfig?.row_limit ?? rowLimit,
          defaultSort: chartConfig?.defaultSort,
        };
        return (
          <PivotTable
            data={renderedData}
            config={pivotConfig}
            sortState={sortState}
            onSortChange={onSortChange}
            isLoading={isLoading}
          />
        );
      }
      default:
        return <HorizontalBarChart data={renderedData.slice(0, rowLimit)} />;
    }
  };

  // 대용량 데이터 경고 메시지
  const renderWarning = () => (
    <div className={styles.warningContainer}>
      <AlertCircle className={styles.warningIcon} />
      <h3 className={styles.warningTitle}>Large Dataset Warning</h3>
      <p className={styles.warningText}>
        This chart has more than 2,000 unique data points. Rendering it may be
        slow or may crash your browser. Try to reduce the number of dimensions
        by adding more selective filters or choosing a coarser breakdown
        dimension.
      </p>
      <button
        className={styles.warningButton}
        onClick={() => setForceRender(true)}
      >
        I understand, proceed to render the chart
      </button>
    </div>
  );

  return (
    <div className={styles.chartContent}>
      {shouldWarn ? renderWarning() : renderChart()}
    </div>
  );
};

export default Chart;
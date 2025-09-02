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
import styles from './chart-library.module.css';

/**
 * Main Chart component that routes to specific chart types
 * 
 * @param {Object} props - Component props
 * @param {string} props.chartType - Type of chart to render
 * @param {import('./chart-props.js').DataPoint[]} props.data - Chart data
 * @param {number} props.rowLimit - Maximum number of rows to display
 * @param {Object} [props.chartConfig] - Chart configuration
 * @param {string} [props.chartConfig.type] - Chart type
 * @param {number} [props.chartConfig.row_limit] - Row limit from config
 * @param {number} [props.chartConfig.bins] - Number of bins for histogram
 * @param {string[]} [props.chartConfig.dimensions] - Dimension fields
 * @param {string[]} [props.chartConfig.metrics] - Metric fields
 * @param {Object} [props.chartConfig.defaultSort] - Default sort configuration
 * @param {Object} [props.sortState] - Current sort state
 * @param {Function} [props.onSortChange] - Sort change handler
 * @param {boolean} [props.isLoading] - Loading state
 * @returns {React.ReactElement} Rendered chart component
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
  const shouldWarn = data.length > 2000 && !forceRender;

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
      case "NUMBER": {
        return <BigNumber data={renderedData} />;
      }
      case "PIVOT_TABLE": {
        // Extract pivot table configuration from chartConfig
        const pivotConfig = {
          dimensions: chartConfig?.dimensions ?? [],
          metrics: chartConfig?.metrics ?? ["metric"], // Use metrics from chartConfig
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
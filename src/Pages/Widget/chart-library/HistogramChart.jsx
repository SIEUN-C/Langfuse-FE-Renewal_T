import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { compactSmallNumberFormatter } from "../utils/number-utils.js";
import styles from './chart-library.module.css';

/**
 * HistogramChart component displays data as a histogram/bar chart
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Array of data points
 * @returns {React.ReactElement} Rendered histogram chart
 */
const HistogramChart = ({ data }) => {
  /**
   * Transforms data points into histogram format
   * @param {import('./chart-props.js').DataPoint[]} data - Input data points
   * @returns {Array<{binLabel: string, count: number, lower?: number, upper?: number, height?: number}>}
   */
  const transformHistogramData = (data) => {
    if (!data.length) return [];

    // Check if this is ClickHouse histogram format (array of tuples)
    const firstDataPoint = data[0];
    if (firstDataPoint?.metric && Array.isArray(firstDataPoint.metric)) {
      // ClickHouse histogram format: [(lower, upper, height), ...]
      return firstDataPoint.metric.map(([lower, upper, height]) => ({
        binLabel: `[${compactSmallNumberFormatter(lower)}, ${compactSmallNumberFormatter(upper)}]`,
        count: height,
        lower,
        upper,
        height,
      }));
    }

    // Fallback: treat as regular data points with binLabel
    return data.map((item) => ({
      binLabel: item.dimension || `Bin ${data.indexOf(item) + 1}`,
      count: (typeof item.metric === 'number' ? item.metric : 0) || 0,
    }));
  };

  const histogramData = transformHistogramData(data);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`Bin: ${label}`}</p>
          <p className={styles.tooltipValue}>
            <span className={styles.tooltipIndicator}></span>
            {`Count: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!histogramData.length) {
    return (
      <div className={styles.empty}>
        No data available
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
        >
          <XAxis
            dataKey="binLabel"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={90}
            interval={0}
            stroke="#6b7280"
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="#6b7280"
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[2, 2, 0, 0]}
          />
          <Tooltip content={<CustomTooltip />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistogramChart;
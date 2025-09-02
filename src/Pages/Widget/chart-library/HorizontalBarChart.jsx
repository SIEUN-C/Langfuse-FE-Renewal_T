import React from "react";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatAxisLabel } from "./utils.js";
import styles from './chart-library.module.css';

/**
 * HorizontalBarChart component displays data as horizontal bars
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Data to be displayed. Expects an array of objects with dimension and metric properties
 * @param {import('./chart-props.js').ChartConfig} [props.config] - Configuration object for the chart. Can include theme settings for light and dark modes
 * @param {boolean} [props.accessibilityLayer=true] - Boolean to enable or disable the accessibility layer
 * @returns {React.ReactElement} Rendered horizontal bar chart
 */
const HorizontalBarChart = ({
  data,
  config = {
    metric: {
      theme: {
        light: "#3b82f6",
        dark: "#3b82f6",
      },
    },
  },
  accessibilityLayer = true,
}) => {
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          <p className={styles.tooltipValue}>
            <span className={styles.tooltipIndicator}></span>
            {`Value: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
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
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 90, bottom: 20 }}
        >
          <XAxis
            type="number"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="#6b7280"
          />
          <YAxis
            type="category"
            dataKey="dimension"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatAxisLabel}
            width={80}
            stroke="#6b7280"
          />
          <Bar
            dataKey="metric"
            radius={[0, 4, 4, 0]}
            fill="#3b82f6"
          />
          <Tooltip content={<CustomTooltip />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HorizontalBarChart;
import React from "react";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import styles from './chart-library.module.css';

/**
 * VerticalBarChart component displays data as vertical bars
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Data to be displayed. Expects an array of objects with dimension and metric properties
 * @param {import('./chart-props.js').ChartConfig} [props.config] - Configuration object for the chart. Can include theme settings for light and dark modes
 * @param {boolean} [props.accessibilityLayer=true] - Boolean to enable or disable the accessibility layer
 * @returns {React.ReactElement} Rendered vertical bar chart
 */
const VerticalBarChart = ({
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
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <XAxis
            type="category"
            dataKey="dimension"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            type="number"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="#6b7280"
          />
          <Bar
            dataKey="metric"
            radius={[4, 4, 0, 0]}
            fill="#3b82f6"
          />
          <Tooltip content={<CustomTooltip />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VerticalBarChart;
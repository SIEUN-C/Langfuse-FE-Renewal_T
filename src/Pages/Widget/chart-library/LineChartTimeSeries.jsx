import React, { useMemo } from "react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getUniqueDimensions, groupDataByTimeDimension } from "./utils.js";
import styles from './chart-library.module.css';

/**
 * LineChartTimeSeries component displays data as a time series line chart
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Data to be displayed. Expects an array of objects with time_dimension, dimension, and metric properties
 * @param {import('./chart-props.js').ChartConfig} [props.config] - Configuration object for the chart. Can include theme settings for light and dark modes
 * @param {boolean} [props.accessibilityLayer=true] - Boolean to enable or disable the accessibility layer
 * @returns {React.ReactElement} Rendered line chart time series
 */
const LineChartTimeSeries = ({
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
  const groupedData = useMemo(() => groupDataByTimeDimension(data), [data]);
  const dimensions = useMemo(() => getUniqueDimensions(data), [data]);

  // Color palette for multiple lines
  const colors = [
    "#3b82f6", // blue-500
    "#ef4444", // red-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#f97316", // orange-500
  ];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={styles.tooltipValue}>
              <span 
                className={styles.tooltipIndicator}
                style={{ backgroundColor: entry.color }}
              ></span>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
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
        <LineChart 
          data={groupedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <XAxis
            dataKey="time_dimension"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="#6b7280"
          />
          <YAxis
            type="number"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="#6b7280"
          />
          {dimensions.map((dimension, index) => (
            <Line
              key={dimension}
              type="monotone"
              dataKey={dimension}
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 6, strokeWidth: 0 }}
              stroke={colors[index % colors.length]}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartTimeSeries;
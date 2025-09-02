import React, { useMemo } from "react";
import { Pie, PieChart as PieChartComponent, ResponsiveContainer, Tooltip, Cell } from "recharts";
import styles from './chart-library.module.css';

/**
 * PieChart component displays data as a pie/donut chart
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Data to be displayed. Expects an array of objects with dimension and metric properties
 * @param {import('./chart-props.js').ChartConfig} [props.config] - Configuration object for the chart. Can include theme settings for light and dark modes
 * @param {boolean} [props.accessibilityLayer=true] - Boolean to enable or disable the accessibility layer
 * @returns {React.ReactElement} Rendered pie chart
 */
const PieChart = ({
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
  // Color palette for pie slices
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

  // Calculate total metric value for center label
  const totalValue = useMemo(() => {
    return data.reduce((acc, curr) => acc + (typeof curr.metric === 'number' ? curr.metric : 0), 0);
  }, [data]);

  // Transform data for PieChart
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item.dimension || "Unknown",
      value: typeof item.metric === 'number' ? item.metric : 0,
      fill: colors[index % colors.length],
    }));
  }, [data, colors]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{data.name}</p>
          <p className={styles.tooltipValue}>
            <span 
              className={styles.tooltipIndicator}
              style={{ backgroundColor: data.payload.fill }}
            ></span>
            {`Value: ${data.value.toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom center label component
  const CenterLabel = ({ cx, cy, totalValue }) => {
    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className={styles.pieChartCenterValue}
        >
          {totalValue.toLocaleString()}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          className={styles.pieChartCenterLabel}
        >
          Total
        </text>
      </g>
    );
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
        <PieChartComponent margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={2}
            stroke="#ffffff"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            {/* Center label */}
            {data.length > 0 && (
              <CenterLabel cx="50%" cy="50%" totalValue={totalValue} />
            )}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
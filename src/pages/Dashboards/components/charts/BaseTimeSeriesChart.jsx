import React, { useState, useMemo } from 'react';
import {
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { getColorsForCategories } from '../../utils/getColorsForCategories';
import { compactNumberFormatter } from '../../utils/numbers';
import { dashboardDateRangeAggregationSettings } from '../../utils/date-range-utils';
import Tooltip from './Tooltip';

const CustomizedDot = (props) => {
  const { value, cx, cy, stroke } = props;
  if (value > 0) {
    return <Dot cx={cx} cy={cy} r={5} fill={stroke} />;
  }
  return null;
};

const BaseTimeSeriesChart = (props) => {
  const {
    className = '',
    agg,
    data = [],
    showLegend = true,
    connectNulls = false,
    valueFormatter = compactNumberFormatter,
    chartType = 'line',
    colors: customColors,
    conditionalDots = false,
    interactiveLegend = false,
    showLine = true,
    specialSeries = [],
    yAxisDomain,
    legendLabels, // 🎯 [수정] 범례 목록을 직접 받는 prop 추가
  } = props;

  const [activeLabel, setActiveLabel] = useState(null);

  // --- 데이터 가공 로직 (기존과 동일) ---
  const safeData = useMemo(() => data.filter(d => d && typeof d.ts !== 'undefined' && Array.isArray(d.values)), [data]);
 // 🎯 [수정] legendLabels prop이 있으면 그것을 사용하고, 없으면 기존 방식을 따름
  const labels = useMemo(() => {
    if (legendLabels) return legendLabels;
    
    const labelSet = new Set();
    safeData.forEach(d => d.values.forEach(v => v && typeof v.label === 'string' && labelSet.add(v.label)));
    return Array.from(labelSet);
  }, [safeData, legendLabels]);


  const convertDate = (date, agg) => {
    try {
      const aggSettings = dashboardDateRangeAggregationSettings?.[agg];
      if (!aggSettings) return new Date(date).toLocaleDateString("en-US");
      const showMinutes = ["minute", "hour"].includes(aggSettings.date_trunc);
      if (showMinutes) return new Date(date).toLocaleTimeString("en-US", { year: "2-digit", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      return new Date(date).toLocaleDateString("en-US", { year: "2-digit", month: "numeric", day: "numeric" });
    } catch { return 'Invalid Date'; }
  };
  const transformArray = (array) => array.map(item => {
    const outputObject = { timestamp: convertDate(item.ts, agg) };
    item.values.forEach(valueObject => {
      if (valueObject && typeof valueObject.label === 'string') {
        outputObject[valueObject.label] = valueObject.value || 0;
      }
    });
    return outputObject;
  });
  const chartData = useMemo(() => transformArray(safeData), [safeData, agg]);
  function getColorCode(colorName) {
    const colorCodeMap = { 'indigo': '#6366f1', 'cyan': '#06b6d4', 'zinc': '#71717a', 'purple': '#a855f7', 'yellow': '#eab308', 'red': '#ef4444', 'lime': '#84cc16', 'pink': '#ec4899', 'emerald': '#10b981', 'teal': '#14b8a6', 'fuchsia': '#d946ef', 'sky': '#0ea5e9', 'blue': '#3b82f6', 'orange': '#f97316', 'violet': '#8b5cf6', 'rose': '#f43f5e', 'green': '#22c55e', 'amber': '#f59e0b', 'slate': '#64748b', 'gray': '#6b7280', 'neutral': '#737373', 'stone': '#78716c' };
    return colorCodeMap[colorName] || '#6b7280';
  }
  const colorMap = useMemo(() => {
    const map = {};
    const effectiveColorNames = customColors || getColorsForCategories(labels);
    labels.forEach((label, index) => {
      const colorName = effectiveColorNames[index % effectiveColorNames.length] || 'blue';
      map[label] = getColorCode(colorName);
    });
    return map;
  }, [labels, customColors]);
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return <Tooltip active={active} payload={payload} label={label} formatter={valueFormatter} />;
  };

  const handleLegendClick = (payload) => {
    if (!interactiveLegend) return; 
    const { dataKey } = payload;
    setActiveLabel(activeLabel === dataKey ? null : dataKey);
  };
  
  const legendFormatter = (value) => {
    return <span style={{ fontSize: '12px', color: '#374151', fontWeight: 900 }}>{value}</span>;
  };

   if (safeData.length === 0 && !legendLabels) {
    return <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#6b7280', fontSize: '0.875rem' }} className={className}>No data available</div>;
  }
  
  
  return (
    <div style={{ marginTop: '16px', height: '300px' }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {labels.map((label) => (
                <linearGradient key={label} id={`color-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorMap[label]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colorMap[label]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="timestamp" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={valueFormatter} domain={yAxisDomain} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" onClick={handleLegendClick} formatter={legendFormatter} wrapperStyle={{ marginBottom: '40px' }} />
            {labels.map((label) => {
              if (activeLabel && activeLabel !== label) return null;
              const isSpecial = specialSeries.includes(label);
              return (
                <Area 
                  key={label} 
                  type="monotone" 
                  dataKey={label} 
                  stackId="1" 
                  stroke={colorMap[label]} 
                  fill={`url(#color-${label})`} 
                  connectNulls={connectNulls}
                  dot={conditionalDots && !isSpecial ? <CustomizedDot /> : { r: 5, fill: colorMap[label] }}
                  activeDot={{ r: 5 }}
                  strokeWidth={showLine || isSpecial ? 2 : 0} 
                />
              );
            })}
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="timestamp" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={valueFormatter} domain={yAxisDomain} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" onClick={handleLegendClick} formatter={legendFormatter} wrapperStyle={{ marginBottom: '40px' }} />
            {labels.map((label) => {
              if (activeLabel && activeLabel !== label) return null;
              // 🎯 [수정] 현재 시리즈가 특별 처리 대상인지 정확히 일치하는지 확인
              const isSpecial = specialSeries.includes(label);
              return (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={colorMap[label]}
                  strokeWidth={showLine || isSpecial ? 2 : 0}
                  dot={conditionalDots && !isSpecial ? <CustomizedDot /> : { r: 5, fill: colorMap[label] }}
                  activeDot={{ r: 5 }}
                  connectNulls={connectNulls}
                />
              );
            })}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default BaseTimeSeriesChart;
import React, { useMemo } from 'react';
import { 
  LineChart, 
  AreaChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { getColorsForCategories } from '../../utils/getColorsForCategories';
import { compactNumberFormatter } from '../../utils/numbers';  
import { dashboardDateRangeAggregationSettings } from '../../utils/date-range-utils';
import Tooltip from './Tooltip';

/**
 * 시계열 차트 데이터 포인트 타입 (JSDoc으로 대체)
 * @typedef {Object} TimeSeriesChartDataPoint
 * @property {number} ts - 타임스탬프
 * @property {Array<{label: string, value?: number}>} values - 값들
 */

/**
 * 기본 시계열 차트 컴포넌트
 * @param {Object} props
 * @param {string} props.className - CSS 클래스명
 * @param {string} props.agg - 집계 옵션
 * @param {TimeSeriesChartDataPoint[]} props.data - 차트 데이터
 * @param {boolean} props.showLegend - 범례 표시 여부
 * @param {boolean} props.connectNulls - null 값 연결 여부
 * @param {function} props.valueFormatter - 값 포맷터 함수
 * @param {string} props.chartType - 차트 타입 ("line" | "area")
 */
const BaseTimeSeriesChart = (props) => {
  const {
    className = '',
    agg,
    data = [],
    showLegend = true,
    connectNulls = false,
    valueFormatter = compactNumberFormatter,
    chartType = 'line'
  } = props;

  console.log('BaseTimeSeriesChart 받은 데이터:', data);

  // 안전한 데이터 검증
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('BaseTimeSeriesChart: data가 배열이 아닙니다:', data);
      return [];
    }

    return data.filter(d => {
      // 필수 구조 검증
      if (!d || typeof d.ts === 'undefined') {
        console.warn('BaseTimeSeriesChart: 잘못된 데이터 포인트 (ts 없음):', d);
        return false;
      }
      
      if (!Array.isArray(d.values)) {
        console.warn('BaseTimeSeriesChart: 잘못된 데이터 포인트 (values가 배열이 아님):', d);
        return false;
      }

      return true;
    });
  }, [data]);

  // 모든 라벨 추출 (안전하게)
  const labels = useMemo(() => {
    if (safeData.length === 0) return new Set();
    
    try {
      const labelSet = new Set();
      safeData.forEach(d => {
        if (d.values && Array.isArray(d.values)) {
          d.values.forEach(v => {
            if (v && typeof v.label === 'string') {
              labelSet.add(v.label);
            }
          });
        }
      });
      return labelSet;
    } catch (error) {
      console.error('BaseTimeSeriesChart: 라벨 추출 중 에러:', error);
      return new Set();
    }
  }, [safeData]);

  /**
   * 데이터 배열을 Recharts 형식으로 변환
   */
  const transformArray = (array) => {
    return array.map((item) => {
      const outputObject = {
        timestamp: convertDate(item.ts, agg),
      };

      // 안전하게 값 추가
      if (item.values && Array.isArray(item.values)) {
        item.values.forEach((valueObject) => {
          if (valueObject && typeof valueObject.label === 'string') {
            outputObject[valueObject.label] = valueObject.value || 0;
          }
        });
      }

      return outputObject;
    });
  };

  /**
   * 타임스탬프를 날짜 문자열로 변환
   */
  const convertDate = (date, agg) => {
    try {
      const aggSettings = dashboardDateRangeAggregationSettings?.[agg];
      if (!aggSettings) return new Date(date).toLocaleDateString("en-US");
      
      const showMinutes = ["minute", "hour"].includes(aggSettings.date_trunc);

      if (showMinutes) {
        return new Date(date).toLocaleTimeString("en-US", {
          year: "2-digit",
          month: "numeric", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(date).toLocaleDateString("en-US", {
        year: "2-digit",
        month: "numeric",
        day: "numeric",
      });
    } catch (error) {
      console.error('BaseTimeSeriesChart: 날짜 변환 에러:', error);
      return 'Invalid Date';
    }
  };

  // 색상 배열 생성
  const colors = getColorsForCategories(Array.from(labels));
  
  // 색상 매핑 객체 생성
  const colorMap = useMemo(() => {
    const map = {};
    Array.from(labels).forEach((label, index) => {
      map[label] = getColorCode(colors[index] || 'blue');
    });
    return map;
  }, [labels, colors]);

  /**
   * 색상 이름을 실제 컬러 코드로 변환
   */
  function getColorCode(colorName) {
    const colorCodeMap = {
      'indigo': '#6366f1',
      'cyan': '#06b6d4',
      'zinc': '#71717a', 
      'purple': '#a855f7',
      'yellow': '#eab308',
      'red': '#ef4444',
      'lime': '#84cc16',
      'pink': '#ec4899',
      'emerald': '#10b981',
      'teal': '#14b8a6',
      'fuchsia': '#d946ef',
      'sky': '#0ea5e9',
      'blue': '#3b82f6',
      'orange': '#f97316',
      'violet': '#8b5cf6',
      'rose': '#f43f5e',
      'green': '#22c55e',
      'amber': '#f59e0b',
      'slate': '#64748b',
      'gray': '#6b7280',
      'neutral': '#737373',
      'stone': '#78716c'
    };
    return colorCodeMap[colorName] || '#6b7280';
  }

  // 동적 최대값 계산 (10% 버퍼 추가)
  const dynamicMaxValue = useMemo(() => {
    if (safeData.length === 0) return undefined;

    try {
      const values = safeData.flatMap((point) => 
        point.values?.map((v) => v.value || 0) || []
      ).filter(v => typeof v === 'number' && !isNaN(v));

      if (values.length === 0) return undefined;

      const maxValue = Math.max(...values);
      if (maxValue <= 0) return undefined;

      // 10% 버퍼 추가
      const bufferedValue = maxValue * 1.1;

      // 자릿수 기반 반올림
      const magnitude = Math.floor(Math.log10(bufferedValue));
      const roundTo = Math.max(1, Math.pow(10, magnitude) / 5);

      return Math.ceil(bufferedValue / roundTo) * roundTo;
    } catch (error) {
      console.error('BaseTimeSeriesChart: 최대값 계산 에러:', error);
      return undefined;
    }
  }, [safeData]);

  // 변환된 데이터
  const chartData = useMemo(() => {
    try {
      return transformArray(safeData);
    } catch (error) {
      console.error('BaseTimeSeriesChart: 데이터 변환 에러:', error);
      return [];
    }
  }, [safeData, agg]);

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    
    return (
      <Tooltip
        active={active}
        payload={payload}
        label={label}
        formatter={valueFormatter}
      />
    );
  };

  // 차트 공통 props
  const commonProps = {
    data: chartData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  // 로딩 상태 처리
  if (safeData.length === 0) {
    return (
      <div 
        style={{ marginTop: '16px' }}
        className={className}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ marginTop: '16px' }}
      className={className}
    >
      {chartData.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          Data processing error
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'area' ? (
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={valueFormatter}
                domain={[0, dynamicMaxValue || 'auto']}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              
              {Array.from(labels).map((label) => (
                <Area
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stackId="1"
                  stroke={colorMap[label]}
                  fill={colorMap[label]}
                  fillOpacity={0.6}
                  connectNulls={connectNulls}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={valueFormatter}
                domain={[0, dynamicMaxValue || 'auto']}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              
              {Array.from(labels).map((label) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={colorMap[label]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={connectNulls}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default BaseTimeSeriesChart;
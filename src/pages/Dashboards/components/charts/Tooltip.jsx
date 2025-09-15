import React from 'react';
import { getRandomColor } from '../../utils/getColorsForCategories';

/**
 * 차트 툴팁 프레임 컴포넌트
 */
function ChartTooltipFrame({ children }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      fontSize: '0.875rem',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      {children}
    </div>
  );
}

/**
 * 차트 툴팁 행 컴포넌트
 */
function ChartTooltipRow({ name, value, color }) {
  // 색상을 실제 컬러 코드로 변환하는 간단한 매핑
  const getColorCode = (colorName) => {
    const colorMap = {
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
    return colorMap[colorName] || '#6b7280';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flex: 1,
        minWidth: 0
      }}>
        {/* 색상 인디케이터 */}
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getColorCode(color),
          flexShrink: 0
        }} />
        
        {/* 이름 */}
        <span style={{
          color: '#374151',
          fontSize: '0.875rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {name}
        </span>
      </div>
      
      {/* 값 */}
      <span style={{
        color: '#111827',
        fontSize: '0.875rem',
        fontWeight: '500',
        flexShrink: 0
      }}>
        {value}
      </span>
    </div>
  );
}

/**
 * 차트용 툴팁 컴포넌트
 * @param {Object} props
 * @param {Array} props.payload - 차트 데이터 배열
 * @param {boolean} props.active - 툴팁 활성화 여부
 * @param {string} props.label - 툴팁 라벨 (보통 날짜/시간)
 * @param {function} props.formatter - 값 포맷팅 함수
 */
const Tooltip = ({
  payload,
  active,
  label,
  formatter
}) => {
  if (!active || !payload) return null;

  // 중복 제거 및 값 기준 내림차순 정렬
  const uniquePayload = Array.from(
    new Map(payload.map((category) => [category.name, category])).values(),
  );

  const sortedPayload = uniquePayload.sort(
    (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0),
  );

  return (
    <ChartTooltipFrame>
      {/* 헤더 - 라벨 표시 */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '8px 16px'
      }}>
        <p style={{
          margin: 0,
          fontWeight: '500',
          color: '#111827',
          fontSize: '0.875rem'
        }}>
          {label}
        </p>
      </div>

      {/* 바디 - 데이터 행들 */}
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {sortedPayload.map(({ name, value, color }, index) => (
          <ChartTooltipRow
            key={index}
            value={formatter(Number(value))}
            name={name?.toString() ?? ""}
            color={color ?? getRandomColor()}
          />
        ))}
      </div>
    </ChartTooltipFrame>
  );
}

export default Tooltip;
// src/Pages/Widget/chart-library/ChartContainer.jsx
// 원본 Langfuse의 ChartContainer 역할을 하는 래퍼 컴포넌트

import React from 'react';

/**
 * ChartContainer - 원본 Langfuse의 ChartContainer와 동일한 역할
 * 모든 차트 컴포넌트를 감싸서 크기 제한과 overflow 제어를 담당
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object} [props.config] - 차트 설정 (원본 호환성)
 * @param {React.ReactNode} props.children - 차트 컴포넌트
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {Object} [props.style] - 추가 인라인 스타일
 * @returns {React.ReactElement} 래퍼가 적용된 차트
 */
const ChartContainer = ({ 
  config = {}, 
  children, 
  className = "",
  style = {} 
}) => {
  return (
    <div 
      className={`chart-container ${className}`}
      style={{
        // 원본 Langfuse ChartContainer의 핵심 스타일
        position: 'relative',
        width: '100%',
        height: '100%',
        // 핵심: overflow hidden으로 차트가 컨테이너를 넘지 않도록
        overflow: 'hidden',
        // flex container로 설정하여 자식 요소들이 올바르게 크기 조절되도록
        display: 'flex',
        flexDirection: 'column',
        // 최소 높이 보장 (ResponsiveContainer 계산 안정화)
        minHeight: '0',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default ChartContainer;
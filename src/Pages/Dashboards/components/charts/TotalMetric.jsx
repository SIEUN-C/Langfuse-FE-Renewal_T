import React from 'react';
import { compactNumberFormatter } from '../../utils/numbers.js';

const TotalMetric = ({
  className = '',
  metric,
  data,
  children
}) => {
  // data prop이 있으면 그것을 우선 사용, 없으면 기존 props 사용
  const displayMetric = data?.value !== undefined ? data.value : metric;

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: '20px 0',
        animation: 'fadeIn 0.3s ease-in'
      }}
      className={className}
    >
      {/* Metric - 큰 숫자 중앙 정렬 */}
      <div style={{
        fontSize: '3rem',
        fontWeight: '700',
        color: '#f8fafc',
        lineHeight: '1',
        letterSpacing: '-0.025em',
        textAlign: 'center'
      }}>
        {compactNumberFormatter(displayMetric)}
      </div>
      
      {/* 개발용 디버그 정보 - 작게 표시 */}
      {import.meta.env.DEV && data?.isMockData && (
        <div style={{
          fontSize: '0.65rem',
          color: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          padding: '2px 6px',
          borderRadius: '3px',
          marginTop: '8px',
          fontFamily: 'monospace'
        }}>
          Mock Data
        </div>
      )}
      
      {children}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default TotalMetric;
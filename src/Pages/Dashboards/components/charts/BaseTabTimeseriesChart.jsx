import React, { useState } from 'react';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import TotalMetric from './TotalMetric';

/**
 * 탭 기반 시계열 차트 컴포넌트
 * 여러 데이터셋을 탭으로 전환하며 보여주는 차트
 * @param {Object} props
 * @param {string} props.agg - 날짜 집계 옵션
 * @param {boolean} props.showLegend - 범례 표시 여부
 * @param {boolean} props.connectNulls - null 값 연결 여부
 * @param {Array} props.data - 탭 데이터 배열
 * @param {React.ReactNode} props.data[].totalMetric - 총 메트릭 값
 * @param {React.ReactNode} props.data[].metricDescription - 메트릭 설명
 * @param {string} props.data[].tabTitle - 탭 제목
 * @param {function} props.data[].formatter - 값 포맷터 함수
 * @param {Array} props.data[].data - 시계열 데이터 배열
 */
const BaseTabTimeseriesChart = (props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTabClick = (index) => {
    setSelectedIndex(index);
    console.log('Tab switched to:', props.data[index]?.tabTitle);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%'
    }}>
      {/* 총 메트릭 표시 */}
      <TotalMetric
        metric={props.data[selectedIndex]?.totalMetric}
        description={props.data[selectedIndex]?.metricDescription}
      />

      {/* 탭 그룹 */}
      <div style={{ marginTop: '16px' }}>
        {/* 탭 리스트 */}
        <div style={{
          height: '32px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '0',
            height: '100%'
          }}>
            {props.data.map((data, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(index)}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderBottom: '2px solid',
                  borderBottomColor: index === selectedIndex ? '#3b82f6' : 'transparent',
                  backgroundColor: 'transparent',
                  color: index === selectedIndex ? '#3b82f6' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (index !== selectedIndex) {
                    e.target.style.color = '#374151';
                    e.target.style.borderBottomColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== selectedIndex) {
                    e.target.style.color = '#6b7280';
                    e.target.style.borderBottomColor = 'transparent';
                  }
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                  e.target.style.borderRadius = '4px 4px 0 0';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderRadius = '0';
                }}
              >
                {data.tabTitle}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 패널들 */}
        <div>
          {props.data.map((data, index) => (
            <div
              key={index}
              style={{
                display: index === selectedIndex ? 'block' : 'none'
              }}
            >
              <BaseTimeSeriesChart
                agg={props.agg}
                data={data.data}
                showLegend={props.showLegend !== false} // 기본값 true
                connectNulls={props.connectNulls}
                valueFormatter={data.formatter}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BaseTabTimeseriesChart;
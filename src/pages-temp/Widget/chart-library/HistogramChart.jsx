// src/Pages/Widget/chart-library/HistogramChart.jsx
// 히스토그램/막대 차트 컴포넌트 - ClickHouse 및 일반 데이터 포맷 지원

import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { compactSmallNumberFormatter } from "../utils/number-utils.js";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * HistogramChart - 히스토그램/막대 차트로 데이터를 표시하는 컴포넌트
 * 원본 Langfuse의 HistogramChart와 동일한 기능 제공
 * 
 * 주요 기능:
 * 1. ClickHouse 히스토그램 포맷 지원 ([(lower, upper, height), ...])
 * 2. 일반 데이터 포인트 포맷 지원 (dimension, metric 구조)
 * 3. 커스텀 툴팁으로 구간 정보 표시
 * 4. 반응형 컨테이너로 크기 자동 조절
 * 5. 빈 데이터 상태 처리
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {import('./chart-props.js').DataPoint[]} props.data - 히스토그램 데이터 배열
 * @param {import('./chart-props.js').ChartConfig} [props.config] - 차트 설정 (원본 호환성)
 * @param {boolean} [props.accessibilityLayer] - 접근성 기능 활성화 여부
 * @returns {React.ReactElement} 렌더링된 히스토그램 차트
 */
const HistogramChart = ({ data, config, accessibilityLayer }) => {
  
  /**
   * 데이터를 히스토그램 포맷으로 변환하는 함수
   * 두 가지 데이터 형식을 지원:
   * 1. ClickHouse 히스토그램: { metric: [[lower, upper, height], ...] }
   * 2. 일반 데이터 포인트: [{ dimension: string, metric: number }, ...]
   * 
   * @param {import('./chart-props.js').DataPoint[]} data - 입력 데이터 포인트
   * @returns {Array<{binLabel: string, count: number, lower?: number, upper?: number, height?: number}>} 
   *          변환된 히스토그램 데이터
   */
  const transformHistogramData = (data) => {
    // 데이터 유효성 검사
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // 첫 번째 데이터 포인트 검사
    const firstDataPoint = data[0];
    
    // ClickHouse 히스토그램 포맷 처리
    // 형식: { metric: [[lower, upper, height], [lower, upper, height], ...] }
    if (firstDataPoint?.metric && Array.isArray(firstDataPoint.metric)) {
      return firstDataPoint.metric
        .filter(item => Array.isArray(item) && item.length >= 3) // 안전성 검사: 3개 요소 확인
        .map(([lower, upper, height], index) => {
          // 숫자 변환 및 기본값 처리
          const lowerBound = typeof lower === 'number' ? lower : 0;
          const upperBound = typeof upper === 'number' ? upper : 0;
          const barHeight = typeof height === 'number' ? height : 0;
          
          return {
            // 구간 라벨: [하한, 상한] 형식으로 표시
            binLabel: `[${compactSmallNumberFormatter(lowerBound)}, ${compactSmallNumberFormatter(upperBound)}]`,
            count: barHeight,     // Y축 값 (막대 높이)
            lower: lowerBound,    // 구간 하한 (툴팁용)
            upper: upperBound,    // 구간 상한 (툴팁용)
            height: barHeight,    // 원본 높이 값
          };
        });
    }

    // 일반 데이터 포인트 포맷 처리
    // 형식: [{ dimension: string, metric: number }, ...]
    return data
      .filter(item => item && typeof item === 'object') // null/undefined 필터링
      .map((item, index) => {
        // metric 값 안전하게 추출
        let count = 0;
        if (typeof item.metric === 'number') {
          count = item.metric;
        } else if (typeof item.metric === 'string') {
          const parsed = parseFloat(item.metric);
          count = isNaN(parsed) ? 0 : parsed;
        }
        
        return {
          // 차원 라벨 또는 기본 구간 이름
          binLabel: item.dimension || `Bin ${index + 1}`,
          count: Math.max(0, count), // 음수 값 제거 (히스토그램에서는 양수만 의미있음)
        };
      })
      .filter(item => item.count >= 0); // 유효한 값만 유지
  };

  // 히스토그램 데이터 변환
  const histogramData = transformHistogramData(data);
  
  /**
   * 커스텀 툴팁 컴포넌트
   * 히스토그램 구간 정보와 값을 표시
   * 
   * @param {Object} props - Recharts 툴팁 props
   * @param {boolean} props.active - 툴팁 활성화 상태
   * @param {Array} props.payload - 툴팁 데이터 배열
   * @param {string} props.label - 구간 라벨
   * @returns {React.ReactElement|null} 툴팁 컴포넌트
   */
  const CustomTooltip = ({ active, payload, label }) => {
    // 툴팁이 활성화되고 데이터가 있을 때만 표시
    if (!active || !payload || !payload.length || payload[0]?.value === undefined) {
      return null;
    }

    const value = payload[0].value;
    
    return (
      <div className={styles.tooltip}>
        {/* 구간 정보 */}
        <p className={styles.tooltipLabel}>
          {`Bin: ${label}`}
        </p>
        
        {/* 개수 정보 */}
        <p className={styles.tooltipValue}>
          <span className={styles.tooltipIndicator}></span>
          {`Count: ${typeof value === 'number' ? value.toLocaleString() : value}`}
        </p>
      </div>
    );
  };

  // 빈 데이터 상태 처리
  if (!histogramData || histogramData.length === 0) {
    return (
      <ChartContainer config={config}>
        <div className={styles.empty}>
          No histogram data available
        </div>
      </ChartContainer>
    );
  }

  // 메인 차트 렌더링
  return (
    <ChartContainer config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ 
            top: 20,    // 상단 여백
            right: 30,  // 우측 여백  
            left: 20,   // 좌측 여백
            bottom: 20  // 하단 여백 (라벨 회전으로 인한 추가 공간)
          }}
        >
          {/* X축 설정 - 구간 라벨 표시 */}
          <XAxis
            dataKey="binLabel"           // 구간 라벨을 X축 값으로 사용
            fontSize={12}                // 글꼴 크기
            tickLine={false}             // 눈금선 숨김
            axisLine={false}             // 축선 숨김
            textAnchor="middle"          // 앵커 포인트
            interval="preserveStartEnd"   
            minTickGap={60}            
            stroke="#6b7280"             // 텍스트 색상 (회색)
            tick={{ fontSize: 11 }}      // 개별 눈금 텍스트 스타일
          />
          
          {/* Y축 설정 - 개수 값 표시 */}
          <YAxis
            fontSize={12}                          // 글꼴 크기
            tickLine={false}                       // 눈금선 숨김
            axisLine={false}                       // 축선 숨김
            stroke="#6b7280"                       // 텍스트 색상 (회색)
            tick={{ fontSize: 11 }}                // 개별 눈금 텍스트 스타일
            tickFormatter={compactSmallNumberFormatter} // 큰 숫자 압축 표시 (1000 -> 1K)
          />
          
          {/* 막대 차트 설정 */}
          <Bar
            dataKey="count"              // Y축 데이터 필드
            fill="#3b82f6"               // 막대 색상 (파란색)
            radius={[2, 2, 0, 0]}        // 막대 모서리 둥글게 (상단만)
          />
          
          {/* 커스텀 툴팁 설정 */}
          <Tooltip 
            content={<CustomTooltip />}                    // 커스텀 툴팁 컴포넌트 사용
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}  // 호버 시 배경 하이라이트
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default HistogramChart;
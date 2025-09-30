// src/Pages/Widget/chart-library/HorizontalBarChart.jsx
// 수평 막대 차트 컴포넌트 - 카테고리별 비교 데이터 시각화

import React from "react";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatAxisLabel } from "./utils.js";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * HorizontalBarChart - 데이터를 수평 막대 차트로 표시하는 컴포넌트
 * 원본 Langfuse의 HorizontalBarChart와 동일한 기능 제공
 * 
 * 주요 기능:
 * 1. 차원(dimension)별 메트릭 값을 수평 막대로 시각화
 * 2. 긴 라벨을 위한 Y축 공간 확보 (left margin 90px)
 * 3. 축 라벨 자동 자르기 (formatAxisLabel 유틸 사용)
 * 4. 커스텀 툴팁으로 정확한 값 표시
 * 5. 반응형 컨테이너로 크기 자동 조절
 * 6. 테마 설정 지원 (라이트/다크 모드)
 * 
 * 사용 케이스:
 * - Top N 순위 데이터 (사용자별, 지역별 등)
 * - 카테고리별 비교 데이터
 * - 긴 라벨명을 가진 데이터 (사용자명, 제품명 등)
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {import('./chartProps.js').DataPoint[]} props.data - 차트 데이터 배열
 *        각 객체는 { dimension: string, metric: number } 구조를 가져야 함
 * @param {import('./chartProps.js').ChartConfig} [props.config] - 차트 설정 객체
 *        테마 설정(라이트/다크 모드 색상)을 포함할 수 있음
 * @param {boolean} [props.accessibilityLayer=true] - 접근성 기능 활성화 여부
 *        스크린 리더 지원 및 키보드 내비게이션 등
 * @returns {React.ReactElement} 렌더링된 수평 막대 차트
 */
const HorizontalBarChart = ({
  data,
  config = {
    // 기본 테마 설정
    metric: {
      theme: {
        light: "#3b82f6", // 라이트 모드: 파란색 (blue-500)
        dark: "#3b82f6",  // 다크 모드: 동일한 파란색 (일관성 유지)
      },
    },
  },
  accessibilityLayer = true,
}) => {
  
  /**
   * 커스텀 툴팁 컴포넌트
   * 수평 막대 차트용으로 최적화된 툴팁 레이아웃
   * 
   * 기능:
   * - 차원 이름 (카테고리) 표시
   * - 메트릭 값을 천 단위 콤마와 함께 표시
   * - 시각적 인디케이터 (색상 점) 포함
   * 
   * @param {Object} props - Recharts 툴팁 props
   * @param {boolean} props.active - 마우스 호버 시 툴팁 활성화 상태
   * @param {Array} props.payload - 툴팁에 표시할 데이터 배열
   * @param {string} props.label - 호버된 막대의 차원(라벨) 값
   * @returns {React.ReactElement|null} 툴팁 컴포넌트 또는 null
   */
  const CustomTooltip = ({ active, payload, label }) => {
    // 툴팁 표시 조건 검사
    // 마우스가 막대 위에 있고, 데이터가 존재할 때만 툴팁 표시
    if (!active || !payload || !payload.length || payload[0]?.value === undefined) {
      return null;
    }

    const value = payload[0].value;
    
    // 툴팁 렌더링
    return (
      <div className={styles.tooltip}>
        {/* 차원명 (카테고리) 표시 */}
        <p className={styles.tooltipLabel}>
          {label || "Unknown"} {/* 라벨이 없는 경우 기본값 표시 */}
        </p>
        
        {/* 메트릭 값 표시 */}
        <p className={styles.tooltipValue}>
          {/* 색상 인디케이터 (막대와 동일한 파란색) */}
          <span className={styles.tooltipIndicator}></span>
          {/* 값을 천 단위 콤마와 함께 표시 */}
          {`Value: ${typeof value === 'number' ? value.toLocaleString() : value}`}
        </p>
      </div>
    );
  };

  // 빈 데이터 상태 처리
  // 데이터가 없거나 빈 배열인 경우 안내 메시지 표시
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <ChartContainer config={config}>
        <div className={styles.empty}>
          No data available
        </div>
      </ChartContainer>
    );
  }

  // 메인 차트 렌더링
  return (
    <ChartContainer config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"              // 수평 막대 차트 설정
          margin={{ 
            top: 10,     // 상단 여백
            right: 20,   // 우측 여백 (값 표시 공간)
            left: 20,    // 좌측 여백 (긴 라벨을 위한 충분한 공간)
            bottom: 10   // 하단 여백
          }}
        >
          {/* X축 설정 (수치 축) */}
          <XAxis
            type="number"                 // 수치형 축으로 설정
            fontSize={12}                 // 글꼴 크기 (가독성을 위해 작게)
            tickLine={false}              // 눈금선 숨김 (깔끔한 디자인)
            axisLine={false}              // 축선 숨김 (미니멀 디자인)
            stroke="#6b7280"              // 텍스트 색상 (중간 회색)
            interval="preserveStartEnd"    
            minTickGap={60}              
          />
          
          {/* Y축 설정 (카테고리 축) */}
          <YAxis
            type="category"               // 카테고리형 축으로 설정
            dataKey="dimension"           // 차원 필드를 Y축 라벨로 사용
            fontSize={12}                 // 글꼴 크기
            tickLine={false}              // 눈금선 숨김
            axisLine={false}              // 축선 숨김
            tickFormatter={formatAxisLabel} // 긴 라벨 자르기 (13자 초과 시 ... 처리)
            width={80}                    // Y축 라벨 영역 너비 (긴 텍스트 고려)
            stroke="#6b7280"              // 텍스트 색상 (중간 회색)
          />
          
          {/* 막대 설정 */}
          <Bar
            dataKey="metric"              // 메트릭 필드를 막대 길이로 사용
            radius={[0, 4, 4, 0]}         // 막대 모서리 둥글게 (우측만)
                                          // [topLeft, topRight, bottomRight, bottomLeft]
            fill="#3b82f6"                // 막대 색상 (파란색)
          />
          
          {/* 툴팁 설정 */}
          <Tooltip 
            content={<CustomTooltip />}  // 커스텀 툴팁 컴포넌트 사용
            cursor={{                    // 호버 시 배경 하이라이트 설정
              fill: 'rgba(59, 130, 246, 0.1)' // 반투명 파란색 배경
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default HorizontalBarChart;
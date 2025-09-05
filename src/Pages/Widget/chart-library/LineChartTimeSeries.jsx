import React, { useMemo } from "react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getUniqueDimensions, groupDataByTimeDimension } from "./utils.js";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * LineChartTimeSeries 컴포넌트 - 시계열 데이터를 선 그래프로 표시
 * 
 * 주요 기능:
 * 1. 시간 축(time_dimension)을 기준으로 한 시계열 데이터 시각화
 * 2. 다중 차원(dimension) 지원으로 여러 선을 동시 표시
 * 3. 자동 색상 팔레트로 최대 8개 선 구분
 * 4. 인터랙티브 포인트(dot)와 호버 효과
 * 5. 시간 기반 데이터 그룹핑 및 변환
 * 6. 커스텀 툴팁으로 다중 데이터 표시
 * 
 * 사용 케이스:
 * - 시간별 메트릭 추이 (사용자 수, 매출, 성능 지표 등)
 * - 여러 카테고리의 시계열 비교 (지역별, 제품별 등)
 * - 트렌드 분석 및 패턴 식별
 * - 대시보드의 핵심 KPI 모니터링
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {import('./chart-props.js').DataPoint[]} props.data - 시계열 데이터 배열
 *        각 객체는 { time_dimension: string, dimension: string, metric: number } 구조
 * @param {import('./chart-props.js').ChartConfig} [props.config] - 차트 설정 객체
 *        테마 설정(라이트/다크 모드 색상) 포함
 * @param {boolean} [props.accessibilityLayer=true] - 접근성 기능 활성화 여부
 *        스크린 리더 지원, 키보드 내비게이션 등
 * @returns {React.ReactElement} 렌더링된 시계열 선 차트
 */
const LineChartTimeSeries = ({
  data,
  config = {
    // ===== 기본 테마 설정 =====
    metric: {
      theme: {
        light: "#3b82f6", // 라이트 모드: 파란색 (주요 선 색상)
        dark: "#3b82f6",  // 다크 모드: 동일한 파란색 (일관성 유지)
      },
    },
  },
  accessibilityLayer = true,
}) => {
  
  /**
   * 시간 차원별 데이터 그룹핑 (메모이제이션)
   * 
   * 원본 데이터를 시간 축 기준으로 그룹핑하여 Recharts가 이해할 수 있는
   * 형태로 변환합니다. 각 시간 포인트마다 모든 차원의 값을 포함하는
   * 객체 배열을 생성합니다.
   * 
   * 예시 변환:
   * 입력: [
   *   { time_dimension: "2024-01-01", dimension: "A", metric: 10 },
   *   { time_dimension: "2024-01-01", dimension: "B", metric: 20 },
   *   { time_dimension: "2024-01-02", dimension: "A", metric: 15 }
   * ]
   * 출력: [
   *   { time_dimension: "2024-01-01", A: 10, B: 20 },
   *   { time_dimension: "2024-01-02", A: 15, B: undefined }
   * ]
   */
  const groupedData = useMemo(() => {
    console.log("LineChartTimeSeries: 데이터 그룹핑 시작", { 
      inputLength: data?.length || 0 
    });
    
    const result = groupDataByTimeDimension(data);
    
    console.log("LineChartTimeSeries: 데이터 그룹핑 완료", {
      outputLength: result.length,
      sampleOutput: result.slice(0, 2) // 처음 2개 시간 포인트만 로그
    });
    
    return result;
  }, [data]);

  /**
   * 고유 차원 목록 추출 (메모이제이션)
   * 
   * 데이터에서 모든 고유한 차원을 추출하여 각각에 대한 선을 그립니다.
   * 차원은 보통 카테고리나 그룹을 나타냅니다 (예: 지역, 제품군, 사용자 타입).
   */
  const dimensions = useMemo(() => {
    const result = getUniqueDimensions(data);
    
    console.log("LineChartTimeSeries: 고유 차원 추출", {
      dimensionCount: result.length,
      dimensions: result
    });
    
    return result;
  }, [data]);

  // ===== 다중 선을 위한 색상 팔레트 =====
  // 8가지 구분되는 색상으로 최대 8개 선까지 지원
  // 색상은 접근성을 고려하여 충분한 대비를 가지도록 선택
  const colors = [
    "#3b82f6", // blue-500 (주 색상)
    "#ef4444", // red-500 (경고/중요)
    "#10b981", // emerald-500 (성공/긍정)
    "#f59e0b", // amber-500 (주의/중간)
    "#8b5cf6", // violet-500 (보조/특별)
    "#06b6d4", // cyan-500 (정보/차가운 색조)
    "#84cc16", // lime-500 (자연/성장)
    "#f97316", // orange-500 (활력/따뜻한 색조)
  ];

  /**
   * 커스텀 툴팁 컴포넌트
   * 시계열 데이터의 다중 선을 위한 특화된 툴팁
   * 
   * 기능:
   * - 시간 포인트 표시 (X축 값)
   * - 모든 활성 선의 값 동시 표시
   * - 각 선의 색상과 일치하는 인디케이터
   * - 차원명과 값을 명확히 구분하여 표시
   * 
   * @param {Object} props - Recharts 툴팁 props
   * @param {boolean} props.active - 마우스 호버 시 툴팁 활성화 상태
   * @param {Array} props.payload - 해당 시간 포인트의 모든 선 데이터
   * @param {string} props.label - 시간 축 라벨 (time_dimension 값)
   * @returns {React.ReactElement|null} 툴팁 컴포넌트 또는 null
   */
  const CustomTooltip = ({ active, payload, label }) => {
    // ===== 툴팁 표시 조건 검사 =====
    if (!active || !payload || !payload.length) {
      return null;
    }

    // 유효한 데이터가 있는 항목만 필터링 (undefined 값 제외)
    const validPayload = payload.filter(entry => 
      entry.value !== undefined && 
      entry.value !== null &&
      !isNaN(entry.value)
    );

    if (validPayload.length === 0) {
      return null;
    }

    // ===== 툴팁 렌더링 =====
    return (
      <div className={styles.tooltip}>
        {/* 시간 축 라벨 (X축 값) */}
        <p className={styles.tooltipLabel}>
          {label || "Unknown Time"}
        </p>
        
        {/* 각 활성 선의 데이터 표시 */}
        {validPayload.map((entry, index) => (
          <p key={`${entry.dataKey}-${index}`} className={styles.tooltipValue}>
            {/* 해당 선의 색상과 일치하는 인디케이터 */}
            <span 
              className={styles.tooltipIndicator}
              style={{ backgroundColor: entry.color }}
            ></span>
            {/* 차원명: 값 형식으로 표시 */}
            {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
          </p>
        ))}
      </div>
    );
  };

  // ===== 빈 데이터 상태 처리 =====
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("LineChartTimeSeries: 데이터가 비어있음", data);
    
    return (
      <ChartContainer config={config}>
        <div className={styles.empty}>
          No time series data available
        </div>
      </ChartContainer>
    );
  }

  // ===== 데이터 검증 및 경고 =====
  // 시계열 차트에 필요한 time_dimension 필드 존재 여부 확인
  const hasTimeData = data.some(item => item.time_dimension);
  if (!hasTimeData) {
    console.warn("LineChartTimeSeries: time_dimension 필드가 없는 데이터 감지", {
      sampleData: data.slice(0, 3)
    });
  }

  // ===== 성능 및 디버깅 정보 로깅 =====
  console.log("LineChartTimeSeries 렌더링:", {
    originalDataLength: data.length,
    groupedDataLength: groupedData.length,
    dimensionCount: dimensions.length,
    timeRange: groupedData.length > 0 ? {
      start: groupedData[0]?.time_dimension,
      end: groupedData[groupedData.length - 1]?.time_dimension
    } : null
  });

  // ===== 메인 차트 렌더링 =====
  return (
    <ChartContainer config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={groupedData}
          margin={{ 
            top: 20,     // 상단 여백
            right: 30,   // 우측 여백 (선 끝부분 잘림 방지)
            left: 20,    // 좌측 여백
            bottom: 20   // 하단 여백
          }}
        >
          {/* ===== X축 설정 (시간 축) ===== */}
          <XAxis
            dataKey="time_dimension"     // 시간 차원을 X축으로 사용
            fontSize={12}                // 글꼴 크기 (가독성)
            tickLine={false}             // 눈금선 숨김 (깔끔한 디자인)
            axisLine={false}             // 축선 숨김 (미니멀 디자인)
            stroke="#6b7280"             // 텍스트 색상 (중간 회색)
            tick={{ fontSize: 11 }}      // 개별 눈금 스타일
          />
          
          {/* ===== Y축 설정 (수치 축) ===== */}
          <YAxis
            type="number"                // 수치형 축
            fontSize={12}                // 글꼴 크기
            tickLine={false}             // 눈금선 숨김
            axisLine={false}             // 축선 숨김
            stroke="#6b7280"             // 텍스트 색상 (중간 회색)
            tick={{ fontSize: 11 }}      // 개별 눈금 스타일
          />
          
          {/* ===== 동적 선 생성 ===== */}
          {/* 각 차원에 대해 별도의 선을 생성 */}
          {dimensions.map((dimension, index) => (
            <Line
              key={dimension}                           // React key (차원명 사용)
              type="monotone"                          // 부드러운 곡선 (monotone spline)
              dataKey={dimension}                      // 데이터 필드명 (차원명)
              strokeWidth={2}                          // 선 두께 (가시성 확보)
              dot={true}                               // 데이터 포인트 표시
              activeDot={{                             // 호버 시 활성 포인트 스타일
                r: 6,                                  // 반지름 6px
                strokeWidth: 0                         // 테두리 없음 (깔끔함)
              }}
              stroke={colors[index % colors.length]}   // 색상 순환 할당
              connectNulls={false}                     // null 값 연결하지 않음 (데이터 무결성)
            />
          ))}
          
          {/* ===== 툴팁 설정 ===== */}
          <Tooltip 
            content={<CustomTooltip />}               // 커스텀 툴팁 사용
            cursor={{                                 // 수직 커서 라인 설정
              stroke: '#6b7280',                      // 라인 색상 (회색)
              strokeWidth: 1,                        // 라인 두께
              strokeDasharray: '3 3'                 // 점선 스타일
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default LineChartTimeSeries;
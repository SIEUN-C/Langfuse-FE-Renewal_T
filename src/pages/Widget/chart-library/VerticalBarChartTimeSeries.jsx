// src/components/Charts/VerticalBarChartTimeSeries.jsx 또는
// src/Pages/Widget/chart-library/VerticalBarChartTimeSeries.jsx

import React, { useMemo } from "react";
import {
  Bar,        // 막대 차트 컴포넌트
  BarChart,   // 막대 차트 컨테이너
  XAxis,      // X축 (시간 축)
  YAxis,      // Y축 (값 축)
  ResponsiveContainer,  // 반응형 크기 조절 컨테이너
  Tooltip,    // 마우스 호버 시 표시할 툴팁
} from "recharts";
import styles from "./chartLibrary.module.css";

/**
 * 시계열 데이터를 그룹핑하는 함수
 * BAR_TIME_SERIES 차트용으로 데이터 구조를 변환
 * 
 * @param {Array} data - 원본 데이터 배열
 * @returns {Array} 변환된 차트 데이터
 * 
 * 입력 예시: [
 *   {dimension: 'Count', metric: 2, time_dimension: '2025-09-05'},
 *   {dimension: 'Count', metric: 0, time_dimension: '2025-09-06'}
 * ]
 * 
 * 출력 예시: [
 *   {time_dimension: '2025-09-05', metric: 2},
 *   {time_dimension: '2025-09-06', metric: 0}
 * ]
 */
const groupDataByTimeDimension = (data) => {
  console.log("=== groupDataByTimeDimension 디버깅 ===");
  console.log("입력 데이터:", data);

  // 데이터 유효성 검사
  if (!data || !Array.isArray(data)) {
    console.warn("데이터가 배열이 아님:", data);
    return [];
  }

  // BAR_TIME_SERIES는 이미 DashboardWidget.jsx에서 올바른 구조로 변환되어 들어옴
  // time_dimension(X축)과 metric(Y축) 필드만 추출하여 Recharts가 사용할 수 있는 형태로 변환
  const result = data.map((item) => ({
    time_dimension: item.time_dimension,  // X축: 날짜/시간 정보
    metric: item.metric,                  // Y축: 막대 높이로 사용할 숫자 값
  }));

  console.log("그룹핑 결과:", result);
  return result;
};

/**
 * 고유 차원(dimension) 배열을 반환하는 함수
 * BAR_TIME_SERIES는 단일 메트릭만 사용하므로 항상 ['metric'] 반환
 * 
 * @param {Array} data - 데이터 배열 (사실상 사용되지 않음)
 * @returns {Array} 차원 배열
 */
const getUniqueDimensions = (data) => {
  // BAR_TIME_SERIES의 경우 단일 메트릭만 사용
  // 다른 차트 타입(예: 스택 막대)에서는 여러 차원을 반환할 수 있음
  return ["metric"];
};

/**
 * 시계열 수직 막대 차트 컴포넌트
 * Langfuse의 "Total Trace Count (over time)" 등의 위젯에서 사용
 * 
 * 주요 기능:
 * - 시간별 데이터를 막대 차트로 시각화
 * - 반응형 크기 조절 (ResponsiveContainer)
 * - 커스텀 툴팁 (마우스 호버 시 상세 정보 표시)
 * - X축 라벨 자동 간격 조절 (화면 크기에 따라)
 * - Y축 자동 스케일링
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 차트에 표시할 데이터 배열
 *   예시: [{dimension: 'Count', metric: 2, time_dimension: '2025-09-05'}]
 * @param {Object} [props.config] - 차트 설정 객체 (테마, 색상 등)
 * @param {boolean} [props.accessibilityLayer=true] - 접근성 기능 활성화 여부
 * @returns {React.ReactElement} 렌더링된 막대 차트
 */
const VerticalBarChartTimeSeries = ({
  data,
  config = {
    metric: {
      theme: {
        light: "#3b82f6",  // 라이트 모드 색상 (파란색)
        dark: "#3b82f6",   // 다크 모드 색상 (동일한 파란색)
      },
    },
  },
  accessibilityLayer = true,
}) => {
  console.log("=== VerticalBarChartTimeSeries 렌더링 ===");
  console.log("받은 데이터:", data);

  // useMemo로 데이터 변환 결과를 메모이제이션
  // data가 변경될 때만 재계산되어 성능 최적화
  const groupedData = useMemo(() => groupDataByTimeDimension(data), [data]);
  const dimensions = useMemo(() => getUniqueDimensions(data), [data]);

  console.log("처리된 그룹 데이터:", groupedData);
  console.log("차원들:", dimensions);

  /**
   * 커스텀 툴팁 컴포넌트
   * 사용자가 막대에 마우스를 올렸을 때 표시되는 정보창
   * 
   * @param {Object} props - Recharts에서 자동으로 전달하는 props
   * @param {boolean} props.active - 마우스가 호버되어 활성화된 상태인지
   * @param {Array} props.payload - 호버된 데이터 포인트의 정보
   * @param {string} props.label - 호버된 포인트의 라벨 (time_dimension)
   * @returns {React.ReactElement|null} 툴팁 UI 또는 null
   */
  const CustomTooltip = ({ active, payload, label }) => {
    // 마우스가 막대 위에 없거나 데이터가 없으면 툴팁 숨김
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div
        style={{
          backgroundColor: "#1f2937", // 어두운 회색 배경
          border: "1px solid #374151", // 테두리
          borderRadius: "6px",         // 둥근 모서리
          padding: "8px 12px",         // 내부 여백
          fontSize: "0.875rem",        // 작은 글씨 크기
          color: "#f9fafb",           // 밝은 텍스트 색상
        }}
      >
        {/* 날짜/시간 표시 */}
        <div style={{ marginBottom: "4px" }}>{label}</div>
        {/* 값 표시 (초록색으로 강조) */}
        <div style={{ color: "#34d399" }}>
          Count: {payload[0].value}
        </div>
      </div>
    );
  };

  // 데이터가 없는 경우 빈 상태 표시
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
          color: "#6b7280",
        }}
      >
        No data available
      </div>
    );
  }

  // 메인 차트 렌더링
  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* ResponsiveContainer: 부모 요소 크기에 맞춰 차트 크기 자동 조절 */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={groupedData}  // 변환된 차트 데이터
          margin={{ 
            top: 20,    // 상단 여백
            right: 30,  // 우측 여백 (X축 라벨이 잘리지 않도록)
            left: 10,   // 좌측 여백 (Y축 라벨 공간)
            bottom: 10  // 하단 여백 (X축 라벨 공간)
          }}
        >
          {/* X축 설정 (시간/날짜 축) */}
          <XAxis
            dataKey="time_dimension"  // 데이터에서 X축으로 사용할 필드명
            stroke="#94a3b8"          // 축 색상 (회색)
            fontSize={12}             // 글꼴 크기
            tickLine={false}          // 눈금선 숨김 (깔끔한 디자인)
            axisLine={false}          // 축선 숨김
            textAnchor="middle"        // 텍스트 앵커 포인트 설정
            minTickGap={60}           // 라벨 간 최소 60px 간격 유지
          />
          
          {/* Y축 설정 (값 축) */}
          <YAxis
            type="number"             // 숫자형 축
            stroke="#94a3b8"          // 축 색상 (회색)
            fontSize={12}             // 글꼴 크기
            tickLine={false}          // 눈금선 숨김
            axisLine={false}          // 축선 숨김
          />
          
          {/* 막대 차트 설정 */}
          <Bar
            dataKey="metric"          // 데이터에서 막대 높이로 사용할 필드명
            stroke="#3b82f6"          // 막대 테두리 색상 (파란색)
            fill="#3b82f6"            // 막대 채우기 색상 (파란색)
            radius={[4, 4, 0, 0]}     // 막대 모서리 둥글기 [좌상, 우상, 우하, 좌하]
          />
          
          {/* 툴팁 설정 */}
          <Tooltip content={<CustomTooltip />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VerticalBarChartTimeSeries;
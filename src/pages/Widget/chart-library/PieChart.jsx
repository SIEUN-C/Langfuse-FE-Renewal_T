import React, { useMemo } from "react";
import { Pie, PieChart as PieChartComponent, ResponsiveContainer, Tooltip, Cell } from "recharts";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * PieChart 컴포넌트 - 데이터를 파이/도넛 차트로 표시
 * 
 * 주요 기능:
 * 1. 카테고리별 비율 데이터를 원형 차트로 시각화
 * 2. 도넛 차트 형태로 중앙에 총합 표시
 * 3. 자동 색상 팔레트로 최대 8개 카테고리 구분
 * 4. 인터랙티브 툴팁으로 정확한 값과 비율 표시
 * 5. 반응형 디자인으로 다양한 화면 크기 지원
 * 6. 접근성 고려된 색상 선택과 레이블링
 * 
 * 사용 케이스:
 * - 전체 대비 각 부분의 비율 표시 (시장 점유율, 예산 배분 등)
 * - 카테고리별 구성 비율 (사용자 유형, 지역별 분포 등)
 * - 총합이 중요한 데이터의 세부 분석
 * - 최대 8개 정도의 카테고리를 가진 데이터
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {import('./chart-props.js').DataPoint[]} props.data - 파이 차트 데이터 배열
 *        각 객체는 { dimension: string, metric: number } 구조
 * @param {import('./chart-props.js').ChartConfig} [props.config] - 차트 설정 객체
 *        테마 설정(라이트/다크 모드 색상) 포함
 * @param {boolean} [props.accessibilityLayer=true] - 접근성 기능 활성화 여부
 *        스크린 리더 지원, 색상 대비 최적화 등
 * @returns {React.ReactElement} 렌더링된 파이 차트
 */
const PieChart = ({
  data,
  config = {
    // ===== 기본 테마 설정 =====
    metric: {
      theme: {
        light: "#3b82f6", // 라이트 모드: 파란색 (주요 색상)
        dark: "#3b82f6",  // 다크 모드: 동일한 파란색 (일관성 유지)
      },
    },
  },
  accessibilityLayer = true,
}) => {
  
  // ===== 파이 조각을 위한 색상 팔레트 =====
  // 색상 대비가 충분하고 구분이 명확한 8가지 색상
  // 접근성을 고려하여 명도와 채도가 적절히 분산됨
  const colors = [
    "#3b82f6", // blue-500 (주요 색상 - 신뢰, 안정)
    "#ef4444", // red-500 (경고, 중요 - 강조)
    "#10b981", // emerald-500 (성공, 긍정 - 자연)
    "#f59e0b", // amber-500 (주의, 중간 - 따뜻함)
    "#8b5cf6", // violet-500 (창의, 특별 - 고급)
    "#06b6d4", // cyan-500 (정보, 차가움 - 시원함)
    "#84cc16", // lime-500 (성장, 활력 - 생동감)
    "#f97316", // orange-500 (에너지, 따뜻함 - 활기)
  ];

  /**
   * 총 메트릭 값 계산 (메모이제이션)
   * 중앙 라벨에 표시할 전체 합계를 계산
   * 
   * 주의사항:
   * - 숫자가 아닌 값은 0으로 처리
   * - null/undefined 값 안전하게 처리
   * - 음수 값도 합계에 포함 (실제 데이터 반영)
   */
  const totalValue = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }
    
    const total = data.reduce((acc, curr) => {
      // 안전한 숫자 변환
      const metricValue = typeof curr?.metric === 'number' ? curr.metric : 0;
      return acc + metricValue;
    }, 0);
    
    console.log("PieChart 총값 계산:", {
      dataLength: data.length,
      totalValue: total,
      sampleData: data.slice(0, 3).map(item => ({ 
        dimension: item?.dimension, 
        metric: item?.metric 
      }))
    });
    
    return total;
  }, [data]);

  /**
   * 파이 차트용 데이터 변환 (메모이제이션)
   * Recharts PieChart 컴포넌트가 요구하는 형식으로 데이터 변환
   * 
   * 변환 과정:
   * 1. dimension → name (카테고리명)
   * 2. metric → value (수치 값)
   * 3. 색상 자동 할당 (색상 팔레트 순환)
   * 4. 유효성 검사 및 기본값 처리
   */
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    
    const transformed = data
      .filter(item => item && typeof item === 'object') // null/undefined 필터링
      .map((item, index) => {
        // 안전한 값 추출
        const dimension = item.dimension || "Unknown";
        const metric = typeof item.metric === 'number' ? item.metric : 0;
        
        return {
          name: dimension,                               // 카테고리명 (툴팁, 범례용)
          value: Math.max(0, metric),                   // 값 (음수는 0으로 처리)
          fill: colors[index % colors.length],          // 색상 순환 할당
          originalValue: metric,                        // 원본 값 보존 (디버깅용)
        };
      })
      .filter(item => item.value > 0); // 0보다 큰 값만 표시 (의미있는 조각만)
    
    console.log("PieChart 데이터 변환:", {
      inputLength: data.length,
      outputLength: transformed.length,
      filteredOut: data.length - transformed.length
    });
    
    return transformed;
  }, [data, colors]);

  /**
   * 커스텀 툴팁 컴포넌트
   * 파이 차트 조각에 대한 상세 정보 표시
   * 
   * 기능:
   * - 카테고리명과 정확한 수치 표시
   * - 해당 조각의 색상과 일치하는 인디케이터
   * - 천 단위 콤마로 가독성 향상
   * - 비율 정보는 Recharts가 자동 계산
   * 
   * @param {Object} props - Recharts 툴팁 props
   * @param {boolean} props.active - 마우스 호버 시 툴팁 활성화 상태
   * @param {Array} props.payload - 해당 조각의 데이터
   * @returns {React.ReactElement|null} 툴팁 컴포넌트 또는 null
   */
  const CustomTooltip = ({ active, payload }) => {
    // ===== 툴팁 표시 조건 검사 =====
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0];
    
    // 데이터 유효성 검사
    if (!data || data.value === undefined || data.value === null) {
      return null;
    }

    // ===== 툴팁 렌더링 =====
    return (
      <div className={styles.tooltip}>
        {/* 카테고리명 */}
        <p className={styles.tooltipLabel}>
          {data.name || "Unknown"}
        </p>
        
        {/* 수치 정보 */}
        <p className={styles.tooltipValue}>
          {/* 해당 조각의 색상과 일치하는 인디케이터 */}
          <span 
            className={styles.tooltipIndicator}
            style={{ backgroundColor: data.payload?.fill || '#3b82f6' }}
          ></span>
          {/* 값을 천 단위 콤마와 함께 표시 */}
          {`Value: ${typeof data.value === 'number' ? data.value.toLocaleString() : data.value}`}
        </p>
        
        {/* 총합 대비 비율 표시 (선택사항) */}
        {totalValue > 0 && (
          <p className={styles.tooltipValue} style={{ fontSize: '11px', opacity: 0.8 }}>
            {`Percentage: ${((data.value / totalValue) * 100).toFixed(1)}%`}
          </p>
        )}
      </div>
    );
  };

  /**
   * 중앙 라벨 컴포넌트
   * 도넛 차트 중앙에 총합과 라벨을 표시하는 SVG 요소
   * 
   * 주의사항:
   * - cx, cy는 문자열로 전달되므로 숫자 변환 필요
   * - viewBox 계산 오류를 방지하기 위한 안전 장치 포함
   * - 폰트 크기와 위치는 차트 크기에 비례하여 조절
   * 
   * @param {Object} props - 중앙 라벨 props
   * @param {string|number} props.cx - 중심 X 좌표 (보통 "50%")
   * @param {string|number} props.cy - 중심 Y 좌표 (보통 "50%")
   * @param {number} props.totalValue - 표시할 총합 값
   * @returns {React.ReactElement} SVG 그룹 요소
   */
  const CenterLabel = ({ cx, cy, totalValue }) => {
    // ===== 좌표 안전 변환 =====
    // 백분율 문자열을 숫자로 변환하거나 기본값 사용
    const centerX = typeof cx === 'string' && cx.includes('%') 
      ? parseFloat(cx) || 50 
      : typeof cx === 'number' ? cx : 50;
    const centerY = typeof cy === 'string' && cy.includes('%') 
      ? parseFloat(cy) || 50 
      : typeof cy === 'number' ? cy : 50;

    // ===== 안전성 검사 =====
    if (isNaN(centerX) || isNaN(centerY)) {
      console.warn("PieChart CenterLabel: 잘못된 좌표값", { cx, cy, centerX, centerY });
      return null;
    }

    return (
      <g>
        {/* 총합 수치 (메인 텍스트) */}
        <text
          x={`${centerX}%`}
          y={`${centerY - 2}%`}                    // 약간 위로 이동
          textAnchor="middle"                      // 가로 중앙 정렬
          dominantBaseline="middle"                // 세로 중앙 정렬
          className={styles.pieChartCenterValue}
        >
          {totalValue.toLocaleString()}
        </text>
        
        {/* "Total" 라벨 (보조 텍스트) */}
        <text
          x={`${centerX}%`}
          y={`${centerY + 4}%`}                    // 메인 텍스트 아래로 이동
          textAnchor="middle"                      // 가로 중앙 정렬
          dominantBaseline="middle"                // 세로 중앙 정렬
          className={styles.pieChartCenterLabel}
        >
          Total
        </text>
      </g>
    );
  };

  // ===== 빈 데이터 상태 처리 =====
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("PieChart: 데이터가 비어있음", data);
    
    return (
      <ChartContainer config={config}>
        <div className={styles.empty}>
          No pie chart data available
        </div>
      </ChartContainer>
    );
  }

  // ===== 변환된 데이터 검증 =====
  if (chartData.length === 0) {
    console.warn("PieChart: 유효한 데이터가 없음 (모든 값이 0 또는 음수)", {
      originalData: data,
      totalValue
    });
    
    return (
      <ChartContainer config={config}>
        <div className={styles.empty}>
          No positive values for pie chart
        </div>
      </ChartContainer>
    );
  }

  // ===== 성능 및 디버깅 정보 로깅 =====
  console.log("PieChart 렌더링:", {
    dataLength: data.length,
    validSlices: chartData.length,
    totalValue,
    largestSlice: Math.max(...chartData.map(item => item.value)),
    colorCount: Math.min(chartData.length, colors.length)
  });

  // ===== 메인 차트 렌더링 =====
  return (
    <ChartContainer config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChartComponent 
          margin={{ 
            top: 20,     // 상단 여백
            right: 20,   // 우측 여백
            bottom: 20,  // 하단 여백
            left: 20     // 좌측 여백
          }}
        >
          <Pie
            data={chartData}                // 변환된 차트 데이터
            dataKey="value"                 // 값 필드명
            nameKey="name"                  // 이름 필드명
            cx="50%"                        // 중심 X 좌표 (중앙)
            cy="50%"                        // 중심 Y 좌표 (중앙)
            innerRadius={60}                // 내부 반지름 (도넛 홀 크기)
            outerRadius={100}               // 외부 반지름 (전체 크기)
            paddingAngle={2}                // 조각 간 간격 (도 단위)
            strokeWidth={2}                 // 조각 테두리 두께
            stroke="#ffffff"                // 조각 테두리 색상 (흰색)
          >
            {/* ===== 각 조각에 개별 색상 적용 ===== */}
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}       // React key
                fill={entry.fill}           // 사전 할당된 색상 사용
              />
            ))}
            
            {/* ===== 중앙 라벨 (조건부 렌더링) ===== */}
            {chartData.length > 0 && totalValue > 0 && (
              <CenterLabel 
                cx="50%" 
                cy="50%" 
                totalValue={totalValue} 
              />
            )}
          </Pie>
          
          {/* ===== 툴팁 설정 ===== */}
          <Tooltip 
            content={<CustomTooltip />}    // 커스텀 툴팁 사용
            cursor={false}                 // 마우스 커서 효과 비활성화 (파이 차트에서는 불필요)
          />
        </PieChartComponent>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PieChart;
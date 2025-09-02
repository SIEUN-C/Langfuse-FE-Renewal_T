import React from 'react';
import RightAlignedCell from './RightAlignedCell';
import WidgetCard from '../WidgetCard';
import DashboardTable from '../cards/DashboardTable';

/* eslint-disable react-refresh/only-export-components */

/**
 * 시간 간격을 초 단위로 포맷팅하는 함수 (간단한 구현)
 * @param {number} seconds - 초 단위 시간
 * @param {number} precision - 소수점 자릿수
 * @returns {string} 포맷된 시간 문자열
 */
function formatIntervalSeconds(seconds, precision = 3) {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(precision - 3)}ms`;
  } else if (seconds < 60) {
    return `${seconds.toFixed(precision)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  }
}

/**
 * 문자열을 지정된 길이로 자르는 함수
 * @param {string} str - 자를 문자열
 * @param {number} length - 최대 길이 (기본: 30)
 * @returns {string} 잘린 문자열
 */
function truncate(str, length = 30) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * 간단한 팝업 컴포넌트 (Popup 대체)
 */
function Popup({ triggerContent, description }) {
  return (
    <span 
      title={description}
      style={{ cursor: 'help' }}
    >
      {triggerContent}
    </span>
  );
}

/**
 * 레거시 UI 테이블 필터를 뷰로 매핑하는 함수 (Mock 구현)
 */
function mapLegacyUiTableFilterToView(view, filterState) {
  console.log('mapLegacyUiTableFilterToView:', { view, filterState });
  return []; // Mock 구현
}

/**
 * Generation 유사 타입들을 가져오는 함수 (Mock 구현)
 */
function getGenerationLikeTypes() {
  return ['GENERATION', 'COMPLETION']; // Mock 타입들
}

/**
 * 지연시간 테이블들 컴포넌트
 * @param {Object} props
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Array} props.globalFilterState - 글로벌 필터 상태
 * @param {Date} props.fromTimestamp - 시작 날짜
 * @param {Date} props.toTimestamp - 종료 날짜
 * @param {boolean} props.isLoading - 로딩 상태
 */
const LatencyTables = ({
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
}) => {
  // Generation 지연시간 쿼리
  const generationsLatenciesQuery = {
    view: "observations",
    dimensions: [{ field: "name" }],
    metrics: [
      { measure: "latency", aggregation: "p50" },
      { measure: "latency", aggregation: "p90" },
      { measure: "latency", aggregation: "p95" },
      { measure: "latency", aggregation: "p99" },
    ],
    filters: [
      ...mapLegacyUiTableFilterToView("observations", globalFilterState),
      {
        column: "type",
        operator: "any of",
        value: getGenerationLikeTypes(),
        type: "stringOptions",
      },
    ],
    timeDimension: null,
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: [{ field: "p95_latency", direction: "desc" }],
  };

  // Span 지연시간 쿼리
  const spansLatenciesQuery = {
    view: "observations",
    dimensions: [{ field: "name" }],
    metrics: [
      { measure: "latency", aggregation: "p50" },
      { measure: "latency", aggregation: "p90" },
      { measure: "latency", aggregation: "p95" },
      { measure: "latency", aggregation: "p99" },
    ],
    filters: [
      ...mapLegacyUiTableFilterToView("observations", globalFilterState),
      {
        column: "type",
        operator: "=",
        value: "SPAN",
        type: "string",
      },
    ],
    timeDimension: null,
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: [{ field: "p95_latency", direction: "desc" }],
  };

  // Trace 지연시간 쿼리
  const tracesLatenciesQuery = {
    view: "traces",
    dimensions: [{ field: "name" }],
    metrics: [
      { measure: "latency", aggregation: "p50" },
      { measure: "latency", aggregation: "p90" },
      { measure: "latency", aggregation: "p95" },
      { measure: "latency", aggregation: "p99" },
    ],
    filters: mapLegacyUiTableFilterToView("traces", globalFilterState),
    timeDimension: null,
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: [{ field: "p95_latency", direction: "desc" }],
  };

  // Mock 데이터들
  const mockTracesData = [
    { name: 'chat-completion', p50_latency: 1200, p90_latency: 2500, p95_latency: 3200, p99_latency: 4800 },
    { name: 'text-generation', p50_latency: 800, p90_latency: 1800, p95_latency: 2200, p99_latency: 3500 },
    { name: 'embedding-creation', p50_latency: 200, p90_latency: 400, p95_latency: 500, p99_latency: 800 },
  ];

  const mockGenerationsData = [
    { name: 'gpt-4-completion', p50_latency: 1500, p90_latency: 2800, p95_latency: 3500, p99_latency: 5200 },
    { name: 'gpt-3.5-completion', p50_latency: 900, p90_latency: 1600, p95_latency: 2000, p99_latency: 3200 },
    { name: 'claude-completion', p50_latency: 1100, p90_latency: 2000, p95_latency: 2500, p99_latency: 3800 },
  ];

  const mockSpansData = [
    { name: 'token-processing', p50_latency: 50, p90_latency: 120, p95_latency: 150, p99_latency: 250 },
    { name: 'model-inference', p50_latency: 800, p90_latency: 1500, p95_latency: 1800, p99_latency: 2800 },
    { name: 'post-processing', p50_latency: 30, p90_latency: 80, p95_latency: 100, p99_latency: 180 },
  ];

  // Mock API 응답
  const tracesLatencies = { data: mockTracesData, isLoading: false };
  const generationsLatencies = { data: mockGenerationsData, isLoading: false };
  const spansLatencies = { data: mockSpansData, isLoading: false };

  // TODO: 실제 API 연동 시 구현
  console.log('LatencyTables queries:', {
    projectId,
    generationsLatenciesQuery,
    spansLatenciesQuery,
    tracesLatenciesQuery
  });

  /**
   * 지연시간 데이터를 테이블 행으로 변환하는 함수
   * @param {Array} data - 지연시간 데이터 배열
   * @returns {Array} 테이블 행 배열
   */
  const generateLatencyData = (data) => {
    return data
      ? data
          .filter((item) => item.name !== null)
          .map((item, i) => [
            <div key={`${item.name}-${i}`}>
              <Popup
                triggerContent={truncate(item.name)}
                description={item.name}
              />
            </div>,
            <RightAlignedCell key={`${i}-p50`}>
              {item.p50_latency
                ? formatIntervalSeconds(Number(item.p50_latency) / 1000, 3)
                : "-"}
            </RightAlignedCell>,
            <RightAlignedCell key={`${i}-p90`}>
              {item.p90_latency
                ? formatIntervalSeconds(Number(item.p90_latency) / 1000, 3)
                : "-"}
            </RightAlignedCell>,
            <RightAlignedCell key={`${i}-p95`}>
              {item.p95_latency
                ? formatIntervalSeconds(Number(item.p95_latency) / 1000, 3)
                : "-"}
            </RightAlignedCell>,
            <RightAlignedCell key={`${i}-p99`}>
              {item.p99_latency
                ? formatIntervalSeconds(Number(item.p99_latency) / 1000, 3)
                : "-"}
            </RightAlignedCell>,
          ])
      : [];
  };

  return (
    <>
      {/* Trace 지연시간 테이블 */}
      <WidgetCard
        className="col-span-1 xl:col-span-2"
        title="Trace latency percentiles"
        isLoading={isLoading || tracesLatencies.isLoading}
      >
        <DashboardTable
          headers={[
            "Trace Name",
            <RightAlignedCell key="p50">p50</RightAlignedCell>,
            <RightAlignedCell key="p90">p90</RightAlignedCell>,
            <RightAlignedCell key="p95">
              p95<span style={{ marginLeft: '4px' }}>▼</span>
            </RightAlignedCell>,
            <RightAlignedCell key="p99">p99</RightAlignedCell>,
          ]}
          rows={generateLatencyData(tracesLatencies.data)}
          isLoading={isLoading || tracesLatencies.isLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
        />
      </WidgetCard>

      {/* Generation 지연시간 테이블 */}
      <WidgetCard
        className="col-span-1 xl:col-span-2"
        title="Generation latency percentiles"
        isLoading={isLoading || generationsLatencies.isLoading}
      >
        <DashboardTable
          headers={[
            "Generation Name",
            <RightAlignedCell key="p50">p50</RightAlignedCell>,
            <RightAlignedCell key="p90">p90</RightAlignedCell>,
            <RightAlignedCell key="p95">
              p95<span style={{ marginLeft: '4px' }}>▼</span>
            </RightAlignedCell>,
            <RightAlignedCell key="p99">p99</RightAlignedCell>,
          ]}
          rows={generateLatencyData(generationsLatencies.data)}
          isLoading={isLoading || generationsLatencies.isLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
        />
      </WidgetCard>

      {/* Span 지연시간 테이블 */}
      <WidgetCard
        className="col-span-1 xl:col-span-2"
        title="Span latency percentiles"
        isLoading={isLoading || spansLatencies.isLoading}
      >
        <DashboardTable
          headers={[
            "Span Name",
            <RightAlignedCell key="p50">p50</RightAlignedCell>,
            <RightAlignedCell key="p90">p90</RightAlignedCell>,
            <RightAlignedCell key="p95">
              p95<span style={{ marginLeft: '4px' }}>▼</span>
            </RightAlignedCell>,
            <RightAlignedCell key="p99">p99</RightAlignedCell>,
          ]}
          rows={generateLatencyData(spansLatencies.data)}
          isLoading={isLoading || spansLatencies.isLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
        />
      </WidgetCard>
    </>
  );
};

export default LatencyTables;
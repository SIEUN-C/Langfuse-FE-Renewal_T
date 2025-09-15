// src/Pages/Dashboards/components/charts/LatencyTables.jsx
import React, { useState, useEffect } from 'react';
import RightAlignedCell from './RightAlignedCell';
import LeftAlignedCell from './LeftAlignedCell';
import { DashboardCard } from '../cards/DashboardCard';
import { DashboardTable } from '../cards/DashboardTable';
import { widgetAPI } from '../../services/dashboardApi';
import { createTracesTimeFilter } from '../../utils/dashboard-utils';

/* eslint-disable react-refresh/only-export-components */

/**
 * 시간 간격을 초 단위로 포맷팅하는 함수
 * @param {number} seconds - 초 단위 시간
 * @param {number} precision - 소수점 자릿수
 * @returns {string} 포맷된 시간 문자열
 */
function formatIntervalSeconds(seconds, precision = 3) {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(Math.max(0, precision - 3))}ms`;
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
 * Generation 유사 타입들을 가져오는 함수
 */
function getGenerationLikeTypes() {
  return ['GENERATION', 'COMPLETION', 'LLM'];
}

/**
 * 지연시간 테이블들 컴포넌트 - ModelCostTable 패턴 적용
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
  // ===== API 상태 관리 (ModelCostTable 패턴) =====
  const [tracesData, setTracesData] = useState(null);
  const [generationsData, setGenerationsData] = useState(null);
  const [spansData, setSpansData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ===== API 호출 (ModelCostTable 패턴) =====
  useEffect(() => {
    const fetchLatencyData = async () => {
      if (!projectId) return;
      if (!fromTimestamp || !toTimestamp) return;
      if (isLoading) return;

      setApiLoading(true);
      setApiError(null);

      try {
        // 글로벌 필터 변환
        const transformedFilters = createTracesTimeFilter(globalFilterState || []);
        
        const fromISO = fromTimestamp instanceof Date 
          ? fromTimestamp.toISOString() 
          : new Date(fromTimestamp).toISOString();
        const toISO = toTimestamp instanceof Date 
          ? toTimestamp.toISOString() 
          : new Date(toTimestamp).toISOString();

        // ===== 1. Traces 지연시간 쿼리 =====
        const tracesLatenciesQuery = {
          view: "traces",
          dimensions: [{ field: "name" }],
          metrics: [
            { measure: "latency", aggregation: "p50" },
            { measure: "latency", aggregation: "p90" },
            { measure: "latency", aggregation: "p95" },
            { measure: "latency", aggregation: "p99" },
          ],
          filters: transformedFilters,
          timeDimension: null,
          fromTimestamp: fromISO,
          toTimestamp: toISO,
          orderBy: [{ field: "p95_latency", direction: "desc" }],
        };

        // ===== 2. Generations 지연시간 쿼리 =====
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
            ...transformedFilters,
            {
              column: "type",
              operator: "any of",
              value: getGenerationLikeTypes(),
              type: "stringOptions",
            },
          ],
          timeDimension: null,
          fromTimestamp: fromISO,
          toTimestamp: toISO,
          orderBy: [{ field: "p95_latency", direction: "desc" }],
        };

        // ===== 3. Spans 지연시간 쿼리 =====
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
            ...transformedFilters,
            {
              column: "type",
              operator: "=",
              value: "SPAN",
              type: "string",
            },
          ],
          timeDimension: null,
          fromTimestamp: fromISO,
          toTimestamp: toISO,
          orderBy: [{ field: "p95_latency", direction: "desc" }],
        };

        // ===== 병렬 API 호출 =====
        const [tracesResult, generationsResult, spansResult] = await Promise.all([
          widgetAPI.executeQuery(projectId, tracesLatenciesQuery),
          widgetAPI.executeQuery(projectId, generationsLatenciesQuery),
          widgetAPI.executeQuery(projectId, spansLatenciesQuery),
        ]);

        // ===== 결과 처리 =====
        if (tracesResult.success && tracesResult.data) {
          setTracesData(tracesResult.data);
        } else {
          console.warn('Traces latency API error:', tracesResult.error);
        }

        if (generationsResult.success && generationsResult.data) {
          setGenerationsData(generationsResult.data);
        } else {
          console.warn('Generations latency API error:', generationsResult.error);
        }

        if (spansResult.success && spansResult.data) {
          setSpansData(spansResult.data);
        } else {
          console.warn('Spans latency API error:', spansResult.error);
        }

        // ===== 에러 처리 =====
        const errors = [
          !tracesResult.success && tracesResult.error,
          !generationsResult.success && generationsResult.error,
          !spansResult.success && spansResult.error
        ].filter(Boolean);

        if (errors.length > 0) {
          setApiError(`API errors: ${errors.join(', ')}`);
        }

      } catch (error) {
        console.error('LatencyTables API error:', error);
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchLatencyData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // ===== Mock 데이터 (API 실패시 폴백) =====
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

  // ===== 실제 데이터 우선, 없으면 Mock 데이터 사용 =====
  const actualTracesData = tracesData || mockTracesData;
  const actualGenerationsData = generationsData || mockGenerationsData;
  const actualSpansData = spansData || mockSpansData;

  /**
   * 지연시간 데이터를 테이블 행으로 변환하는 함수
   * @param {Array} data - 지연시간 데이터 배열
   * @returns {Array} 테이블 행 배열
   */
  const generateLatencyData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter((item) => item && item.name !== null)
      .map((item, i) => [
        <LeftAlignedCell key={`${i}-name`} title={item.name}>
          <Popup
            triggerContent={truncate(item.name)}
            description={item.name}
          />
        </LeftAlignedCell>,
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
      ]);
  };

  const isCurrentlyLoading = isLoading || apiLoading;

  return (
    <>
      {/* ===== Trace 지연시간 테이블 ===== */}
      <DashboardCard
        className="col-span-1 xl:col-span-2"
        title="Trace latency percentiles"
        isLoading={isCurrentlyLoading}
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
          rows={generateLatencyData(actualTracesData)}
          isLoading={isCurrentlyLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
          noDataProps={{
            description: "Trace latency percentiles show response times across different percentiles.",
            href: "https://langfuse.com/docs/observability/features/traces",
          }}
        />
      </DashboardCard>

      {/* ===== Generation 지연시간 테이블 ===== */}
      <DashboardCard
        className="col-span-1 xl:col-span-2"
        title="Generation latency percentiles"
        isLoading={isCurrentlyLoading}
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
          rows={generateLatencyData(actualGenerationsData)}
          isLoading={isCurrentlyLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
          noDataProps={{
            description: "Generation latency percentiles show LLM response times across different percentiles.",
            href: "https://langfuse.com/docs/observability/features/generations",
          }}
        />
      </DashboardCard>

      {/* ===== Span 지연시간 테이블 ===== */}
      <DashboardCard
        className="col-span-1 xl:col-span-2"
        title="Span latency percentiles"
        isLoading={isCurrentlyLoading}
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
          rows={generateLatencyData(actualSpansData)}
          isLoading={isCurrentlyLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
          noDataProps={{
            description: "Span latency percentiles show intermediate processing times across different percentiles.",
            href: "https://langfuse.com/docs/observability/features/spans",
          }}
        />

        {/* ===== 에러 표시 (ModelCostTable 패턴) ===== */}
        {apiError && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              backgroundColor: "#7f1d1d",
              color: "#fca5a5",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            Error: {apiError}
          </div>
        )}
      </DashboardCard>
    </>
  );
};

export default LatencyTables;
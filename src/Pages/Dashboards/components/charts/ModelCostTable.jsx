// src/Pages/Dashboards/components/charts/ModelCostTable.jsx
import React, { useState, useEffect } from 'react';
import RightAlignedCell from './RightAlignedCell';
import LeftAlignedCell from './LeftAlignedCell';
import { DashboardCard } from '../cards/DashboardCard'; // ✅ 수정됨
import { DashboardTable } from '../cards/DashboardTable';
import { compactNumberFormatter } from '../../utils/numbers';
import TotalMetric from './TotalMetric';
import { totalCostDashboardFormatted } from '../../utils/dashboard-utils';
import { truncate } from '../../utils/string';
import { widgetAPI } from '../../services/dashboardApi';
import { createTracesTimeFilter } from '../../utils/dashboard-utils';

// DocPopup 미니 컴포넌트 (ModelCostTable 전용)
const DocPopup = ({ description, href }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = (e) => {
    if (!href) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(href, '_blank');
    console.log('DocPopup 링크 클릭:', href);
  };

  const InfoIcon = () => (
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ display: 'inline-block' }}
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="M12,11 L12,16"/>
      <circle cx="12" cy="8" r="1"/>
    </svg>
  );

  return (
    <div 
      style={{ 
        position: 'relative',
        display: 'inline-block',
        marginLeft: '4px',
        marginRight: '4px'
      }}
      onMouseEnter={() => {
        setIsVisible(true);
        console.log('DocPopup 열림:', description);
      }}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div
        onClick={handleClick}
        style={{
          display: 'inline-block',
          cursor: href ? 'pointer' : 'default',
          color: '#6b7280',
          verticalAlign: 'middle'
        }}
      >
        <InfoIcon />
      </div>
      
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '12px',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            zIndex: 1000,
            minWidth: '200px',
            maxWidth: '300px'
          }}
        >
          {description}
          
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white'
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Generation 유사 타입들을 가져오는 함수
 * 원본: import { getGenerationLikeTypes } from "@langfuse/shared";
 * 현재: @langfuse/shared 패키지가 없으므로 로컬 구현
 */
function getGenerationLikeTypes() {
  return ['GENERATION', 'COMPLETION', 'LLM'];
}

/**
 * 모델별 비용 테이블 컴포넌트 - API 연동 버전
 * @param {Object} props
 * @param {string} props.className - CSS 클래스
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Object} props.globalFilterState - 글로벌 필터 상태
 * @param {Date} props.fromTimestamp - 시작 시간
 * @param {Date} props.toTimestamp - 종료 시간
 * @param {boolean} props.isLoading - 로딩 상태
 */
const ModelCostTable = ({
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
}) => {
  // API 상태 관리
  const [metricsData, setMetricsData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  console.log('💰 ModelCostTable props:', {
    projectId,
    globalFilterState,
    fromTimestamp: fromTimestamp?.toISOString(),
    toTimestamp: toTimestamp?.toISOString(),
    isLoading
  });

  // API 호출
  useEffect(() => {
    const fetchModelCostData = async () => {
      // ===== 필수 조건 검증 =====
      if (!projectId) {
        console.warn('🚫 ProjectId가 없어서 ModelCostTable API 호출을 건너뜁니다.');
        return;
      }
      
      if (!fromTimestamp || !toTimestamp) {
        console.warn('🚫 날짜가 없어서 ModelCostTable API 호출을 건너뜁니다:', { fromTimestamp, toTimestamp });
        return;
      }
      
      if (isLoading) {
        console.warn('🚫 로딩 중이므로 ModelCostTable API 호출을 건너뜁니다.');
        return;
      }

      setApiLoading(true);
      setApiError(null);

      try {
        // ===== 필터 변환 및 적용 =====
        const transformedFilters = createTracesTimeFilter(globalFilterState || []);
        
        // Generation 타입 필터 추가
        const filtersWithType = [
          ...transformedFilters,
          {
            column: "type",
            operator: "any of",
            value: getGenerationLikeTypes(),
            type: "stringOptions",
          }
        ];

        // ===== 날짜 안전 변환 =====
        const fromISO = fromTimestamp instanceof Date ? fromTimestamp.toISOString() : new Date(fromTimestamp).toISOString();
        const toISO = toTimestamp instanceof Date ? toTimestamp.toISOString() : new Date(toTimestamp).toISOString();

        console.log('💰 ModelCostTable 쿼리 준비:', {
          필터: filtersWithType,
          시작날짜: fromISO,
          종료날짜: toISO
        });

        // 모델별 비용 쿼리 (원본 Langfuse와 동일)
        const modelCostQuery = {
          view: "observations",
          dimensions: [{ field: "providedModelName" }],
          metrics: [
            { measure: "totalCost", aggregation: "sum" },
            { measure: "totalTokens", aggregation: "sum" },
          ],
          filters: filtersWithType,
          timeDimension: null,
          fromTimestamp: fromISO,
          toTimestamp: toISO,
          orderBy: null,
        };

        console.log('💰 ModelCostTable API 쿼리:', modelCostQuery);

        const result = await widgetAPI.executeQuery(projectId, modelCostQuery);

        console.log('💰 ModelCostTable API 응답:', {
          success: result.success,
          dataLength: result.data?.length || 0,
          sampleData: result.data?.slice(0, 2)
        });

        if (result.success && result.data) {
          setMetricsData(result.data);
        } else {
          setApiError(result.error || 'Unknown error');
        }

      } catch (error) {
        console.error('❌ ModelCostTable API 호출 실패:', error);
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchModelCostData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // ===== 데이터 처리 =====
  
  // 실제 데이터가 있으면 사용, 없으면 Mock 데이터 사용
  const actualData = metricsData || [
    {
      providedModelName: 'Qwen3-30B-A3B-Instruct-2507-UD...',
      sum_totalTokens: 60,
      sum_totalCost: 0.00
    }
  ];

  console.log('💰 사용할 데이터:', actualData);

  // 총 비용 계산 - NaN 방지
  const totalTokenCost = actualData.reduce(
    (acc, curr) => {
      const cost = curr.sum_totalCost || 0;
      return acc + (isNaN(cost) ? 0 : cost);
    },
    0
  );

  // 테이블 데이터 변환
  const tableData = actualData
    .filter((item) => item.providedModelName !== null)
    .map((item, i) => [
      <LeftAlignedCell
        key={`${i}-model`}
        title={item.providedModelName}
      >
        {truncate(item.providedModelName, 30)}
      </LeftAlignedCell>,
      <RightAlignedCell key={`${i}-tokens`}>
        {item.sum_totalTokens
          ? compactNumberFormatter(item.sum_totalTokens)
          : "0"}
      </RightAlignedCell>,
      <RightAlignedCell key={`${i}-cost`}>
        {item.sum_totalCost
          ? totalCostDashboardFormatted(item.sum_totalCost)
          : "$0"}
      </RightAlignedCell>,
    ]);

  const isCurrentlyLoading = isLoading || apiLoading;

  return (
    <DashboardCard
      className={className}
      title="Model costs"
      description={null}
      isLoading={isCurrentlyLoading}
    >
      <DashboardTable
        headers={[
          "Model",
          <RightAlignedCell key="tokens">Tokens</RightAlignedCell>,
          <RightAlignedCell key="cost">USD</RightAlignedCell>,
        ]}
        rows={tableData}
        isLoading={isCurrentlyLoading}
        collapse={{ collapsed: 5, expanded: 20 }}
        noDataProps={{
          description: apiError 
            ? `API Error: ${apiError}`
            : "No model cost data available for the selected time range.",
          href: "https://langfuse.com/docs/model-usage-and-cost"
        }}
      >
        <TotalMetric
          metric={totalCostDashboardFormatted(totalTokenCost)}
          description="Total cost"
        >
          <DocPopup
            description="Calculated multiplying the number of tokens with cost per token for each model."
            href="https://langfuse.com/docs/model-usage-and-cost"
          />
        </TotalMetric>

        {/* 개발 모드 디버깅 정보 */}
        {import.meta.env.DEV && (
          <details style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer' }}>🔧 Model Cost Debug Info</summary>
            <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
              <div>API Loading: {apiLoading ? '🔄' : '✅'}</div>
              <div>API Error: {apiError || '없음'}</div>
              <div>Data Count: {actualData.length}</div>
              <div>Total Cost: ${totalTokenCost.toFixed(4)}</div>
              <div>Sample Data: {JSON.stringify(actualData.slice(0, 1), null, 2)}</div>
            </div>
          </details>
        )}
      </DashboardTable>
    </DashboardCard>
  );
};

export default ModelCostTable;
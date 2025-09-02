import React, { useState } from 'react';
import RightAlignedCell from './RightAlignedCell';
import LeftAlignedCell from './LeftAlignedCell';
import WidgetCard from '../WidgetCard';
import DashboardTable from '../cards/DashboardTable';
import { compactNumberFormatter } from '../../utils/numbers';
import TotalMetric from './TotalMetric';
import { totalCostDashboardFormatted } from '../../utils/dashboard-utils';
import { truncate } from '../../utils/string';

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
 * 모델별 비용 테이블 컴포넌트
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
  // TODO: 실제 API 연동 필요
  // 현재는 목업 데이터 사용
  console.log('ModelCostTable props:', {
    projectId,
    globalFilterState,
    fromTimestamp: fromTimestamp?.toISOString(),
    toTimestamp: toTimestamp?.toISOString(),
    isLoading
  });

  // Mock 데이터 (실제 구현 시 API 호출로 대체)
  const mockData = [
    {
      providedModelName: 'gpt-4o-mini',
      sum_totalTokens: 1205234,
      sum_totalCost: 0.6521
    },
    {
      providedModelName: 'gpt-4o',
      sum_totalTokens: 542341,
      sum_totalCost: 3.2145
    },
    {
      providedModelName: 'claude-3-5-sonnet-20241022',
      sum_totalTokens: 893456,
      sum_totalCost: 2.1892
    },
    {
      providedModelName: 'claude-3-haiku-20240307',
      sum_totalTokens: 2341567,
      sum_totalCost: 0.4523
    },
    {
      providedModelName: 'gemini-1.5-flash',
      sum_totalTokens: 1567234,
      sum_totalCost: 0.3241
    },
    {
      providedModelName: 'llama-3.1-8b-instant',
      sum_totalTokens: 3456789,
      sum_totalCost: 0.1923
    }
  ];

  // 총 비용 계산
  const totalTokenCost = mockData.reduce(
    (acc, curr) => acc + (curr.sum_totalCost || 0),
    0
  );

  // 테이블 데이터 변환
  const metricsData = mockData
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

  return (
    <WidgetCard
      className={className}
      title="Model costs"
      isLoading={isLoading}
    >
      <DashboardTable
        headers={[
          "Model",
          <RightAlignedCell key="tokens">Tokens</RightAlignedCell>,
          <RightAlignedCell key="cost">USD</RightAlignedCell>,
        ]}
        rows={metricsData}
        isLoading={isLoading}
        collapse={{ collapsed: 5, expanded: 20 }}
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
      </DashboardTable>
    </WidgetCard>
  );
};

export default ModelCostTable;
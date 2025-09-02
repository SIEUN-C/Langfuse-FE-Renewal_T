import React, { useState } from 'react';
import WidgetCard from '../WidgetCard';
import { compactNumberFormatter } from '../../utils/numbers';
import TabComponent from './TabsComponent';
import TotalMetric from './TotalMetric';
import { totalCostDashboardFormatted } from '../../utils/dashboard-utils';
import NoDataOrLoading from './NoDataOrLoading';

// ExpandListButton 컴포넌트 (재사용)
const ExpandListButton = ({ 
  isExpanded, 
  setExpanded, 
  totalLength, 
  maxLength, 
  expandText 
}) => {
  if (totalLength <= maxLength) return null;

  return (
    <button
      onClick={() => setExpanded(!isExpanded)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '8px 16px',
        marginTop: '12px',
        border: '1px solid #d1d5db',
        backgroundColor: 'white',
        color: '#374151',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'white';
      }}
    >
      {isExpanded ? 'Show less' : expandText}
      <span style={{ 
        marginLeft: '4px',
        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s'
      }}>
        ▼
      </span>
    </button>
  );
};

// BarList 컴포넌트 (재사용)
const BarList = ({ data, valueFormatter, showAnimation = true, color = "indigo" }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  const getBarColor = (colorName) => {
    const colors = {
      indigo: '#6366f1',
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      red: '#ef4444'
    };
    return colors[colorName] || colors.indigo;
  };

  return (
    <div style={{ marginTop: '8px' }}>
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        
        return (
          <div 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '4px 0'
            }}
          >
            {/* 사용자 이름 */}
            <div style={{
              minWidth: '120px',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {item.name}
            </div>
            
            {/* 바 컨테이너 */}
            <div style={{
              flex: 1,
              margin: '0 12px',
              height: '20px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* 실제 바 */}
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: getBarColor(color),
                  borderRadius: '4px',
                  transition: showAnimation ? 'width 0.8s ease-out' : 'none',
                  opacity: 0.8
                }}
              />
            </div>
            
            {/* 값 */}
            <div style={{
              minWidth: '80px',
              textAlign: 'right',
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {valueFormatter ? valueFormatter(item.value) : item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 사용자 소비량 차트 컴포넌트
 * 사용자별 토큰 비용과 트레이스 개수를 바 차트로 표시
 * @param {Object} props
 * @param {string} props.className - CSS 클래스
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Object} props.globalFilterState - 글로벌 필터 상태
 * @param {Date} props.fromTimestamp - 시작 시간
 * @param {Date} props.toTimestamp - 종료 시간
 * @param {boolean} props.isLoading - 로딩 상태
 */
const UserChart = ({
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // TODO: 실제 API 연동 필요
  console.log('UserChart props:', {
    projectId,
    globalFilterState,
    fromTimestamp: fromTimestamp?.toISOString(),
    toTimestamp: toTimestamp?.toISOString(),
    isLoading
  });

  // Mock 사용자 비용 데이터
  const mockUserCostData = [
    { userId: 'john.doe@example.com', sum_totalCost: 45.67, count_count: 1234 },
    { userId: 'jane.smith@example.com', sum_totalCost: 38.92, count_count: 987 },
    { userId: 'alice.johnson@example.com', sum_totalCost: 29.45, count_count: 756 },
    { userId: 'bob.wilson@example.com', sum_totalCost: 23.18, count_count: 543 },
    { userId: 'charlie.brown@example.com', sum_totalCost: 18.73, count_count: 432 },
    { userId: 'diana.prince@example.com', sum_totalCost: 15.29, count_count: 321 },
    { userId: 'eve.adams@example.com', sum_totalCost: 12.84, count_count: 276 },
    { userId: 'frank.miller@example.com', sum_totalCost: 9.67, count_count: 198 },
    { userId: 'grace.lee@example.com', sum_totalCost: 7.42, count_count: 156 },
    { userId: 'henry.ford@example.com', sum_totalCost: 5.91, count_count: 123 },
    { userId: 'iris.chen@example.com', sum_totalCost: 4.38, count_count: 89 },
    { userId: 'jack.ryan@example.com', sum_totalCost: 3.15, count_count: 67 }
  ];

  // Mock 트레이스 데이터 (동일한 사용자들)
  const mockTracesData = mockUserCostData.map(user => ({
    userId: user.userId,
    count_count: user.count_count
  }));

  // 데이터 변환
  const transformedCost = mockUserCostData
    .filter((item) => item.userId !== undefined)
    .map((item) => ({
      name: item.userId,
      value: Number(item.sum_totalCost) || 0,
    }));

  const transformedNumberOfTraces = mockTracesData
    .filter((item) => item.userId !== undefined)
    .map((item) => ({
      name: item.userId,
      value: Number(item.count_count) || 0,
    }));

  // 총합 계산
  const totalCost = mockUserCostData.reduce(
    (acc, curr) => acc + (Number(curr.sum_totalCost) || 0),
    0,
  );

  const totalTraces = mockTracesData.reduce(
    (acc, curr) => acc + (Number(curr.count_count) || 0),
    0,
  );

  const maxNumberOfEntries = { collapsed: 5, expanded: 20 };

  const localUsdFormatter = (value) => totalCostDashboardFormatted(value);

  // 탭 데이터 구성
  const data = [
    {
      tabTitle: "Token cost",
      data: isExpanded
        ? transformedCost.slice(0, maxNumberOfEntries.expanded)
        : transformedCost.slice(0, maxNumberOfEntries.collapsed),
      totalMetric: totalCostDashboardFormatted(totalCost),
      metricDescription: "Total cost",
      formatter: localUsdFormatter,
    },
    {
      tabTitle: "Count of Traces",
      data: isExpanded
        ? transformedNumberOfTraces.slice(0, maxNumberOfEntries.expanded)
        : transformedNumberOfTraces.slice(0, maxNumberOfEntries.collapsed),
      totalMetric: totalTraces
        ? compactNumberFormatter(totalTraces)
        : compactNumberFormatter(0),
      metricDescription: "Total traces",
    },
  ];

  return (
    <WidgetCard
      className={className}
      title="User consumption"
      isLoading={isLoading}
    >
      <TabComponent
        tabs={data.map((item) => {
          return {
            tabTitle: item.tabTitle,
            content: (
              <>
                {item.data.length > 0 ? (
                  <>
                    <TotalMetric
                      metric={item.totalMetric}
                      description={item.metricDescription}
                    />
                    <BarList
                      data={item.data}
                      valueFormatter={item.formatter}
                      showAnimation={true}
                      color="indigo"
                    />
                  </>
                ) : (
                  <NoDataOrLoading
                    isLoading={isLoading}
                    description="Consumption per user is tracked by passing their ids on traces."
                    href="https://langfuse.com/docs/observability/features/users"
                  />
                )}
              </>
            ),
          };
        })}
      />
      <ExpandListButton
        isExpanded={isExpanded}
        setExpanded={setIsExpanded}
        totalLength={transformedCost.length}
        maxLength={maxNumberOfEntries.collapsed}
        expandText={
          transformedCost.length > maxNumberOfEntries.expanded
            ? `Show top ${maxNumberOfEntries.expanded}`
            : "Show all"
        }
      />
    </WidgetCard>
  );
};

export default UserChart; 
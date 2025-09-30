// src/Pages/Dashboards/components/charts/UserChart.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardCard } from '../cards/DashboardCard';
import { compactNumberFormatter } from '../../utils/numbers';
import TabComponent from './TabsComponent';
import TotalMetric from './TotalMetric';
import { totalCostDashboardFormatted } from '../../utils/dashboardUtils';
import NoDataOrLoading from './NoDataOrLoading';
import { widgetAPI } from '../../services/dashboardApi';
import { mapLegacyUiTableFilterToView } from '../../utils/widgetUtils';

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
        border: '1px solid #374151',
        backgroundColor: '#1f2937',
        color: '#e5e7eb',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#374151';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#1f2937';
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

// BarList 컴포넌트 - TracesBarListChart와 동일한 디자인
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
    <div style={{ marginTop: '16px' }}>
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        
        return (
          <div 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              position: 'relative'
            }}
          >
            {/* 막대 배경 */}
            <div style={{
              flex: 1,
              height: '32px', 
              borderRadius: '6px', 
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* 채워진 막대 */}
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: getBarColor(color),
                  borderRadius: '6px',
                  transition: showAnimation ? 'width 0.8s ease-out' : 'none',
                  opacity: 0.5,
                  position: 'relative'
                }}
              />
              
              {/* 막대 안의 텍스트 */}
              <div style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '400',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 'calc(100% - 32px)',
                zIndex: 2
              }}>
                {item.name}
              </div>
            </div>
            
            {/* 오른쪽 숫자 */}
            <div style={{
              minWidth: '10px',
              textAlign: 'right',
              marginLeft: '20px',
              fontSize: '14px',
              color: '#9ca3af',
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
  // 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);
  const [userCostData, setUserCostData] = useState(null);
  const [userTracesData, setUserTracesData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // 디버깅용 로그
  console.log('UserChart props:', {
    projectId,
    globalFilterState,
    fromTimestamp: fromTimestamp?.toISOString(),
    toTimestamp: toTimestamp?.toISOString(),
    isLoading
  });

  // API 호출
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || isLoading) return;

      setApiLoading(true);
      setApiError(null);

      try {
        // 필터 변환
        const convertedFilters = mapLegacyUiTableFilterToView('traces', globalFilterState || []);
        console.log('UserChart converted filters:', convertedFilters);

        // 사용자별 비용 데이터 조회 쿼리
        const userCostQuery = {
          view: "traces",
          dimensions: [{ field: "userId" }],
          metrics: [
            { measure: "totalCost", aggregation: "sum" },
            { measure: "count", aggregation: "count" }
          ],
          filters: convertedFilters,
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: [{ field: "sum_totalCost", direction: "desc" }],
          chartConfig: { row_limit: 50, type: "TABLE" }
        };

        console.log('UserChart cost query:', userCostQuery);

        // 사용자별 트레이스 개수 쿼리
        const userTracesQuery = {
          view: "traces",
          dimensions: [{ field: "userId" }],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters: convertedFilters,
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: [{ field: "count_count", direction: "desc" }],
          chartConfig: { row_limit: 50, type: "TABLE" }
        };

        console.log('UserChart traces query:', userTracesQuery);

        // 두 개의 쿼리를 병렬로 실행
        const [costResult, tracesResult] = await Promise.all([
          widgetAPI.executeQuery(projectId, userCostQuery),
          widgetAPI.executeQuery(projectId, userTracesQuery)
        ]);

        console.log('UserChart API responses:', { costResult, tracesResult });

        // API 응답 처리
        if (costResult.success && Array.isArray(costResult.data)) {
          setUserCostData(costResult.data);
        }

        if (tracesResult.success && Array.isArray(tracesResult.data)) {
          setUserTracesData(tracesResult.data);
        }

        // 에러 처리
        if (!costResult.success || !tracesResult.success) {
          const errorMsg = costResult.error || tracesResult.error || 'Unknown API error';
          setApiError(errorMsg);
        }

      } catch (error) {
        console.error('UserChart API error:', error);
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // 데이터 변환
  const transformedCost = useMemo(() => {
    if (!userCostData || !Array.isArray(userCostData)) {
      return [];
    }

    return userCostData
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const userId = item.userId || item.user_id || "Unknown";
        const costValue = item.sum_totalCost || item.totalCost || item.cost || 0;
        
        return {
          name: userId,
          value: Number(costValue),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
  }, [userCostData]);

  const transformedTraces = useMemo(() => {
    if (!userTracesData || !Array.isArray(userTracesData)) {
      return [];
    }

    return userTracesData
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const userId = item.userId || item.user_id || "Unknown";
        const countValue = item.count_count || item.count || item.value || 0;
        
        return {
          name: userId,
          value: Number(countValue),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
  }, [userTracesData]);

  // 총합 계산
  const totalCost = useMemo(() => {
    return transformedCost.reduce((acc, curr) => acc + curr.value, 0);
  }, [transformedCost]);

  const totalTraces = useMemo(() => {
    return transformedTraces.reduce((acc, curr) => acc + curr.value, 0);
  }, [transformedTraces]);

  const maxNumberOfEntries = { collapsed: 5, expanded: 20 };
  const isCurrentlyLoading = isLoading || apiLoading;

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
      isEmpty: transformedCost.length === 0,
    },
    {
      tabTitle: "Count of Traces",
      data: isExpanded
        ? transformedTraces.slice(0, maxNumberOfEntries.expanded)
        : transformedTraces.slice(0, maxNumberOfEntries.collapsed),
      totalMetric: totalTraces
        ? compactNumberFormatter(totalTraces)
        : compactNumberFormatter(0),
      metricDescription: "Total traces",
      formatter: (number) => Intl.NumberFormat("en-US").format(number).toString(),
      isEmpty: transformedTraces.length === 0,
    },
  ];

  return (
    <DashboardCard
      className={className}
      title="User consumption"
      isLoading={isCurrentlyLoading}
    >
      <TabComponent
        tabs={data.map((item) => {
          return {
            tabTitle: item.tabTitle,
            content: (
              <>
                {!item.isEmpty ? (
                  <>
                    <TotalMetric
                      totalCount={item.totalMetric}
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
                    isLoading={isCurrentlyLoading}
                    description="Consumption per user is tracked by passing their ids on traces."
                    href="https://langfuse.com/docs/observability/features/users"
                  />
                )}
              </>
            ),
          };
        })}
      />
      
      {/* 확장 버튼 - 데이터가 있을 때만 표시 */}
      {(transformedCost.length > 0 || transformedTraces.length > 0) && (
        <ExpandListButton
          isExpanded={isExpanded}
          setExpanded={setIsExpanded}
          totalLength={Math.max(transformedCost.length, transformedTraces.length)}
          maxLength={maxNumberOfEntries.collapsed}
          expandText={
            Math.max(transformedCost.length, transformedTraces.length) > maxNumberOfEntries.expanded
              ? `Show top ${maxNumberOfEntries.expanded}`
              : "Show all"
          }
        />
      )}

      {/* 에러 표시 - apiError가 null이 아닐 때만 표시 */}
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
  );
};

export default UserChart;
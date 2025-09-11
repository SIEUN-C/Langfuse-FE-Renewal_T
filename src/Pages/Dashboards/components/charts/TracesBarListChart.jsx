import React, { useState, useEffect } from 'react';
import { DashboardCard } from '../cards/DashboardCard';
import TotalMetric from './TotalMetric';
import NoDataOrLoading from './NoDataOrLoading';
import ExpandListButton from './ExpandListButton';
import { widgetAPI } from '../../services/dashboardApi';
import { compactNumberFormatter } from '../../utils/numbers';
import { createTracesTimeFilter } from '../../utils/dashboard-utils';

// BarList 구현
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
    <div style={{ marginTop: '24px' }}>
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
            {/* 이름 */}
            <div style={{
              minWidth: '120px',
              fontSize: '14px',
              color: '#f3f4f6',
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
              backgroundColor: '#374151',
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
              minWidth: '60px',
              textAlign: 'right',
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
 * TracesBarListChart 컴포넌트
 * 원본 Langfuse와 동일한 구조로 구현
 */
export const TracesBarListChart = ({
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [totalTracesData, setTotalTracesData] = useState(null);
  const [tracesData, setTracesData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // API 호출
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || isLoading) return;

      setApiLoading(true);
      setApiError(null);

      try {
        // 1. Total traces query (원본과 동일)
        const totalTracesQuery = {
          view: "traces",
          dimensions: [],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters: createTracesTimeFilter(globalFilterState || []),
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: null,
        };

        const totalResult = await widgetAPI.executeQuery(projectId, totalTracesQuery);

        // 2. Traces grouped by name query (원본과 동일)
        const tracesQuery = {
          view: "traces",
          dimensions: [{ field: "name" }],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters: createTracesTimeFilter(globalFilterState || []),
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: null,
        };

        const tracesResult = await widgetAPI.executeQuery(projectId, tracesQuery);

        if (totalResult.success) {
          setTotalTracesData(totalResult.data);
        }

        if (tracesResult.success) {
          setTracesData(tracesResult.data);
        }

        if (!totalResult.success || !tracesResult.success) {
          setApiError(totalResult.error || tracesResult.error);
        }

      } catch (error) {
        console.error('TracesBarListChart API 호출 실패:', error);
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // Transform the data to match the expected format for the BarList (원본과 동일)
  const transformedTraces = tracesData?.map((item) => {
    return {
      name: item.name ? item.name : "Unknown",
      value: Number(item.count_count),
    };
  }) || [];

  const maxNumberOfEntries = { collapsed: 5, expanded: 20 };

  const adjustedData = isExpanded
    ? transformedTraces.slice(0, maxNumberOfEntries.expanded)
    : transformedTraces.slice(0, maxNumberOfEntries.collapsed);

  const isCurrentlyLoading = isLoading || apiLoading;

  return (
    <DashboardCard
      className={className}
      title="Traces"
      description={null}
      isLoading={isCurrentlyLoading}
    >
      <>
        <TotalMetric
          metric={compactNumberFormatter(
            totalTracesData?.[0]?.count_count
              ? Number(totalTracesData[0].count_count)
              : 0,
          )}
          description="Total traces tracked"
        />
        {adjustedData.length > 0 ? (
          <>
            <BarList
              data={adjustedData}
              valueFormatter={(number) =>
                Intl.NumberFormat("en-US").format(number).toString()
              }
              showAnimation={true}
              color="indigo"
            />
          </>
        ) : (
          <NoDataOrLoading
            isLoading={isCurrentlyLoading}
            description="Traces contain details about LLM applications and can be created using the SDK."
            href="https://langfuse.com/docs/get-started"
          />
        )}
        <ExpandListButton
          isExpanded={isExpanded}
          setExpanded={setIsExpanded}
          totalLength={transformedTraces.length}
          maxLength={maxNumberOfEntries.collapsed}
          expandText={
            transformedTraces.length > maxNumberOfEntries.expanded
              ? `Show top ${maxNumberOfEntries.expanded}`
              : "Show all"
          }
        />
        
        {/* 에러 표시 */}
        {apiError && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Error: {apiError}
          </div>
        )}
      </>
    </DashboardCard>
  );
};

export default TracesBarListChart;
import React, { useState, useEffect } from 'react';
import { DashboardCard } from '../cards/DashboardCard';
import TotalMetric from './TotalMetric';
import NoDataOrLoading from './NoDataOrLoading';
import ExpandListButton from './ExpandListButton';
import { widgetAPI } from '../../services/dashboardApi';

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
    <div style={{ marginTop: '20px' }}>
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        
        return (
          <div 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '0'
            }}
          >
            <div style={{
              minWidth: '200px',
              fontSize: '14px',
              color: '#f3f4f6',
              fontWeight: '400',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingRight: '16px'
            }}>
              {item.name}
            </div>
            
            <div style={{
              flex: 1,
              height: '24px',
              backgroundColor: '#374151',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: getBarColor(color),
                  borderRadius: '12px',
                  transition: showAnimation ? 'width 0.8s ease-out' : 'none',
                  opacity: 0.9
                }}
              />
            </div>
            
            <div style={{
              minWidth: '40px',
              textAlign: 'right',
              fontSize: '14px',
              color: '#9ca3af',
              fontWeight: '500',
              paddingLeft: '16px'
            }}>
              {valueFormatter ? valueFormatter(item.value) : item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
        // 총 Traces 개수 조회 쿼리
        const totalTracesQuery = {
          view: "traces",
          dimensions: [],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters: globalFilterState || [],
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: null,
          chartConfig: { row_limit: 100, type: "NUMBER" }
        };

        const totalResult = await widgetAPI.executeQuery(projectId, totalTracesQuery);

        // Name별 Traces 개수 조회 쿼리
        const tracesQuery = {
          view: "traces",
          dimensions: [{ field: "name" }],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters: globalFilterState || [],
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: null,
          chartConfig: { row_limit: 100, type: "TABLE" }
        };

        const tracesResult = await widgetAPI.executeQuery(projectId, tracesQuery);

        // API 응답 처리
        if (totalResult.success && Array.isArray(totalResult.data)) {
          setTotalTracesData(totalResult.data);
        }

        if (tracesResult.success && Array.isArray(tracesResult.data)) {
          setTracesData(tracesResult.data);
        }

        // 에러 처리
        if (!totalResult.success || !tracesResult.success) {
          const errorMsg = totalResult.error || tracesResult.error || 'Unknown API error';
          setApiError(errorMsg);
        }

      } catch (error) {
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // 데이터 변환
  const transformedTraces = React.useMemo(() => {
    if (!tracesData || !Array.isArray(tracesData)) {
      return [];
    }

    const transformed = tracesData.map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const countValue = item.count_count || item.count || item.value || 0;
      
      return {
        name: item.name || "Unknown",
        value: Number(countValue),
      };
    }).filter(Boolean);

    // 값 기준 내림차순 정렬
    transformed.sort((a, b) => b.value - a.value);

    return transformed;
  }, [tracesData]);

  const maxNumberOfEntries = { collapsed: 5, expanded: 20 };

  const adjustedData = isExpanded
    ? transformedTraces.slice(0, maxNumberOfEntries.expanded)
    : transformedTraces.slice(0, maxNumberOfEntries.collapsed);

  // 총 개수 계산
  const totalCount = React.useMemo(() => {
    if (!totalTracesData || !Array.isArray(totalTracesData) || totalTracesData.length === 0) {
      return 0;
    }

    const firstItem = totalTracesData[0];
    const count = firstItem?.count_count || firstItem?.count || firstItem?.value || 0;
    
    return Number(count);
  }, [totalTracesData]);

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
          totalCount={totalCount}
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
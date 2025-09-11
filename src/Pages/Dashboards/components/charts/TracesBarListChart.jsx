import React, { useState, useEffect } from 'react';
import { DashboardCard } from '../cards/DashboardCard';
import TotalMetric from './TotalMetric';
import NoDataOrLoading from './NoDataOrLoading';
import ExpandListButton from './ExpandListButton';
import { widgetAPI } from '../../services/dashboardApi';
import { compactNumberFormatter } from '../../utils/numbers';
// ✅ 수정: 원본과 동일한 필터 매핑 사용
import { mapLegacyUiTableFilterToView } from '../../utils/widget-utils';

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
 * 
 * ✅ 수정사항:
 * 1. 필터 매핑 함수 변경 (createTracesTimeFilter → mapLegacyUiTableFilterToView)
 * 2. 에러 핸들링 개선
 * 3. API 응답 구조 검증 추가
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
        // ✅ 수정: 원본과 동일한 필터 매핑 사용
        const filters = mapLegacyUiTableFilterToView("traces", globalFilterState || []);

        console.log('🔍 TracesBarListChart API 호출:', {
          projectId,
          filters,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString()
        });

        // 1. Total traces query (원본과 동일)
        const totalTracesQuery = {
          view: "traces",
          dimensions: [],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters,
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: null,
        };

        const totalResult = await widgetAPI.executeQuery(projectId, totalTracesQuery);
        console.log('📊 Total traces 결과:', totalResult);

        // 2. Traces grouped by name query (원본과 동일)
        const tracesQuery = {
          view: "traces",
          dimensions: [{ field: "name" }],
          metrics: [{ measure: "count", aggregation: "count" }],
          filters,
          timeDimension: null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: null,
        };

        const tracesResult = await widgetAPI.executeQuery(projectId, tracesQuery);
        console.log('📊 Grouped traces 결과:', tracesResult);

        // ✅ 개선: API 응답 구조 검증
        if (totalResult.success && Array.isArray(totalResult.data)) {
          setTotalTracesData(totalResult.data);
          console.log('✅ Total traces 데이터 설정 완료');
        } else {
          console.warn('⚠️ Total traces 데이터 형식이 예상과 다름:', totalResult);
        }

        if (tracesResult.success && Array.isArray(tracesResult.data)) {
          setTracesData(tracesResult.data);
          console.log('✅ Grouped traces 데이터 설정 완료');
        } else {
          console.warn('⚠️ Grouped traces 데이터 형식이 예상과 다름:', tracesResult);
        }

        // 에러 처리
        if (!totalResult.success || !tracesResult.success) {
          const errorMsg = totalResult.error || tracesResult.error || 'Unknown API error';
          setApiError(errorMsg);
          console.error('❌ API 에러:', errorMsg);
        }

      } catch (error) {
        console.error('❌ TracesBarListChart API 호출 실패:', error);
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // ✅ 개선: 데이터 변환 및 검증
  const transformedTraces = React.useMemo(() => {
    if (!tracesData || !Array.isArray(tracesData)) {
      console.log('📊 변환할 tracesData가 없음:', tracesData);
      return [];
    }

    const transformed = tracesData.map((item) => {
      // ✅ 검증: 예상되는 데이터 구조 확인
      if (!item || typeof item !== 'object') {
        console.warn('⚠️ 잘못된 trace 아이템:', item);
        return null;
      }

      // count_count 필드 확인 (다양한 형태 지원)
      const countValue = item.count_count || item.count || item.value || 0;
      
      return {
        name: item.name || "Unknown",
        value: Number(countValue),
      };
    }).filter(Boolean); // null 값 제거

    console.log('🔄 Traces 데이터 변환 완료:', {
      원본: tracesData.length,
      변환후: transformed.length,
      샘플: transformed.slice(0, 3)
    });

    return transformed;
  }, [tracesData]);

  const maxNumberOfEntries = { collapsed: 5, expanded: 20 };

  const adjustedData = isExpanded
    ? transformedTraces.slice(0, maxNumberOfEntries.expanded)
    : transformedTraces.slice(0, maxNumberOfEntries.collapsed);

  // ✅ 개선: 총 개수 계산
  const totalCount = React.useMemo(() => {
    if (!totalTracesData || !Array.isArray(totalTracesData) || totalTracesData.length === 0) {
      return 0;
    }

    const firstItem = totalTracesData[0];
    const count = firstItem?.count_count || firstItem?.count || firstItem?.value || 0;
    
    console.log('📊 총 Traces 개수:', {
      totalTracesData,
      extractedCount: count
    });

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
          metric={compactNumberFormatter(totalCount)}
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

        {/* 개발 모드에서 디버그 정보 표시 */}
        {import.meta.env.DEV && (
          <details style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            <summary style={{ cursor: 'pointer' }}>🔧 Debug Info</summary>
            <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
              <div>Total Traces: {totalTracesData?.length || 0} items</div>
              <div>Grouped Traces: {tracesData?.length || 0} items</div>
              <div>Transformed: {transformedTraces.length} items</div>
              <div>Displayed: {adjustedData.length} items</div>
            </div>
          </details>
        )}
      </>
    </DashboardCard>
  );
};

export default TracesBarListChart;
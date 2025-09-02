import React, { useState } from 'react';
import WidgetCard from '../WidgetCard';
import TotalMetric from './TotalMetric';
import { compactNumberFormatter } from '../../utils/numbers';
import NoDataOrLoading from './NoDataOrLoading';

// ExpandListButton 간단 구현 (임시)
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

// BarList 컴포넌트 (Tremor 대체)
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
              minWidth: '60px',
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
 * 트레이스 바 리스트 차트 컴포넌트
 * DashboardDetail에서 data prop으로 차트 데이터를 받음
 * @param {Object} props
 * @param {Array} props.data - 차트 데이터 배열 (transformWidgetData에서 변환된 데이터)
 */
const TracesBarListChart = ({ data = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 디버깅용 로그 추가
  console.log('=== TracesBarListChart Debug ===');
  console.log('Raw data received:', data);
  console.log('Data type:', typeof data);
  console.log('Is array:', Array.isArray(data));
  console.log('Data length:', data?.length);
  
  // 각 데이터 아이템 상세 분석
  if (Array.isArray(data) && data.length > 0) {
    data.forEach((item, index) => {
      console.log(`Item ${index}:`, item);
      console.log(`  - Keys: ${Object.keys(item)}`);
      console.log(`  - Values: ${Object.values(item)}`);
    });
  }

  // 데이터가 없거나 비어있는 경우
  if (!data || data.length === 0) {
    return (
      <NoDataOrLoading
        isLoading={false}
        description="Traces contain details about LLM applications and can be created using the SDK."
        href="https://langfuse.com/docs/get-started"
      />
    );
  }

  // 데이터 변환 (모든 가능한 키 확인)
  const transformedTraces = data.map((item, index) => {
    console.log(`Transforming item ${index}:`, item);
    
    // 가능한 모든 name 필드 확인
    const name = item.name || 
                 item.trace_name || 
                 item.traceName || 
                 item.key || 
                 item.label ||
                 item.dimension ||
                 `Trace ${index + 1}`;
    
    // 가능한 모든 value 필드 확인
    const rawValue = item.value || 
                     item.count || 
                     item.count_count || 
                     item.metric || 
                     item.total ||
                     item.sum || 
                     0;
    
    console.log(`  - Raw name: "${name}"`);
    console.log(`  - Raw value: "${rawValue}"`);
    
    // 값을 숫자로 변환
    const value = Number(rawValue);
    console.log(`  - Parsed value: ${value} (isNaN: ${isNaN(value)})`);
    
    return {
      name: String(name),
      value: isNaN(value) ? 0 : value
    };
  });

  console.log('Transformed traces:', transformedTraces);

  // 총합 계산
  const totalCount = transformedTraces.reduce((sum, item) => {
    const validValue = isNaN(item.value) ? 0 : item.value;
    return sum + validValue;
  }, 0);
  
  console.log('Total count:', totalCount);

  const maxNumberOfEntries = { collapsed: 5, expanded: 20 };

  const adjustedData = isExpanded
    ? transformedTraces.slice(0, maxNumberOfEntries.expanded)
    : transformedTraces.slice(0, maxNumberOfEntries.collapsed);

  // compactNumberFormatter 안전 호출
  let formattedTotal;
  try {
    formattedTotal = compactNumberFormatter ? compactNumberFormatter(totalCount) : totalCount.toLocaleString();
    console.log('Formatted total:', formattedTotal);
  } catch (error) {
    console.error('compactNumberFormatter error:', error);
    formattedTotal = totalCount.toLocaleString();
  }

  return (
    <>
      <TotalMetric
        metric={formattedTotal}
        description="Total traces tracked"
      />
      {adjustedData.length > 0 ? (
        <BarList
          data={adjustedData}
          valueFormatter={(number) =>
            Intl.NumberFormat("en-US").format(number).toString()
          }
          showAnimation={true}
          color="indigo"
        />
      ) : (
        <NoDataOrLoading
          isLoading={false}
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
    </>
  );
};

export default TracesBarListChart;
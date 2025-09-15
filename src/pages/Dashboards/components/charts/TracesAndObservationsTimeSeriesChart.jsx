import React from 'react';
import WidgetCard from '../WidgetCard';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import TotalMetric from './TotalMetric';
import { compactNumberFormatter } from '../../utils/numbers';
import { isEmptyTimeSeries } from '../../utils/hooks';
import NoDataOrLoading from './NoDataOrLoading';
import TabComponent from './TabsComponent';

/**
 * 트레이스와 관찰 시계열 차트 컴포넌트
 * 트레이스 개수와 관찰(level별) 개수를 시간별로 보여주는 차트
 * @param {Object} props
 * @param {string} props.className - CSS 클래스
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Object} props.globalFilterState - 글로벌 필터 상태
 * @param {Date} props.fromTimestamp - 시작 시간
 * @param {Date} props.toTimestamp - 종료 시간
 * @param {string} props.agg - 집계 옵션
 * @param {boolean} props.isLoading - 로딩 상태
 */
const TracesAndObservationsTimeSeriesChart = ({
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  agg,
  isLoading = false,
}) => {
  // TODO: 실제 API 연동 필요
  console.log('TracesAndObservationsTimeSeriesChart props:', {
    projectId,
    globalFilterState,
    fromTimestamp: fromTimestamp?.toISOString(),
    toTimestamp: toTimestamp?.toISOString(),
    agg,
    isLoading
  });

  // Mock 트레이스 시계열 데이터 생성
  const generateMockTimeSeriesData = (fromDate, toDate, baseValue, label) => {
    const data = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);
    
    while (current <= end) {
      const variance = 0.7 + Math.random() * 0.6; // 70-130% 변동
      data.push({
        ts: current.getTime(),
        values: [{
          label: label,
          value: Math.round(baseValue * variance)
        }]
      });
      
      // 집계 옵션에 따라 시간 증가
      if (agg === '1 hour' || agg === '3 hours') {
        current.setHours(current.getHours() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }
    
    return data;
  };

  // Mock 관찰 데이터 생성 (level별)
  const generateMockObservationsData = (fromDate, toDate) => {
    const data = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);
    const levels = ['DEFAULT', 'DEBUG', 'WARNING', 'ERROR'];
    
    while (current <= end) {
      const ts = current.getTime();
      const values = levels.map(level => {
        const baseValue = level === 'DEFAULT' ? 120 : 
                         level === 'DEBUG' ? 80 : 
                         level === 'WARNING' ? 25 : 10;
        const variance = 0.6 + Math.random() * 0.8;
        return {
          label: level,
          value: Math.round(baseValue * variance)
        };
      });
      
      data.push({ ts, values });
      
      // 시간 증가
      if (agg === '1 hour' || agg === '3 hours') {
        current.setHours(current.getHours() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }
    
    return data;
  };

  // Mock 데이터 생성
  const mockTracesData = generateMockTimeSeriesData(fromTimestamp, toTimestamp, 150, 'Traces');
  const mockObservationsData = generateMockObservationsData(fromTimestamp, toTimestamp);

  // 총합 계산
  const totalTraces = mockTracesData.reduce((acc, item) => {
    return acc + (item.values[0]?.value || 0);
  }, 0);

  const totalObservations = mockObservationsData.reduce((acc, item) => {
    return acc + item.values.reduce((sum, val) => sum + (val.value || 0), 0);
  }, 0);

  // 탭 데이터 구성
  const data = [
    {
      tabTitle: "Traces",
      data: mockTracesData,
      totalMetric: totalTraces,
      metricDescription: `Traces tracked`,
    },
    {
      tabTitle: "Observations by Level",
      data: mockObservationsData,
      totalMetric: totalObservations,
      metricDescription: `Observations tracked`,
    },
  ];

  return (
    <WidgetCard
      className={className}
      title="Traces by time"
      isLoading={isLoading}
      cardContentClassName="flex flex-col content-end"
    >
      <TabComponent
        tabs={data.map((item) => {
          return {
            tabTitle: item.tabTitle,
            content: (
              <>
                <TotalMetric
                  description={item.metricDescription}
                  metric={
                    item.totalMetric
                      ? compactNumberFormatter(item.totalMetric)
                      : compactNumberFormatter(0)
                  }
                />
                {!isEmptyTimeSeries({ data: item.data }) ? (
                  <BaseTimeSeriesChart
                    className="h-full min-h-80 self-stretch"
                    agg={agg}
                    data={item.data}
                    connectNulls={true}
                    chartType="area"
                  />
                ) : (
                  <NoDataOrLoading
                    isLoading={isLoading}
                    description="Traces contain details about LLM applications and can be created using the SDK."
                    href="https://langfuse.com/docs/observability/overview"
                  />
                )}
              </>
            ),
          };
        })}
      />
    </WidgetCard>
  );
};

export default TracesAndObservationsTimeSeriesChart;
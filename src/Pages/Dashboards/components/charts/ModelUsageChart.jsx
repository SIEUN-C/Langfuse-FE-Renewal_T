import React from 'react';
import NoDataOrLoading from './NoDataOrLoading';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import WidgetCard from '../WidgetCard';
import {
 // extractTimeSeriesData, - API 연동 시 사용 예정
 // fillMissingValuesAndTransform - API 연동 시 사용 예정
 isEmptyTimeSeries,
} from '../../utils/hooks';
import TabComponent from './TabsComponent';
import TotalMetric from './TotalMetric';
import { totalCostDashboardFormatted } from '../../utils/dashboard-utils';
import { compactNumberFormatter } from '../../utils/numbers';
import {
 ModelSelectorPopover,
 useModelSelection,
} from './ModelSelector';

/**
 * 모델 사용량 차트 컴포넌트 - 4개 탭으로 구성
 * @param {Object} props
 * @param {string} props.className - CSS 클래스
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Object} props.globalFilterState - 글로벌 필터 상태
 * @param {string} props.agg - 날짜 집계 옵션
 * @param {Date} props.fromTimestamp - 시작 시간
 * @param {Date} props.toTimestamp - 종료 시간
 * @param {Object} props.userAndEnvFilterState - 사용자/환경 필터 상태
 * @param {boolean} props.isLoading - 로딩 상태
 */
const ModelUsageChart = ({
  className,
  projectId,
  globalFilterState,
  agg,
  fromTimestamp,
  toTimestamp,
  userAndEnvFilterState,
  isLoading = false,
}) => {
  // 모델 선택 로직
  const {
    allModels,
    selectedModels,
    setSelectedModels,
    isAllSelected,
    buttonText,
    handleSelectAll,
  } = useModelSelection(
    projectId,
    userAndEnvFilterState,
    fromTimestamp,
    toTimestamp,
  );

  // TODO: 실제 API 연동 필요
  console.log('ModelUsageChart props:', {
    projectId,
    globalFilterState,
    agg,
    fromTimestamp: fromTimestamp?.toISOString(),
    toTimestamp: toTimestamp?.toISOString(),
    userAndEnvFilterState,
    isLoading,
    selectedModels
  });

  // Mock 데이터 생성 (4개 탭용)
  const generateMockTimeSeriesData = (baseValue, models, isTokens = false) => {
    const dates = [];
    const current = new Date(fromTimestamp);
    while (current <= toTimestamp) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates.map(date => {
      const dataPoint = { date: date.toISOString() };
      models.forEach((model, index) => {
        const multiplier = isTokens ? 1000 : 1;
        const variance = 0.8 + Math.random() * 0.4; // 80-120% 변동
        dataPoint[model] = Math.round(baseValue * (index + 1) * variance * multiplier);
      });
      return dataPoint;
    });
  };

  // Mock 모델별 비용 데이터
  const costByModel = selectedModels.length > 0 
    ? generateMockTimeSeriesData(0.05, selectedModels, false)
    : [];

  // Mock 타입별 비용 데이터 (Generation, Chat 등)
  const mockTypes = ['generation', 'chat', 'completion'];
  const costByType = generateMockTimeSeriesData(0.08, mockTypes, false);

  // Mock 모델별 토큰 데이터
  const unitsByModel = selectedModels.length > 0
    ? generateMockTimeSeriesData(50, selectedModels, true)
    : [];

  // Mock 타입별 토큰 데이터
  const unitsByType = generateMockTimeSeriesData(80, mockTypes, true);

  // 총 비용 계산 (Mock)
  const totalCost = selectedModels.reduce((acc, model, index) => {
    return acc + (0.5 + index * 0.3) * Math.random() * 10;
  }, 0);

  // 총 토큰 계산 (Mock)
  const totalTokens = selectedModels.reduce((acc, model, index) => {
    return acc + (50000 + index * 20000) * Math.random();
  }, 0);

  // USD 포맷터 (Tremor 호환성을 위한 단일 값 포맷터)
  const oneValueUsdFormatter = (value) => {
    return totalCostDashboardFormatted(value);
  };

  // 탭 데이터 구성
  const data = [
    {
      tabTitle: "Cost by model",
      data: costByModel,
      totalMetric: totalCostDashboardFormatted(totalCost),
      metricDescription: `Cost`,
      formatter: oneValueUsdFormatter,
    },
    {
      tabTitle: "Cost by type", 
      data: costByType,
      totalMetric: totalCostDashboardFormatted(totalCost),
      metricDescription: `Cost`,
      formatter: oneValueUsdFormatter,
    },
    {
      tabTitle: "Units by model",
      data: unitsByModel,
      totalMetric: totalTokens
        ? compactNumberFormatter(totalTokens)
        : compactNumberFormatter(0),
      metricDescription: `Units`,
    },
    {
      tabTitle: "Units by type",
      data: unitsByType,
      totalMetric: totalTokens
        ? compactNumberFormatter(totalTokens)
        : compactNumberFormatter(0),
      metricDescription: `Units`,
    },
  ];

  return (
    <WidgetCard
      className={className}
      title="Model Usage"
      isLoading={isLoading || (selectedModels.length === 0 && allModels.length === 0)}
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <ModelSelectorPopover
            allModels={allModels}
            selectedModels={selectedModels}
            setSelectedModels={setSelectedModels}
            buttonText={buttonText}
            isAllSelected={isAllSelected}
            handleSelectAll={handleSelectAll}
          />
        </div>
      }
    >
      <TabComponent
        tabs={data.map((item) => {
          return {
            tabTitle: item.tabTitle,
            content: (
              <>
                <TotalMetric
                  metric={item.totalMetric}
                  description={item.metricDescription}
                  className="mb-4"
                />
                {isEmptyTimeSeries({ data: item.data }) ||
                isLoading ||
                selectedModels.length === 0 ? (
                  <NoDataOrLoading
                    isLoading={isLoading || selectedModels.length === 0}
                  />
                ) : (
                  <BaseTimeSeriesChart
                    agg={agg}
                    data={item.data}
                    showLegend={true}
                    connectNulls={true}
                    valueFormatter={item.formatter}
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

export default ModelUsageChart;
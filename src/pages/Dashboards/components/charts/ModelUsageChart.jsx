// src/pages/Dashboards/components/charts/ModelUsageChart.jsx

import React from 'react';
import NoDataOrLoading from './NoDataOrLoading';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import { isEmptyTimeSeries } from '../../utils/hooks';
import TabComponent from './TabsComponent';
import TotalMetric from './TotalMetric';
import { totalCostDashboardFormatted } from '../../utils/dashboard-utils';
import { compactNumberFormatter } from '../../utils/numbers';
import {
  ModelSelectorPopover,
} from './ModelSelector';

/**
 * 모델 사용량 차트 (Dumb Component)
 */
const ModelUsageChart = ({
  className,
  data,
  isLoading,
  agg,
  allModels,
  selectedModels,
  setSelectedModels,
  isAllSelected,
  buttonText,
  handleSelectAll,
}) => {
  if (!data) {
    return (
      <div className="flex flex-col h-full">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <ModelSelectorPopover
            allModels={allModels}
            selectedModels={selectedModels}
            setSelectedModels={setSelectedModels}
            buttonText={buttonText}
            isAllSelected={isAllSelected}
            handleSelectAll={handleSelectAll}
          />
        </div>
        <NoDataOrLoading isLoading={isLoading} />
      </div>
    );
  }

  const { costByModel, costByType, unitsByModel, unitsByType } = data;

  const totalCost = (costByModel || []).reduce((acc, curr) => acc + curr.values.reduce((s, v) => s + v.value, 0), 0);
  const totalTokens = (unitsByModel || []).reduce((acc, curr) => acc + curr.values.reduce((s, v) => s + v.value, 0), 0);

// 🎯 [수정] 타입별 데이터에서 모든 유니크한 라벨(타입)을 추출하는 로직 추가
  const costTypeLabels = Array.from(new Set((costByType || []).flatMap(d => d.values.map(v => v.label))));
  const unitTypeLabels = Array.from(new Set((unitsByType || []).flatMap(d => d.values.map(v => v.label))));


  const tabsData = [
    {
      tabTitle: "Cost by model",
      data: costByModel,
      totalMetric: totalCostDashboardFormatted(totalCost),
      metricDescription: `Cost`,
      formatter: totalCostDashboardFormatted,
      yAxisDomain: [0, 1],
      legendLabels: selectedModels, // 🎯 [수정] 모델 목록을 범례로 전달
    },
    {
      tabTitle: "Cost by type",
      data: costByType,
      totalMetric: totalCostDashboardFormatted(totalCost),
      metricDescription: `Cost`,
      formatter: totalCostDashboardFormatted,
      legendLabels: costTypeLabels, // 🎯 [수정] 타입 목록을 범례로 전달
    },
    {
      tabTitle: "Units by model",
      data: unitsByModel,
      totalMetric: compactNumberFormatter(totalTokens),
      metricDescription: `Units`,
      formatter: compactNumberFormatter,
      legendLabels: selectedModels, // 🎯 [수정] 모델 목록을 범례로 전달
      yAxisDomain: [0, 60], // 🎯 [수정] Y축 범위를 0에서 60으로 고정
    },
    {
      tabTitle: "Units by type",
      data: unitsByType,
      totalMetric: compactNumberFormatter(totalTokens),
      metricDescription: `Units`,
      formatter: compactNumberFormatter,
      legendLabels: unitTypeLabels, // 🎯 [수정] 타입 목록을 범례로 전달
    },
  ];

  return (
    <div className={className}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <ModelSelectorPopover
          allModels={allModels}
          selectedModels={selectedModels}
          setSelectedModels={setSelectedModels}
          buttonText={buttonText}
          isAllSelected={isAllSelected}
          handleSelectAll={handleSelectAll}
        />
      </div>
      <TabComponent
        tabs={tabsData.map((item) => ({
          tabTitle: item.tabTitle,
          content: (
            <>
              <TotalMetric
                totalCount={item.totalMetric}
                description={item.metricDescription}
              />
              {isLoading || !item.data || isEmptyTimeSeries({ data: item.data }) ? (
                <NoDataOrLoading isLoading={isLoading} />
              ) : (
                <BaseTimeSeriesChart
                  agg={agg}
                  data={item.data}
                  showLegend={true}
                  connectNulls={true}
                  valueFormatter={item.formatter}
                  chartType="line"
                  interactiveLegend={true}
                  yAxisDomain={item.yAxisDomain}
                  legendLabels={item.legendLabels} // 🎯 [수정] 범례 목록 prop 전달
                />
              )}
            </>
          ),
        }))}
      />
    </div>
  );
};

export default ModelUsageChart;
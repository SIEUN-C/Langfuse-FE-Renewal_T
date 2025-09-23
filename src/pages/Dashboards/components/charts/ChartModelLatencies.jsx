// src/pages/Dashboards/components/charts/ChartModelLatencies.jsx

import React from 'react';
import {
  extractTimeSeriesData,
  fillMissingValuesAndTransform,
  isEmptyTimeSeries,
} from '../../utils/hooks';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import TabComponent from './TabsComponent';
import { latencyFormatter } from '../../utils/numbers';
import NoDataOrLoading from './NoDataOrLoading';
// ▼▼▼ ModelSelectorPopover를 여기서 직접 import 함 ▼▼▼
import { ModelSelectorPopover } from './ModelSelector';

const ChartModelLatencies = ({
  // 데이터 관련 Props
  rawData,
  isLoading,
  agg = "1 day",

  // 모델 선택 관련 Props (Home.jsx에서 모두 내려받음)
  allModels,
  selectedModels,
  setSelectedModels,
  isAllSelected,
  buttonText,
  handleSelectAll,
}) => {

  const getData = (valueColumn) => {
    if (!rawData || rawData.length === 0 || selectedModels.length === 0) {
      return [];
    }
    
    const extracted = extractTimeSeriesData(
      rawData,
      "time_dimension",
      [{
        uniqueIdentifierColumns: [{ accessor: "providedModelName" }],
        valueColumn: valueColumn,
      }]
    );

    return fillMissingValuesAndTransform(extracted, selectedModels);
  };

  const tabsData = [
    { tabTitle: "50th Percentile", data: getData("p50_latency") },
    { tabTitle: "75th Percentile", data: getData("p75_latency") },
    { tabTitle: "90th Percentile", data: getData("p90_latency") },
    { tabTitle: "95th Percentile", data: getData("p95_latency") },
    { tabTitle: "99th Percentile", data: getData("p99_latency") },
  ];

  return (
    // ▼▼▼ ModelUsageChart와 동일한 구조로 변경 ▼▼▼
    <div>
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
              {!isEmptyTimeSeries({ data: item.data }) ? (
                <BaseTimeSeriesChart
                  agg={agg}
                  data={item.data}
                  connectNulls={true}
                  valueFormatter={latencyFormatter}
                  showLegend={true}
                  interactiveLegend={true}
                />
              ) : (
                <NoDataOrLoading
                  isLoading={isLoading}
                  description="Model latencies are tracked automatically when using the Langfuse SDK or API."
                  href="https://langfuse.com/docs/model-usage-and-cost"
                />
              )}
            </>
          ),
        }))}
      />
    </div>
  );
};

export default ChartModelLatencies;
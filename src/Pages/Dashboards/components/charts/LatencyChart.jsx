import React from 'react';
import {
 extractTimeSeriesData,
 fillMissingValuesAndTransform,
 isEmptyTimeSeries,
} from '../../utils/hooks';
import WidgetCard from '../WidgetCard';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import TabComponent from './TabsComponent';
import { latencyFormatter } from '../../utils/numbers';
import { dashboardDateRangeAggregationSettings } from '../../utils/date-range-utils';
//import NoDataOrLoading from './NoDataOrLoading';
import {
 ModelSelectorPopover,
 useModelSelection,
} from './ModelSelector';

/* eslint-disable react-refresh/only-export-components */

/**
 * 레거시 UI 테이블 필터를 뷰로 매핑하는 함수 (Mock 구현)
 */
function mapLegacyUiTableFilterToView(view, filterState) {
  console.log('mapLegacyUiTableFilterToView:', { view, filterState });
  return []; // Mock 구현
}

/**
 * Generation 유사 타입들을 가져오는 함수 (Mock 구현)
 */
function getGenerationLikeTypes() {
  return ['generation', 'llm', 'completion']; // Mock 타입들
}

/**
 * 지연시간 차트 컴포넌트 (GenerationLatencyChart)
 * @param {Object} props
 * @param {string} props.className - CSS 클래스명
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Array} props.globalFilterState - 글로벌 필터 상태
 * @param {string} props.agg - 집계 옵션
 * @param {Date} props.fromTimestamp - 시작 날짜
 * @param {Date} props.toTimestamp - 종료 날짜
 * @param {boolean} props.isLoading - 로딩 상태
 */
const GenerationLatencyChart = ({
  className,
  projectId,
  globalFilterState,
  agg,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
}) => {
  const {
    allModels,
    selectedModels,
    setSelectedModels,
    isAllSelected,
    buttonText,
    handleSelectAll,
  } = useModelSelection(
    projectId,
    globalFilterState,
    fromTimestamp,
    toTimestamp,
  );

  // 지연시간 쿼리 구성
  const latenciesQuery = {
    view: "observations",
    dimensions: [{ field: "providedModelName" }],
    metrics: [
      { measure: "latency", aggregation: "p50" },
      { measure: "latency", aggregation: "p75" },
      { measure: "latency", aggregation: "p90" },
      { measure: "latency", aggregation: "p95" },
      { measure: "latency", aggregation: "p99" },
    ],
    filters: [
      ...mapLegacyUiTableFilterToView("observations", globalFilterState),
      {
        column: "type",
        operator: "any of",
        value: getGenerationLikeTypes(),
        type: "stringOptions",
      },
      {
        column: "providedModelName",
        operator: "any of",
        value: selectedModels,
        type: "stringOptions",
      },
    ],
    timeDimension: {
      granularity: dashboardDateRangeAggregationSettings[agg]?.date_trunc || 'hour',
    },
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: null,
  };

  // Mock 지연시간 데이터
  const mockLatencyData = [
    {
      time_dimension: fromTimestamp.toISOString(),
      providedModelName: 'gpt-4',
      p50_latency: 1.2,
      p75_latency: 1.8,
      p90_latency: 2.5,
      p95_latency: 3.2,
      p99_latency: 4.8
    },
    {
      time_dimension: new Date(fromTimestamp.getTime() + 3600000).toISOString(), // +1시간
      providedModelName: 'gpt-4',
      p50_latency: 1.1,
      p75_latency: 1.7,
      p90_latency: 2.3,
      p95_latency: 3.0,
      p99_latency: 4.5
    },
    {
      time_dimension: fromTimestamp.toISOString(),
      providedModelName: 'gpt-3.5-turbo',
      p50_latency: 0.8,
      p75_latency: 1.2,
      p90_latency: 1.8,
      p95_latency: 2.2,
      p99_latency: 3.5
    },
    {
      time_dimension: new Date(fromTimestamp.getTime() + 3600000).toISOString(),
      providedModelName: 'gpt-3.5-turbo',
      p50_latency: 0.7,
      p75_latency: 1.1,
      p90_latency: 1.6,
      p95_latency: 2.0,
      p99_latency: 3.2
    },
  ];

  // Mock API 호출 시뮬레이션
  const latencies = {
    data: mockLatencyData,
    isLoading: false,
    error: null
  };

  // TODO: 실제 API 연동 시 구현
  // const latencies = api.dashboard.executeQuery.useQuery({
  //   projectId,
  //   query: latenciesQuery,
  // }, {
  //   enabled: !isLoading && selectedModels.length > 0 && allModels.length > 0,
  // });

  console.log('LatencyChart query:', latenciesQuery);

  /**
   * 특정 퍼센타일 데이터를 추출하는 함수
   * @param {string} valueColumn - 값 컬럼명 (예: "p50_latency")
   */
  const getData = (valueColumn) => {
    return latencies.data && selectedModels.length > 0
      ? fillMissingValuesAndTransform(
          extractTimeSeriesData(
            latencies.data,
            "time_dimension",
            [
              {
                uniqueIdentifierColumns: [{ accessor: "providedModelName" }],
                valueColumn: valueColumn,
              },
            ],
          ),
          selectedModels,
        )
      : [];
  };

  // 퍼센타일별 탭 데이터 구성
  const data = [
    {
      tabTitle: "50th Percentile",
      data: getData("p50_latency"),
    },
    {
      tabTitle: "75th Percentile",
      data: getData("p75_latency"),
    },
    {
      tabTitle: "90th Percentile",
      data: getData("p90_latency"),
    },
    {
      tabTitle: "95th Percentile",
      data: getData("p95_latency"),
    },
    {
      tabTitle: "99th Percentile",
      data: getData("p99_latency"),
    },
  ];

  return (
    <WidgetCard
      className={className}
      title="Model latencies"
      description="Latencies (seconds) per LLM generation"
      isLoading={
        isLoading || (latencies.isLoading && selectedModels.length > 0)
      }
      headerRight={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end' 
        }}>
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
                {!isEmptyTimeSeries({ data: item.data }) ? (
                  <BaseTimeSeriesChart
                    agg={agg}
                    data={item.data}
                    connectNulls={true}
                    valueFormatter={latencyFormatter}
                  />
                ) : (
                  <NoDataOrLoading
                    isLoading={isLoading || latencies.isLoading}
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

export default GenerationLatencyChart;
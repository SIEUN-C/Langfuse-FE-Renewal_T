import React from 'react';
import {
 extractTimeSeriesData,
 fillMissingValuesAndTransform,
 isEmptyTimeSeries,
} from '../../utils/hooks';
import { DashboardCard } from '../cards/DashboardCard';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import TabComponent from './TabsComponent';
import { latencyFormatter } from '../../utils/numbers';
import { dashboardDateRangeAggregationSettings } from '../../utils/date-range-utils';
import NoDataOrLoading from './NoDataOrLoading';
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
 * 지연시간 차트 컴포넌트 (LatencyChart)
 * @param {Object} props
 * @param {string} props.className - CSS 클래스명
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Array} props.globalFilterState - 글로벌 필터 상태
 * @param {string} props.agg - 집계 옵션
 * @param {Date} props.fromTimestamp - 시작 날짜
 * @param {Date} props.toTimestamp - 종료 날짜
 * @param {boolean} props.isLoading - 로딩 상태
 */
const LatencyChart = ({
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

  // Mock 지연시간 데이터 생성 (더 현실적인 데이터)
  const generateMockLatencyData = () => {
    const models = selectedModels.length > 0 ? selectedModels : ['Qwen3-30B-A3B-Instruct-2507-UD-Q5_K_XL.gguf'];
    const timePoints = [];
    
    // 시간 포인트 생성 (현재 시간부터 과거로)
    const now = new Date();
    for (let i = 0; i < 48; i++) { // 48시간
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000)); // 1시간씩 감소
      timePoints.push(time);
    }
    timePoints.reverse(); // 시간순으로 정렬

    const data = [];
    
    timePoints.forEach(time => {
      models.forEach(model => {
        // 모델별 기본 레이턴시 설정
        const baseLatency = model.includes('gpt-4') ? 1.5 : 
                           model.includes('gpt-3.5') ? 0.8 :
                           model.includes('claude') ? 1.2 : 0.15; // Qwen 모델은 매우 빠름
        
        // 각 퍼센타일별 레이턴시 생성
        const variance = 0.8 + Math.random() * 0.4; // 80-120% 변동
        const p50 = baseLatency * variance;
        const p75 = p50 * 1.3;
        const p90 = p50 * 1.8;
        const p95 = p50 * 2.2;
        const p99 = p50 * 3.5;

        data.push({
          time_dimension: time.toISOString(),
          providedModelName: model,
          p50_latency: p50,
          p75_latency: p75,
          p90_latency: p90,
          p95_latency: p95,
          p99_latency: p99
        });
      });
    });

    return data;
  };

  const mockLatencyData = generateMockLatencyData();

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
    <DashboardCard
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
                    showLegend={true}
                  />
                ) : (
                  <NoDataOrLoading
                    isLoading={isLoading || latencies.isLoading}
                    description="Model latencies are tracked automatically when using the Langfuse SDK or API."
                    href="https://langfuse.com/docs/model-usage-and-cost"
                  />
                )}
              </>
            ),
          };
        })}
      />
    </DashboardCard>
  );
};

export default LatencyChart;
import React from 'react';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import WidgetCard from '../WidgetCard';
import { 
 extractTimeSeriesData,
 fillMissingValuesAndTransform,
 isEmptyTimeSeries 
} from '../../utils/hooks';
import { dashboardDateRangeAggregationSettings } from '../../utils/date-range-utils';
import NoDataOrLoading from './NoDataOrLoading';

/**
 * 스코어 데이터 타입에 따른 아이콘 반환 (간단 구현)
 * @param {string} dataType - 데이터 타입
 * @returns {string} 아이콘 문자열
 */
const getScoreDataTypeIcon = (dataType) => {
  const iconMap = {
    'NUMERIC': '📊',
    'CATEGORICAL': '📋', 
    'BOOLEAN': '✅',
    'STRING': '📝'
  };
  return iconMap[dataType] || '📈';
}

/**
 * 레거시 UI 테이블 필터를 뷰로 매핑하는 함수 (Mock 구현)
 * TODO: 실제 API 연동 시 구현 필요
 */
function mapLegacyUiTableFilterToView(view, filterState) {
  // Mock 구현 - 실제로는 복잡한 필터 변환 로직
  console.log('mapLegacyUiTableFilterToView:', { view, filterState });
  return []; // 빈 필터 배열 반환
}

/**
 * 스코어 차트 컴포넌트
 * @param {Object} props
 * @param {string} props.className - CSS 클래스명
 * @param {string} props.agg - 집계 옵션
 * @param {Array} props.globalFilterState - 글로벌 필터 상태
 * @param {Date} props.fromTimestamp - 시작 날짜
 * @param {Date} props.toTimestamp - 종료 날짜
 * @param {string} props.projectId - 프로젝트 ID
 * @param {boolean} props.isLoading - 로딩 상태
 */
const ChartScores = (props) => {
  const {
    className,
    agg,
    globalFilterState,
    fromTimestamp,
    toTimestamp,
    projectId,
    isLoading = false
  } = props;

  // 스코어 쿼리 구성
  const scoresQuery = {
    view: "scores-numeric",
    dimensions: [
      { field: "name" }, 
      { field: "dataType" }, 
      { field: "source" }
    ],
    metrics: [{ measure: "value", aggregation: "avg" }],
    filters: mapLegacyUiTableFilterToView("scores-numeric", globalFilterState),
    timeDimension: {
      granularity: dashboardDateRangeAggregationSettings[agg]?.date_trunc || 'hour',
    },
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: null,
  };

  // TODO: 실제 API 연동 시 사용
  // const scores = api.dashboard.executeQuery.useQuery({
  //   projectId,
  //   query: scoresQuery,
  // });
  
  // 임시로 매개변수 사용 (ESLint 경고 방지)
  console.log('ChartScores called with projectId:', projectId, 'query:', scoresQuery);

  // Mock 스코어 데이터 (실제 API 연동 시 교체)
  const mockScoresData = [
    {
      time_dimension: fromTimestamp.toISOString(),
      name: 'Quality Score',
      data_type: 'NUMERIC',
      source: 'AUTO',
      avg_value: 8.5
    },
    {
      time_dimension: new Date(fromTimestamp.getTime() + 3600000).toISOString(), // +1시간
      name: 'Quality Score', 
      data_type: 'NUMERIC',
      source: 'AUTO',
      avg_value: 8.7
    },
    {
      time_dimension: fromTimestamp.toISOString(),
      name: 'Relevance Score',
      data_type: 'NUMERIC', 
      source: 'MANUAL',
      avg_value: 7.2
    },
    {
      time_dimension: new Date(fromTimestamp.getTime() + 3600000).toISOString(),
      name: 'Relevance Score',
      data_type: 'NUMERIC',
      source: 'MANUAL', 
      avg_value: 7.8
    }
  ];

  // 실제 API 호출 시뮬레이션
  const scores = {
    data: mockScoresData,
    isLoading: false,
    error: null
  };

  // 스코어 데이터 추출 및 변환
  const extractedScores = scores.data
    ? fillMissingValuesAndTransform(
        extractTimeSeriesData(scores.data, "time_dimension", [
          {
            uniqueIdentifierColumns: [
              {
                accessor: "data_type",
                formatFct: (value) => getScoreDataTypeIcon(value),
              },
              { accessor: "name" },
              {
                accessor: "source", 
                formatFct: (value) => `(${value.toLowerCase()})`,
              },
            ],
            valueColumn: "avg_value",
          },
        ]),
      )
    : [];

  return (
    <WidgetCard
      className={className}
      title="Scores"
      description="Moving average per score"
      isLoading={isLoading || scores.isLoading}
    >
      {!isEmptyTimeSeries({ data: extractedScores }) ? (
        <BaseTimeSeriesChart
          agg={agg}
          data={extractedScores}
          connectNulls={true}
        />
      ) : (
        <NoDataOrLoading
          isLoading={isLoading || scores.isLoading}
          description="Scores evaluate LLM quality and can be created manually or using the SDK."
          href="https://langfuse.com/docs/evaluation/overview"
          className="h-full"
        />
      )}
    </WidgetCard>
  );
}

export default ChartScores;
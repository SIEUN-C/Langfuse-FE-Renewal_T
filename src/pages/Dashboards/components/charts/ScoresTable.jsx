import React from 'react';
import WidgetCard from '../WidgetCard';
import DashboardTable from '../cards/DashboardTable';
import { compactNumberFormatter } from '../../utils/numbers';
import RightAlignedCell from './RightAlignedCell';
import LeftAlignedCell from './LeftAlignedCell';
import TotalMetric from './TotalMetric';
import { createTracesTimeFilter } from '../../utils/dashboard-utils';
import NoDataOrLoading from './NoDataOrLoading';

// Mock 스코어 관련 함수들 (간단 구현)
/**
 * 스코어 데이터 타입에 따른 아이콘 반환
 * @param {string} scoreDataType - 스코어 데이터 타입
 * @returns {string} 아이콘 문자열
 */
const getScoreDataTypeIcon = (scoreDataType) => {
  switch (scoreDataType) {
    case 'NUMERIC':
      return '📊';
    case 'CATEGORICAL':
      return '📋';
    case 'BOOLEAN':
      return '✅';
    default:
      return '📈';
  }
};

/**
 * 카테고리형 데이터 타입인지 확인
 * @param {string} scoreDataType - 스코어 데이터 타입
 * @returns {boolean} 카테고리형 여부
 */
const isCategoricalDataType = (scoreDataType) => {
  return scoreDataType === 'CATEGORICAL' || scoreDataType === 'BOOLEAN';
};

/**
 * 카테고리형 스코어의 경우 값을 "-"로 표시
 * @param {number} value - 값
 * @param {string} scoreDataType - 스코어 데이터 타입
 * @returns {string} 포맷된 값
 */
const dropValuesForCategoricalScores = (value, scoreDataType) => {
  return isCategoricalDataType(scoreDataType)
    ? "-"
    : compactNumberFormatter(value);
};

/**
 * 스코어 이름, 소스, 데이터 타입이 일치하는 항목 찾기
 * @param {string} scoreName - 스코어 이름
 * @param {string} scoreSource - 스코어 소스
 * @param {string} scoreDataType - 스코어 데이터 타입
 * @returns {function} 매칭 함수
 */
const scoreNameSourceDataTypeMatch = (scoreName, scoreSource, scoreDataType) => (item) =>
  item.scoreName === scoreName &&
  item.scoreSource === scoreSource &&
  item.scoreDataType === scoreDataType;

/**
 * 스코어 테이블 컴포넌트
 * @param {Object} props
 * @param {string} props.className - CSS 클래스
 * @param {string} props.projectId - 프로젝트 ID
 * @param {Object} props.globalFilterState - 글로벌 필터 상태
 * @param {boolean} props.isLoading - 로딩 상태
 */
const ScoresTable = ({
  className,
  projectId,
  globalFilterState,
  isLoading = false,
}) => {
  // 로컬 필터 생성
  const localFilters = createTracesTimeFilter(
    globalFilterState,
    "scoreTimestamp",
  );

  // TODO: 실제 API 연동 필요
  console.log('ScoresTable props:', {
    projectId,
    globalFilterState,
    localFilters,
    isLoading
  });

  // Mock 데이터 생성
  const mockMetricsData = [
    {
      scoreName: 'helpfulness',
      scoreSource: 'ANNOTATION',
      scoreDataType: 'NUMERIC',
      countScoreId: 245,
      avgValue: 4.2
    },
    {
      scoreName: 'accuracy',
      scoreSource: 'API',
      scoreDataType: 'NUMERIC', 
      countScoreId: 198,
      avgValue: 3.8
    },
    {
      scoreName: 'sentiment',
      scoreSource: 'EVAL',
      scoreDataType: 'CATEGORICAL',
      countScoreId: 156,
      avgValue: 0 // 카테고리형은 평균값 무의미
    },
    {
      scoreName: 'toxicity',
      scoreSource: 'API',
      scoreDataType: 'BOOLEAN',
      countScoreId: 89,
      avgValue: 0.15
    }
  ];

  const mockZeroValueScores = [
    {
      scoreName: 'helpfulness',
      scoreSource: 'ANNOTATION', 
      scoreDataType: 'NUMERIC',
      countScoreId: 12
    },
    {
      scoreName: 'accuracy',
      scoreSource: 'API',
      scoreDataType: 'NUMERIC',
      countScoreId: 8
    },
    {
      scoreName: 'toxicity',
      scoreSource: 'API',
      scoreDataType: 'BOOLEAN',
      countScoreId: 76
    }
  ];

  const mockOneValueScores = [
    {
      scoreName: 'helpfulness',
      scoreSource: 'ANNOTATION',
      scoreDataType: 'NUMERIC', 
      countScoreId: 58
    },
    {
      scoreName: 'accuracy',
      scoreSource: 'API',
      scoreDataType: 'NUMERIC',
      countScoreId: 42
    },
    {
      scoreName: 'toxicity',
      scoreSource: 'API',
      scoreDataType: 'BOOLEAN',
      countScoreId: 13
    }
  ];

  // 데이터 조인 로직
  const joinRequestData = () => {
    return mockMetricsData.map((metric) => {
      const { scoreName, scoreSource, scoreDataType } = metric;

      const zeroValueScore = mockZeroValueScores.find(
        scoreNameSourceDataTypeMatch(scoreName, scoreSource, scoreDataType),
      );
      const oneValueScore = mockOneValueScores.find(
        scoreNameSourceDataTypeMatch(scoreName, scoreSource, scoreDataType),
      );

      return {
        scoreName,
        scoreSource,
        scoreDataType,
        countScoreId: metric.countScoreId || 0,
        avgValue: metric.avgValue || 0,
        zeroValueScore: zeroValueScore?.countScoreId || 0,
        oneValueScore: oneValueScore?.countScoreId || 0,
      };
    });
  };

  const data = joinRequestData();

  // 총 스코어 계산
  const totalScores = data.reduce(
    (acc, curr) => acc + curr.countScoreId,
    0,
  );

  // 로딩 상태 확인
  if (isLoading) {
    return (
      <WidgetCard title="Scores" isLoading={true}>
        <NoDataOrLoading isLoading={true} />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      className={className}
      title="Scores"
      isLoading={isLoading}
    >
      <DashboardTable
        headers={[
          "Name",
          <RightAlignedCell key="count">#</RightAlignedCell>,
          <RightAlignedCell key="average">Avg</RightAlignedCell>,
          <RightAlignedCell key="zero">0</RightAlignedCell>,
          <RightAlignedCell key="one">1</RightAlignedCell>,
        ]}
        rows={data.map((item, i) => [
          <LeftAlignedCell
            key={`${i}-name`}
          >
            {`${getScoreDataTypeIcon(item.scoreDataType)} ${item.scoreName} (${item.scoreSource.toLowerCase()})`}
          </LeftAlignedCell>,
          <RightAlignedCell key={`${i}-count`}>
            {compactNumberFormatter(item.countScoreId)}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-average`}>
            {dropValuesForCategoricalScores(item.avgValue, item.scoreDataType)}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-zero`}>
            {dropValuesForCategoricalScores(item.zeroValueScore, item.scoreDataType)}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-one`}>
            {dropValuesForCategoricalScores(item.oneValueScore, item.scoreDataType)}
          </RightAlignedCell>,
        ])}
        collapse={{ collapsed: 5, expanded: 20 }}
        isLoading={isLoading}
        noDataProps={{
          description:
            "Scores evaluate LLM quality and can be created manually or using the SDK.",
          href: "https://langfuse.com/docs/evaluation/overview",
        }}
      >
        <TotalMetric
          metric={totalScores ? compactNumberFormatter(totalScores) : "0"}
          description="Total scores tracked"
        />
      </DashboardTable>
    </WidgetCard>
  );
};

export default ScoresTable; 
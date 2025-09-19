import React from 'react';
import { DashboardCard } from '../cards/DashboardCard';
import { DashboardTable } from '../cards/DashboardTable';
import { compactNumberFormatter } from '../../utils/numbers';
import RightAlignedCell from './RightAlignedCell';
import LeftAlignedCell from './LeftAlignedCell';
import TotalMetric from './TotalMetric';
import NoDataOrLoading from './NoDataOrLoading';

// 스코어 데이터 타입에 따른 아이콘 반환 함수
const getScoreDataTypeIcon = (scoreDataType) => {
  switch (scoreDataType) {
    case 'NUMERIC': return '📊';
    case 'CATEGORICAL': return '📋';
    case 'BOOLEAN': return '✅';
    default: return '📈';
  }
};

// 카테고리형/불리언 타입인지 확인하는 함수
const isCategoricalOrBoolean = (scoreDataType) => {
  return scoreDataType === 'CATEGORICAL' || scoreDataType === 'BOOLEAN';
};

// 카테고리형/불리언 스코어의 특정 숫자 필드를 "-"로 표시하는 함수
const formatValue = (value, scoreDataType) => {
  return isCategoricalOrBoolean(scoreDataType) ? "-" : compactNumberFormatter(value);
};

/**
 * ScoresTable 컴포넌트 (Dumb Component)
 * @param {Object} props
 * @param {Array} props.data - Home.jsx에서 가공된 스코어 데이터
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {string} [props.className] - 추가적인 CSS 클래스
 */
const ScoresTable = ({ data, isLoading, className }) => {
  // 로딩 중이거나 데이터가 없을 경우 처리
  if (isLoading || !data) {
    return <NoDataOrLoading isLoading={isLoading} />;
  }

  // 총 스코어 계산
  const totalScores = data.reduce((acc, curr) => acc + (curr.countScoreId || 0), 0);

  return (
    <DashboardTable
      headers={[
        "Name",
        <RightAlignedCell key="count">#</RightAlignedCell>,
        <RightAlignedCell key="average">Avg</RightAlignedCell>,
        <RightAlignedCell key="zero">0</RightAlignedCell>,
        <RightAlignedCell key="one">1</RightAlignedCell>,
      ]}
      rows={data.map((item, i) => [
        <LeftAlignedCell key={`${i}-name`}>
          {`${getScoreDataTypeIcon(item.scoreDataType)} ${item.scoreName} (${item.scoreSource.toLowerCase()})`}
        </LeftAlignedCell>,
        <RightAlignedCell key={`${i}-count`}>
          {compactNumberFormatter(item.countScoreId)}
        </RightAlignedCell>,
        <RightAlignedCell key={`${i}-average`}>
          {formatValue(item.avgValue, item.scoreDataType)}
        </RightAlignedCell>,
        <RightAlignedCell key={`${i}-zero`}>
          {/* 0과 1은 숫자형(NUMERIC) 스코어에만 의미가 있을 수 있으나,
              BOOLEAN 타입도 0/1로 표현되므로 함께 표시. 카테고리는 제외. */}
          {item.scoreDataType === 'CATEGORICAL' ? "-" : compactNumberFormatter(item.zeroValueScore)}
        </RightAlignedCell>,
        <RightAlignedCell key={`${i}-one`}>
          {item.scoreDataType === 'CATEGORICAL' ? "-" : compactNumberFormatter(item.oneValueScore)}
        </RightAlignedCell>,
      ])}
      collapse={{ collapsed: 5, expanded: 20 }}
      isLoading={isLoading}
      noDataProps={{
        description: "Scores evaluate LLM quality and can be created manually or using the SDK.",
        href: "https://langfuse.com/docs/evaluation/overview",
      }}
    >
      <TotalMetric
        metric={totalScores ? compactNumberFormatter(totalScores) : "0"}
        description="Total scores tracked"
      />
    </DashboardTable>
  );
};

export default ScoresTable;
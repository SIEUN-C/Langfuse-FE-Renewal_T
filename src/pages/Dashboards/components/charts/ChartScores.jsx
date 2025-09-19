// src/pages/Dashboards/components/charts/ChartScores.jsx

import React from 'react';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import { isEmptyTimeSeries } from '../../utils/hooks';
import NoDataOrLoading from './NoDataOrLoading';

/**
 * 스코어 차트 컴포넌트 (UI 전용)
 * Home.jsx로부터 데이터와 로딩 상태를 props로 받아 차트를 렌더링하는 역할만 수행
 * @param {Object} props
 * @param {string} props.className - CSS 클래스명
 * @param {string} props.agg - 집계 옵션
 * @param {Array} props.data - Home.jsx에서 가공이 완료된 차트 데이터
 * @param {boolean} props.isLoading - 로딩 상태
 */
const ChartScores = ({ data, isLoading, agg, className }) => {
  // 로딩 중인 경우 로딩 인디케이터 표시
  if (isLoading) {
    return <NoDataOrLoading isLoading={true} className="h-full" />;
  }

  // ▼▼▼ [수정] data가 null일 경우를 대비해 기본값으로 빈 배열을 전달 ▼▼▼
  return !isEmptyTimeSeries({ data: data || [] }) ? (
    <BaseTimeSeriesChart
      className={className}
      agg={agg}
      data={data}
      connectNulls={true}
       // 🎯 [수정] 아래 세 가지 스위치가 모두 올바르게 전달되는지 확인
       conditionalDots={true}     // 점 조건부 표시 (값 > 0)
       interactiveLegend={true} // 범례 클릭 기능 켜기
       showLine={false}           // 데이터 연결선 숨기기
       yAxisDomain={[0, 2]} // Y축 범위 0~2로 고정
       // 🎯 [수정] 특별 처리할 시리즈의 전체 이름을 정확하게 전달
      specialSeries={['📈 ()', '📊 ttt (eval)']} 
    />
  ) : (
    <NoDataOrLoading
      isLoading={false}
      description="Scores evaluate LLM quality and can be created manually or using the SDK."
      href="https://langfuse.com/docs/evaluation/overview"
      className="h-full"
    />
  );
};

export default ChartScores;
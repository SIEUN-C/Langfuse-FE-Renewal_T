// import React from 'react';
// import BaseTimeSeriesChart from './BaseTimeSeriesChart';
// import TotalMetric from './TotalMetric';
// import { compactNumberFormatter } from '../../utils/numbers';
// import { isEmptyTimeSeries } from '../../utils/hooks';
// import NoDataOrLoading from './NoDataOrLoading';
// import TabComponent from './TabsComponent';

// /**
//  * 트레이스와 관찰 시계열 차트 컴포넌트 (리팩토링 버전)
//  * props를 통해 실제 API 데이터를 받아 렌더링
//  *
//  * @param {Object} props
//  * @param {string} props.className - CSS 클래스
//  * @param {Object} props.data - API로부터 받은 차트 데이터
//  * @param {boolean} props.isLoading - 로딩 상태
//  * @param {Object} props.error - 에러 객체
//  * @param {string} props.agg - 집계 옵션
//  */
// const TracesAndObservationsTimeSeriesChart = ({
//   className,
//   data, // API 데이터를 직접 받도록 수정
//   isLoading = false,
//   error, // 에러 상태 추가
//   agg,
// }) => {
//   // 에러가 발생한 경우 에러 메시지 표시
//   if (error) {
//     return (
//       <div className="flex h-full items-center justify-center text-red-500">
//         Error loading data: {error.message}
//       </div>
//     );
//   }

//   // API 응답 데이터를 UI에 맞게 가공 (데이터가 없을 경우 빈 배열로 초기화)
//   // [주의] 실제 API 응답 구조에 따라 이 부분은 달라질 수 있음.
//   // 우선 기존 Mock 데이터와 유사한 구조로 가정하고 처리.
//   const traces = data?.traces || [];
//   const observations = data?.observations || [];

//   const totalTraces = traces.reduce((acc, item) => acc + (item.values[0]?.value || 0), 0);
//   const totalObservations = observations.reduce((acc, item) => acc + item.values.reduce((sum, val) => sum + val.value, 0), 0);

//   // 탭 데이터 구성
//   const tabData = [
//     {
//       tabTitle: "Traces",
//       timeSeriesData: traces,
//       totalMetric: totalTraces,
//       metricDescription: `Traces tracked`,
//     },
//     {
//       tabTitle: "Observations by Level",
//       timeSeriesData: observations,
//       totalMetric: totalObservations,
//       metricDescription: `Observations tracked`,
//     },
//   ];

//   return (
//     <div className={`flex flex-col content-end ${className}`}>
//       <TabComponent
//         tabs={tabData.map((item) => {
//           return {
//             tabTitle: item.tabTitle,
//             content: (
//               <>
//                 <TotalMetric
//                   description={item.metricDescription}
//                   metric={
//                     item.totalMetric
//                       ? compactNumberFormatter(item.totalMetric)
//                       : "0"
//                   }
//                 />
//                 {!isEmptyTimeSeries({ data: item.timeSeriesData }) ? (
//                   <BaseTimeSeriesChart
//                     className="h-full min-h-80 self-stretch"
//                     agg={agg}
//                     data={item.timeSeriesData}
//                     connectNulls={true}
//                     chartType="area"
//                   />
//                 ) : (
//                   <NoDataOrLoading
//                     isLoading={isLoading}
//                     description="Traces contain details about LLM applications and can be created using the SDK."
//                     href="https://langfuse.com/docs/observability/overview"
//                   />
//                 )}
//               </>
//             ),
//           };
//         })}
//       />
//     </div>
//   );
// };

// export default TracesAndObservationsTimeSeriesChart;


import React from 'react';
import BaseTimeSeriesChart from './BaseTimeSeriesChart';
import TotalMetric from './TotalMetric';
import { compactNumberFormatter } from '../../utils/numbers';
import { isEmptyTimeSeries } from '../../utils/hooks';
import NoDataOrLoading from './NoDataOrLoading';
import TabComponent from './TabsComponent';

const TracesAndObservationsTimeSeriesChart = ({
  className,
  data,
  isLoading = false,
  error,
  agg,
}) => {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  const tracesData = data?.traces || [];
  const observationsData = data?.observations || [];

  const totalTraces = tracesData.reduce((acc, curr) => acc + (curr.values[0]?.value || 0), 0);
  const totalObservations = observationsData.reduce((acc, curr) => {
    const sumOfValues = curr.values.reduce((sum, v) => sum + (v.value || 0), 0);
    return acc + sumOfValues;
  }, 0);

  const tabData = [
    {
      tabTitle: "Traces",
      timeSeriesData: tracesData,
      totalMetric: totalTraces,
      metricDescription: `Traces tracked`,
      color: "blue",
    },
    {
      tabTitle: "Observations by Level",
      timeSeriesData: observationsData,
      totalMetric: totalObservations,
      metricDescription: `Observations tracked`,
      color: "indigo",
    },
  ];

  return (
    <div className={`flex flex-col content-end ${className}`}>
      <TabComponent
        tabs={tabData.map((item) => ({
          tabTitle: item.tabTitle,
          content: (
            <>
              {/* 🎯 [수정] prop 이름을 'metric'에서 'totalCount'로 변경 */}
              <TotalMetric
                description={item.metricDescription}
                totalCount={compactNumberFormatter(item.totalMetric)}
              />
              {!isEmptyTimeSeries({ data: item.timeSeriesData }) ? (
                <BaseTimeSeriesChart
                  className="h-full min-h-80 self-stretch"
                  agg={agg}
                  data={item.timeSeriesData}
                  connectNulls={true}
                  chartType="area" 
                  colors={[item.color]}
                />
              ) : (
                <NoDataOrLoading
                  isLoading={isLoading}
                  description="No data available for the selected time range."
                />
              )}
            </>
          ),
        }))}
      />
    </div>
  );
};

export default TracesAndObservationsTimeSeriesChart;
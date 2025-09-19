
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
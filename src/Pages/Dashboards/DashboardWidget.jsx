import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PencilIcon,
  TrashIcon,
  CopyIcon,
  GripVerticalIcon,
  Loader2,
} from "lucide-react";

import Chart from "./Widgets/Chart";
import DownloadButton from "./DownloadButton";

// Placeholder functions - 실제 구현 필요
const formatMetricName = (field) => field;
const isTimeSeriesChart = (chartType) => 
  chartType === "LINE_TIME_SERIES" || chartType === "BAR_TIME_SERIES";

const DashboardWidget = ({
  projectId,
  dashboardId,
  placement,
  dateRange,
  filterState = [],
  onDeleteWidget,
  dashboardOwner = "PROJECT",
}) => {
  const navigate = useNavigate();
  
  // Mock data - 실제로는 API에서 가져와야 함
  const [widgetData, setWidgetData] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [queryData, setQueryData] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  
  // 권한 체크 - 실제로는 RBAC 훅을 사용해야 함
  const hasCUDAccess = dashboardOwner !== "LANGFUSE";

  // 날짜 범위 처리
  const fromTimestamp = dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toTimestamp = dateRange?.to || new Date();

  // 정렬 상태 관리 (피벗 테이블용)
  const [sortState, setSortState] = useState(null);

  const updateSort = useCallback((newSort) => {
    setSortState(newSort);
  }, []);

  // Mock widget data loading
  useEffect(() => {
    const loadWidget = async () => {
      setWidgetLoading(true);
      
      // 임시 목업 데이터
      const mockWidget = {
        id: placement.widgetId,
        name: `Widget ${placement.widgetId}`,
        description: "Sample widget description",
        owner: "PROJECT",
        chartType: "LINE_TIME_SERIES",
        view: "traces",
        dimensions: [{ field: "name" }],
        metrics: [{ measure: "count", agg: "count" }],
        filters: [],
        chartConfig: {
          type: "LINE_TIME_SERIES",
          row_limit: 100,
        },
      };

      // 실제로는 API 호출
      setTimeout(() => {
        setWidgetData(mockWidget);
        setWidgetLoading(false);
      }, 500);
    };

    if (placement.widgetId) {
      loadWidget();
    }
  }, [placement.widgetId]);

  // Mock query execution
  useEffect(() => {
    const executeQuery = async () => {
      if (!widgetData) return;
      
      setQueryLoading(true);
      
      // 임시 목업 쿼리 결과
      const mockQueryResult = [
        { name: "Item 1", count_count: 150, time_dimension: "2024-01-01" },
        { name: "Item 2", count_count: 200, time_dimension: "2024-01-02" },
        { name: "Item 3", count_count: 175, time_dimension: "2024-01-03" },
        { name: "Item 4", count_count: 300, time_dimension: "2024-01-04" },
        { name: "Item 5", count_count: 250, time_dimension: "2024-01-05" },
      ];

      // 실제로는 API 호출
      setTimeout(() => {
        setQueryData(mockQueryResult);
        setQueryLoading(false);
      }, 300);
    };

    executeQuery();
  }, [widgetData, fromTimestamp, toTimestamp, filterState, sortState]);

  // 데이터 변환
  const transformedData = useMemo(() => {
    if (!widgetData || !queryData) {
      return [];
    }

    return queryData.map((item) => {
      if (widgetData.chartType === "PIVOT_TABLE") {
        return {
          dimension: widgetData.dimensions.length > 0 
            ? (widgetData.dimensions[0]?.field ?? "dimension")
            : "dimension",
          metric: 0, // 피벗 테이블용 플레이스홀더
          time_dimension: item["time_dimension"],
          ...item,
        };
      }

      // 일반 차트 처리
      const metric = widgetData.metrics[0] ?? { measure: "count", agg: "count" };
      const metricField = `${metric.agg}_${metric.measure}`;
      const metricValue = item[metricField];

      const dimensionField = widgetData.dimensions[0]?.field ?? "none";
      
      return {
        dimension: item[dimensionField] !== undefined
          ? (() => {
              const val = item[dimensionField];
              if (typeof val === "string") return val;
              if (val === null || val === undefined || val === "") return "n/a";
              if (Array.isArray(val)) return val.join(", ");
              return String(val);
            })()
          : formatMetricName(metricField),
        metric: Array.isArray(metricValue) ? metricValue : Number(metricValue || 0),
        time_dimension: item["time_dimension"],
      };
    });
  }, [queryData, widgetData]);

  // 이벤트 핸들러들
  const handleEdit = () => {
    navigate(`/project/${projectId}/widgets/${placement.widgetId}?dashboardId=${dashboardId}`);
  };

  const handleCopy = async () => {
    try {
      // 실제로는 API 호출
      console.log("Copying widget...");
      alert("Widget copied successfully!");
    } catch (error) {
      alert(`Failed to copy widget: ${error.message}`);
    }
  };

  const handleDelete = () => {
    if (onDeleteWidget && confirm("Please confirm deletion")) {
      onDeleteWidget(placement.id);
    }
  };

  // 로딩 상태
  if (widgetLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // 위젯을 찾을 수 없는 경우
  if (!widgetData) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-gray-500">Widget not found</div>
      </div>
    );
  }

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-lg border bg-white p-4 shadow-sm">
      {/* 위젯 헤더 */}
      <div className="flex items-center justify-between">
        <span className="truncate font-medium text-gray-900" title={widgetData.name}>
          {widgetData.name}{" "}
          {dashboardOwner === "PROJECT" && widgetData.owner === "LANGFUSE" ? " ( 🪢 )" : null}
        </span>
        <div className="flex space-x-2">
          {hasCUDAccess && (
            <>
              <GripVerticalIcon
                size={16}
                className="drag-handle hidden cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing lg:group-hover:block"
              />
              {widgetData.owner === "PROJECT" ? (
                <button
                  onClick={handleEdit}
                  className="hidden text-gray-400 hover:text-gray-600 group-hover:block"
                  aria-label="Edit widget"
                >
                  <PencilIcon size={16} />
                </button>
              ) : widgetData.owner === "LANGFUSE" ? (
                <button
                  onClick={handleCopy}
                  className="hidden text-gray-400 hover:text-gray-600 group-hover:block"
                  aria-label="Copy widget"
                >
                  <CopyIcon size={16} />
                </button>
              ) : null}
              <button
                onClick={handleDelete}
                className="hidden text-gray-400 hover:text-red-600 group-hover:block"
                aria-label="Delete widget"
              >
                <TrashIcon size={16} />
              </button>
            </>
          )}
          {/* 다운로드 버튼 또는 로딩 인디케이터 */}
          {queryLoading ? (
            <div
              className="text-gray-400"
              aria-label="Loading chart data"
              title="Loading..."
            >
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : (
            <DownloadButton
              data={transformedData}
              fileName={widgetData.name}
              className="hidden group-hover:block"
            />
          )}
        </div>
      </div>
      
      {/* 위젯 설명 */}
      <div
        className="mb-4 truncate text-sm text-gray-500"
        title={widgetData.description}
      >
        {widgetData.description}
      </div>
      
      {/* 차트 영역 */}
      <div className="min-h-0 flex-1">
        <Chart
          chartType={widgetData.chartType}
          data={transformedData}
          rowLimit={
            widgetData.chartConfig.type === "LINE_TIME_SERIES" ||
            widgetData.chartConfig.type === "BAR_TIME_SERIES"
              ? 100
              : (widgetData.chartConfig.row_limit ?? 100)
          }
          chartConfig={{
            ...widgetData.chartConfig,
            // 피벗 테이블용 설정 강화
            ...(widgetData.chartType === "PIVOT_TABLE" && {
              dimensions: widgetData.dimensions.map((dim) => dim.field),
              metrics: widgetData.metrics.map(
                (metric) => `${metric.agg}_${metric.measure}`,
              ),
            }),
          }}
          sortState={widgetData.chartType === "PIVOT_TABLE" ? sortState : undefined}
          onSortChange={widgetData.chartType === "PIVOT_TABLE" ? updateSort : undefined}
          isLoading={queryLoading}
        />
      </div>
    </div>
  );
};

export default DashboardWidget;
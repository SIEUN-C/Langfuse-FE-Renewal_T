import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { widgetAPI } from "../../Dashboards/services/dashboardApi.js";
import Chart from "../chart-library/Chart.jsx";
import {
  formatMetricName,
  isTimeSeriesChart,
  mapLegacyUiTableFilterToView,
} from "../../Dashboards/utils/widget-utils.js";
import {
  PencilIcon,
  TrashIcon,
  CopyIcon,
  GripVerticalIcon,
  Loader2,
} from "lucide-react";
import DownloadButton from "../../Dashboards/DownloadButton.jsx";
import styles from "./DashboardWidget.module.css";

// 임시 권한 시스템
const useHasProjectAccess = ({ projectId, scope }) => {
  return true;
};

// 임시 알림 시스템
const showErrorToast = (title, message) => {
  console.error(`${title}: ${message}`);
  alert(`${title}: ${message}`);
};

export default function DashboardWidget({
  projectId,
  dashboardId,
  placement,
  dateRange,
  filterState,
  onDeleteWidget,
  dashboardOwner,
}) {
  const navigate = useNavigate();
  
  // 상태 관리
  const [widget, setWidget] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [widgetError, setWidgetError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [sortState, setSortState] = useState(null);
  
  // 무한 로딩 방지를 위한 ref
  const queryExecutedRef = useRef(false);
  const widgetLoadedRef = useRef(false);
  
  // 권한 체크
  const hasCUDAccess = useHasProjectAccess({ 
    projectId, 
    scope: "dashboards:CUD" 
  }) && dashboardOwner !== "LANGFUSE";

  // 날짜 범위 처리 (기본값: 최근 7일)
  const fromTimestamp = useMemo(() => 
    dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
    [dateRange?.from]
  );
  const toTimestamp = useMemo(() => 
    dateRange?.to || new Date(), 
    [dateRange?.to]
  );

  // 위젯 데이터 로드 (한 번만 실행되도록 수정)
  useEffect(() => {
    const loadWidget = async () => {
      // 이미 로드했거나 필요한 데이터가 없으면 리턴
      if (widgetLoadedRef.current || !projectId || !placement.widgetId) {
        return;
      }
      
      console.log(`🔄 위젯 로드 시작: ${placement.widgetId}`);
      widgetLoadedRef.current = true; // 로드 시작 표시
      
      setWidgetLoading(true);
      setWidgetError(null);
      
      try {
        const result = await widgetAPI.getWidget(projectId, placement.widgetId);
        if (result.success) {
          console.log("✅ 위젯 데이터 로드 성공:", placement.widgetId);
          setWidget(result.data);
        } else {
          setWidgetError(result.error);
          console.error("위젯 로드 실패:", result.error);
          widgetLoadedRef.current = false; // 실패시 재시도 가능하도록
        }
      } catch (error) {
        setWidgetError(error.message);
        console.error("위젯 로드 중 오류:", error);
        widgetLoadedRef.current = false; // 실패시 재시도 가능하도록
      } finally {
        setWidgetLoading(false);
      }
    };

    loadWidget();
  }, [projectId, placement.widgetId]); // placement.id 제거

  // 기본 정렬 설정
  const defaultSort = useMemo(() => {
    return widget?.chartConfig?.type === "PIVOT_TABLE"
      ? widget.chartConfig.defaultSort
      : undefined;
  }, [widget?.chartConfig]);

  useEffect(() => {
    if (defaultSort && sortState === null) {
      setSortState(defaultSort);
    }
  }, [defaultSort, sortState]);

  // filterState와 sortState를 문자열로 안정화
  const stableFilterState = useMemo(() => 
    JSON.stringify(filterState || {}), 
    [filterState]
  );
  const stableSortState = useMemo(() => 
    JSON.stringify(sortState || {}), 
    [sortState]
  );

  // 쿼리 실행 (무한 로딩 방지)
  useEffect(() => {
    const executeQuery = async () => {
      if (!widget || !projectId) return;
      
      // 중복 실행 방지
      if (queryExecutedRef.current) return;
      
      console.log(`🔄 쿼리 실행 시작: ${widget.name}`);
      queryExecutedRef.current = true;

      setQueryLoading(true);
      setQueryError(null);
      
      try {
        const query = {
          view: widget.view || "traces",
          dimensions: widget.dimensions || [],
          metrics: widget.metrics?.map(metric => ({
            measure: metric.measure,
            aggregation: metric.agg,
          })) || [],
          filters: [
            ...(widget.filters || []),
            ...mapLegacyUiTableFilterToView(widget.view || "traces", filterState || {}),
          ],
          timeDimension: isTimeSeriesChart(widget.chartType || "LINE_TIME_SERIES")
            ? { granularity: "auto" }
            : null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy: widget.chartConfig?.type === "PIVOT_TABLE" && sortState
            ? [{
                field: sortState.column,
                direction: sortState.order.toLowerCase(),
              }]
            : null,
          chartConfig: widget.chartConfig,
        };

        console.log("🔍 쿼리 요청:", query);
        const result = await widgetAPI.executeQuery(projectId, query);
        
        if (result.success) {
          console.log("✅ 쿼리 실행 성공:", result.data);
          setQueryResult(result.data);
        } else {
          setQueryError(result.error);
          console.error("쿼리 실행 실패:", result.error);
        }
      } catch (error) {
        setQueryError(error.message);
        console.error("쿼리 실행 중 오류:", error);
      } finally {
        setQueryLoading(false);
        queryExecutedRef.current = false; // 완료 후 다시 실행 가능하도록
      }
    };

    // 위젯이 로드되었고 아직 쿼리를 실행하지 않았을 때만 실행
    if (widget && !queryExecutedRef.current) {
      executeQuery();
    }
  }, [
    widget?.id, 
    projectId, 
    stableFilterState, 
    fromTimestamp.getTime(), 
    toTimestamp.getTime(), 
    stableSortState
  ]);

  // 정렬 업데이트
  const updateSort = useCallback((newSort) => {
    setSortState(newSort);
    queryExecutedRef.current = false; // 새로운 정렬로 쿼리 재실행 허용
  }, []);

  // 데이터 변환
  const transformedData = useMemo(() => {
    if (!widget || !queryResult) {
      return [];
    }

    console.log("🔄 데이터 변환 중...", { widget: widget.name, queryResult });

    return queryResult.map((item) => {
      if (widget.chartType === "PIVOT_TABLE") {
        return {
          dimension: widget.dimensions.length > 0
            ? (widget.dimensions[0]?.field || "dimension")
            : "dimension",
          metric: 0,
          time_dimension: item["time_dimension"],
          ...item,
        };
      }

      // 일반 차트 처리
      const metric = widget.metrics?.slice().shift() || {
        measure: "count",
        agg: "count",
      };
      const metricField = `${metric.agg}_${metric.measure}`;
      const metricValue = item[metricField];

      const dimensionField = widget.dimensions?.slice().shift()?.field || "none";
      
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
        metric: Array.isArray(metricValue)
          ? metricValue
          : Number(metricValue || 0),
        time_dimension: item["time_dimension"],
      };
    });
  }, [queryResult, widget]);

  // 이벤트 핸들러들
  const handleEdit = useCallback(() => {
    navigate(`/project/${projectId}/widgets/${placement.widgetId}?dashboardId=${dashboardId}`);
  }, [navigate, projectId, placement.widgetId, dashboardId]);

  const handleCopy = useCallback(async () => {
    try {
      const result = await widgetAPI.copyWidgetToProject(
        projectId,
        projectId,
        placement.widgetId
      );
      if (result.success) {
        navigate(`/project/${projectId}/widgets/${result.data.widgetId}?dashboardId=${dashboardId}`);
      } else {
        showErrorToast("위젯 복사 실패", result.error);
      }
    } catch (error) {
      showErrorToast("위젯 복사 중 오류", error.message);
    }
  }, [projectId, placement.widgetId, dashboardId, navigate]);

  const handleDelete = useCallback(() => {
    if (onDeleteWidget && confirm("정말 삭제하시겠습니까?")) {
      onDeleteWidget(placement.id);
    }
  }, [onDeleteWidget, placement.id]);

  // 로딩 상태
  if (widgetLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading widget...</div>
      </div>
    );
  }

  // 위젯이 없는 경우
  if (!widget) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>
          {widgetError || "Widget not found"}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.widgetContainer} ${styles.group}`}>
      {/* 헤더 */}
      <div className={styles.header}>
        <span className={styles.title} title={widget.name}>
          {widget.name}{" "}
          {dashboardOwner === "PROJECT" && widget.owner === "LANGFUSE"
            ? " ( 🪢 )"
            : null}
        </span>
        <div className={styles.actions}>
          {hasCUDAccess && (
            <>
              <GripVerticalIcon
                size={16}
                className={`${styles.dragHandle} drag-handle`}
              />
              {widget.owner === "PROJECT" ? (
                <button
                  onClick={handleEdit}
                  className={styles.actionButton}
                  aria-label="Edit widget"
                >
                  <PencilIcon size={16} />
                </button>
              ) : widget.owner === "LANGFUSE" ? (
                <button
                  onClick={handleCopy}
                  className={styles.actionButton}
                  aria-label="Copy widget"
                >
                  <CopyIcon size={16} />
                </button>
              ) : null}
              <button
                onClick={handleDelete}
                className={`${styles.actionButton} ${styles.deleteButton}`}
                aria-label="Delete widget"
              >
                <TrashIcon size={16} />
              </button>
            </>
          )}
          {queryLoading ? (
            <div
              className={styles.loadingIndicator}
              aria-label="Loading chart data"
              title="Loading..."
            >
              <Loader2 size={16} className={styles.spinner} />
            </div>
          ) : (
            <DownloadButton
              data={transformedData}
              fileName={widget.name}
              className={styles.downloadButton}
            />
          )}
        </div>
      </div>

      {/* 설명 */}
      <div className={styles.description} title={widget.description}>
        {widget.description}
      </div>

      {/* 차트 */}
      <div className={styles.chartContainer}>
        {queryError ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorText}>
              Error loading chart data: {queryError}
            </div>
          </div>
        ) : (
          <Chart
            chartType={widget.chartType}
            data={transformedData}
            rowLimit={
              widget.chartConfig?.type === "LINE_TIME_SERIES" ||
              widget.chartConfig?.type === "BAR_TIME_SERIES"
                ? 100
                : (widget.chartConfig?.row_limit || 100)
            }
            chartConfig={{
              ...widget.chartConfig,
              ...(widget.chartType === "PIVOT_TABLE" && {
                dimensions: widget.dimensions?.map((dim) => dim.field) || [],
                metrics: widget.metrics?.map(
                  (metric) => `${metric.agg}_${metric.measure}`
                ) || [],
              }),
            }}
            sortState={widget.chartType === "PIVOT_TABLE" ? sortState : undefined}
            onSortChange={widget.chartType === "PIVOT_TABLE" ? updateSort : undefined}
            isLoading={queryLoading}
          />
        )}
      </div>
    </div>
  );
}
// src/Pages/Widget/component/DashboardWidget.jsx

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

/**
 * 임시 권한 시스템 (실제 프로덕션에서는 교체 필요)
 */
const useHasProjectAccess = ({ projectId, scope }) => {
  return true;
};

/**
 * 임시 알림 시스템 (Toast 컴포넌트로 교체 예정)
 */
const showErrorToast = (title, message) => {
  console.error(`${title}: ${message}`);
  alert(`${title}: ${message}`);
};

/**
 * 필터 컬럼 타입 매핑
 * dashboardFilterConfig와 동일한 설정
 */
const getFilterType = (column) => {
  const config = [
    { key: "environment", type: "categorical" },
    { key: "traceName", type: "categorical" },
    { key: "observationName", type: "string" },
    { key: "scoreName", type: "string" },
    { key: "tags", type: "categorical" },
    { key: "user", type: "string" },
    { key: "session", type: "string" },
    { key: "metadata", type: "string" },
    { key: "release", type: "string" },
    { key: "version", type: "string" },
  ];

  const filterConfig = config.find((c) => c.key === column);
  return filterConfig?.type || "string";
};

/**
 * 대시보드 위젯 컴포넌트
 * 
 * 주요 기능:
 * - 위젯 메타데이터 로드 (이름, 차트타입, 설정)
 * - 쿼리 실행 및 차트 데이터 로드
 * - 필터 적용 (날짜 범위 + 사용자 필터)
 * - 차트 렌더링
 * - 위젯 관리 (편집, 복사, 삭제)
 * 
 * @param {string} projectId - 프로젝트 ID
 * @param {string} dashboardId - 대시보드 ID
 * @param {Object} placement - 위젯 배치 정보
 * @param {Object} dateRange - 날짜 범위
 * @param {Array} filterState - 사용자 필터 상태
 * @param {Function} onDeleteWidget - 위젯 삭제 콜백
 * @param {string} dashboardOwner - 대시보드 소유자
 */
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

  // 위젯 관련 상태
  const [widget, setWidget] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [widgetError, setWidgetError] = useState(null);

  // 쿼리 관련 상태
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [sortState, setSortState] = useState(null);

  // 중복 실행 방지
  const queryExecutedRef = useRef(false);
  const widgetLoadedRef = useRef(false);

  // 권한 체크
  const hasCUDAccess =
    useHasProjectAccess({
      projectId,
      scope: "dashboards:CUD",
    }) && dashboardOwner !== "LANGFUSE";

  // 날짜 범위 처리 (startDate/endDate와 from/to 구조 모두 지원)
  const fromTimestamp = useMemo(() => {
    if (dateRange?.startDate) return dateRange.startDate;
    if (dateRange?.from) return dateRange.from;
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }, [dateRange?.startDate, dateRange?.from]);

  const toTimestamp = useMemo(() => {
    if (dateRange?.endDate) return dateRange.endDate;
    if (dateRange?.to) return dateRange.to;
    return new Date();
  }, [dateRange?.endDate, dateRange?.to]);

  // 위젯 메타데이터 로드
  useEffect(() => {
    const loadWidget = async () => {
      if (widgetLoadedRef.current || !projectId || !placement.widgetId) {
        return;
      }
      widgetLoadedRef.current = true;

      setWidgetLoading(true);
      setWidgetError(null);

      try {
        const result = await widgetAPI.getWidget(projectId, placement.widgetId);

        if (result.success) {
          setWidget(result.data);
        } else {
          setWidgetError(result.error);
          console.error("위젯 로드 실패:", result.error);
          widgetLoadedRef.current = false;
        }
      } catch (error) {
        setWidgetError(error.message);
        console.error("위젯 로드 중 오류:", error);
        widgetLoadedRef.current = false;
      } finally {
        setWidgetLoading(false);
      }
    };

    loadWidget();
  }, [projectId, placement.widgetId]);

  // PIVOT_TABLE용 기본 정렬 설정
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

  // 상태 안정화 (무한 리렌더링 방지)
  const stableFilterState = useMemo(() => {
    const activeFilters = (filterState || []).filter(
      (filter) => filter.value && filter.value.toString().trim() !== ""
    );
    return JSON.stringify(activeFilters);
  }, [filterState]);

  const stableSortState = useMemo(
    () => JSON.stringify(sortState || {}),
    [sortState]
  );

  // 쿼리 실행
  useEffect(() => {
    const executeQuery = async () => {
      if (!widget || !projectId) return;
      if (queryExecutedRef.current) return;

      queryExecutedRef.current = true;

      setQueryLoading(true);
      setQueryError(null);

      try {
        // 필터 처리: 위젯 자체 필터 + 사용자 설정 필터 병합
        const allFilters = [
          ...(widget.filters || []),
          ...(Array.isArray(filterState) ? filterState : []),
        ];

        const processedFilters = allFilters
          .filter((filter) => {
            const hasValue =
              filter.value && filter.value.toString().trim() !== "";
            return hasValue;
          })
          .map((filter) => {
            const filterType = getFilterType(filter.column);

            let processedFilter = {
              column: filter.column,
              operator: filter.operator,
              value: filter.value,
            };

            // 타입별 처리
            if (filterType === "categorical") {
              processedFilter.type = "stringOptions";
              if (typeof filter.value === "string") {
                processedFilter.value = filter.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter((v) => v);
              } else if (Array.isArray(filter.value)) {
                processedFilter.value = filter.value;
              } else {
                processedFilter.value = [filter.value.toString()];
              }
            } else {
              processedFilter.type = filterType;
            }

            // metadata 필터의 경우 key 필드 추가
            if (filter.metaKey && filter.metaKey.trim()) {
              processedFilter.key = filter.metaKey.trim();
            }

            return processedFilter;
          });

        // 쿼리 구성
        const query = {
          view: widget.view || "traces",
          dimensions: widget.dimensions || [],
          metrics:
            widget.metrics?.map((metric) => ({
              measure: metric.measure,
              aggregation: metric.agg,
            })) || [],
          filters: processedFilters,
          timeDimension: isTimeSeriesChart(
            widget.chartType || "LINE_TIME_SERIES"
          )
            ? { granularity: "auto" }
            : null,
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),
          orderBy:
            widget.chartConfig?.type === "PIVOT_TABLE" && sortState
              ? [
                  {
                    field: sortState.column,
                    direction: sortState.order.toLowerCase(),
                  },
                ]
              : null,
          chartConfig: widget.chartConfig,
        };

        const result = await widgetAPI.executeQuery(projectId, query);

        if (result.success) {
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
        queryExecutedRef.current = false;
      }
    };

    if (widget && !queryExecutedRef.current) {
      executeQuery();
    }
  }, [
    widget?.id,
    projectId,
    stableFilterState,
    fromTimestamp.getTime(),
    toTimestamp.getTime(),
    stableSortState,
  ]);

  // PIVOT_TABLE 정렬 업데이트
  const updateSort = useCallback((newSort) => {
    setSortState(newSort);
    queryExecutedRef.current = false;
  }, []);

  // API 데이터를 Chart 컴포넌트용으로 변환
  const transformedData = useMemo(() => {
    if (!widget || !queryResult) {
      return [];
    }

    return queryResult.map((item) => {
      // PIVOT_TABLE용 변환
      if (widget.chartType === "PIVOT_TABLE") {
        return {
          dimension:
            widget.dimensions.length > 0
              ? widget.dimensions[0]?.field || "dimension"
              : "dimension",
          metric: 0,
          time_dimension: item["time_dimension"],
          ...item,
        };
      }

      // 일반 차트용 변환
      const metric = widget.metrics?.slice().shift() || {
        measure: "count",
        agg: "count",
      };
      const metricField = `${metric.agg}_${metric.measure}`;
      const metricValue = item[metricField];

      const dimensionField =
        widget.dimensions?.slice().shift()?.field || "none";

      return {
        dimension:
          item[dimensionField] !== undefined
            ? (() => {
                const val = item[dimensionField];
                if (typeof val === "string") return val;
                if (val === null || val === undefined || val === "")
                  return "n/a";
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
    navigate(
      `/project/${projectId}/widgets/${placement.widgetId}?dashboardId=${dashboardId}`
    );
  }, [navigate, projectId, placement.widgetId, dashboardId]);

  const handleCopy = useCallback(async () => {
    try {
      const result = await widgetAPI.copyWidgetToProject(
        projectId,
        projectId,
        placement.widgetId
      );
      if (result.success) {
        navigate(
          `/project/${projectId}/widgets/${result.data.widgetId}?dashboardId=${dashboardId}`
        );
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

  // 위젯 없음
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
          {widget.name}
          {/* LANGFUSE 기본 위젯 표시 */}
          {dashboardOwner === "PROJECT" && widget.owner === "LANGFUSE"
            ? " ( 🪢 )"
            : null}
        </span>

        {/* 액션 버튼들 */}
        <div className={styles.actions}>
          {hasCUDAccess && (
            <>
              {/* 드래그 핸들 */}
              <GripVerticalIcon
                size={16}
                className={`${styles.dragHandle} drag-handle`}
              />

              {/* 편집/복사 버튼 */}
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

              {/* 삭제 버튼 */}
              <button
                onClick={handleDelete}
                className={`${styles.actionButton} ${styles.deleteButton}`}
                aria-label="Delete widget"
              >
                <TrashIcon size={16} />
              </button>
            </>
          )}

          {/* 로딩 또는 다운로드 버튼 */}
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

      {/* 차트 영역 */}
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
                : widget.chartConfig?.row_limit || 100
            }
            chartConfig={{
              ...widget.chartConfig,
              // PIVOT_TABLE용 추가 설정
              ...(widget.chartType === "PIVOT_TABLE" && {
                dimensions:
                  widget.dimensions?.map((dim) => dim.field) || [],
                metrics:
                  widget.metrics?.map(
                    (metric) => `${metric.agg}_${metric.measure}`
                  ) || [],
              }),
            }}
            // PIVOT_TABLE용 정렬 관련 props
            sortState={
              widget.chartType === "PIVOT_TABLE" ? sortState : undefined
            }
            onSortChange={
              widget.chartType === "PIVOT_TABLE" ? updateSort : undefined
            }
            isLoading={queryLoading}
          />
        )}
      </div>
    </div>
  );
}
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
 * 임시 권한 시스템
 * 실제 프로덕션에서는 실제 권한 체크 로직으로 교체 필요
 * @param {Object} params - { projectId, scope }
 * @returns {boolean} 권한 여부 (현재는 항상 true)
 */
const useHasProjectAccess = ({ projectId, scope }) => {
  return true;
};

/**
 * 임시 알림 시스템
 * 실제 프로덕션에서는 Toast 컴포넌트로 교체 필요
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 */
const showErrorToast = (title, message) => {
  console.error(`${title}: ${message}`);
  alert(`${title}: ${message}`);
};

/**
 * 필터 컬럼의 타입을 가져오는 함수
 * dashboardFilterConfig와 동일한 설정을 로컬에서 관리
 * @param {string} column - 필터 컬럼명
 * @returns {string} 필터 타입 (categorical, string, number, date)
 */
const getFilterType = (column) => {
  // dashboardFilterConfig와 동일한 매핑 테이블
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
  return filterConfig?.type || "string"; // 기본값은 string
};

/**
 * 대시보드 위젯 컴포넌트
 *
 * 주요 기능:
 * 1. 위젯 메타데이터 로드 (이름, 차트타입, 설정 등)
 * 2. 쿼리 실행 및 차트 데이터 로드
 * 3. 필터 적용 (날짜 범위 + 사용자 필터)
 * 4. 차트 렌더링 (Chart 컴포넌트 사용)
 * 5. 위젯 관리 (편집, 복사, 삭제)
 *
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.projectId - 프로젝트 ID
 * @param {string} props.dashboardId - 대시보드 ID
 * @param {Object} props.placement - 위젯 배치 정보 (widgetId, id 포함)
 * @param {Object} props.dateRange - 날짜 범위 (startDate, endDate 또는 from, to)
 * @param {Array} props.filterState - 사용자 설정 필터 배열
 * @param {Function} props.onDeleteWidget - 위젯 삭제 콜백 함수
 * @param {string} props.dashboardOwner - 대시보드 소유자 (PROJECT, LANGFUSE 등)
 */
export default function DashboardWidget({
  // 주요 Props
  projectId, // 프로젝트 ID
  dashboardId, // 대시보드 ID
  placement, // 위젯 배치 정보 (widgetId, id 포함)
  dateRange, // 날짜 범위 (from, to)
  filterState, // 사용자 설정 필터 상태
  onDeleteWidget, // 위젯 삭제 콜백
  dashboardOwner, // 대시보드 소유자
}) {
  const navigate = useNavigate();

  // ===== 위젯 관련 상태 관리 =====
  const [widget, setWidget] = useState(null); // 위젯 메타데이터 (이름, 차트타입, 설정 등)
  const [widgetLoading, setWidgetLoading] = useState(true); // 위젯 로딩 상태
  const [widgetError, setWidgetError] = useState(null); // 위젯 로딩 에러

  // ===== 쿼리 관련 상태 =====
  const [queryResult, setQueryResult] = useState(null); // 실제 차트 데이터
  const [queryLoading, setQueryLoading] = useState(false); // 쿼리 실행 상태
  const [queryError, setQueryError] = useState(null); // 쿼리 실행 에러
  const [sortState, setSortState] = useState(null); // 정렬 상태 (PIVOT_TABLE용)

  // ===== 무한 로딩 방지를 위한 ref =====
  const queryExecutedRef = useRef(false); // 쿼리 중복 실행 방지
  const widgetLoadedRef = useRef(false); // 위젯 중복 로드 방지

  // ===== 권한 체크 =====
  // 대시보드 편집 권한: 프로젝트 권한이 있고 LANGFUSE 기본 대시보드가 아닌 경우
  const hasCUDAccess =
    useHasProjectAccess({
      projectId,
      scope: "dashboards:CUD",
    }) && dashboardOwner !== "LANGFUSE";

  // ===== 날짜 범위 처리 =====
  // startDate/endDate와 from/to 구조 모두 지원하도록 처리
  const fromTimestamp = useMemo(() => {
    // DashboardDetail에서 전달하는 startDate/endDate 구조 우선 체크
    if (dateRange?.startDate) return dateRange.startDate;
    // 다른 곳에서 사용할 수 있는 from/to 구조 체크
    if (dateRange?.from) return dateRange.from;
    // 기본값: 최근 7일
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }, [dateRange?.startDate, dateRange?.from]);

  const toTimestamp = useMemo(() => {
    // endDate/to 구조 우선 체크
    if (dateRange?.endDate) return dateRange.endDate;
    if (dateRange?.to) return dateRange.to;
    // 기본값: 현재 시간
    return new Date();
  }, [dateRange?.endDate, dateRange?.to]);

  // ===== 위젯 데이터 로드 =====
  /**
   * 위젯 메타데이터를 API에서 로드
   * 중복 실행 방지를 위해 widgetLoadedRef 사용
   */
  useEffect(() => {
    const loadWidget = async () => {
      // 이미 로드했거나 필요한 데이터가 없으면 리턴
      if (widgetLoadedRef.current || !projectId || !placement.widgetId) {
        return;
      }
      widgetLoadedRef.current = true; // 로드 시작 표시

      setWidgetLoading(true);
      setWidgetError(null);

      try {
        // API 호출: 위젯 메타데이터 조회
        const result = await widgetAPI.getWidget(projectId, placement.widgetId);

        if (result.success) {
          console.log("위젯 데이터 로드 성공:", placement.widgetId);
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
  }, [projectId, placement.widgetId]);

  // ===== 기본 정렬 설정 (PIVOT_TABLE용) =====
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

  // ===== 상태 안정화 (무한 리렌더링 방지) =====
  // filterState와 sortState를 문자열로 직렬화하여 참조 안정성 확보
  const stableFilterState = useMemo(() => {
    // 값이 있는 필터만 포함하여 직렬화
    const activeFilters = (filterState || []).filter(filter => 
      filter.value && filter.value.toString().trim() !== ""
    );
    return JSON.stringify(activeFilters);
  }, [filterState]);
  
  const stableSortState = useMemo(
    () => JSON.stringify(sortState || {}),
    [sortState]
  );

  // ===== 쿼리 실행 =====
  /**
   * 위젯 데이터를 기반으로 실제 차트 데이터를 조회하는 쿼리 실행
   * 위젯 로드 완료 후 실행되며, 필터나 날짜 범위 변경 시 재실행
   */
  useEffect(() => {
    const executeQuery = async () => {
      // 위젯이 로드되지 않았거나 프로젝트 ID가 없으면 실행하지 않음
      if (!widget || !projectId) return;

      // 중복 실행 방지
      if (queryExecutedRef.current) return;

      console.log(`쿼리 실행 시작: ${widget.name}`);
      queryExecutedRef.current = true;

      setQueryLoading(true);
      setQueryError(null);

      try {
        // ===== 필터 처리 =====
        // 위젯 자체 필터 + 사용자 설정 필터 병합
        const allFilters = [
          ...(widget.filters || []), // 위젯에 설정된 기본 필터
          ...(Array.isArray(filterState) ? filterState : []), // 사용자가 설정한 필터
        ];

        // ✅ 수정된 필터 처리 로직
        const processedFilters = allFilters
          .filter((filter) => {
            // 값이 있는 필터만 처리
            const hasValue =
              filter.value && filter.value.toString().trim() !== "";
            return hasValue;
          })
          .map((filter) => {
            const filterType = getFilterType(filter.column);

            // API에서 기대하는 형식으로 변환
            let processedFilter = {
              column: filter.column,
              operator: filter.operator,
              value: filter.value,
            };

            // categorical 타입의 경우 특별 처리
            // categorical 타입의 경우 특별 처리
            if (filterType === "categorical") {
              // type을 stringOptions로 설정 (API 요구사항)
              processedFilter.type = "stringOptions";

              // value를 배열로 변환
              if (typeof filter.value === "string") {
                // "production,staging" → ["production", "staging"]
                processedFilter.value = filter.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter((v) => v);
              } else if (Array.isArray(filter.value)) {
                processedFilter.value = filter.value;
              } else {
                processedFilter.value = [filter.value.toString()];
              }
            } else if (filterType === "string") {
              // string 타입에 명시적으로 type 추가
              processedFilter.type = "string";
              // value는 그대로 사용
            } else if (filterType === "number") {
              // number 타입에 명시적으로 type 추가
              processedFilter.type = "number";
              // value는 그대로 사용
            } else if (filterType === "date") {
              // date 타입에 명시적으로 type 추가
              processedFilter.type = "date";
              // value는 그대로 사용
            } else {
              // 알 수 없는 타입은 string으로 기본 처리
              processedFilter.type = "string";
            }

            // metadata 필터의 경우 key 필드 추가
            if (filter.metaKey && filter.metaKey.trim()) {
              processedFilter.key = filter.metaKey.trim();
            }

            return processedFilter;
          });

        console.log("처리된 필터들:", processedFilters);

        // ===== 쿼리 구성 =====
        const query = {
          // 기본 쿼리 설정
          view: widget.view || "traces", // 데이터 뷰 (traces, observations 등)
          dimensions: widget.dimensions || [], // 차트 차원 (x축)
          metrics:
            widget.metrics?.map((metric) => ({
              measure: metric.measure,
              aggregation: metric.agg,
            })) || [], // 차트 메트릭 (y축)

          // 필터 적용
          filters: processedFilters, // 처리된 필터 사용

          // 시간 차원 설정 (시계열 차트인 경우)
          timeDimension: isTimeSeriesChart(
            widget.chartType || "LINE_TIME_SERIES"
          )
            ? { granularity: "auto" }
            : null,

          // 날짜 범위 설정
          fromTimestamp: fromTimestamp.toISOString(),
          toTimestamp: toTimestamp.toISOString(),

          // 정렬 설정 (PIVOT_TABLE인 경우)
          orderBy:
            widget.chartConfig?.type === "PIVOT_TABLE" && sortState
              ? [
                  {
                    field: sortState.column,
                    direction: sortState.order.toLowerCase(),
                  },
                ]
              : null,

          // 차트 설정
          chartConfig: widget.chartConfig,
        };

        console.log("전송하는 쿼리:", query);

        // ===== API 호출 =====
        const result = await widgetAPI.executeQuery(projectId, query);

        if (result.success) {
          console.log("쿼리 실행 성공:", result.data);
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
    widget?.id, // 위젯 변경 시
    projectId, // 프로젝트 변경 시
    stableFilterState, // 필터 변경 시
    fromTimestamp.getTime(), // 시작 날짜 변경 시
    toTimestamp.getTime(), // 종료 날짜 변경 시
    stableSortState, // 정렬 변경 시
  ]);

  // ===== 정렬 업데이트 함수 =====
  /**
   * PIVOT_TABLE에서 정렬 변경 시 호출
   * @param {Object} newSort - 새로운 정렬 설정
   */
  const updateSort = useCallback((newSort) => {
    setSortState(newSort);
    queryExecutedRef.current = false; // 새로운 정렬로 쿼리 재실행 허용
  }, []);

  // ===== 데이터 변환 =====
  /**
   * API에서 받은 원시 데이터를 Chart 컴포넌트가 사용할 수 있는 형태로 변환
   */
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

  // ===== 이벤트 핸들러들 =====

  /**
   * 위젯 편집 버튼 클릭 핸들러
   * 위젯 편집 페이지로 이동
   */
  const handleEdit = useCallback(() => {
    navigate(
      `/project/${projectId}/widgets/${placement.widgetId}?dashboardId=${dashboardId}`
    );
  }, [navigate, projectId, placement.widgetId, dashboardId]);

  /**
   * 위젯 복사 버튼 클릭 핸들러
   * LANGFUSE 기본 위젯을 사용자 위젯으로 복사
   */
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

  /**
   * 위젯 삭제 버튼 클릭 핸들러
   * 확인 후 위젯을 대시보드에서 제거
   */
  const handleDelete = useCallback(() => {
    if (onDeleteWidget && confirm("정말 삭제하시겠습니까?")) {
      onDeleteWidget(placement.id);
    }
  }, [onDeleteWidget, placement.id]);

  // ===== 렌더링 =====

  // 위젯 로딩 중
  if (widgetLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading widget...</div>
      </div>
    );
  }

  // 위젯이 없는 경우 (로드 실패)
  if (!widget) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>
          {widgetError || "Widget not found"}
        </div>
      </div>
    );
  }

  // ===== 메인 위젯 렌더링 =====
  return (
    <div className={`${styles.widgetContainer} ${styles.group}`}>
      {/* ===== 위젯 헤더 ===== */}
      <div className={styles.header}>
        {/* 위젯 제목 */}
        <span className={styles.title} title={widget.name}>
          {widget.name} {/* LANGFUSE 기본 위젯 표시 */}
          {dashboardOwner === "PROJECT" && widget.owner === "LANGFUSE"
            ? " ( 🪢 )"
            : null}
        </span>

        {/* 위젯 액션 버튼들 */}
        <div className={styles.actions}>
          {hasCUDAccess && (
            <>
              {/* 드래그 핸들 (위젯 이동용) */}
              <GripVerticalIcon
                size={16}
                className={`${styles.dragHandle} drag-handle`}
              />

              {/* 편집/복사 버튼 */}
              {widget.owner === "PROJECT" ? (
                // 사용자 위젯: 편집 가능
                <button
                  onClick={handleEdit}
                  className={styles.actionButton}
                  aria-label="Edit widget"
                >
                  <PencilIcon size={16} />
                </button>
              ) : widget.owner === "LANGFUSE" ? (
                // LANGFUSE 기본 위젯: 복사만 가능
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

          {/* 로딩 인디케이터 또는 다운로드 버튼 */}
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

      {/* ===== 위젯 설명 ===== */}
      <div className={styles.description} title={widget.description}>
        {widget.description}
      </div>

      {/* ===== 차트 영역 ===== */}
      <div className={styles.chartContainer}>
        {queryError ? (
          // 쿼리 에러 표시
          <div className={styles.errorContainer}>
            <div className={styles.errorText}>
              Error loading chart data: {queryError}
            </div>
          </div>
        ) : (
          // 차트 렌더링
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
                dimensions: widget.dimensions?.map((dim) => dim.field) || [],
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

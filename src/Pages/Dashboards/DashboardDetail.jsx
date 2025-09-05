// src/Pages/Dashboards/DashboardDetail.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Copy } from "lucide-react";
import { dashboardAPI } from "./services/dashboardApi.js";
import { dashboardFilterConfig } from "../../components/FilterControls/filterConfig.js";
import DashboardGrid from "../Widget/component/DashboardGrid.jsx";
import DashboardFilterControls from "./components/DashboardFilterControls";
// ✅ 프롬프트에서 검증된 FilterControls 컴포넌트 추가
import FilterControls from "../../components/FilterControls/FilterControls";
import { SelectWidgetDialog } from "../Widget/component/SelectWidgetDialog.jsx";
import { useDebounce } from "./hooks/useDebounce";
import styles from "./DashboardDetail.module.css";
import { v4 as uuidv4 } from "uuid";

/**
 * 대시보드 상세 페이지 컴포넌트
 *
 * 주요 기능:
 * 1. 대시보드 정보 표시 및 관리 (제목, 설명, 메타데이터)
 * 2. 위젯 그리드 레이아웃 관리 (드래그 앤 드롭, 리사이즈)
 * 3. 필터링 시스템:
 *    - DateRangePicker: 날짜 범위 선택 (Past 7 days 등 프리셋 포함)
 *    - FilterControls: 고급 필터 (Environment, Trace Name, Tags 등)
 * 4. 위젯 추가/삭제/편집
 * 5. 대시보드 복제 및 권한 관리
 */
const DashboardDetail = () => {
  // URL 파라미터에서 프로젝트 ID와 대시보드 ID 추출
  const { projectId, dashboardId } = useParams();
  const navigate = useNavigate();

  // ===== 기본 상태 관리 =====
  const [dashboard, setDashboard] = useState(null); // 대시보드 기본 정보 (이름, 설명 등)
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [error, setError] = useState(null); // 에러 메시지

  // ===== 날짜 범위 필터 상태 =====
  // 기본값: 현재로부터 7일 전부터 현재까지
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
    endDate: new Date(), // 현재
  });

  // ===== 위젯 관리 상태 =====
  const [localDashboardDefinition, setLocalDashboardDefinition] =
    useState(null); // 위젯 레이아웃 정보
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false); // 위젯 추가 다이얼로그 열림 상태
  const [userFilterState, setUserFilterState] = useState([]); // 사용자 필터 상태 (현재 미사용)

  // ===== 필터 시스템 상태 =====

  // 기존 복잡한 필터 상태 (API 변환용) - 제거 예정이지만 호환성을 위해 유지
  const [filterState, setFilterState] = useState([]);

  // ✅ 새로 추가: 프롬프트 페이지와 동일한 필터 상태 구조
  // FilterControls 컴포넌트에서 사용할 표준 필터 상태
  const [builderFilters, setBuilderFilters] = useState(() => {
    // dashboardFilterConfig의 첫 번째 항목으로 초기 필터 생성
    const initialColumn = dashboardFilterConfig[0];
    return [
      {
        id: Date.now(),
        column: initialColumn.key,
        operator: initialColumn.operators[0],
        value: "",
        metaKey: "",
      },
    ];
  });

  // ===== 필터 옵션 데이터 상태 =====
  // API에서 동적으로 로드되는 필터 옵션들 (Environment, Trace Names, Tags 등)
  const [environmentOptions, setEnvironmentOptions] = useState([]);
  const [nameOptions, setNameOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // ===== 동적 필터 설정 생성 =====
  /**
   * API에서 로드한 옵션들을 기본 필터 설정에 동적으로 추가
   * 드롭다운에 실제 데이터 옵션들이 표시되도록 함
   */
  const dynamicFilterConfig = useMemo(() => {
    return dashboardFilterConfig.map((config) => {
      // Environment 필터에 API 로드된 환경 목록 추가
      if (config.key === "environment") {
        return { ...config, options: environmentOptions };
      }
      // Trace Name 필터에 API 로드된 이름 목록 추가
      if (config.key === "traceName") {
        return { ...config, options: nameOptions };
      }
      // Tags 필터에 API 로드된 태그 목록 추가
      if (config.key === "tags") {
        return { ...config, options: tagsOptions };
      }
      // 나머지는 기본 설정 그대로 사용
      return config;
    });
  }, [environmentOptions, nameOptions, tagsOptions]);

  // ===== 권한 관리 =====
  // 대시보드 소유자에 따른 권한 체크
  const hasCUDAccess = dashboard?.owner !== "LANGFUSE"; // 생성/수정/삭제 권한 (LANGFUSE 기본 대시보드는 읽기 전용)
  const hasCloneAccess = dashboard?.owner === "LANGFUSE"; // 복제 권한 (LANGFUSE 대시보드만 복제 가능)

  // ===== 필터 변경 핸들러 (기존 API 호환용) =====
  // 기존 복잡한 필터 로직 - 점진적으로 단순화 예정
  const handleFilterChange = useCallback(
    (newFilters) => {
      console.log("Received newFilters:", typeof newFilters, newFilters);

      let actualFilters;

      // newFilters가 함수인 경우 (React setter 패턴 지원)
      if (typeof newFilters === "function") {
        actualFilters = newFilters(filterState);
      } else if (Array.isArray(newFilters)) {
        actualFilters = newFilters;
      } else {
        console.error("newFilters is neither array nor function:", newFilters);
        return;
      }

      // 원본 필터 상태 저장
      setFilterState(actualFilters);

      // API용 필터 변환 (type 필드 추가)
      const apiFilters = actualFilters.map((filter) => {
        // filterConfig에서 해당 컬럼의 type 찾기
        const config = dashboardFilterConfig.find(
          (c) => c.key === filter.column
        );
        const filterType = config?.type || "string";

        // API 형식에 맞게 변환
        let apiFilter = {
          column: filter.column,
          type: filterType === "categorical" ? "stringOptions" : filterType,
          operator: filter.operator,
          value: filter.value,
          key: filter.metaKey || null,
        };

        // categorical 타입은 value를 배열로 변환
        if (filterType === "categorical" && typeof filter.value === "string") {
          apiFilter.value = filter.value ? filter.value.split(",") : [];
        }

        return apiFilter;
      });

      console.log("Converted filters for API:", apiFilters);
    },
    [filterState]
  );

  // ===== 필터 옵션 로딩 함수 =====
  /**
   * API에서 필터에 사용할 옵션들을 동적으로 로드
   * Environment, Trace Names, Tags 등의 실제 데이터를 가져와서 드롭다운에 표시
   */
  const loadFilterOptions = useCallback(async () => {
    if (!projectId) return;

    setFilterOptionsLoading(true);

    // 기본값 설정 (에러 발생 시 폴백용)
    const defaultEnvironmentOptions = ["default"];
    const defaultNameOptions = [];
    const defaultTagsOptions = [];

    try {
      console.log("Loading filter options...");

      // Trace 필터 옵션과 Environment 필터 옵션을 병렬로 로드
      const [traceOptions, envOptions] = await Promise.all([
        dashboardAPI.getTraceFilterOptions(projectId),
        dashboardAPI.getEnvironmentFilterOptions(projectId),
      ]);

      // Trace 필터 옵션 처리 (Trace Names, Tags)
      if (traceOptions.success && traceOptions.data) {
        setNameOptions(traceOptions.data.name || defaultNameOptions);
        setTagsOptions(traceOptions.data.tags || defaultTagsOptions);
        console.log("Trace filter options loaded:", traceOptions.data);
      } else {
        console.warn("Failed to load trace options, using defaults");
        setNameOptions(defaultNameOptions);
        setTagsOptions(defaultTagsOptions);
      }

      // Environment 필터 옵션 처리
      if (envOptions.success && envOptions.data) {
        setEnvironmentOptions(
          envOptions.data.length > 0
            ? envOptions.data
            : defaultEnvironmentOptions
        );
        console.log("Environment filter options loaded:", envOptions.data);
      } else {
        console.warn("Failed to load environment options, using defaults");
        setEnvironmentOptions(defaultEnvironmentOptions);
      }
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      // 에러 발생 시 기본값 사용
      setEnvironmentOptions(defaultEnvironmentOptions);
      setNameOptions(defaultNameOptions);
      setTagsOptions(defaultTagsOptions);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [projectId]);

  // ===== 대시보드 로딩 함수 =====
  /**
   * 대시보드 기본 정보와 위젯 레이아웃을 로드
   */
  const loadDashboard = useCallback(async () => {
    if (!projectId || !dashboardId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dashboardAPI.getDashboard(projectId, dashboardId);

      if (result.success) {
        setDashboard(result.data);
        // 위젯 레이아웃 정보 설정 (빈 배열이 기본값)
        setLocalDashboardDefinition(result.data.definition ?? { widgets: [] });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, dashboardId]);

  // ===== 디바운스된 대시보드 저장 함수 =====
  /**
   * 위젯 레이아웃 변경사항을 자동으로 저장 (500ms 디바운스)
   * 사용자가 위젯을 드래그하거나 리사이즈할 때마다 호출되지만,
   * 실제 API 호출은 마지막 변경 후 500ms 후에 실행
   */
  const debouncedSaveDashboard = useDebounce(
    async (definition) => {
      if (!hasCUDAccess || !projectId || !dashboardId) return;

      try {
        console.log("Saving dashboard definition...", definition);
        const result = await dashboardAPI.updateDashboardDefinition(
          projectId,
          dashboardId,
          definition
        );

        if (result.success) {
          console.log("Dashboard updated successfully");
        } else {
          console.error("Failed to update dashboard:", result.error);
        }
      } catch (error) {
        console.error("Failed to update dashboard:", error);
      }
    },
    500, // 500ms 디바운스
    false
  );

  // ===== 대시보드 복제 함수 =====
  /**
   * 현재 대시보드를 복제하여 새로운 대시보드 생성
   * 주로 LANGFUSE 기본 대시보드를 사용자 대시보드로 복제할 때 사용
   */
  const handleCloneDashboard = async () => {
    if (!projectId || !dashboardId) return;

    try {
      const result = await dashboardAPI.cloneDashboard(projectId, dashboardId);

      if (result.success) {
        console.log("Dashboard cloned successfully");
        // 복제된 대시보드로 이동
        navigate(`/project/${projectId}/dashboards/${result.data.id}`);
      } else {
        alert(`Failed to clone dashboard: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to clone dashboard: ${error.message}`);
    }
  };

  // ===== 날짜 범위 변경 핸들러 =====
  /**
   * DateRangePicker에서 날짜 범위가 변경되었을 때 호출
   * @param {Object} newDateRange - { startDate: Date, endDate: Date }
   */
  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  // ===== 위젯 추가 함수 =====
  /**
   * 새로운 위젯을 대시보드에 추가
   * 자동으로 기존 위젯들 아래에 배치
   * @param {Object} widget - 추가할 위젯 정보
   */
  const addWidgetToDashboard = useCallback(
    (widget) => {
      if (!localDashboardDefinition) return;

      console.log("[DashboardDetail] 위젯 추가:", widget);

      // 기존 위젯들의 최대 Y 위치를 찾아서 그 아래에 새 위젯 배치
      const maxY =
        localDashboardDefinition.widgets.length > 0
          ? Math.max(
              ...localDashboardDefinition.widgets.map((w) => w.y + w.y_size)
            )
          : 0;

      // 새 위젯 배치 정보 생성
      const newWidgetPlacement = {
        id: uuidv4(), // 고유 ID 생성
        widgetId: widget.id,
        x: 0, // 왼쪽부터 시작
        y: maxY, // 기존 위젯들 아래에 배치
        x_size: 6, // 가로 크기 (그리드 기준)
        y_size: 6, // 세로 크기 (그리드 기준)
        type: "widget",
      };

      // 업데이트된 레이아웃으로 상태 변경
      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: [...localDashboardDefinition.widgets, newWidgetPlacement],
      };

      setLocalDashboardDefinition(updatedDefinition);
      debouncedSaveDashboard(updatedDefinition); // 자동 저장
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  // ===== 위젯 삭제 함수 =====
  /**
   * 지정된 위젯을 대시보드에서 삭제
   * @param {string} tileId - 삭제할 위젯의 타일 ID
   */
  const handleDeleteWidget = useCallback(
    (tileId) => {
      if (!localDashboardDefinition) return;

      // 해당 위젯을 제외한 나머지 위젯들로 새 배열 생성
      const updatedWidgets = localDashboardDefinition.widgets.filter(
        (widget) => widget.id !== tileId
      );

      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };

      setLocalDashboardDefinition(updatedDefinition);
      debouncedSaveDashboard(updatedDefinition); // 자동 저장
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  // ===== 그리드 레이아웃 변경 핸들러 =====
  /**
   * 사용자가 위젯을 드래그하거나 리사이즈했을 때 호출
   * @param {Array} updatedWidgets - 변경된 위젯 배치 정보 배열
   */
  const handleGridChange = useCallback(
    (updatedWidgets) => {
      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };

      setLocalDashboardDefinition(updatedDefinition);
      debouncedSaveDashboard(updatedDefinition); // 자동 저장
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  // ===== 위젯 추가 다이얼로그 열기 =====
  const handleAddWidget = () => {
    setIsWidgetDialogOpen(true);
  };

  // ===== 초기 데이터 로딩 Effect =====
  // 컴포넌트가 마운트되거나 URL 파라미터가 변경될 때 대시보드 로드
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 필터 옵션 로딩 Effect
  // 프로젝트 ID가 변경될 때 필터 옵션들을 새로 로드
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // ===== 로딩 상태 렌더링 =====
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          Loading dashboard...
          {filterOptionsLoading && <div>Loading filter options...</div>}
        </div>
      </div>
    );
  }

  // ===== 에러 상태 렌더링 =====
  if (error || !dashboard) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          {error || "Dashboard not found"}
        </div>
      </div>
    );
  }

  // ===== 메인 렌더링 =====
  return (
    <div className={styles.container}>
      {/* ===== 헤더 영역 ===== */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{dashboard.name}</h1>
          {dashboard.description && (
            <p className={styles.description}>{dashboard.description}</p>
          )}
        </div>

        {/* 헤더 액션 버튼들 */}
        <div className={styles.actions}>
          {/* 복제 버튼 (LANGFUSE 대시보드만) */}
          {hasCloneAccess && (
            <button
              className={styles.secondaryButton}
              onClick={handleCloneDashboard}
            >
              <Copy size={16} /> Clone
            </button>
          )}

          {/* 위젯 추가 버튼 (편집 권한이 있을 때만) */}
          {hasCUDAccess && (
            <button className={styles.primaryButton} onClick={handleAddWidget}>
              <Plus size={16} /> Add Widget
            </button>
          )}
        </div>
      </div>

      {/* ===== 필터 영역 ===== */}
      <div className={styles.filterSection}>
        {/* 기존 DateRangePicker는 DashboardFilterControls를 통해 유지 */}
        <DashboardFilterControls
          dateRange={dateRange}
          onDateChange={handleDateRangeChange}
          // ❌ 기존 필터 관련 props 제거 (더 이상 FilterBuilder를 사용하지 않음)
          // onFilterChange={handleFilterChange}
          // environmentOptions={environmentOptions}
          // nameOptions={nameOptions}
          // tagsOptions={tagsOptions}
        />

        {/* ✅ 새로 추가: 프롬프트에서 검증된 FilterControls 사용 */}
        <FilterControls
          builderFilterProps={{
            filters: builderFilters,
            onFilterChange: setBuilderFilters,
            filterConfig: dynamicFilterConfig,
          }}
        />
      </div>

      {/* ===== 위젯 그리드 영역 ===== */}
      <div className={styles.gridContainer}>
        {localDashboardDefinition && (
          <DashboardGrid
            widgets={localDashboardDefinition.widgets || []}
            onChange={handleGridChange}
            canEdit={hasCUDAccess}
            dashboardId={dashboardId}
            projectId={projectId}
            dateRange={dateRange}
            filterState={builderFilters || []}
            onDeleteWidget={handleDeleteWidget}
            dashboardOwner={dashboard?.owner || "PROJECT"}
          />
        )}
      </div>

      {/* ===== 위젯 추가 다이얼로그 ===== */}
      {isWidgetDialogOpen && (
        <SelectWidgetDialog
          open={isWidgetDialogOpen}
          onOpenChange={setIsWidgetDialogOpen}
          projectId={projectId}
          onSelectWidget={addWidgetToDashboard}
        />
      )}
    </div>
  );
};

export default DashboardDetail;

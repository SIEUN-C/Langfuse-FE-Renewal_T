// src/Pages/Dashboards/DashboardDetail.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Copy } from "lucide-react";
import { dashboardAPI } from "./services/dashboardApi.js";
import { dashboardFilterConfig } from "../../components/FilterControls/filterConfig.js";
import DashboardGrid from "../Widget/component/DashboardGrid.jsx";
import DashboardFilterControls from "./components/DashboardFilterControls";
import FilterControls from "../../components/FilterControls/FilterControls";
import { SelectWidgetDialog } from "../Widget/component/SelectWidgetDialog.jsx";
import { useDebounce } from "./hooks/useDebounce";
import styles from "./DashboardDetail.module.css";
import { v4 as uuidv4 } from "uuid";

/**
 * 대시보드 상세 페이지
 * 위젯 그리드 관리, 필터링, 위젯 CRUD 기능 제공
 * 
 * 주요 기능:
 * - 위젯 그리드 레이아웃 (드래그 앤 드롭, 리사이즈)
 * - 날짜 범위 및 고급 필터링
 * - 위젯 추가/삭제
 * - 대시보드 복제 (LANGFUSE 소유 시)
 */
const DashboardDetail = () => {
  const { projectId, dashboardId } = useParams();
  const navigate = useNavigate();

  // 기본 상태
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 날짜 범위 (기본: 최근 7일)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // 위젯 관리
  const [localDashboardDefinition, setLocalDashboardDefinition] = useState(null);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [userFilterState, setUserFilterState] = useState([]);

  // 필터 시스템
  const [filterState, setFilterState] = useState([]);

  // FilterControls 컴포넌트용 필터 상태
  const [builderFilters, setBuilderFilters] = useState(() => {
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

  // 필터 옵션 데이터
  const [environmentOptions, setEnvironmentOptions] = useState([]);
  const [nameOptions, setNameOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // API 옵션을 기본 필터 설정에 동적 추가
  const dynamicFilterConfig = useMemo(() => {
    return dashboardFilterConfig.map((config) => {
      if (config.key === "environment") {
        return { ...config, options: environmentOptions };
      }
      if (config.key === "traceName") {
        return { ...config, options: nameOptions };
      }
      if (config.key === "tags") {
        return { ...config, options: tagsOptions };
      }
      return config;
    });
  }, [environmentOptions, nameOptions, tagsOptions]);

  // 권한 체크
  const hasCUDAccess = dashboard?.owner !== "LANGFUSE";
  const hasCloneAccess = dashboard?.owner === "LANGFUSE";

  // 필터 변경 핸들러 (기존 API 호환용)
  const handleFilterChange = useCallback(
    (newFilters) => {
      let actualFilters;

      if (typeof newFilters === "function") {
        actualFilters = newFilters(filterState);
      } else if (Array.isArray(newFilters)) {
        actualFilters = newFilters;
      } else {
        console.error("newFilters is neither array nor function:", newFilters);
        return;
      }

      setFilterState(actualFilters);

      // API용 필터 변환
      const apiFilters = actualFilters.map((filter) => {
        const config = dashboardFilterConfig.find(
          (c) => c.key === filter.column
        );
        const filterType = config?.type || "string";

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
    },
    [filterState]
  );

  // 필터 옵션 로딩
  const loadFilterOptions = useCallback(async () => {
    if (!projectId) return;

    setFilterOptionsLoading(true);

    const defaultEnvironmentOptions = ["default"];
    const defaultNameOptions = [];
    const defaultTagsOptions = [];

    try {
      const [traceOptions, envOptions] = await Promise.all([
        dashboardAPI.getTraceFilterOptions(projectId),
        dashboardAPI.getEnvironmentFilterOptions(projectId),
      ]);

      // Trace 필터 옵션 처리
      if (traceOptions.success && traceOptions.data) {
        setNameOptions(traceOptions.data.name || defaultNameOptions);
        setTagsOptions(traceOptions.data.tags || defaultTagsOptions);
      } else {
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
      } else {
        setEnvironmentOptions(defaultEnvironmentOptions);
      }
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      setEnvironmentOptions(defaultEnvironmentOptions);
      setNameOptions(defaultNameOptions);
      setTagsOptions(defaultTagsOptions);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [projectId]);

  // 대시보드 로딩
  const loadDashboard = useCallback(async () => {
    if (!projectId || !dashboardId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dashboardAPI.getDashboard(projectId, dashboardId);

      if (result.success) {
        setDashboard(result.data);
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

  // 위젯 레이아웃 자동 저장 (500ms 디바운스)
  const debouncedSaveDashboard = useDebounce(
    async (definition) => {
      if (!hasCUDAccess || !projectId || !dashboardId) return;

      try {
        const result = await dashboardAPI.updateDashboardDefinition(
          projectId,
          dashboardId,
          definition
        );

        if (!result.success) {
          console.error("Failed to update dashboard:", result.error);
        }
      } catch (error) {
        console.error("Failed to update dashboard:", error);
      }
    },
    500,
    false
  );

  // 대시보드 복제
  const handleCloneDashboard = async () => {
    if (!projectId || !dashboardId) return;

    try {
      const result = await dashboardAPI.cloneDashboard(projectId, dashboardId);

      if (result.success) {
        navigate(`/project/${projectId}/dashboards/${result.data.id}`);
      } else {
        alert(`Failed to clone dashboard: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to clone dashboard: ${error.message}`);
    }
  };

  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  // 위젯을 대시보드에 추가 (기존 위젯들 아래에 배치)
  const addWidgetToDashboard = useCallback(
    (widget) => {
      if (!localDashboardDefinition) return;

      // 기존 위젯들의 최대 Y 위치 계산
      const maxY =
        localDashboardDefinition.widgets.length > 0
          ? Math.max(
              ...localDashboardDefinition.widgets.map((w) => w.y + w.y_size)
            )
          : 0;

      const newWidgetPlacement = {
        id: uuidv4(),
        widgetId: widget.id,
        x: 0,
        y: maxY,
        x_size: 6,
        y_size: 6,
        type: "widget",
      };

      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: [...localDashboardDefinition.widgets, newWidgetPlacement],
      };

      setLocalDashboardDefinition(updatedDefinition);
      debouncedSaveDashboard(updatedDefinition);
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  const handleDeleteWidget = useCallback(
    (tileId) => {
      if (!localDashboardDefinition) return;

      const updatedWidgets = localDashboardDefinition.widgets.filter(
        (widget) => widget.id !== tileId
      );

      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };

      setLocalDashboardDefinition(updatedDefinition);
      debouncedSaveDashboard(updatedDefinition);
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  // 그리드 레이아웃 변경 시
  const handleGridChange = useCallback(
    (updatedWidgets) => {
      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };

      setLocalDashboardDefinition(updatedDefinition);
      debouncedSaveDashboard(updatedDefinition);
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  const handleAddWidget = () => {
    setIsWidgetDialogOpen(true);
  };

  // 초기 데이터 로딩
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

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

  if (error || !dashboard) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          {error || "Dashboard not found"}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{dashboard.name}</h1>
          {dashboard.description && (
            <p className={styles.description}>{dashboard.description}</p>
          )}
        </div>

        <div className={styles.actions}>
          {/* LANGFUSE 대시보드만 복제 가능 */}
          {hasCloneAccess && (
            <button
              className={styles.secondaryButton}
              onClick={handleCloneDashboard}
            >
              <Copy size={16} /> Clone
            </button>
          )}

          {/* 편집 권한이 있을 때만 위젯 추가 */}
          {hasCUDAccess && (
            <button className={styles.primaryButton} onClick={handleAddWidget}>
              <Plus size={16} /> Add Widget
            </button>
          )}
        </div>
      </div>

      {/* 필터 */}
      <div className={styles.filterSection}>
        <DashboardFilterControls
          dateRange={dateRange}
          onDateChange={handleDateRangeChange}
        />

        <FilterControls
          builderFilterProps={{
            filters: builderFilters,
            onFilterChange: setBuilderFilters,
            filterConfig: dynamicFilterConfig,
          }}
        />
      </div>

      {/* 위젯 그리드 */}
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

      {/* 위젯 추가 다이얼로그 */}
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
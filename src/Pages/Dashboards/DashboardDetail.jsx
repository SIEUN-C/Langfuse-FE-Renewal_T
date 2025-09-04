import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Plus, Copy } from "lucide-react";
import { dashboardAPI } from "./services/dashboardApi.js";
import { dashboardFilterConfig } from "../../components/FilterControls/filterConfig.js";
import DashboardGrid from "../Widget/component/DashboardGrid.jsx";
import DashboardFilterControls from "./components/DashboardFilterControls";
import { SelectWidgetDialog } from "../Widget/component/SelectWidgetDialog.jsx";
import { useDebounce } from "./hooks/useDebounce";
import styles from "./DashboardDetail.module.css";
import { v4 as uuidv4 } from "uuid";

const DashboardDetail = () => {
  const { projectId, dashboardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 기본 상태
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // 위젯 관리
  const [localDashboardDefinition, setLocalDashboardDefinition] = useState(null);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [userFilterState, setUserFilterState] = useState([]);

  // 필터 처리 관리
  const [filterState, setFilterState] = useState([]);

  // 필터 옵션 상태 관리 - API에서 가져옴
  const [environmentOptions, setEnvironmentOptions] = useState([]);
  const [nameOptions, setNameOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // 위젯 자동 추가 상태
  const [widgetAddProcessed, setWidgetAddProcessed] = useState(false);

  // ✅ 강제 리렌더링을 위한 상태 추가
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  // 권한 체크
  const hasCUDAccess = dashboard?.owner !== "LANGFUSE";
  const hasCloneAccess = dashboard?.owner === "LANGFUSE";

  // 필터 변경 핸들러 - API 형식으로 변환
  const handleFilterChange = useCallback((newFilters) => {
    console.log('Received newFilters:', typeof newFilters, newFilters);
    
    let actualFilters;
    
    // newFilters가 함수인 경우 (React setter 패턴)
    if (typeof newFilters === 'function') {
      actualFilters = newFilters(filterState);
    } else if (Array.isArray(newFilters)) {
      actualFilters = newFilters;
    } else {
      console.error('newFilters is neither array nor function:', newFilters);
      return;
    }
    
    // 원본 필터 상태 저장
    setFilterState(actualFilters);
    
    // API용 필터 변환 (type 필드 추가)
    const apiFilters = actualFilters.map(filter => {
      // filterConfig에서 해당 컬럼의 type 찾기
      const config = dashboardFilterConfig.find(c => c.key === filter.column);
      const filterType = config?.type || 'string';
      
      // API 형식에 맞게 변환
      let apiFilter = {
        column: filter.column,
        type: filterType === 'categorical' ? 'stringOptions' : filterType,
        operator: filter.operator,
        value: filter.value,
        key: filter.metaKey || null
      };
      
      // categorical 타입은 value를 배열로 변환
      if (filterType === 'categorical' && typeof filter.value === 'string') {
        apiFilter.value = filter.value ? filter.value.split(',') : [];
      }
      
      return apiFilter;
    });
    
    console.log('Converted filters for API:', apiFilters);
  }, [filterState]);

  // 필터 옵션 로딩 함수
  const loadFilterOptions = useCallback(async () => {
    if (!projectId) return;

    setFilterOptionsLoading(true);
    
    // 기본값 설정 (에러 발생 시 사용)
    const defaultEnvironmentOptions = ['default'];
    const defaultNameOptions = [];
    const defaultTagsOptions = [];

    try {
      console.log('Loading filter options...');
      
      const [traceOptions, envOptions] = await Promise.all([
        dashboardAPI.getTraceFilterOptions(projectId),
        dashboardAPI.getEnvironmentFilterOptions(projectId)
      ]);
      
      // Trace 필터 옵션 처리
      if (traceOptions.success && traceOptions.data) {
        setNameOptions(traceOptions.data.name || defaultNameOptions);
        setTagsOptions(traceOptions.data.tags || defaultTagsOptions);
        console.log('Trace filter options loaded:', traceOptions.data);
      } else {
        console.warn('Failed to load trace options, using defaults');
        setNameOptions(defaultNameOptions);
        setTagsOptions(defaultTagsOptions);
      }
      
      // Environment 필터 옵션 처리
      if (envOptions.success && envOptions.data) {
        setEnvironmentOptions(envOptions.data.length > 0 ? envOptions.data : defaultEnvironmentOptions);
        console.log('Environment filter options loaded:', envOptions.data);
      } else {
        console.warn('Failed to load environment options, using defaults');
        setEnvironmentOptions(defaultEnvironmentOptions);
      }
      
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      // 에러 발생 시 기본값 사용
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

  // ✅ 디바운스된 대시보드 저장 함수 - 시간 단축 및 에러 처리 개선
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
          // ✅ 저장 성공 후 상태 동기화
          setLocalDashboardDefinition(definition);
        } else {
          console.error("Failed to update dashboard:", result.error);
          // ✅ 저장 실패 시 이전 상태로 롤백
          loadDashboard();
        }
      } catch (error) {
        console.error("Failed to update dashboard:", error);
        // ✅ 에러 시 롤백
        loadDashboard();
      }
    },
    200, // ✅ 500ms → 200ms로 단축
    false
  );

  // 대시보드 복제
  const handleCloneDashboard = async () => {
    if (!projectId || !dashboardId) return;

    try {
      const result = await dashboardAPI.cloneDashboard(projectId, dashboardId);

      if (result.success) {
        console.log("Dashboard cloned successfully");
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

  // ✅ 위젯 추가 - 즉시 UI 업데이트
  const addWidgetToDashboard = useCallback(
    (widget) => {
      if (!localDashboardDefinition) return;

      console.log("[DashboardDetail] 위젯 추가:", widget);

      // 최대 Y 위치 찾기
      const maxY =
        localDashboardDefinition.widgets.length > 0
          ? Math.max(
              ...localDashboardDefinition.widgets.map((w) => w.y + w.y_size)
            )
          : 0;

      // 새 위젯 배치
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

      // ✅ 즉시 UI 업데이트
      setLocalDashboardDefinition(updatedDefinition);
      
      // ✅ 강제 리렌더링을 위한 key 업데이트
      setForceRefreshKey(prev => prev + 1);
      
      // ✅ 백그라운드에서 저장
      debouncedSaveDashboard(updatedDefinition);
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  // 위젯 삭제
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

      // ✅ 즉시 UI 업데이트
      setLocalDashboardDefinition(updatedDefinition);
      
      // ✅ 강제 리렌더링
      setForceRefreshKey(prev => prev + 1);
      
      debouncedSaveDashboard(updatedDefinition);
    },
    [localDashboardDefinition, debouncedSaveDashboard]
  );

  // 그리드 레이아웃 변경 처리
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

  // 위젯 추가 다이얼로그
  const handleAddWidget = () => {
    setIsWidgetDialogOpen(true);
  };

  // 초기 로딩
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 필터 옵션 로딩
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // ✅ 새 위젯 자동 추가 기능 - 개선된 로직
  useEffect(() => {
    if (location.state?.refreshDashboard && 
        location.state?.addWidgetId && 
        !widgetAddProcessed &&
        localDashboardDefinition) {
      
      console.log("위젯 자동 추가 프로세스 시작:", location.state.addWidgetId);
      
      // ✅ 즉시 처리 완료 표시
      setWidgetAddProcessed(true);
      
      // 중복 위젯 체크
      const existingWidget = localDashboardDefinition.widgets.find(
        w => w.widgetId === location.state.addWidgetId
      );
      
      if (!existingWidget) {
        // ✅ 즉시 위젯 추가 (UI 우선)
        const widgetToAdd = { id: location.state.addWidgetId };
        addWidgetToDashboard(widgetToAdd);
        console.log("위젯 자동 추가 완료:", location.state.addWidgetId);
        
        // ✅ 성공 피드백
        setTimeout(() => {
          console.log("위젯이 대시보드에 추가되었습니다!");
        }, 100);
      } else {
        console.log("위젯이 이미 존재함, 추가 생략:", location.state.addWidgetId);
      }
      
      // ✅ state 정리 (즉시)
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.refreshDashboard, location.state?.addWidgetId, widgetAddProcessed, localDashboardDefinition, addWidgetToDashboard]);

  // 로딩 상태
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

  // 에러 상태
  if (error || !dashboard) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          {error || "Dashboard not found"}
        </div>
      </div>
    );
  }

  // ✅ 위젯 개수 계산
  const widgetCount = localDashboardDefinition?.widgets?.length || 0;

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            {dashboard.name} ({widgetCount} widgets)
            {dashboard.owner === "LANGFUSE" && " (Langfuse Maintained)"}
          </h1>
          {dashboard.description && (
            <p className={styles.description}>{dashboard.description}</p>
          )}
        </div>
        <div className={styles.actions}>
          {hasCUDAccess && (
            <button className={styles.addButton} onClick={handleAddWidget}>
              <Plus size={16} />
              Add Widget
            </button>
          )}
          {hasCloneAccess && (
            <button
              className={styles.cloneButton}
              onClick={handleCloneDashboard}
            >
              <Copy size={16} />
              Clone
            </button>
          )}
        </div>
      </div>

      {/* 필터 컨트롤 */}
      <div className={styles.filters}>
        <DashboardFilterControls
          dateRange={dateRange}
          onDateChange={handleDateRangeChange}
          onFilterChange={handleFilterChange}
          environmentOptions={environmentOptions}
          nameOptions={nameOptions}
          tagsOptions={tagsOptions}
        />
      </div>

      {/* 대시보드 그리드 */}
      <div className={styles.mainContent}>
        {localDashboardDefinition?.widgets?.length > 0 ? (
          <DashboardGrid
            key={forceRefreshKey} // ✅ 강제 리렌더링
            widgets={localDashboardDefinition.widgets}
            onChange={handleGridChange}
            canEdit={hasCUDAccess}
            dashboardId={dashboardId}
            projectId={projectId}
            dateRange={dateRange}
            filterState={filterState}
            onDeleteWidget={handleDeleteWidget}
            dashboardOwner={dashboard.owner}
          />
        ) : (
          <div className={styles.emptyContent}></div>
        )}
      </div>

      {/* 위젯 선택 다이얼로그 */}
      <SelectWidgetDialog
        open={isWidgetDialogOpen}
        onOpenChange={setIsWidgetDialogOpen}
        projectId={projectId}
        onSelectWidget={addWidgetToDashboard}
        dashboardId={dashboardId}
      />
    </div>
  );
};

export default DashboardDetail;
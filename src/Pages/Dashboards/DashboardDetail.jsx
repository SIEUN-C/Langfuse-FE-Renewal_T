import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Copy } from "lucide-react";
import { dashboardAPI } from "./services/dashboardApi.js";
import DashboardGrid from "./components/DashboardGrid";
import DashboardFilterControls from "./components/DashboardFilterControls";
import { SelectWidgetDialog } from './Widgets/SelectWidgetDialog';
import styles from "./DashboardDetail.module.css";
import { v4 as uuidv4 } from "uuid";

const DashboardDetail = () => {
  const { projectId, dashboardId } = useParams();
  const navigate = useNavigate();

  // 기본 상태 (원본 방식)
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // 위젯 관리 (원본과 동일)
  const [localDashboardDefinition, setLocalDashboardDefinition] =
    useState(null);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [userFilterState, setUserFilterState] = useState([]);

  // 권한 체크 (원본과 동일)
  const hasCUDAccess = dashboard?.owner !== "LANGFUSE";
  const hasCloneAccess = dashboard?.owner === "LANGFUSE";

  // 대시보드 로딩 (원본 방식을 API로 변환)
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

  // 대시보드 정의 저장 (디바운스 적용)
  const saveDashboardChanges = useCallback(
    async (definition) => {
      if (!hasCUDAccess) return;
      
      try {
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
    [projectId, dashboardId, hasCUDAccess]
  );

  // 대시보드 복제 (원본과 동일한 로직)
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

  // 위젯 추가 (원본과 동일한 로직 + API 저장)
  const addWidgetToDashboard = useCallback(
    async (widget) => {
      if (!localDashboardDefinition) return;

      console.log('[DashboardDetail] 위젯 추가:', widget);

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

      setLocalDashboardDefinition(updatedDefinition);
      
      // 백엔드에 저장
      await saveDashboardChanges(updatedDefinition);
    },
    [localDashboardDefinition, saveDashboardChanges]
  );

  // 위젯 삭제 (원본과 동일 + API 저장)
  const handleDeleteWidget = useCallback(
    async (tileId) => {
      if (!localDashboardDefinition) return;

      const updatedWidgets = localDashboardDefinition.widgets.filter(
        (widget) => widget.id !== tileId
      );

      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };

      setLocalDashboardDefinition(updatedDefinition);
      
      // 백엔드에 저장
      await saveDashboardChanges(updatedDefinition);
    },
    [localDashboardDefinition, saveDashboardChanges]
  );

  // 그리드 레이아웃 변경 처리 (드래그&드롭)
  const handleGridChange = useCallback(
    async (updatedWidgets) => {
      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };
      
      setLocalDashboardDefinition(updatedDefinition);
      
      // 백엔드에 저장
      await saveDashboardChanges(updatedDefinition);
    },
    [localDashboardDefinition, saveDashboardChanges]
  );

  // 위젯 추가 다이얼로그
  const handleAddWidget = () => {
    setIsWidgetDialogOpen(true);
  };

  // 초기 로딩
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading dashboard...</div>
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

  return (
    <div className={styles.container}>
      {/* 헤더 (원본과 동일한 구조) */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            {dashboard.name}
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

      {/* 필터 컨트롤 영역 (간소화) */}
      <div className={styles.filters}>
        <DashboardFilterControls
          dateRange={dateRange}
          onDateChange={handleDateRangeChange}
        />
      </div>

      {/* 대시보드 그리드 */}
      <div className={styles.mainContent}>
        {localDashboardDefinition?.widgets?.length > 0 ? (
          <DashboardGrid
            widgets={localDashboardDefinition.widgets}
            onChange={handleGridChange}
            canEdit={hasCUDAccess}
            dashboardId={dashboardId}
            projectId={projectId}
            dateRange={dateRange}
            filterState={userFilterState}
            onDeleteWidget={handleDeleteWidget}
            dashboardOwner={dashboard.owner}
          />
        ) : (
          // 빈 상태 (원본과 동일)
          <div className={styles.emptyState}>
            <div className={styles.emptyStateContent}>
              <div className={styles.emptyIcon}>
                <Plus size={48} />
              </div>
              <h2 className={styles.emptyTitle}>No widgets yet</h2>
              <p className={styles.emptyDescription}>
                Start building your dashboard by adding your first widget.
              </p>
              {hasCUDAccess && (
                <button
                  className={styles.emptyStateButton}
                  onClick={handleAddWidget}
                >
                  <Plus size={16} />
                  Add Widget
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SelectWidgetDialog 사용 */}
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
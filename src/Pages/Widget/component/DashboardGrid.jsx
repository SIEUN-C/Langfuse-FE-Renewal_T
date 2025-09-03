import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import DashboardWidget from "./DashboardWidget";
import styles from './DashboardGrid.module.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Hook to detect screen size
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

const DashboardGrid = ({
  widgets,
  onChange,
  canEdit,
  dashboardId,
  projectId,
  dateRange,
  filterState,
  onDeleteWidget,
  dashboardOwner,
}) => {
  // 위젯 높이를 더 컴팩트하게 설정
  const [rowHeight, setRowHeight] = useState(100); // 150 → 100으로 변경

  // Detect if screen is medium or smaller (1024px and below)
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");

  const handleWidthChange = useCallback(
    (containerWidth) => {
      const calculatedRowHeight = ((containerWidth / 12) * 9) / 16;
      // 최대 높이 제한을 추가하여 너무 큰 위젯 방지
      const finalRowHeight = Math.min(calculatedRowHeight, 200); // 최대 120px로 제한
      if (finalRowHeight !== rowHeight) {
        setRowHeight(finalRowHeight);
      }
    },
    [rowHeight],
  );

  // Convert widget format to react-grid-layout format
  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.x_size,
    h: w.y_size,
    isDraggable: canEdit && !isSmallScreen,
    minW: 2,
    minH: 2, // 최소 높이 유지
  }));

  const handleLayoutChange = (newLayout) => {
    // Safety checks: prevent layout changes on small screens and when editing is disabled
    if (!canEdit || isSmallScreen) return;
    
    if (!newLayout || newLayout.length === 0) return;

    // Update widget positions based on the new layout
    const updatedWidgets = widgets.map((w) => {
      const layoutItem = newLayout.find((item) => item.i === w.id);
      if (!layoutItem) return w;

      return {
        ...w,
        x: layoutItem.x,
        y: layoutItem.y,
        x_size: layoutItem.w,
        y_size: layoutItem.h,
      };
    });

    onChange(updatedWidgets);
  };

  // Render flex layout for small screens
  if (isSmallScreen) {
    return (
      <div className={styles.mobileLayout}>
        {widgets
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((widget) => (
            <div
              key={widget.id}
              className={styles.mobileWidget}
              style={{ height: "400px" }} // 300px → 250px로 줄임
            >
              <DashboardWidget
                dashboardId={dashboardId}
                projectId={projectId}
                placement={widget}
                dateRange={dateRange}
                filterState={filterState}
                onDeleteWidget={onDeleteWidget}
                dashboardOwner={dashboardOwner || "PROJECT"}
              />
            </div>
          ))}
      </div>
    );
  }

  // Render grid layout for larger screens
  return (
    <div className={styles.gridContainer}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        margin={[16, 16]}
        rowHeight={rowHeight} // 동적으로 계산된 더 작은 높이 사용
        isDraggable={canEdit}
        isResizable={canEdit}
        onDragStop={handleLayoutChange}
        onResizeStop={handleLayoutChange}
        onWidthChange={handleWidthChange}
        draggableHandle=".drag-handle"
        useCSSTransforms
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="max-h-full max-w-full">
            <DashboardWidget
              dashboardId={dashboardId}
              projectId={projectId}
              placement={widget}
              dateRange={dateRange}
              filterState={filterState}
              onDeleteWidget={onDeleteWidget}
              dashboardOwner={dashboardOwner || "PROJECT"}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardGrid;
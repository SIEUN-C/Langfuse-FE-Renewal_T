import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import DashboardWidget from "../DashboardWidget";
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
  }, [query]); // matches 의존성 제거 (원본과 동일하게)

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
  const [rowHeight, setRowHeight] = useState(150);

  // Detect if screen is medium or smaller (1024px and below)
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");

  const handleWidthChange = useCallback(
    (containerWidth) => {
      const calculatedRowHeight = ((containerWidth / 12) * 9) / 16;
      if (calculatedRowHeight !== rowHeight) {
        setRowHeight(calculatedRowHeight);
      }
    },
    [rowHeight],
  );

  // Convert widget format to react-grid-layout format
  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.x, // 원본처럼 직접 사용 (|| 0 제거)
    y: w.y, // 원본처럼 직접 사용 (|| 0 제거)
    w: w.x_size, // 원본처럼 직접 사용 (fallback 제거)
    h: w.y_size, // 원본처럼 직접 사용 (fallback 제거)
    isDraggable: canEdit && !isSmallScreen,
    minW: 2,
    minH: 2,
  }));

  const handleLayoutChange = (newLayout) => {
    // Safety checks: prevent layout changes on small screens and when editing is disabled
    // This prevents unintended saves during responsive transitions or on mobile devices
    if (!canEdit || isSmallScreen) return;

    // Additional safety: ensure the layout change is meaningful
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
          .sort((a, b) => a.y - b.y || a.x - b.x) // 원본처럼 fallback 없이
          .map((widget) => (
            <div
              key={widget.id}
              className={styles.mobileWidget}
              style={{ height: "300px" }} // 원본처럼 fixed height 추가
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
        className="layout" // 원본처럼 간단한 className 사용
        layouts={{ lg: layout }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        margin={[16, 16]}
        rowHeight={rowHeight}
        isDraggable={canEdit}
        isResizable={canEdit}
        onDragStop={handleLayoutChange} // Save immediately when drag stops
        onResizeStop={handleLayoutChange} // Save immediately when resize stops
        onWidthChange={handleWidthChange}
        draggableHandle=".drag-handle"
        useCSSTransforms
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="max-h-full max-w-full"> {/* 원본처럼 Tailwind 클래스 */}
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
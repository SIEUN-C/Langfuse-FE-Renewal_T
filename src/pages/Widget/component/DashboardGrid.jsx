// src/Pages/Widget/component/DashboardGrid.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import DashboardWidget from "./DashboardWidget";
import styles from './DashboardGrid.module.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * 화면 크기 감지 훅
 * @param {string} query - CSS 미디어 쿼리 문자열
 * @returns {boolean} 미디어 쿼리와 매치되는지 여부
 */
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

/**
 * 대시보드 위젯 그리드 컴포넌트
 * 반응형 그리드 레이아웃으로 위젯들을 배치하고 드래그 앤 드롭 지원
 * 작은 화면에서는 플렉스 레이아웃으로 전환
 * 
 * @param {Array} widgets - 위젯 배치 정보 배열
 * @param {Function} onChange - 레이아웃 변경 시 콜백
 * @param {boolean} canEdit - 편집 가능 여부
 * @param {string} dashboardId - 대시보드 ID
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} dateRange - 날짜 범위
 * @param {Array} filterState - 필터 상태
 * @param {Function} onDeleteWidget - 위젯 삭제 콜백
 * @param {string} dashboardOwner - 대시보드 소유자
 */
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
  const [rowHeight, setRowHeight] = useState(100);

  // 1024px 이하에서는 모바일 레이아웃 사용
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");

  // 컨테이너 너비에 따른 동적 행 높이 계산
  const handleWidthChange = useCallback(
    (containerWidth) => {
      const calculatedRowHeight = ((containerWidth / 12) * 9) / 16;
      // 최대 높이 제한으로 너무 큰 위젯 방지
      const finalRowHeight = Math.min(calculatedRowHeight, 200);
      if (finalRowHeight !== rowHeight) {
        setRowHeight(finalRowHeight);
      }
    },
    [rowHeight],
  );

  // 위젯 데이터를 react-grid-layout 형식으로 변환
  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.x_size,
    h: w.y_size,
    isDraggable: canEdit && !isSmallScreen,
    minW: 2,
    minH: 2,
  }));

  const handleLayoutChange = (newLayout) => {
    // 작은 화면이거나 편집 불가능한 경우 변경 방지
    if (!canEdit || isSmallScreen) return;
    
    if (!newLayout || newLayout.length === 0) return;

    // 새 레이아웃에 따라 위젯 위치 업데이트
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

  // 모바일 화면: 세로 나열 레이아웃
  if (isSmallScreen) {
    return (
      <div className={styles.mobileLayout}>
        {widgets
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((widget) => (
            <div
              key={widget.id}
              className={styles.mobileWidget}
              style={{ height: "400px" }}
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

  // 데스크톱 화면: 그리드 레이아웃
  return (
    <div className={styles.gridContainer}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        margin={[16, 16]}
        rowHeight={rowHeight}
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
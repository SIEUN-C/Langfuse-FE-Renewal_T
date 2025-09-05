import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/DataTable/DataTable.jsx';
import { Plus, X } from 'lucide-react';
import { startCase } from 'lodash';
import { WidgetsAPI } from '../services/widgets.js';
import styles from './SelectWidgetDialog.module.css';

// 위젯 API 클라이언트 인스턴스 생성
const widgetsAPI = new WidgetsAPI();

// 차트 타입 표시명 매핑 (나중에 위젯팀 유틸리티로 교체)
const getChartTypeDisplayName = (chartType) => {
  const typeMap = {
    'LINE_TIME_SERIES': 'Line Chart (Time Series)',
    'BAR_TIME_SERIES': 'Bar Chart (Time Series)',
    'BAR': 'Bar Chart',
    'LINE': 'Line Chart',
    'PIE': 'Pie Chart',
    'TABLE': 'Table',
    'PIVOT_TABLE': 'Pivot Table'
  };
  return typeMap[chartType] || chartType || 'Unknown';
};

export const SelectWidgetDialog = ({
  open,
  onOpenChange,
  projectId,
  onSelectWidget,
  dashboardId
}) => {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [error, setError] = useState(null);

  // 위젯 목록 로딩
  useEffect(() => {
    if (open && projectId) {
      loadWidgets();
    }
  }, [open, projectId]);

  const loadWidgets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SelectWidgetDialog] 위젯 목록 로딩 시작:', projectId);
      
      // 위젯팀 API 사용
      const result = await widgetsAPI.getWidgets(projectId, 1, 50, 'DESC');
      
      console.log('[SelectWidgetDialog] API 응답:', result);
      
      if (result.error) {
        setError(result.error);
        setWidgets([]);
      } else {
        const widgetData = Array.isArray(result.data) ? result.data : [];
        setWidgets(widgetData);
        console.log('[SelectWidgetDialog] 위젯 데이터 설정 완료:', widgetData.length, '개');
      }
    } catch (error) {
      console.error("[SelectWidgetDialog] Failed to load widgets:", error);
      setError(error.message || 'Failed to load widgets');
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  };

  // 새 위젯 생성 페이지로 이동 
  const handleCreateNewWidget = () => {
    navigate(`/project/${projectId}/widgets/new?dashboardId=${dashboardId}`);
    onOpenChange(false);
    setSelectedWidget(null);
  };

  // 위젯 선택 처리
  const handleAddSelectedWidget = () => {
    if (selectedWidget) {
      console.log('[SelectWidgetDialog] 선택된 위젯:', selectedWidget);
      onSelectWidget(selectedWidget);
      onOpenChange(false);
      setSelectedWidget(null);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    onOpenChange(false);
    setSelectedWidget(null);
    setError(null);
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!open) return null;

  // DataTable 컬럼 정의
  const widgetColumns = [
    {
      header: "Name",
      accessor: (row) => (
        <span className={styles.widgetName} title={row.name}>
          {row.name || 'Unnamed Widget'}
        </span>
      )
    },
    {
      header: "Description",
      accessor: (row) => (
        <span className={styles.description} title={row.description}>
          {row.description || <em>No description</em>}
        </span>
      )
    },
    {
      header: "View Type",
      accessor: (row) => startCase(row.view?.toLowerCase() || row.viewType?.toLowerCase() || 'unknown')
    },
    {
      header: "Chart Type",
      accessor: (row) => getChartTypeDisplayName(row.chartType)
    }
  ];

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div 
        className={styles.modalContent} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>Select widget to add</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              Loading widgets...
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚠️</div>
              <h3>위젯 로딩 실패</h3>
              <p>{error}</p>
              <button 
                className={styles.createButton} 
                onClick={loadWidgets}
                style={{ marginTop: '12px' }}
              >
                다시 시도
              </button>
            </div>
          ) : widgets.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📊</div>
              <h3>No widgets found</h3>
              <p>Create a new widget to get started.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <DataTable
                columns={widgetColumns}
                data={widgets}
                keyField="id"
                selectedRowKey={selectedWidget?.id}
                onRowClick={setSelectedWidget}
                renderEmptyState={() => <div>No widgets available.</div>}
                showFavorite={false}
              />
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button 
            className={styles.createButton}
            onClick={handleCreateNewWidget}
          >
            <Plus size={16} />
            Create New Widget
          </button>
          
          <div className={styles.rightButtons}>
            <button 
              className={styles.cancelButton}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              className={styles.addButton}
              onClick={handleAddSelectedWidget}
              disabled={!selectedWidget}
            >
              Add Selected Widget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
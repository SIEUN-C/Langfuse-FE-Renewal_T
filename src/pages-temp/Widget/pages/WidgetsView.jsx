// src/Pages/Widget/pages/WidgetsView.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "../../../components/DataTable/DataTable.jsx";
import { Bot, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import styles from "../../Dashboards/Dashboards.module.css";

// Widget API
import { WidgetsAPI } from '../services/widgets.js';
// 공통 유틸
import { dashboardUtils } from "../../Dashboards/services/dashboardApi.js";

export const WidgetsView = () => {
  const { projectId } = useParams();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });

  // WidgetsAPI 인스턴스 생성
  const widgetServices = useMemo(() => new WidgetsAPI(), []);

  useEffect(() => {
    loadWidgets();
  }, [projectId]);

  const loadWidgets = async () => {
    try {
      setLoading(true);
      const res = await widgetServices.getWidgets(
        String(projectId),
        1,
        50,
        "DESC"
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      setWidgets(rows);
      
      // 디버깅용 로그
      if (import.meta.env.DEV) {
        console.log("불러온 위젯:", rows);
        if (rows[0]) {
          console.log("첫 번째 위젯:", rows[0]);
          console.log("설명 있나?", !!rows[0].description);
        }
      }
    } catch (err) {
      console.error("위젯 가져오기 실패:", err);
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (widgetId, widgetName) => {
    if (!confirm(`"${widgetName}" 위젯을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await widgetServices.deleteWidget(String(projectId), widgetId);
      
      if (result.success) {
        // 성공적으로 삭제되면 목록에서 제거
        setWidgets(prevWidgets => prevWidgets.filter(w => w.id !== widgetId));
        
        // 선택적: 성공 메시지 표시
        console.log("위젯이 성공적으로 삭제되었습니다.");
      } else {
        alert(`위젯 삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("위젯 삭제 중 오류:", error);
      alert(`위젯 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const sortedWidgets = React.useMemo(() => {
    const sortableItems = [...widgets];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === "updatedAt" || sortConfig.key === "createdAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [widgets, sortConfig]);

  // 간단한 설명 렌더링
  const renderDescription = (row) => {
    if (row.description && row.description.trim()) {
      return row.description;
    }
    return <em style={{ color: "#64748b" }}>No description</em>;
  };

  const columns = [
    {
      header: "Name",
      accessor: (row) => (
        <Link
          to={`/project/${projectId}/widgets/${row.id}`}
          className={styles.dashboardLink}
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: "Description",
      accessor: renderDescription,
    },
    {
      header: "Owner",
      accessor: (row) => (
        <div className={styles.ownerCell}>
          <Bot size={16} />
          <span>{row.owner === "LANGFUSE" ? "Langfuse" : "Project"}</span>
        </div>
      ),
    },
    {
      header: "Chart Type",
      accessor: (row) => row.chartType || <em>-</em>,
    },
    {
      header: "Created At",
      accessor: (row) => dashboardUtils.formatDate(row.createdAt),
    },
    {
      header: (
        <div
          className={styles.sortableHeader}
          onClick={() => handleSort("updatedAt")}
        >
          Updated At
          {sortConfig.key === "updatedAt" ? (
            sortConfig.direction === "asc" ? (
              <ChevronUp size={14} className={styles.sortIconActive} />
            ) : (
              <ChevronDown size={14} className={styles.sortIconActive} />
            )
          ) : (
            <ChevronDown size={14} className={styles.sortIcon} />
          )}
        </div>
      ),
      accessor: (row) => dashboardUtils.formatDate(row.updatedAt),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className={styles.actionsCell}>
          <button
            className={styles.iconButton}
            onClick={() => handleDelete(row.id, row.name)}
            title="Delete widget"
            disabled={row.owner === "LANGFUSE"} // Langfuse 소유 위젯은 삭제 불가
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div>위젯 로딩중...</div>;

  return (
    <DataTable
      columns={columns}
      data={sortedWidgets}
      keyField="id"
      showFavorite={false}
      renderEmptyState={() => <div>위젯이 없습니다.</div>}
      pagination={{
        enabled: true,
        pageSize: 50,
        pageSizeOptions: [10, 20, 30, 50],
        position: "fixed-bottom"
      }}
    />
  );
};
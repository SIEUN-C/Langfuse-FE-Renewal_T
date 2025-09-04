// src/Pages/Widget/pages/WidgetsView.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "../../../components/DataTable/DataTable.jsx";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
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
  ];

  if (loading) return <div>위젯 로딩중...</div>;

  return (
    <DataTable
      columns={columns}
      data={sortedWidgets}
      keyField="id"
      renderEmptyState={() => <div>위젯이 없습니다.</div>}
    />
  );
};
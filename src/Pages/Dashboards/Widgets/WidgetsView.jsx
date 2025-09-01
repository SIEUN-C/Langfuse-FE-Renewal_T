// src/Pages/Dashboards/WidgetsView.jsx
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "../../../components/DataTable/DataTable.jsx";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import styles from "../Dashboards.module.css";

// Widget API (default export: WidgetAPI 인스턴스)
import widgetServices from "./services/widgetsAPI.js";
// 공통 유틸
import { dashboardUtils } from "../services/dashboardApi.js";

export const WidgetsView = () => {
  const { projectId } = useParams(); // ✅ URL에서 projectId 가져오기
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });

  useEffect(() => {
    loadWidgets();
  }, [projectId]); // ✅ projectId 바뀌면 다시 로드

  const loadWidgets = async () => {
    try {
      setLoading(true);
      // ✅ projectId 전달 (문자열)
      const res = await widgetServices.getWidgets(
        String(projectId),
        1,
        50,
        "DESC"
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      setWidgets(rows);
    } catch (err) {
      console.error("Failed to fetch widgets:", err);
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
      accessor: (row) =>
        row.description || <em style={{ color: "#64748b" }}>No description</em>,
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

  if (loading) return <div>Loading widgets...</div>;

  return (
    <DataTable
      columns={columns}
      data={sortedWidgets}
      keyField="id"
      renderEmptyState={() => <div>No widgets found.</div>}
    />
  );
};

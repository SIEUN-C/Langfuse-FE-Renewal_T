// src/Pages/Dashboards/DashboardsView.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "../../components/DataTable/DataTable.jsx";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";
import styles from "./Dashboards.module.css";
import { dashboardAPI, dashboardUtils } from "./services/dashboardApi.js";
import { EditDashboardDialog } from "./components/EditDashboardDialog";

/**
 * 액션 드롭다운 컴포넌트
 * 대시보드별 편집/복제/삭제 액션을 제공
 * LANGFUSE 소유 대시보드는 편집/삭제 불가
 */
const ActionDropdown = ({ row, onEdit, onClone, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLangfuseOwned = row.owner === "LANGFUSE";

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleActionClick = (action) => {
    action(row);
    setIsOpen(false);
  };

  return (
    <div className={styles.actionDropdown} ref={dropdownRef}>
      <button
        className={styles.actionButton}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* Edit: 프로젝트 소유 대시보드만 */}
          {!isLangfuseOwned && (
            <button
              className={styles.dropdownItem}
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick(onEdit);
              }}
            >
              <Edit size={14} />
              Edit
            </button>
          )}
          
          {/* Clone: 모든 대시보드 */}
          <button
            className={styles.dropdownItem}
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick(onClone);
            }}
          >
            <Copy size={14} />
            Clone
          </button>
          
          {/* Delete: 프로젝트 소유 대시보드만 */}
          {!isLangfuseOwned && (
            <button
              className={`${styles.dropdownItem} ${styles.deleteItem}`}
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick(onDelete);
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 대시보드 목록 뷰 컴포넌트
 * 대시보드 CRUD 기능과 정렬 기능 제공
 */
export const DashboardsView = () => {
  const { projectId } = useParams();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });

  // 편집 다이얼로그 상태
  const [editDialog, setEditDialog] = useState({
    open: false,
    dashboard: null,
  });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const result = await dashboardAPI.getAllDashboards(projectId);

      if (result.success) {
        setDashboards(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboards:", err);
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

  // 정렬된 대시보드 목록
  const sortedDashboards = React.useMemo(() => {
    const sortableItems = [...dashboards];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // 날짜 필드 정렬
        if (sortConfig.key === "updatedAt" || sortConfig.key === "createdAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [dashboards, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown size={14} className={styles.sortIcon} />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className={styles.sortIconActive} />
    ) : (
      <ChevronDown size={14} className={styles.sortIconActive} />
    );
  };

  const handleEdit = (dashboard) => {
    setEditDialog({
      open: true,
      dashboard,
    });
  };

  // 편집 성공 시 목록 업데이트
  const handleEditSuccess = (updatedDashboard) => {
    setDashboards((prev) =>
      prev.map((dashboard) =>
        dashboard.id === updatedDashboard.id
          ? { ...dashboard, ...updatedDashboard }
          : dashboard
      )
    );
  };

  const handleClone = async (dashboard) => {
    try {
      const result = await dashboardAPI.cloneDashboard(projectId, dashboard.id);

      if (result.success) {
        await loadDashboards();
        // TODO: 성공 토스트 메시지 표시
      } else {
        alert(`Failed to clone dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cloning dashboard:", error);
      alert("An error occurred while cloning the dashboard");
    }
  };

  const handleDelete = async (dashboard) => {
    if (
      !window.confirm(`Are you sure you want to delete "${dashboard.name}"?`)
    ) {
      return;
    }

    try {
      const result = await dashboardAPI.deleteDashboard(projectId, dashboard.id);

      if (result.success) {
        await loadDashboards();
        // TODO: 성공 토스트 메시지 표시
      } else {
        alert(`Failed to delete dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      alert("An error occurred while deleting the dashboard");
    }
  };

  const columns = [
    {
      header: "Name",
      accessor: (row) => (
        <Link
          to={`/project/${projectId}/dashboards/${row.id}`}
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
      header: "Created At",
      accessor: (row) => dashboardUtils.formatDate(row.createdAt),
    },
    {
      header: (
        <div
          className={styles.sortableHeader}
          onClick={() => handleSort("updatedAt")}
        >
          Updated At {getSortIcon("updatedAt")}
        </div>
      ),
      accessor: (row) => dashboardUtils.formatDate(row.updatedAt),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <ActionDropdown
          row={row}
          onEdit={handleEdit}
          onClone={handleClone}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  if (loading) {
    return <div>Loading dashboards...</div>;
  }

  return (
    <>
      {/* 대시보드 테이블 - 페이지네이션 포함 */}
      <DataTable
        columns={columns}
        data={sortedDashboards} // 전체 데이터 전달, 페이징은 내부에서 처리
        keyField="id"
        showActions={false}
        showFavorite={false}
        showCheckbox={false}
        renderEmptyState={() => <div>No dashboards found.</div>}
        // 페이지네이션 활성화 및 페이지 하단 고정
        pagination={{
          enabled: true,
          pageSize: 50,
          pageSizeOptions: [10, 20, 30, 50],
          position: "fixed-bottom"
        }}
      />

      {/* 편집 다이얼로그 */}
      <EditDashboardDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, dashboard: null })}
        projectId={projectId}
        dashboardId={editDialog.dashboard?.id}
        initialName={editDialog.dashboard?.name || ""}
        initialDescription={editDialog.dashboard?.description || ""}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};
import { useOutletContext } from "react-router-dom";
import {
  listScoreConfigs,
  createScoreConfig,
  updateScoreConfigStatus,
} from "./lib/scoreApiTrpc.js";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";

import {
  Plus,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import commonStyles from "./layout/SettingsCommon.module.css";
import gridStyles from "./layout/SettingsGrid.module.css";
import CustomPagination from "./CustomPagination.jsx";
import ColumnMenu from "../../layouts/ColumnMenu.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import NewScoreForm from "./form/NewScoreForm.jsx";

import stylesScores from "./layout/Scores.module.css";

/** 서버 응답 → 그리드 데이터 매핑 */
const transformApiToGridData = (apiData = []) => {
  return apiData.map((item) => {
    let range = "";

    if (item.dataType === "NUMERIC") {
      // 보기 좋게 객체로 저장 → 렌더러에서 Min/Max로 출력
      range = { Minimum: item.minValue ?? "-∞", Maximum: item.maxValue ?? "∞" };
    } else if (item.dataType === "CATEGORICAL" && item.categories) {
      range = item.categories.reduce((acc, cat) => {
        acc[String(cat.value)] = cat.label;
        return acc;
      }, {});
    } else if (item.dataType === "BOOLEAN" && item.categories) {
      range = item.categories.reduce((acc, cat) => {
        acc[String(cat.value)] = cat.label;
        return acc;
      }, {});
    }

    return {
      id: item.id,
      configID: item.id,
      name: item.name,
      dataType: item.dataType,
      range,
      description: item.description ?? "",
      projectId: item.projectId,
      createdAt: new Date(item.createdAt).toLocaleDateString(),
      status: item.isArchived ? "Archived" : "Active",
    };
  });
};

/** Range Renderer: NUMERIC은 Min/Max, 나머진 JSON pretty */
const RangeRenderer = ({ value }) => {
  let text = "";
  if (value && typeof value === "object") {
    if ("Minimum" in value && "Maximum" in value) {
      text = `Min: ${value.Minimum}, Max: ${value.Maximum}`;
    } else {
      text = JSON.stringify(value, null, 2);
    }
  } else {
    text = String(value ?? "");
  }
  return <div className={stylesScores.rangeCell}>{text}</div>;
};

/** Status Renderer: 배지 스타일 */
const StatusRenderer = ({ value }) => (
  <span
    className={`${stylesScores.status} ${
      value === "Active" ? stylesScores.statusActive : stylesScores.statusArchived
    }`}
  >
    {value}
  </span>
);

/** Actions Renderer: Archive/Restore 토글 */
const ActionsRenderer = (props) => {
  const { data, onToggleStatus } = props;
  const Icon = data?.status === "Active" ? Archive : ArchiveRestore;
  const tooltip =
    data?.status === "Active" ? "Archive this score" : "Restore this score";

  return (
    <button
      onClick={() => onToggleStatus?.(data.id, data.status)}
      className={stylesScores.actionBtn}
      title={tooltip}
    >
      <Icon size={16} />
    </button>
  );
};

const COLUMN_DEFINITIONS = [
  { 
    field: "name", 
    headerName: "Name", 
    flex: 2, 
    resizable: true, 
    sortable: true,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    headerClass: 'ag-header-cell-center'
  },
  { 
    field: "dataType", 
    headerName: "Data Type", 
    flex: 2, 
    resizable: true, 
    sortable: true,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    headerClass: 'ag-header-cell-center'
  },
    {
    field: "range",
    headerName: "Range",
    cellRenderer: RangeRenderer,
    flex: 6,
    resizable: true,
    autoHeight: true,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center'  // flex-start → center로 변경
    },
    headerClass: 'ag-header-cell-center'  // ag-header-cell-left → center로 변경
  },
  {
    field: "description",
    headerName: "Description",
    flex: 4,
    resizable: true,
    cellClass: stylesScores.descCell,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center'  // flex-start → center로 변경
    },
    headerClass: 'ag-header-cell-center'  // ag-header-cell-left → center로 변경
  },
  {
    field: "status",
    headerName: "Status",
    flex: 2,
    resizable: true,
    sortable: true,
    cellRenderer: StatusRenderer,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    headerClass: 'ag-header-cell-center'
  },
  {
    field: "actions",
    headerName: "Action",
    cellRenderer: ActionsRenderer,
    flex: 1,
    resizable: false,
    sortable: false,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    headerClass: 'ag-header-cell-center'
  },
];

const Scores = () => {
  // SettingsPage에서 Outlet context로 projectId를 전달받음
  const { projectId } = useOutletContext();

  const gridRef = useRef(null);
  const [gridApi, setGridApi] = useState(null);
  const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnButtonRef = useRef(null);

  const [rowData, setRowData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [scoreToToggle, setScoreToToggle] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 페이지네이션 상태 (UI는 1-based)
  const [paginationMeta, setPaginationMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  /** 목록 조회 */
  const fetchScoreConfigs = useCallback(
    async (page1, limit) => {
      setIsLoading(true);
      setError(null);
      try {
        if (!projectId) throw new Error("No projectId");

        // UI(1-based) → 서버(0-based)
        const page0 = Math.max(0, (page1 ?? 1) - 1);

        const res = await listScoreConfigs(projectId, page0, limit);
        const gridData = transformApiToGridData(res.data || []);
        setRowData(gridData);
        setPaginationMeta(res.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setRowData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (projectId) fetchScoreConfigs(currentPage, limit);
  }, [projectId, currentPage, limit, fetchScoreConfigs]);

  /** Archive/Restore 모달 오픈 */
  const handleToggleRequest = useCallback((id, currentStatus) => {
    setScoreToToggle({ id, status: currentStatus });
    setIsToggleModalOpen(true);
  }, []);

  /** Archive/Restore 확정 */
  const handleConfirmToggle = async () => {
    if (scoreToToggle !== null) {
      const isArchived = scoreToToggle.status === "Active";
      try {
        await updateScoreConfigStatus(projectId, scoreToToggle.id, isArchived);
        fetchScoreConfigs(currentPage, limit);
      } catch (err) {
        console.error("Failed to toggle status:", err);
        alert(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setScoreToToggle(null);
        setIsToggleModalOpen(false);
      }
    }
  };

  /** 생성 */
  const handleCreateScore = async (formData) => {
    try {
      const payload = { ...formData };

      // NUMERIC: 문자열로 들어온 min/max를 숫자로 캐스팅
      if (payload.dataType === "NUMERIC") {
        if (payload.minValue !== undefined && payload.minValue !== "")
          payload.minValue = Number(payload.minValue);
        if (payload.maxValue !== undefined && payload.maxValue !== "")
          payload.maxValue = Number(payload.maxValue);
      }

      await createScoreConfig(projectId, payload);
      setIsModalOpen(false);
      fetchScoreConfigs(currentPage, limit);
    } catch (err) {
      console.error("Failed to create score config:", err);
      alert(`Error: ${err instanceof Error ? err.message : "An unknown error occurred"}`);
    }
  };

  /** 컬럼 토글 상태 */
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility = {};
    COLUMN_DEFINITIONS.forEach((col) => {
      if (col.field) initialVisibility[col.field] = !col.initialHide;
    });
    return initialVisibility;
  });

  const toggleColumnVisibility = (field) => {
    const columnDef = COLUMN_DEFINITIONS.find((c) => c.field === field);
    if (columnDef?.lockVisible) return;
    setColumnVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAllColumns = (select) => {
    const newVisibility = { ...columnVisibility };
    COLUMN_DEFINITIONS.forEach((col) => {
      if (!col.lockVisible) newVisibility[col.field] = select;
    });
    setColumnVisibility(newVisibility);
  };

  const visibleColumnCount = useMemo(
    () => Object.values(columnVisibility).filter(Boolean).length,
    [columnVisibility]
  );

  const mandatoryFields = useMemo(
    () => COLUMN_DEFINITIONS.filter((c) => c.lockVisible).map((c) => c.field),
    []
  );

  const columnDisplayNames = useMemo(
    () =>
      COLUMN_DEFINITIONS.reduce((acc, col) => {
        if (col.field) acc[col.field] = col.headerName;
        return acc;
      }, {}),
    []
  );

  const columnDefs = useMemo(
    () =>
      COLUMN_DEFINITIONS.map((col) => ({
        ...col,
        hide: !columnVisibility[col.field],
        cellRendererParams:
          col.field === "actions" ? { onToggleStatus: handleToggleRequest } : undefined,
      })),
    [columnVisibility, handleToggleRequest]
  );

  const icons = {
    paginationFirst: () => <ChevronsLeft size={18} />,
    paginationPrev: () => <ChevronLeft size={18} />,
    paginationNext: () => <ChevronRight size={18} />,
    paginationLast: () => <ChevronsRight size={18} />,
  };

  const onGridReady = useCallback((event) => setGridApi(event.api), []);

  const modalInfo = useMemo(() => {
    if (!scoreToToggle) return { title: "", message: "", buttonText: "" };
    const isArchiving = scoreToToggle.status === "Active";
    return {
      title: isArchiving ? "Archive Score Config" : "Restore Score Config",
      message: `Are you sure you want to ${isArchiving ? "archive" : "restore"} this score config?`,
      buttonText: isArchiving ? "Archive" : "Restore",
    };
  }, [scoreToToggle]);

  if (isLoading) return <div className={commonStyles.container}>Loading...</div>;

  if (error)
    return (
      <div className={commonStyles.container}>
        Error: {error}{" "}
        <button onClick={() => fetchScoreConfigs(currentPage, limit)}>Retry</button>
      </div>
    );

  return (
    <div className={commonStyles.container}>
      <h3 className={commonStyles.title}>Score Configs</h3>
      <p className={commonStyles.p}>
        Score configs define which scores are available for annotation in your project. Please note that all
        score configs are immutable.
      </p>

      <div className={gridStyles.header}>
        <div ref={columnButtonRef} onClick={() => setIsColumnMenuOpen((prev) => !prev)}>
          <button className={`${gridStyles.headerButton} ${gridStyles.columnsButton}`}>
            <span>Columns</span>
            <span className={gridStyles.count}>
              {visibleColumnCount}/{COLUMN_DEFINITIONS.length}
            </span>
          </button>
          <ColumnMenu
            isOpen={isColumnMenuOpen}
            onClose={() => setIsColumnMenuOpen(false)}
            anchorE1={columnButtonRef}
            columnVisibility={columnVisibility}
            toggleColumnVisibility={toggleColumnVisibility}
            displayNames={columnDisplayNames}
            mandatoryFields={mandatoryFields}
            onToggleAll={toggleAllColumns}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`${gridStyles.headerButton} ${gridStyles.addButton}`}
        >
          <Plus size={16} /> Add new score config
        </button>
      </div>

      {/* ✅ 커스텀 테마 적용: ag-theme-alpine 제거 */}
      <div className={`${stylesScores.gridWrap} ${stylesScores.agThemeCustom}`}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          suppressRowClickSelection={true}
          icons={icons}
          rowHeight={96}
          onGridReady={onGridReady}
          domLayout="autoHeight"
        />
      </div>

      <Modal title="Add new score config" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <NewScoreForm onClose={() => setIsModalOpen(false)} onSave={handleCreateScore} />
      </Modal>

      <Modal title={modalInfo.title} isOpen={isToggleModalOpen} onClose={() => setIsToggleModalOpen(false)}>
        <div>
          <p>{modalInfo.message}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
            <button onClick={() => setIsToggleModalOpen(false)} className={gridStyles.headerButton}>
              Cancel
            </button>
            <button
              onClick={handleConfirmToggle}
              className={`${gridStyles.headerButton} ${
                scoreToToggle?.status === "Active" ? gridStyles.deleteButton : gridStyles.addButton
              }`}
            >
              {modalInfo.buttonText}
            </button>
          </div>
        </div>
      </Modal>

      {gridApi && paginationMeta && (
        <CustomPagination
          pageSizes={pageSizes}
          currentPage={paginationMeta.page}
          totalPages={paginationMeta.totalPages}
          totalItems={paginationMeta.totalItems}
          onPageChange={(page) => setCurrentPage(page)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default Scores;

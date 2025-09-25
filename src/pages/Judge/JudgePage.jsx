// src/Pages/Evaluation/Judge/JudgePage.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./JudgePage.module.css";
import EvaluatorsTable from "./components/EvaluatorsTable";
import EvaluatorLibrary from "./components/EvaluatorLibrary";
import EvaluationDetail from "./EvaluationDetail";
// 주석: 'react-router-dom'에서 useLocation 훅을 import합니다.
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import useProjectId from "hooks/useProjectId";
import { Pencil, Columns } from 'lucide-react';
import { getAllEvaluatorConfigs, getAllDatasetMeta, deleteEvalJob } from "./services/judgeApi";
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Toast from '../../components/Toast/Toast';
import { getDefaultModel, getTemplateEvaluators } from './services/libraryApi';
import SearchInput from 'components/SearchInput/SearchInput'
import FilterControls from "components/FilterControls/FilterControls";
import { sessionsFilterConfig } from 'components/FilterControls/filterConfig.js';
import FilterButton from 'components/FilterButton/FilterButton'
import { getEvaluatorColumns } from "./components/EvaluatorColumns";
import { getEvaluatorLibraryColumns } from "./components/EvaluatorLibraryColumns"
import ColumnVisibilityModal from "components/ColumnVisibilityModal/ColumnVisibilityModal";
import { useColumnVisibility } from "hooks/useColumnVisibility";
import { colorSchemeDark } from "ag-grid-community";

const JudgePage = () => {
  const [activeTab, setActiveTab] = useState("running");
  const [evaluators, setEvaluators] = useState([]);
  const [evaluatorLibrary, setEvaluatorLibrary] = useState([]);
  const [datasetMap, setDatasetMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
// 주석: useLocation hook을 사용하여 현재 경로 정보를 가져오고,
  //       상세 패널 DOM을 참조하기 위한 ref를 생성합니다.
  const location = useLocation();
  const panelRef = useRef(null);
  const peekId = searchParams.get('peek')
  const [defaultModel, setDefaultModel] = useState(null);
  const [isColumnVisibleModalOpen, setIsColumnVisibleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("Name")
  const [builderFilters, setBuilderFilters] = useState(() => {
    const initialColumn = sessionsFilterConfig[0];
    return [{ id: 1, column: initialColumn.key, operator: initialColumn.operators[0], value: '', metaKey: '' }];
  });
  const builderFilterProps = {
    filters: builderFilters,
    onFilterChange: setBuilderFilters,
    filterConfig: sessionsFilterConfig
  };
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [evaluatorsResponse, datasetsResponse, modelResponse] = await Promise.all([
        getAllEvaluatorConfigs({ projectId }),
        getAllDatasetMeta({ projectId }),
        getDefaultModel(projectId),
      ]);

      const configs = evaluatorsResponse.configs ?? [];
      setEvaluators(configs);

      const datasets = datasetsResponse ?? [];
      const newDatasetMap = new Map();
      datasets.forEach(dataset => newDatasetMap.set(dataset.id, dataset.name));
      setDatasetMap(newDatasetMap);

      setDefaultModel(modelResponse);

    } catch (error) {
      console.error("데이터를 가져오는 중 에러 발생:", error);
      setEvaluators([]);
      setDatasetMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchLibraryData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await getTemplateEvaluators(projectId);
      setEvaluatorLibrary(data ?? []);
    } catch (error) {
      console.error('Failed to fetch evaluator library', error);
      setEvaluatorLibrary([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "running") {
      fetchData();
    } else if (activeTab === 'library') {
      fetchLibraryData();
    }
  }, [activeTab, fetchData, fetchLibraryData]);

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEvaluatorToDelete(null);
  };

  // ========================[수정 2: useEffect로 컬럼 재생성]========================
  // 주석: projectId나 datasetMap이 변경될 때마다 컬럼 정의를 업데이트합니다.
  //       이렇게 하면 비동기 데이터 로딩 후에도 컬럼이 올바르게 설정됩니다.
  //       또한, handleOpenDeleteModal을 useCallback으로 감싸서 불필요한 재실행을 방지합니다.
  const handleOpenDeleteModal = useCallback((evaluator) => {
    setEvaluatorToDelete(evaluator);
    setIsDeleteModalOpen(true);
  }, []);

  const handleUseEvaluator = useCallback((evaluator) => {
    navigate(`/llm-as-a-judge/evals/new/${evaluator.id}`);
  }, [navigate]);

  const handleEditEvaluator = useCallback((evaluator) => {
    navigate(`/llm-as-a-judge/edit/${evaluator.id}`);
  }, [navigate]);

  const handleActionEdit = (evaluator) => {
    navigate(`/llm-as-a-judge/evals/edit/${evaluator.id}`);
  }

  const handleConfirmDelete = async () => {
    if (!evaluatorToDelete) return;
    try {
      await deleteEvalJob({
        projectId,
        evalConfigId: evaluatorToDelete.id,
      });
      handleCloseDeleteModal();
      showToast('Running evaluator deleted');
      fetchData();
    } catch (error) {
      console.error("삭제 중 에러 발생:", error);
      showToast('Failed to delete evaluator', 'error');
    }
  };

  const handleRowClick = (row) => {
    const next = new URLSearchParams(searchParams);
    next.set('peek', row.id);
    setSearchParams(next, { replace: true });
  };

  // 주석: useCallback으로 감싸 불필요한 재선언을 방지합니다.
  const handleClosePanel = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('peek');
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // ========================[수정 시작 (2/5)]========================
  // 주석: 페이지 경로(location.pathname)가 변경될 때마다 패널을 닫습니다.
  useEffect(() => {
    handleClosePanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  // ========================[수정 끝 (2/5)]========================


  // ========================[수정 시작 (3/5)]========================
  // 주석: 패널 외부를 클릭했을 때 패널을 닫는 로직입니다.
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 테이블의 row 클릭은 무시하여 패널이 바로 다시 열리는 현상을 방지합니다.
      if (event.target.closest('tr')) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        handleClosePanel();
      }
    };
    if (peekId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [peekId, handleClosePanel]);
  // ========================[수정 끝 (3/5)]========================

  const handleSetupEvaluator = () => navigate(`setup`);
  const handleOpenDefaultModel = () => navigate(`default-model`);
  const handleCustomEvaluator = () => navigate(`custom`);

  const rawColumns = useMemo(() => {
    if (activeTab === 'running') {
      return getEvaluatorColumns(projectId, datasetMap, handleOpenDeleteModal, handleActionEdit);
    }
    if (activeTab === 'library') {
      return getEvaluatorLibraryColumns({
        onUse: handleUseEvaluator,
        onEdit: handleEditEvaluator
      });
    }
    return [];
  }, [activeTab, projectId, datasetMap, handleOpenDeleteModal, handleUseEvaluator, handleEditEvaluator]);

    const {
    columns,
    visibleColumns,
    toggleColumnVisibility,
    setAllColumnsVisible,
    restoreDefaults,
  } = useColumnVisibility(rawColumns);

  const filteredEvaluators = useMemo(() => {
    if (!searchValue) {
      return evaluators;
    }
    return evaluators.filter(evaluator =>
      evaluator.scoreName && typeof evaluator.scoreName === 'string' &&
      evaluator.scoreName.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [evaluators, searchValue]);

  const filteredLibrary = useMemo(() => {
    if (!searchValue) {
      return evaluatorLibrary;
    }
    return evaluatorLibrary.filter(item =>
      item.name?.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [evaluatorLibrary, searchValue]);

  return (
    <div className={styles.pageLayout}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>LLM-as-a-judge</h1>

          <div className={styles.actions}>
            {defaultModel ? (
              <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
                {defaultModel.provider} / {defaultModel.model} <Pencil size={16} />
              </button>
            ) : (
              <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
                Default model not found <Pencil size={16} />
              </button>
            )}

            <button onClick={handleCustomEvaluator} className={styles.setupButton}>
              + Custom Evaluator
            </button>
            <button onClick={handleSetupEvaluator} className={styles.setupButton}>
              + Set up evaluator
            </button>
          </div>
        </header>

        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "running" ? styles.active : ""}`}
            onClick={() => setActiveTab("running")}
          >
            Running Evaluators
          </button>
          <button
            className={`${styles.tab} ${activeTab === "library" ? styles.active : ""}`}
            onClick={() => setActiveTab("library")}
          >
            Evaluator Library
          </button>
        </nav>

        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <SearchInput
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              searchType={searchType}
              setSearchType={setSearchType}
              searchTypes={["Name"]}
            />
          </div>
          {activeTab === "running" && (
            <FilterControls
              builderFilterProps={builderFilterProps}
            />
          )}
          <FilterButton onClick={() => setIsColumnVisibleModalOpen(true)}>
            <Columns size={16} /> Columns ({visibleColumns.length}/{columns.length})
          </FilterButton>
        </div>
        <ColumnVisibilityModal
          isOpen={isColumnVisibleModalOpen}
          onClose={() => setIsColumnVisibleModalOpen(false)}
          columns={columns}
          toggleColumnVisibility={toggleColumnVisibility}
          setAllColumnsVisible={setAllColumnsVisible}
          onRestoreDefaults={restoreDefaults}
        />

        <main className={styles.content}>
          {activeTab === "running" ? (
            <EvaluatorsTable
              data={filteredEvaluators}
              columns={visibleColumns}
              onRowClick={handleRowClick}
              isLoading={isLoading}
              datasetMap={datasetMap}
              projectId={projectId}
              onDeleteClick={handleOpenDeleteModal}
            />
          ) : (
            <EvaluatorLibrary
              data={filteredLibrary}
              columns={visibleColumns}
              onUse={handleUseEvaluator}
              onEdit={handleEditEvaluator}
            />
          )}
        </main>
      </div>

      {/* 주석: 상세 패널을 감싸는 div에 위에서 생성한 ref를 연결합니다. */}
      {peekId && (
        <div className={styles.peekPanel} ref={panelRef}>
          <EvaluationDetail onClose={handleClosePanel} />
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        evaluator={evaluatorToDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default JudgePage;
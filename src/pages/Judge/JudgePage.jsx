// src/Pages/Evaluation/Judge/JudgePage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./JudgePage.module.css";
import EvaluatorsTable from "./components/EvaluatorsTable";
import EvaluatorLibrary from "./components/EvaluatorLibrary";
import EvaluationDetail from "./EvaluationDetail";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProjectId from "hooks/useProjectId";
import { Pencil, Columns } from 'lucide-react';
import { getAllEvaluatorConfigs, getAllDatasetMeta, deleteEvalJob } from "./services/judgeApi";
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Toast from '../../components/Toast/Toast';
import { getDefaultModel } from './services/libraryApi';
import SearchInput from 'components/SearchInput/SearchInput'
import FilterControls from "components/FilterControls/FilterControls";
import { sessionsFilterConfig } from 'components/FilterControls/filterConfig.js';
import FilterButton from 'components/FilterButton/FilterButton'
import { getEvaluatorColumns } from "./components/EvaluatorColumns";
import ColumnVisibilityModal from "pages/Tracing/components/ColumnVisibilityModal";

const JudgePage = () => {
  const [activeTab, setActiveTab] = useState("running");
  const [evaluators, setEvaluators] = useState([]);
  const [datasetMap, setDatasetMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // ========================[수정 1: 컬럼 상태 초기화]========================
  // 주석: columns 상태를 빈 배열로 초기화합니다.
  //       useEffect를 사용하여 projectId나 datasetMap이 변경될 때마다 컬럼을 다시 계산하도록 합니다.
  const [columns, setColumns] = useState([]);
  // ========================[수정 끝]========================

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

  useEffect(() => {
    if (activeTab === "running") {
      fetchData();
    }
  }, [activeTab, fetchData]);

  // ========================[수정 2: useEffect로 컬럼 재생성]========================
  // 주석: projectId나 datasetMap이 변경될 때마다 컬럼 정의를 업데이트합니다.
  //       이렇게 하면 비동기 데이터 로딩 후에도 컬럼이 올바르게 설정됩니다.
  //       또한, handleOpenDeleteModal을 useCallback으로 감싸서 불필요한 재실행을 방지합니다.
  const handleOpenDeleteModal = useCallback((evaluator) => {
    setEvaluatorToDelete(evaluator);
    setIsDeleteModalOpen(true);
  }, []);

  useEffect(() => {
    const newColumns = getEvaluatorColumns(
      projectId,
      datasetMap,
      handleOpenDeleteModal
    ).map(c => ({
      ...c,
      key: c.accessorKey || c.id,
      visible: columns.find(oldCol => (oldCol.accessorKey || oldCol.id) === (c.accessorKey || c.id))?.visible ?? true,
    }));
    setColumns(newColumns);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, datasetMap, handleOpenDeleteModal]);
  // ========================[수정 끝]========================

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEvaluatorToDelete(null);
  };

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

  const handleClosePanel = () => {
    searchParams.delete('peek');
    setSearchParams(searchParams);
  }

  const handleSetupEvaluator = () => navigate(`setup`);
  const handleOpenDefaultModel = () => navigate(`default-model`);
  const handleCustomEvaluator = () => navigate(`custom`);

  const toggleColumnVisibility = (key) => {
    setColumns(prev =>
      prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const setAllColumnsVisible = (visible) => {
    setColumns(prev => prev.map(col => ({ ...col, visible })));
  };

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const filteredEvaluators = useMemo(() => {
    if (!searchValue) {
      return evaluators;
    }
    return evaluators.filter(evaluator =>
      evaluator.scoreName && typeof evaluator.scoreName === 'string' &&
      evaluator.scoreName.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [evaluators, searchValue]);


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
          <FilterControls
            builderFilterProps={builderFilterProps}
          />
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
        />

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

        <main className={styles.content}>
          {activeTab === "running" ? (
            // ========================[수정 3: visibleColumns 전달]========================
            // 주석: EvaluatorsTable에 'columns' prop으로 'visibleColumns'를 전달합니다.
            <EvaluatorsTable
              data={filteredEvaluators}
              columns={visibleColumns} 
              onRowClick={handleRowClick}
              isLoading={isLoading}
              datasetMap={datasetMap}
              projectId={projectId}
              onDeleteClick={handleOpenDeleteModal}
            />
            // ========================[수정 끝]========================
          ) : (
            <EvaluatorLibrary />
          )}
        </main>
      </div>

      {peekId && (
        <div className={styles.peekPanel}>
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
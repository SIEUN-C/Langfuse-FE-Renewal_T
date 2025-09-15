// src/Pages/Evaluation/Judge/JudgePage.jsx

// ========================[수정 시작]========================
// 주석: fetchData 함수를 useEffect 밖에서도 사용하기 위해 useCallback을 import 합니다.
import React, { useState, useEffect, useCallback } from "react";
// ========================[수정 끝]========================
import styles from "./JudgePage.module.css";
import EvaluatorsTable from "./components/EvaluatorsTable";
import EvaluatorLibrary from "./components/EvaluatorLibrary";
import EvaluationDetail from "./EvaluationDetail";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProjectId from "hooks/useProjectId";
import { Pencil } from 'lucide-react';
// ========================[수정 시작]========================
// 주석: deleteEvalJob API와 새로 만든 모달, Toast 컴포넌트를 import합니다.
import { getAllEvaluatorConfigs, getAllDatasetMeta, deleteEvalJob } from "./services/judgeApi";
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Toast from '../../components/Toast/Toast'; // Toast 컴포넌트 경로
// ========================[수정 끝]========================
import { getDefaultModel } from './services/libraryApi';


const JudgePage = () => {
  const [activeTab, setActiveTab] = useState("running");
  const [evaluators, setEvaluators] = useState([]);
  // --- 추가: 데이터셋 ID와 이름을 매핑할 상태 추가 ---
  const [datasetMap, setDatasetMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
  const peekId = searchParams.get('peek')
  const [defaultModel, setDefaultModel] = useState(null);


// ========================[수정 시작]========================
  // 주석: 삭제 모달과 Toast 메시지를 위한 state를 추가합니다.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  // ========================[수정 끝]========================




  // ========================[수정 시작 (2/2)]========================
  // 주석: fetchData 함수를 useEffect 밖으로 꺼내고 useCallback으로 감쌌습니다.
  //       이렇게 하면 다른 함수(handleConfirmDelete)에서도 이 함수를 호출할 수 있게 되어
  //       'fetchData is not defined' 오류가 해결됩니다.
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
  }, [projectId]); // projectId가 바뀔 때만 함수가 새로 생성됩니다.
  // ========================[수정 끝 (2/2)]========================

  useEffect(() => {
    if (activeTab === "running") {
      fetchData();
    }
  }, [activeTab, fetchData]); // useEffect의 의존성 배열에 fetchData를 추가합니다.

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const handleOpenDeleteModal = (evaluator) => {
    setEvaluatorToDelete(evaluator);
    setIsDeleteModalOpen(true);
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
      fetchData(); // 이제 정상적으로 호출됩니다.
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

  return (
    <div className={styles.pageLayout}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className={styles.mainContent}>
        {/* ========================[수정 시작: 실수로 누락했던 헤더와 탭 복원]======================== */}
        <header className={styles.header}>
          <h1 className={styles.title}>LLM-as-a-judge</h1>

          <div className={styles.actions}>
            {defaultModel ? (
              <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
                {defaultModel.provider} / {defaultModel.model} <Pencil size={16} />
              </button>
            ) : (
              <button onClick={handleOpenDefaultModel} className={styles.iconButton}>
                No default model set <Pencil size={16} />
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
        {/* ========================[수정 끝]======================== */}

        <main className={styles.content}>
          {activeTab === "running" ? (
            <EvaluatorsTable
              data={evaluators}
              onRowClick={handleRowClick}
              isLoading={isLoading}
              datasetMap={datasetMap}
              projectId={projectId}
              onDeleteClick={handleOpenDeleteModal}
            />
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
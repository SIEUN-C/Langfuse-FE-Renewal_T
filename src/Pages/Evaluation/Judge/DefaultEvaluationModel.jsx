import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DefaultEvaluationModel.module.css";
import useProjectId from "hooks/useProjectId";
import { getDefaultModel } from "./services/libraryApi";
import { Check, Trash, Pencil } from 'lucide-react';
import DefaultModelModal from "./components/DefaultModelModal";

const DefaultEvaluationModel = () => {
  const navigate = useNavigate();
  const { projectId } = useProjectId();

  const [defaultModel, setDefaultModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchModelData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const modelData = await getDefaultModel(projectId);
      setDefaultModel(modelData);
    } catch (error) {
      console.error('기본 모델을 가져오는데 실패했습니다.', error);
      setDefaultModel(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchModelData();
  }, [fetchModelData]);

  // delete
  const handleDelete = () => {
    navigate(-1);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}></h1>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.formGroup}>
            <h2>Default Model</h2>
            <div className={styles.modelname}>
              {isLoading ? (
                <p>Loading default model...</p>
              ) : defaultModel ? (
                <p>
                  <Check size={16} /> Current default model:{" "}
                  <strong>
                    {defaultModel.provider} / {defaultModel.model}
                  </strong>
                </p>
              ) : (
                <p>Default model not found.</p>
              )}
            </div>
          </div>
        </main>
      </div >

      <footer className={styles.footer}>
        <button onClick={handleDelete} className={styles.deleteButton}>
          <Trash size={14} /> Delete
        </button>
        <button onClick={() => setIsModalOpen(true)} className={styles.editButton}>
          <Pencil size={14} /> Edit
        </button>
        <DefaultModelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          provider={defaultModel?.provider}
          modelName={defaultModel?.model}
          onUpdate={() => {
            setIsModalOpen(false);
            fetchModelData();
            alert('Updated!');
          }}
        />
      </footer>
    </div >
  );
};

export default DefaultEvaluationModel;
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DefaultEvaluationModel.module.css";
import useProjectId from "hooks/useProjectId";
import { getDefaultModel, deleteDefaultModel } from "./services/libraryApi";
import { Check, Trash, Pencil } from 'lucide-react';
import DefaultModelModal from "./components/DefaultModelModal";

const DefaultEvaluationModel = () => {
  const navigate = useNavigate();
  const { projectId } = useProjectId();

  const [defaultModel, setDefaultModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
      if (confirmText.trim().toLowerCase() !== 'delete' || isDeleting) return;
  
      setIsDeleting(true);
  
      try {
        await deleteDefaultModel(projectId);
  
        setConfirmText("");
        setIsDeleteModalOpen(false);
        
        fetchModelData();
        alert('기본 모델이 삭제되었습니다.')

      } catch (error) {
        console.error('기본 모델 삭제에 실패했습니다.', error);
      } finally {
        setIsDeleting(false);
      }
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
                <p>Default model not found</p>
              )}
            </div>
          </div>
        </main>
      </div >

      <footer className={styles.footer}>
        <button 
        onClick={() => setIsDeleteModalOpen(true)} 
        className={styles.deleteButton}
        disabled={!defaultModel || isLoading}
        >
          <Trash size={14} /> Delete
        </button>
        <button 
        onClick={() => setIsModalOpen(true)} 
        className={styles.editButton}
        disabled={isLoading}
        >
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
        {isDeleteModalOpen && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmModal}>
              <h3>Please confirm</h3>
              <p>
                Deleting this model might cause running evaluators to fail. 
                Please make sure you have no running evaluators relying on this model.
              </p>
              <label htmlFor="deleteInput">Type "delete" to confirm</label>
              <input
                id="deleteInput"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={styles.confirmInput}
              />
              <div className={styles.confirmActions}>
                <button
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  disabled={confirmText.trim().toLowerCase() !== 'delete' || isDeleting}
                  onClick={handleConfirmDelete}
                >
                  {isDeleting ? 'deleting...' : 'delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div >
  );
};

export default DefaultEvaluationModel;
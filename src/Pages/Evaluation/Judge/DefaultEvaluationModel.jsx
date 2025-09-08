import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DefaultEvaluationModel.module.css";
import useProjectId from "hooks/useProjectId";
import { getDefaultModel } from "./services/libraryApi"

const DefaultEvaluationModel = () => {
  const navigate = useNavigate();
  const { projectId } = useProjectId();

  const [defaultModel, setDefaultModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchModelData = async () => {
      try {
        const modelData = await getDefaultModel(projectId);
        setDefaultModel(modelData);
      } catch (error) {
        console.error("기본 모델을 가져오는 데 실패했습니다:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModelData();
  }, [projectId]);

  // edit
  const handleEdit = () => {
    navigate(-1);
  };

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
                // 👈 핵심: defaultModel에 데이터가 있을 때만 이 부분을 렌더링합니다.
                <p>
                  Current default model:{" "}
                  <strong>
                    {defaultModel.provider} / {defaultModel.model}
                  </strong>
                </p>
              ) : (
                // 데이터가 없거나 API 호출에 실패한 경우
                <p>Default model not found.</p>
              )}
            </div>
          </div>
        </main>
      </div >

      <footer className={styles.footer}>
        <button onClick={handleDelete} className={styles.cancelButton}>
          Delete
        </button>
        <button onClick={handleEdit} className={styles.saveButton}>
          Edit
        </button>
      </footer>
    </div >
  );
};

export default DefaultEvaluationModel;
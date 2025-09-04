import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DefaultEvaluationModel.module.css";
import useProjectId from "hooks/useProjectId";

const DefaultEvaluationModel = () => {
  const navigate = useNavigate();
  const { projectId } = useProjectId();

  const handleEdit = () => {
    navigate(-1); 
  };

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
            <p>Default Model</p>
            <p>Current default model: provider / model</p>
          </div>
        </main>
      </div>

      <footer className={styles.footer}>
        <button onClick={handleDelete} className={styles.cancelButton}>
          Delete
        </button>
        <button onClick={handleEdit} className={styles.saveButton}>
          Edit
        </button>
      </footer>
    </div>
  );
};

export default DefaultEvaluationModel;
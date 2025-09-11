// src/Pages/Evaluation/Judge/components/DeleteConfirmationModal.jsx (새 파일)

import React, { useState, useEffect } from 'react';
import styles from './DeleteConfirmationModal.module.css';

const DeleteConfirmationModal = ({ isOpen, onClose, evaluator, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');

  // 모달이 닫힐 때 입력 텍스트를 초기화합니다.
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen || !evaluator) {
    return null;
  }

  const isConfirmEnabled = confirmText === evaluator.scoreName;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Please confirm</h2>
        <p className={styles.description}>
          This action cannot be undone and removes all logs associated with this running evaluator.
          Scores produced by this evaluator will not be deleted.
        </p>
        <div className={styles.formGroup}>
          <label htmlFor="confirmInput">
            Type "{evaluator.scoreName}" to confirm
          </label>
          <input
            id="confirmInput"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
            className={styles.deleteButton}
          >
            Delete running evaluator
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
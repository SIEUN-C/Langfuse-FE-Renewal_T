// src/Pages/Evaluation/DataSets/components/DeleteDatasetModal.jsx
import React, { useState } from 'react';
import styles from '../deleteDatasetModal.module.css';
import { X } from 'lucide-react';

export default function DeleteDatasetModal({ isOpen, onClose, datasetName, onDeleteConfirm }) {
    const [inputValue, setInputValue] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDeleteConfirm();
        } finally {
            setIsDeleting(false);
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Please confirm</h3>
                    <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
                </div>
                <div className={styles.body}>
                    <p>This action cannot be undone and removes all the data associated with this dataset.</p>
                    <p>Type "<strong>{datasetName}</strong>" to confirm</p>
                    <input
                        type="text"
                        className={styles.input}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className={styles.footer}>
                    <button
                        className={styles.deleteButton}
                        disabled={inputValue !== datasetName || isDeleting}
                        onClick={handleDelete}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete dataset'}
                    </button>
                </div>
            </div>
        </div>
    );
}
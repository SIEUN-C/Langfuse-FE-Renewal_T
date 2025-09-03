// src/Pages/Settings/form/Modal.jsx

import React from 'react';
import { X } from 'lucide-react';
import styles from '../layout/NewMemberModal.module.css';

const NewMemberModal = ({ children, isOpen, onClose, title }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default NewMemberModal;
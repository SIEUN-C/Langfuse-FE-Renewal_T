import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../../../components/Modal/Modal';
import styles from './AddVersionLabelModal.module.css';
import { Plus, X } from 'lucide-react';

export default function AddVersionLabelModal({ isOpen, onClose, onSubmit, version, availableLabels }) {
  // version이 변경될 때마다 selectedLabels 상태를 초기화합니다.
  const [selectedLabels, setSelectedLabels] = useState(new Set(version.labels || []));
  
  useEffect(() => {
    setSelectedLabels(new Set(version.labels || []));
  }, [version]);

  const [customLabelInput, setCustomLabelInput] = useState('');
  const [inputError, setInputError] = useState('');

  const initialLabels = useMemo(() => new Set(version.labels || []), [version.labels]);
  const isProductionSelected = selectedLabels.has('production');
  const hasChanges = JSON.stringify(Array.from(initialLabels).sort()) !== JSON.stringify(Array.from(selectedLabels).sort());

  const handleToggleLabel = (label) => {
    setSelectedLabels(prev => {
      const newLabels = new Set(prev);
      if (newLabels.has(label)) {
        newLabels.delete(label);
      } else {
        newLabels.add(label);
      }
      return newLabels;
    });
  };

  const handleAddCustomLabel = () => {
    if (customLabelInput.length < 1) {
      setInputError('Too small: expected string to have >=1 characters');
      return;
    }
    if (customLabelInput.length > 50) {
      setInputError('Too large: expected string to have <=50 characters');
      return;
    }
    handleToggleLabel(customLabelInput);
    setCustomLabelInput('');
    setInputError('');
  };

  const handleSubmit = () => {
    // [수정] 라벨 배열만 인자로 전달합니다.
    onSubmit(Array.from(selectedLabels));
  };

  const otherAvailableLabels = availableLabels.filter(
    label => label !== 'production' && !selectedLabels.has(label)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        {/* ▼▼▼ 아래 3줄을 추가해주세요 ▼▼▼ */}
        <h3 className={styles.title}>Prompt version labels</h3>
        <p className={styles.description}>
          Use labels to fetch prompts via SDKs. The production labeled prompt will be served by default.
        </p>
        <hr className={styles.separator} /> 
         <h5 className={styles.sectionTitle}>Promote to production?</h5>

        {/* --- Production Section --- */}
        <div
          className={`${styles.labelItem} ${isProductionSelected ? styles.selected : ''}`}
          onClick={() => handleToggleLabel('production')}
        >
          <span>production</span>
        </div>

        {/* --- Custom Labels Section --- */}
        <h5 className={styles.customLabelTitle}>Custom labels</h5>
        <div className={styles.selectedLabelsContainer}>
          {Array.from(selectedLabels)
            .filter(label => label !== 'production')
            .map(label => (
              <div key={label} className={`${styles.labelItem} ${styles.selected}`}>
                <span>{label}</span>
                <button onClick={() => handleToggleLabel(label)} className={styles.removeButton}>
                  <X size={14} />
                </button>
              </div>
            ))}
        </div>

        <div className={styles.addLabelWrapper}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={customLabelInput}
              onChange={(e) => {
                setCustomLabelInput(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="New label"
              className={styles.input}
            />
            <button onClick={handleAddCustomLabel} className={styles.addButton}>
              <Plus size={16} />
            </button>
          </div>
          {inputError && <p className={styles.errorMessage}>{inputError}</p>}
        </div>

        {/* --- Available Labels Section --- */}
        {otherAvailableLabels.length > 0 && (
          <div className={styles.availableLabelsContainer}>
            {otherAvailableLabels.map(label => (
              <div key={label} className={styles.labelItem} onClick={() => handleToggleLabel(label)}>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* --- Footer Actions --- */}
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={!hasChanges}
          >
            {isProductionSelected ? 'Save and promote to production' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
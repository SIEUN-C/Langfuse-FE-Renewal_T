import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '../../../components/DataTable/DataTable';
import { getEvaluatorLibraryColumns } from './EvaluatorLibraryColumns';
import { useNavigate } from 'react-router-dom';
import Templates from '../Templates';
import styles from './EvaluatorLibrary.module.css';
import { Expand, ChevronDown, ChevronUp } from 'lucide-react';
import { useListNavigator } from 'hooks/useListNavigator';

const EvaluatorLibrary = ({ data, columns, isLoading }) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  
  const { currentIndex, handleNext, handlePrevious } = useListNavigator(
    isPanelOpen,
    data,
    selectedTemplateId,
    setSelectedTemplateId,
    () => setIsPanelOpen(false)
  );

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  useEffect(() => {
    if (!isPanelOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'j') {
        handleNext();
      } else if (event.key === 'k') {
        handlePrevious();
      } else if (event.key === 'Escape') {
        closePanel()
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanelOpen, handleNext, handlePrevious, closePanel]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  const handleRowClick = (row) => {
    setIsPanelOpen(true);
    setSelectedTemplateId(row.id);
  };

  const handleExpand = () => {
    navigate(`./templates/${selectedTemplateId}`);
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        keyField="id"
        showCheckbox={false}
        showFavorite={false}
        onRowClick={handleRowClick}
        renderEmptyState={() => <div className={styles.emptyState}>No evaluators found in library.</div>}
        pagination={{
          enabled: true,
          pageSize: 50,
          pageSizeOptions: [10, 20, 30, 50],
          position: "fixed-bottom"
        }}
      />
      {isPanelOpen && (
        <>
          <div className={styles.overlay} onClick={closePanel}></div>
          <div className={styles.sidePanelWrapper}>
            <button
              className={styles.chevronUpButton}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronUp /> K
            </button>
            <button
              className={styles.chevronDownButton}
              onClick={handleNext}
              disabled={currentIndex >= data.length - 1}
            >
              <ChevronDown /> J
            </button>
            <button className={styles.expandButton} onClick={handleExpand}><Expand /></button>
            <button className={styles.closeButton} onClick={closePanel}>X</button>
            {selectedTemplateId && <Templates key={selectedTemplateId} templateId={selectedTemplateId} mode='panel' />}
          </div>
        </>
      )}
    </>
  );
};

export default EvaluatorLibrary;
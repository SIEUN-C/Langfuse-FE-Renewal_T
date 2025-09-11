import React, { useState, useEffect } from 'react';
import { DataTable } from '../../../../components/DataTable/DataTable';
import { getEvaluatorLibraryColumns } from './EvaluatorLibraryColumns';
import { getTemplateEvaluators } from '../services/libraryApi'
import useProjectId from 'hooks/useProjectId';
import { useNavigate } from 'react-router-dom';
import Templates from '../Templates';
import styles from './EvaluatorLibrary.module.css';
import { Expand } from 'lucide-react';

const EvaluatorLibrary = () => {
  const columns = getEvaluatorLibraryColumns({
    onUse: (row) => navigate(`evals/new/${row.id}`),
    onEdit: (row) => navigate(`edit/${row.id}`),
  });
  const { projectId } = useProjectId();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const evaluatorsData = await getTemplateEvaluators(projectId);
        setData(evaluatorsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load evaluator templates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  const handleRowClick = (row) => {
    setIsPanelOpen(true);
    setSelectedTemplateId(row.id);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  }

  const handleExpand = () => {
    navigate(`./templates/${selectedTemplateId}`);
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        keyField="id"
        showCheckbox={false}
        showFavorite={false}
        onRowClick={handleRowClick}
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
            <button className={styles.expandButton} onClick={handleExpand}><Expand /></button>
            <button className={styles.closeButton} onClick={closePanel}>X</button>
            {selectedTemplateId && <Templates templateId={selectedTemplateId} mode='panel'/>}
          </div>
        </>
      )}
    </>
  );
};

export default EvaluatorLibrary;
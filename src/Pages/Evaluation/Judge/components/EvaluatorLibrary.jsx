import React, { useState, useEffect } from 'react';
import { DataTable } from '../../../../components/DataTable/DataTable';
import { getEvaluatorLibraryColumns } from './EvaluatorLibraryColumns';
import { getTemplateEvaluators } from '../services/libraryApi'
import useProjectId from 'hooks/useProjectId';
import { useNavigate } from 'react-router-dom';

const EvaluatorLibrary = () => {
  const columns = getEvaluatorLibraryColumns();
  const { projectId } = useProjectId();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  // 목록 클릭시 template Id로 이동
  const handleRowClick = (row) => {
    navigate(`templates/${row.id}`);
  }

  return (
    // className을 지정할 필요가 없으므로 div도 삭제 가능합니다.
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      showCheckbox={false}
      showFavorite={false}
      onRowClick={handleRowClick}
    />
  );
};

export default EvaluatorLibrary;
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dashboardAPI } from './services/dashboardApi.js';
import styles from './DashboardNew.module.css';

const DashboardNew = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Dashboard name is required');
      return;
    }

    setLoading(true);
    try {
      console.log('대시보드 생성 요청:', { projectId, name, description });
      const result = await dashboardAPI.createDashboard(projectId, name.trim(), description.trim());
      
      if (result.success) {
        console.log('대시보드 생성 성공:', result.data);
        // 생성된 대시보드의 상세 페이지로 이동
        navigate(`/project/${projectId}/dashboards/${result.data.id}`);
      } else {
        console.error('대시보드 생성 실패:', result.error);
        alert(`Failed to create dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('대시보드 생성 중 오류:', error);
      alert(`Failed to create dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/project/${projectId}/dashboards`);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Create Dashboard</h1>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.createButton}
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            Create
          </button>
        </div>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label htmlFor="dashboard-name" className={styles.formLabel}>
              Dashboard Name
            </label>
            <input
              id="dashboard-name"
              type="text"
              className={styles.formInput}
              placeholder="New Dashboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dashboard-description" className={styles.formLabel}>
              Description
            </label>
            <textarea
              id="dashboard-description"
              className={styles.formTextarea}
              placeholder="Describe the purpose of this dashboard. Optional, but very helpful."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className={styles.helpText}>
            After creating the dashboard, you can add widgets to visualize your data.
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingMessage}>
            Creating dashboard...
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardNew;
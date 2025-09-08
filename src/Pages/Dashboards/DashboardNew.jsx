// src/Pages/Dashboards/DashboardNew.jsx

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dashboardAPI } from './services/dashboardApi.js';
import styles from './DashboardNew.module.css';

/**
 * 새 대시보드 생성 페이지
 * 대시보드 이름과 설명을 입력받아 새로운 대시보드를 생성
 */
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
      const result = await dashboardAPI.createDashboard(projectId, name.trim(), description.trim());
      
      if (result.success) {
        // 생성 후 대시보드 상세 페이지로 이동
        navigate(`/project/${projectId}/dashboards/${result.data.id}`);
      } else {
        alert(`Failed to create dashboard: ${result.error}`);
      }
    } catch (error) {
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
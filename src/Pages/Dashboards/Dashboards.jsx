import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Dashboards.module.css';
import { Info, Plus } from 'lucide-react';
import { DashboardsView } from './DashboardsView';
import { WidgetsView } from '../Widget/pages/WidgetsView';

const Dashboards = () => {
  const { projectId } = useParams(); // URL에서 projectId 추출
  const [activeTab, setActiveTab] = useState('Dashboards');
  const navigate = useNavigate();

  const { title, buttonText } = activeTab === 'Dashboards'
  ? { title: 'Dashboards', buttonText: 'New dashboard' }
  : { title: 'Widgets', buttonText: 'New widget' };

  const handleNewButtonClick = () => {
    if (activeTab === 'Dashboards') {
      navigate(`/project/${projectId}/dashboards/new`);
    } else {
      navigate(`/project/${projectId}/dashboards/widgets/new`);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. 페이지 헤더 (동적) */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>{title}</h1>
          <Info size={16} className={styles.infoIcon} />
        </div>
        <button className={styles.primaryButton} onClick={handleNewButtonClick}>
          <Plus size={16} /> {buttonText}
        </button>
      </div>

      {/* 2. 탭 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'Dashboards' ? styles.active : ''}`}
          onClick={() => setActiveTab('Dashboards')}
        >
          Dashboards
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'Widgets' ? styles.active : ''}`}
          onClick={() => setActiveTab('Widgets')}
        >
          Widgets
        </button>
      </div>

      {/* 3. 탭에 따른 컨텐츠 렌더링 */}
      <div className={styles.contentArea}>
        {activeTab === 'Dashboards' ? <DashboardsView /> : <WidgetsView />}
      </div>
    </div>
  );
};

export default Dashboards;
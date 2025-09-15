// src/Pages/Dashboards/Dashboards.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Dashboards.module.css';
import { Info, Plus } from 'lucide-react';
import { DashboardsView } from './DashboardsView';
import { WidgetsView } from '../Widget/pages/WidgetsView';

/**
 * 대시보드 메인 페이지
 * Dashboards와 Widgets 탭을 제공하는 상위 컨테이너
 */
const Dashboards = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('Dashboards');
  const navigate = useNavigate();

  // 활성 탭에 따른 헤더 텍스트 결정
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
      {/* 페이지 헤더 */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>{title}</h1>
          <Info size={16} className={styles.infoIcon} />
        </div>
        <button className={styles.primaryButton} onClick={handleNewButtonClick}>
          <Plus size={16} /> {buttonText}
        </button>
      </div>

      {/* 탭 네비게이션 */}
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

      {/* 탭 컨텐츠 */}
      <div className={styles.contentArea}>
        {activeTab === 'Dashboards' ? <DashboardsView /> : <WidgetsView />}
      </div>
    </div>
  );
};

export default Dashboards;
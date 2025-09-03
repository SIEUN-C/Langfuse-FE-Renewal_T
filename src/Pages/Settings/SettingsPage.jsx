import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import SettingsSidebar from "../../layouts/SettingsSidebar";
import styles from "./layout/SettingsPage.module.css";
import useProjectId from "../../hooks/useProjectId";

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const [isMobile, setIsMobile] = useState(false);

  // 세션/로컬/URL 등에서 프로젝트 식별 (Playground에서 쓰던 훅 재사용)
  const { projectId: resolvedId } = useProjectId({
    location,
    validateAgainstSession: true,
  });

  // 메뉴 옵션들 - 실제 라우팅 구조에 맞게 조정
  const menuOptions = [
    { value: `/project/${resolvedId}/settings/general`, label: 'General' },
    { value: `/project/${resolvedId}/settings/api-keys`, label: 'API Keys' },
    { value: `/project/${resolvedId}/settings/llm-connections`, label: 'LLM Connections' },
    { value: `/project/${resolvedId}/settings/models`, label: 'Models' },
    { value: `/project/${resolvedId}/settings/scores`, label: 'Scores' },
    { value: `/project/${resolvedId}/settings/members`, label: 'Members' },
  ];

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // URL의 :projectId와 내부 해석 값이 다르면 표준 경로로 정정
  useEffect(() => {
    if (routeProjectId && resolvedId && routeProjectId !== resolvedId) {
      navigate(`/project/${resolvedId}/settings`, { replace: true });
    }
  }, [routeProjectId, resolvedId, navigate]);

  // 현재 경로 확인
  const getCurrentPath = () => {
    return location.pathname;
  };

  // 메뉴 변경 처리
  const handleMenuChange = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      navigate(selectedValue);
    }
  };

  if (resolvedId === null) return null;           // 아직 판별 중
  if (resolvedId === "") return null;             // 게이트에서 처리

  return (
    <div>
      <div className={styles.headerWrapper}>
        <div className={styles.contentContainer}>
          <h1 className={styles.headerTitle}>Project Settings</h1>
        </div>
      </div>

      <div className={styles.centeredContent}>
        {/* 모바일에서만 표시되는 드롭다운 메뉴 */}
        {isMobile && (
          <div className={styles.mobileMenuWrapper}>
            <select 
              className={styles.mobileMenuSelect}
              value={getCurrentPath()}
              onChange={handleMenuChange}
            >
              {menuOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.bodyLayout}>
          {/* 사이드바는 항상 렌더하고, 표시 여부는 CSS에서 제어 */}
          <aside className={styles.sidebar}>
            <SettingsSidebar projectId={resolvedId} />
          </aside> 
           
          <div className={styles.mainContent}>
            {/* Outlet context로 projectId 내려줌 */}
            <Outlet context={{ projectId: resolvedId }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
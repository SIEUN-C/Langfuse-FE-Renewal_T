// src/Pages/Dashboards/components/cards/DashboardCard.jsx

import { Loader } from 'lucide-react';
import styles from './DashboardCard.module.css';

/**
 * DashboardCard 컴포넌트
 * 위젯을 감싸는 카드 컨테이너. 헤더(제목/설명/액션버튼)와 본문 영역 제공
 * 
 * @param {string} className - 추가 CSS 클래스
 * @param {React.ReactNode} title - 카드 제목 (필수)
 * @param {React.ReactNode} description - 카드 설명
 * @param {boolean} isLoading - 로딩 시 헤더에 스피너 표시
 * @param {React.ReactNode} children - 카드 본문 내용
 * @param {React.ReactNode} headerChildren - 헤더 하단 추가 요소 (필터 등)
 * @param {string} cardContentClassName - 본문 영역 추가 CSS 클래스
 * @param {string} headerClassName - 헤더 영역 추가 CSS 클래스
 * @param {React.ReactNode} headerRight - 헤더 우측 요소 (버튼 등)
 */
export const DashboardCard = ({
  className = '',
  title,
  description,
  isLoading,
  children,
  headerChildren,
  cardContentClassName = '',
  headerClassName = '',
  headerRight,
}) => {
  const cardClasses = `${styles.dashboardCard} ${className}`.trim();
  const headerClasses = `${styles.dashboardCardHeader} ${headerClassName}`.trim();
  const contentClasses = `${styles.dashboardCardContent} ${cardContentClassName}`.trim();

  return (
    <div className={cardClasses}>
      {/* 헤더 영역 */}
      <div className={headerClasses}>
        <div className={styles.dashboardCardHeaderTop}>
          <div className={styles.dashboardCardHeaderLeft}>
            <h3 className={styles.dashboardCardTitle}>{title}</h3>
            {description && (
              <p className={styles.dashboardCardDescription}>{description}</p>
            )}
          </div>
          {headerRight && (
            <div className={styles.dashboardCardHeaderRight}>
              {headerRight}
            </div>
          )}
        </div>
        
        {headerChildren && (
          <div className={styles.dashboardCardHeaderChildren}>
            {headerChildren}
          </div>
        )}
        
        {isLoading && (
          <div className={styles.dashboardCardLoader}>
            <Loader className={styles.loaderIcon} />
          </div>
        )}
      </div>
      
      {/* 본문 영역 */}
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
};
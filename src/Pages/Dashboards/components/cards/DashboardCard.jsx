import { Loader } from 'lucide-react';
import styles from './DashboardCard.module.css'; // 이렇게 변경!

/**
 * DashboardCard 컴포넌트
 * 기본 대시보드의 카드 래퍼 컴포넌트
 * 
 * @param {Object} props
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {React.ReactNode} props.title - 카드 제목
 * @param {React.ReactNode} [props.description] - 카드 설명
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {React.ReactNode} [props.children] - 카드 내용
 * @param {React.ReactNode} [props.headerChildren] - 헤더 추가 내용
 * @param {string} [props.cardContentClassName] - 내용 영역 CSS 클래스
 * @param {string} [props.headerClassName] - 헤더 영역 CSS 클래스
 * @param {React.ReactNode} [props.headerRight] - 헤더 오른쪽 영역
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
      
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
};
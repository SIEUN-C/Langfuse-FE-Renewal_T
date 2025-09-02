import { Loader } from 'lucide-react';
import './DashboardCard.module.css';

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
  const cardClasses = `dashboard-card ${className}`.trim();
  const headerClasses = `dashboard-card-header ${headerClassName}`.trim();
  const contentClasses = `dashboard-card-content ${cardContentClassName}`.trim();

  return (
    <div className={cardClasses}>
      <div className={headerClasses}>
        <div className="dashboard-card-header-top">
          <div className="dashboard-card-header-left">
            <h3 className="dashboard-card-title">{title}</h3>
            {description && (
              <p className="dashboard-card-description">{description}</p>
            )}
          </div>
          {headerRight && (
            <div className="dashboard-card-header-right">
              {headerRight}
            </div>
          )}
        </div>
        
        {headerChildren && (
          <div className="dashboard-card-header-children">
            {headerChildren}
          </div>
        )}
        
        {isLoading && (
          <div className="dashboard-card-loader">
            <Loader className="loader-icon" />
          </div>
        )}
      </div>
      
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
};
// src/Pages/Dashboards/components/cards/DashboardTable.jsx

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './DashboardTable.module.css';
import { NoDataOrLoading } from '../charts/NoDataOrLoading';

/**
 * 테이블 접기/펼치기 버튼
 */
const ExpandListButton = ({ 
  isExpanded, 
  setExpanded, 
  totalLength, 
  maxLength, 
  expandText 
}) => {
  const handleToggle = () => {
    setExpanded(!isExpanded);
  };

  if (totalLength <= maxLength) {
    return null;
  }

  return (
    <div className="expand-button-container">
      <button 
        className="expand-button"
        onClick={handleToggle}
      >
        <span className="expand-button-text">
          {isExpanded ? `Show top ${maxLength}` : expandText}
        </span>
        {isExpanded ? (
          <ChevronUp className="expand-button-icon" />
        ) : (
          <ChevronDown className="expand-button-icon" />
        )}
      </button>
    </div>
  );
};

/**
 * DashboardTable 컴포넌트
 * 대시보드용 데이터 테이블. 접기/펼치기, 로딩상태, 빈데이터 처리 지원
 * 
 * @param {Array} headers - 테이블 헤더 (ReactNode 배열)
 * @param {Array} rows - 테이블 행 데이터 (ReactNode[][] 배열)
 * @param {React.ReactNode} children - 테이블 상단 추가 내용
 * @param {Object} collapse - 접기/펼치기 설정 { collapsed: 5, expanded: 20 }
 * @param {Object} noDataProps - 빈 데이터 설정 { description, href }
 * @param {boolean} isLoading - 로딩 상태
 */
export const DashboardTable = ({
  headers,
  rows,
  children,
  collapse,
  noDataProps,
  isLoading,
}) => {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <div className="dashboard-table-container">
      {children}
      
      {rows.length > 0 ? (
        <div className="table-wrapper">
          <div className="table-scroll-container">
            <div className="table-inner-container">
              <table className="dashboard-table">
                <thead className="table-header">
                  <tr>
                    {headers.map((header, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="table-header-cell"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="table-body">
                  {rows
                    .slice(
                      0,
                      collapse
                        ? isExpanded
                          ? collapse.expanded
                          : collapse.collapsed
                        : undefined,
                    )
                    .map((row, i) => (
                      <tr key={i} className="table-row">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="table-cell"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* collapse 설정이 있을 때만 접기/펼치기 버튼 표시 */}
          {collapse && (
            <ExpandListButton
              isExpanded={isExpanded}
              setExpanded={setExpanded}
              totalLength={rows.length}
              maxLength={collapse.collapsed}
              expandText={
                rows.length > collapse.expanded
                  ? `Show top ${collapse.expanded}`
                  : "Show all"
              }
            />
          )}
        </div>
      ) : (
        <NoDataOrLoading 
          isLoading={isLoading} 
          description={noDataProps?.description}
          href={noDataProps?.href}
        />
      )}
    </div>
  );
};
// src/components/DataTable/DataTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from './DataTable.module.css';
import {
  MoreVertical,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Star,
  Trash2,
} from 'lucide-react';

export function DataTable({
  columns,
  data,
  renderEmptyState,
  keyField,
  selectedRowKey,
  onRowClick,
  showCheckbox = false,
  onCheckboxChange,
  selectedRows = new Set(),
  showFavorite = true,
  onFavoriteClick,
  favoriteState = {},
  onToggleAllFavorites,
  showDelete = false,
  onDeleteClick,
  pagination = null,
}) {
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 50);
  
  // 사이드바 상태 감지
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 사이드바 상태 감지 로직
  useEffect(() => {
    if (pagination?.position !== "fixed-bottom") return;

    const checkSidebarState = () => {
      // 사이드바 상태를 감지하는 방법들
      // 1. body 클래스 확인
      const hasCollapsedClass = document.body.classList.contains('sidebar-collapsed');
      
      // 2. 또는 CSS 변수로 확인
      const sidebarWidth = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width');
      
      // 3. 또는 뷰포트 너비로 추정
      const isSmallScreen = window.innerWidth < 1024;
      
      setIsSidebarCollapsed(hasCollapsedClass || sidebarWidth === '60px' || isSmallScreen);
    };

    // 초기 체크
    checkSidebarState();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkSidebarState);
    
    // MutationObserver로 body 클래스 변화 감지
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      window.removeEventListener('resize', checkSidebarState);
      observer.disconnect();
    };
  }, [pagination?.position]);

  // 페이지네이션이 활성화된 경우 계산된 데이터
  const paginatedData = useMemo(() => {
    if (!pagination?.enabled) {
      return data;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize, pagination?.enabled]);

  const totalPages = useMemo(() => {
    if (!pagination?.enabled) return 1;
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize, pagination?.enabled]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 페이지 입력 상태
  const [pageInput, setPageInput] = useState(currentPage);

  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePageNavigation();
    }
  };

  const handlePageInputBlur = () => {
    handlePageNavigation();
  };

  const handlePageNavigation = () => {
    const newPage = parseInt(pageInput);
    if (isNaN(newPage) || newPage < 1 || newPage > totalPages) {
      setPageInput(currentPage);
      return;
    }
    handlePageChange(newPage);
  };

  // 체크박스 로직
  const allChecked = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row[keyField]));
  const allFavorited = paginatedData.length > 0 && paginatedData.every(row => favoriteState[row[keyField]]);

  const handleAllCheckboxChange = (e) => {
    const newSelectedRows = new Set();
    if (e.target.checked) {
      paginatedData.forEach(row => newSelectedRows.add(row[keyField]));
    }
    onCheckboxChange(newSelectedRows);
  };

  const handleRowCheckboxChange = (rowId) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    onCheckboxChange(newSelectedRows);
  };

  // 페이지네이션 컴포넌트
  const renderPagination = () => {
    if (!pagination?.enabled) return null;

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages && totalPages > 0;
    const pageSizeOptions = pagination.pageSizeOptions || [10, 20, 30, 50];

    // fixed-bottom일 때 사이드바 상태에 따른 클래스 적용
    let paginationClass = styles.pagination;
    
    if (pagination?.position === "fixed-bottom") {
      paginationClass = `${styles.pagination} ${styles.fixedBottomPagination}`;
      if (isSidebarCollapsed) {
        paginationClass += ` ${styles.sidebarCollapsed}`;
      }
    }

    return (
      <div className={paginationClass}>
        <div className={styles.rowsPerPage}>
          <span>Rows per page</span>
          <select 
            value={pageSize} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.pageInfo}>
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyPress={handlePageInputKeyPress}
            onBlur={handlePageInputBlur}
            className={styles.pageInput}
          />
          <span>of {totalPages || 0}</span>
        </div>

        <div className={styles.pageControls}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrevious}
            className={styles.iconButton}
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className={styles.iconButton}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
            className={styles.iconButton}
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={!canGoNext}
            className={styles.iconButton}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  // 컨테이너 스타일 결정
  const getContainerClass = () => {
    if (!pagination?.enabled) return styles.tableContainer;
    
    if (pagination.position === "fixed-bottom") {
      return `${styles.tableContainer} ${styles.fixedBottomContainer}`;
    }
    
    if (pagination.position === "sticky-bottom") {
      return `${styles.tableContainer} ${styles.stickyBottomContainer}`;
    }
    
    return styles.tableContainer;
  };

  return (
    <>
      <div className={getContainerClass()}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {showCheckbox && (
                  <th>
                    <input type="checkbox" checked={allChecked} onChange={handleAllCheckboxChange} />
                  </th>
                )}
                {showFavorite && (
                  <th>
                    <Star
                      size={16}
                      className={`${styles.starIcon} ${allFavorited ? styles.favorited : ''}`}
                      onClick={onToggleAllFavorites}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                {columns.map((col, index) => (
                  <th key={index}>{col.header}</th>
                ))}
                {showDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => {
                  const rowKey = String(row[keyField]);
                  const isSelected = selectedRowKey === rowKey;

                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick?.(row)}
                      className={`${onRowClick ? styles.clickableRow : ''} ${isSelected ? styles.selectedRow : ''}`}
                    >
                      {showCheckbox && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowKey)}
                            onChange={() => handleRowCheckboxChange(rowKey)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      {showFavorite && (
                        <td>
                          <Star
                            size={16}
                            className={`${styles.starIcon} ${favoriteState[rowKey] ? styles.favorited : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFavoriteClick(rowKey);
                            }}
                          />
                        </td>
                      )}
                      {columns.map((col, index) => (
                        <td key={index}>
                          {col.accessor ? col.accessor(row) : null}
                        </td>
                      ))}
                      {showDelete && (
                        <td>
                          <div className={styles.actionsCell}>
                            <button
                              className={styles.iconButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick(rowKey);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + (showCheckbox ? 1 : 0) + (showFavorite ? 1 : 0) + (showDelete ? 1 : 0)} className={styles.emptyCell}>
                    {renderEmptyState()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* fixed-bottom이 아닐 때만 여기서 렌더링 */}
        {pagination?.position !== "fixed-bottom" && renderPagination()}
      </div>

      {/* fixed-bottom일 때는 컨테이너 외부에서 렌더링 */}
      {pagination?.position === "fixed-bottom" && renderPagination()}
    </>
  );
}
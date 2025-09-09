// src/Pages/Prompts/components/PromptsPagination.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './PromptsPagination.module.css';

const PromptsPagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  pageSizes = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  mode = 'fixed-bottom', // 'sticky-bottom' 또는 'fixed-bottom'
  sidebarCollapsed = false // 사이드바 접힘 상태
}) => {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput, 10);
      if (!isNaN(page) && page > 0 && page <= totalPages) {
        onPageChange(page);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  const handlePageInputBlur = () => {
    setPageInput(String(currentPage));
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    onPageSizeChange(newSize);
  };

  if (totalPages === 0) return null;

  // 클래스명 결정
  const paginationClass = mode === 'fixed-bottom' 
    ? `${styles.pagination} ${styles.fixedBottomPagination} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}` 
    : styles.pagination;

  return (
    <div className={paginationClass}>
      <div className={styles.rowsPerPage}>
        <span>Rows per page</span>
        <select 
          value={pageSize} 
          onChange={handlePageSizeChange}
          className={styles.pageSelect}
        >
          {pageSizes.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      
      <div className={styles.pageInfo}>
        <span>Page</span>
        <input
          type="text"
          value={pageInput}
          onChange={handlePageInputChange}
          onKeyDown={handlePageInputKeyDown}
          onBlur={handlePageInputBlur}
          className={styles.pageInput}
        />
        <span>of {totalPages}</span>
      </div>
      
      <div className={styles.pageControls}>
        <button 
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={styles.iconButton}
        >
          <ChevronsLeft size={18} />
        </button>
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.iconButton}
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.iconButton}
        >
          <ChevronRight size={18} />
        </button>
        <button 
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={styles.iconButton}
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default PromptsPagination;
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import styles from "./layout/CustomPagination.module.css";

/**
 * Props (둘 다 지원):
 * - pageSizes: number[] = [10,20,50,100]
 * - totalRows: number
 * - pageSize: number
 * - currentIndex (0-based)  또는  currentPage (0-based로 해석)
 * - onPageChange: (nextIndex:number) => void   // 0-based
 * - onLimitChange: (size:number) => void       // 우선 호출
 * - onPageSizeChange: (size:number) => void    // 구버전 호환
 */
export default function CustomPagination(props) {
  const {
    pageSizes = [10, 20, 50, 100],
    totalRows = 0,
    pageSize = 50,
    currentIndex,
    currentPage,
    onPageChange,
    onLimitChange,
    onPageSizeChange,
  } = props;

  // 구버전/신버전 prop 호환
  const index = Number.isFinite(currentIndex) ? currentIndex : (Number(currentPage) || 0);

  // 계산 값들
  const safePageSize = Math.max(1, Number(pageSize) || 50);
  const totalPages = Math.max(1, Math.ceil(Number(totalRows || 0) / safePageSize));
  const page = Math.min(Math.max(0, index || 0), totalPages - 1);

  // 1-based로 보여줄 입력창
  const [inputValue, setInputValue] = useState(String(page + 1));
  const [innerPageSize, setInnerPageSize] = useState(safePageSize);

  // 훅은 항상 최상단에서 호출되어야 함 (early return 금지!)
  useEffect(() => setInputValue(String(page + 1)), [page]);
  useEffect(() => setInnerPageSize(safePageSize), [safePageSize]);

  const start = totalRows === 0 ? 0 : page * safePageSize + 1;
  const end   = Math.min(totalRows, (page + 1) * safePageSize);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const emitPageSize = (size) => {
    if (onLimitChange) onLimitChange(size);
    else if (onPageSizeChange) onPageSizeChange(size);
  };

  const goto = (p) => onPageChange && onPageChange(p);

  const onPageInputKeyDown = (e) => {
    if (e.key === "Enter") {
      const asNumber = parseInt(inputValue, 10);
      if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= totalPages) {
        goto(asNumber - 1); // 0-based
      } else {
        setInputValue(String(page + 1));
      }
    }
  };

  if (totalRows === 0) {
    // 훅은 이미 위에서 전부 호출됨. 여기서 early return 해도 안전.
    return null;
  }

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.pageSizeSelector}>
        <span>Rows per page</span>
        <select
          value={innerPageSize}
          onChange={(e) => { const s = Number(e.target.value); setInnerPageSize(s); emitPageSize(s); }}
          className={styles.pageSizeSelect}
        >
          {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className={styles.controlsWrapper}>
        <div className={styles.pageInfo}>
          <span>Page</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onPageInputKeyDown}
            onBlur={() => setInputValue(String(page + 1))}
            className={styles.pageInput}
          />
          <span>of {totalPages}</span>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={() => goto(0)}           disabled={!canPrev} className={styles.button} title="First page"><ChevronsLeft size={18} /></button>
          <button onClick={() => goto(page - 1)}    disabled={!canPrev} className={styles.button} title="Previous page"><ChevronLeft size={18} /></button>
          <button onClick={() => goto(page + 1)}    disabled={!canNext} className={styles.button} title="Next page"><ChevronRight size={18} /></button>
          <button onClick={() => goto(totalPages-1)}disabled={!canNext} className={styles.button} title="Last page"><ChevronsRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}

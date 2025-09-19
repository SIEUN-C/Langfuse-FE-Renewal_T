import { useState, useMemo, useCallback, useEffect } from 'react';

const getInitialVisibility = (rawColumns) => {
  const initialVisibility = {};
  if (!rawColumns || rawColumns.length === 0) {
    return initialVisibility;
  }
  rawColumns.forEach(col => {
    const key = col.id;
    if (col.isMandatory) {
      initialVisibility[key] = true;
    } else {
      initialVisibility[key] = col.defaultVisible !== false;
    }
  });
  return initialVisibility;
};

// rawColumns: isMandatory, defaultVisible 등이 정의된 순수 컬럼 배열
export const useColumnVisibility = (rawColumns = []) => {
  const [columnVisibility, setColumnVisibility] = useState(() =>
    getInitialVisibility(rawColumns)
  );

  useEffect(() => {
    setColumnVisibility(getInitialVisibility(rawColumns));
  }, [rawColumns]);

  // 1. 기본값으로 되돌리는 함수
  const restoreDefaults = useCallback(() => {
    const defaultVisibility = {};
    rawColumns.forEach(col => {
      const key = col.id;

      if (col.isMandatory) {
        defaultVisibility[key] = true;
      } else {
        defaultVisibility[key] = col.defaultVisibility !== false;
      }
    });
    setColumnVisibility(defaultVisibility);
  }, [rawColumns]);

  // 2. 개별 컬럼 토글 함수
  const toggleColumnVisibility = useCallback((key) => {
    setColumnVisibility(prev => {
      const currentVisibility = prev[key] ?? true;
      return { ...prev, [key]: !currentVisibility };
    });
  }, []);

  // 3. 전체 선택/해제 함수 (필수 컬럼 제외)
  const setAllColumnsVisible = useCallback((visible) => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev };
      rawColumns.forEach(col => {
        if (!col.isMandatory) {
          const key = col.id;
          newVisibility[key] = visible;
        }
      });
      return newVisibility;
    });
  }, [rawColumns]);

  // 4. 최종적으로 UI에 보여줄 columns 배열
  const columns = useMemo(() => {
    if (!rawColumns || rawColumns.length === 0) return [];

    return rawColumns.map(col => {
      const key = col.id;
      return {
        ...col,
        key: key,
        visible: columnVisibility[key] ?? true,
      };
    });
  }, [rawColumns, columnVisibility]);

  // 5. 현재 보이는 컬럼들만 필터링한 배열
  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  // Hook이 반환하는 값들
  return {
    columns,
    visibleColumns,
    toggleColumnVisibility,
    setAllColumnsVisible,
    restoreDefaults,
  };
};
import React, { useCallback, useState } from 'react';
import DateRangePicker from '../../../components/DateRange/DateRangePicker';
import FilterBuilder from '../../../components/FilterControls/FilterBuilder';
import styles from './DashboardFilterControls.module.css';

const DashboardFilterControls = ({ 
  dateRange,     // dateRange 객체로 받기
  onDateChange,  // 함수 받기
}) => {
  // FilterBuilder를 위한 상태 추가
  const [filters, setFilters] = useState([
    { 
      id: Date.now(), 
      column: 'Name', 
      operator: '=', 
      value: '', 
      metaKey: '' 
    }
  ]);

  // dateRange가 없으면 기본값 설정
  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  const handlePresetChange = useCallback((newStartDate, newEndDate) => {
    if (onDateChange) {
      onDateChange({ startDate: newStartDate, endDate: newEndDate });
    }
  }, [onDateChange]);

  // 개별 날짜 변경 핸들러 수정 - 의존성 제거
  const handleStartDateChange = useCallback((newStartDate) => {
    if (onDateChange) {
      onDateChange(prev => ({ ...prev, startDate: newStartDate }));
    }
  }, [onDateChange]);

  const handleEndDateChange = useCallback((newEndDate) => {
    if (onDateChange) {
      onDateChange(prev => ({ ...prev, endDate: newEndDate }));
    }
  }, [onDateChange]);

  // 동시 날짜 변경 핸들러
  const handleBothDatesChange = useCallback((newStartDate, newEndDate) => {
    if (onDateChange) {
      onDateChange({ startDate: newStartDate, endDate: newEndDate });
    }
  }, [onDateChange]);

  // FilterBuilder 변경 핸들러
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    // TODO: 필터 변경을 상위 컴포넌트에 전달할 경우
    // if (onFilterChange) {
    //   onFilterChange(newFilters);
    // }
  }, []);

  return (
    <div className={styles.filterControls}>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        setStartDate={handleStartDateChange}
        setEndDate={handleEndDateChange}
        setBothDates={handleBothDatesChange}
        onPresetChange={handlePresetChange}
      />
      
      <FilterBuilder 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default DashboardFilterControls;
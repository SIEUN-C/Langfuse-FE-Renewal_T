// src/Pages/Dashboards/components/DashboardFilterControls.jsx
import React, { useCallback } from 'react';
import DateRangePicker from '../../../components/DateRange/DateRangePicker';
import styles from './DashboardFilterControls.module.css';

/**
 * 대시보드 디테일 페이지의 필터 컨트롤 컴포넌트
 * 
 * 기능:
 * - DateRangePicker: 날짜 범위 선택 (달력 UI + Past 7 days 등 프리셋)
 * - FilterBuilder는 제거됨 (DashboardDetail.jsx에서 직접 FilterControls 사용)
 * 
 * @param {Object} dateRange - 현재 선택된 날짜 범위 { startDate, endDate }
 * @param {Function} onDateChange - 날짜 범위 변경 시 호출되는 콜백 함수
 */
const DashboardFilterControls = ({ 
 dateRange,
 onDateChange
}) => {
 // 날짜 범위에서 시작일/종료일 추출
 const startDate = dateRange?.startDate;
 const endDate = dateRange?.endDate;

 /**
  * 프리셋 날짜 범위 선택 시 호출되는 핸들러
  * Past 7 days, Past 30 days 등의 버튼 클릭 시 실행
  * 
  * @param {Date} newStartDate - 새로운 시작 날짜
  * @param {Date} newEndDate - 새로운 종료 날짜
  */
 const handlePresetChange = useCallback((newStartDate, newEndDate) => {
   if (onDateChange) {
     onDateChange({ startDate: newStartDate, endDate: newEndDate });
   }
 }, [onDateChange]);

 /**
  * 시작 날짜만 변경되었을 때 호출되는 핸들러
  * 사용자가 달력에서 시작 날짜를 직접 선택했을 때 실행
  * 
  * @param {Date} newStartDate - 새로운 시작 날짜
  */
 const handleStartDateChange = useCallback((newStartDate) => {
   if (onDateChange) {
     // 기존 종료일은 유지하고 시작일만 업데이트
     onDateChange(prev => ({ ...prev, startDate: newStartDate }));
   }
 }, [onDateChange]);

 /**
  * 종료 날짜만 변경되었을 때 호출되는 핸들러
  * 사용자가 달력에서 종료 날짜를 직접 선택했을 때 실행
  * 
  * @param {Date} newEndDate - 새로운 종료 날짜
  */
 const handleEndDateChange = useCallback((newEndDate) => {
   if (onDateChange) {
     // 기존 시작일은 유지하고 종료일만 업데이트
     onDateChange(prev => ({ ...prev, endDate: newEndDate }));
   }
 }, [onDateChange]);

 /**
  * 시작일과 종료일이 동시에 변경되었을 때 호출되는 핸들러
  * 달력에서 날짜 범위를 드래그로 선택했을 때 등에 사용
  * 
  * @param {Date} newStartDate - 새로운 시작 날짜
  * @param {Date} newEndDate - 새로운 종료 날짜
  */
 const handleBothDatesChange = useCallback((newStartDate, newEndDate) => {
   if (onDateChange) {
     onDateChange({ startDate: newStartDate, endDate: newEndDate });
   }
 }, [onDateChange]);

 return (
   <div className={styles.filterControls}>
     {/* DateRangePicker: 날짜 범위 선택 컴포넌트 */}
     {/* 달력 UI와 Past 7 days, Past 30 days 등의 프리셋 버튼 포함 */}
     <DateRangePicker
       startDate={startDate}
       endDate={endDate}
       setStartDate={handleStartDateChange}
       setEndDate={handleEndDateChange}
       setBothDates={handleBothDatesChange}
       onPresetChange={handlePresetChange}
     />
     
     {/* 
       ✅ FilterBuilder 제거됨 
       - 기존에 여기 있던 FilterBuilder는 제거
       - 대신 DashboardDetail.jsx에서 직접 FilterControls 컴포넌트 사용
       - 이유: 프롬프트 페이지에서 검증된 필터 로직을 재사용하기 위함
     */}
   </div>
 );
};

export default DashboardFilterControls;
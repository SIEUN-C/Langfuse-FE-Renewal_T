import React, { useCallback, useState, useMemo } from 'react';
import DateRangePicker from '../../../components/DateRange/DateRangePicker';
import FilterBuilder from '../../../components/FilterControls/FilterBuilder';
import { dashboardFilterConfig } from '../../../components/FilterControls/filterConfig.js';
import styles from './DashboardFilterControls.module.css';

const DashboardFilterControls = ({ 
 dateRange,
 onDateChange,
 onFilterChange,
 environmentOptions = [], 
 nameOptions = [],        
 tagsOptions = []         
}) => {
 const [filters, setFilters] = useState([
   { 
     id: Date.now(), 
     column: 'traceName',
     operator: '=', 
     value: '', 
     metaKey: '' 
   }
 ]);

 // 동적으로 필터 설정 생성
 const dynamicFilterConfig = useMemo(() => {
   return dashboardFilterConfig.map(config => {
     if (config.key === 'environment') {
       return { ...config, options: environmentOptions };
     }
     if (config.key === 'traceName') {
       return { ...config, options: nameOptions };
     }
     if (config.key === 'tags') {
       return { ...config, options: tagsOptions };
     }
     return config;
   });
 }, [environmentOptions, nameOptions, tagsOptions]);

 const startDate = dateRange?.startDate;
 const endDate = dateRange?.endDate;

 const handlePresetChange = useCallback((newStartDate, newEndDate) => {
   if (onDateChange) {
     onDateChange({ startDate: newStartDate, endDate: newEndDate });
   }
 }, [onDateChange]);

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

 const handleBothDatesChange = useCallback((newStartDate, newEndDate) => {
   if (onDateChange) {
     onDateChange({ startDate: newStartDate, endDate: newEndDate });
   }
 }, [onDateChange]);

 const handleFilterChange = useCallback((newFilters) => {
   setFilters(newFilters);
   if (onFilterChange) {
     onFilterChange(newFilters);
   }
 }, [onFilterChange]);

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
       filterConfig={dynamicFilterConfig}
     />
   </div>
 );
};

export default DashboardFilterControls;
// src/components/Filter_test/FilterControls.jsx

import React from "react";
import styles from "./FilterControls.module.css"; 

// 기존 Filter_test의 컴포넌트
import { FilterBuilder } from "./FilterBuilder"; 
import { useFilterState } from "./hooks/useFilterState";

// FilterControls에서 재사용할 컴포넌트와 훅
import { EnvironmentFilter } from "./EnvironmentFilter";
import { TimeRangeFilter } from "./TimeRangeFilter";
import { useEnvironmentFilter } from "./hooks/useEnvironmentFilter";
import { useTimeRangeFilter } from "./hooks/useTimeRangeFilter";

export const FilterControls = ({
  columnDefs, // FilterBuilder에 필요
  // 추가적으로 필요한 props가 있다면 여기에 정의
}) => {
  // 1. 각 필터에 필요한 커스텀 훅 호출
  const { filters, addFilter, updateFilter, removeFilter, clearFilters } = useFilterState([]);
  const { environment, setEnvironment, availableEnvironments } = useEnvironmentFilter();
  const { timeRange, setTimeRange } = useTimeRangeFilter();

  return (
    <div className={styles.filterControlsContainer}>
      {/* 2. TimeRangeFilter 추가 */}
      <TimeRangeFilter
        value={timeRange}
        onChange={setTimeRange}
      />
      
      {/* 3. EnvironmentFilter 추가 */}
      <EnvironmentFilter
        value={environment}
        onChange={setEnvironment}
        options={availableEnvironments}
      />

      {/* 4. 기존 FilterBuilder 연결 */}
      <FilterBuilder
        filters={filters}
        onAddFilter={addFilter}
        onUpdateFilter={updateFilter}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
        columnDefs={columnDefs}
      />
      
      {/* 필요하다면 RefreshButton 등 다른 컴포넌트도 추가할 수 있습니다. */}
    </div>
  );
};
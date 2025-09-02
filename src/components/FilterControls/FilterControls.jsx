import React from 'react';
import styles from './FilterControls.module.css';
import TimeRangeFilter from './TimeRangeFilter';
import EnvironmentFilter from './EnvironmentFilter';
import FilterBuilder from './FilterBuilder';
import RefreshButton from './RefreshButton';

const FilterControls = ({ onRefresh, envFilterProps, timeRangeFilterProps, builderFilterProps }) => {
  return (
    <div className={styles.filterControls}>
      {/* 각 필터 버튼이 props를 통해서만 렌더링되도록 조건부 렌더링을 추가합니다. */}
      {timeRangeFilterProps && <TimeRangeFilter {...timeRangeFilterProps} />}
      {envFilterProps && <EnvironmentFilter {...envFilterProps} />}
      {builderFilterProps && <FilterBuilder {...builderFilterProps} />}
      {onRefresh && <RefreshButton onClick={onRefresh} />}
    </div>
  );
};

export default FilterControls;
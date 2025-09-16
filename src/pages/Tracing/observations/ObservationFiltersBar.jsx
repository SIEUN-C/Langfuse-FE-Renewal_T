import React, { useMemo } from 'react';
import FilterControls from 'components/FilterControls/FilterControls';
import SearchInput from 'components/SearchInput/SearchInput';
import { observationsFilterConfig } from '../config/ObservationFilterConfig';
import { SEARCH_MODE } from '../config/SearchMode';

/**
 * 상단 툴바: Search + TimeRange + Env + Builder + Refresh
 * - 공용 컴포넌트(FilterControls, SearchInput) 재사용
 * - Builder만 관측치 전용 래퍼로 주입
 */
export default function ObservationsFiltersBar({
    searchQuery, onChangeSearch,
    searchMode = SEARCH_MODE.IDS_NAMES, onChangeSearchMode,
    timeRange, onChangeTimeRange,
    selectedEnvs, onChangeEnvs,
    builderFilters, onChangeBuilderFilters,
    onRefresh,
}) {
    const timeRangeFilterProps = useMemo(() => ({
        startDate: timeRange?.startDate || null,
        endDate: timeRange?.endDate || null,
        onChange: onChangeTimeRange,
    }), [timeRange, onChangeTimeRange]);

    const envFilterProps = useMemo(() => ({
        value: selectedEnvs || [],
        onChange: onChangeEnvs,
    }), [selectedEnvs, onChangeEnvs]);

    const builderFilterProps = useMemo(() => ({
        // ✅ FilterBuilder 가 기대하는 키로 전달해야 함
        filters: builderFilters || [],
        onFilterChange: onChangeBuilderFilters ?? (() => { }),
        filterConfig: observationsFilterConfig,
    }), [builderFilters, onChangeBuilderFilters]);

    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0 12px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 260 }}>
                <SearchInput
                    value={searchQuery || ''}
                    onChange={onChangeSearch}
                    placeholder="Search…"
                />
                {/* 🔽 간단한 네이티브 select — 공용 컴포넌트는 손대지 않음 */}
                <select
                    value={searchMode}
                    onChange={(e) => onChangeSearchMode?.(e.target.value)}
                    style={{
                        height: 34, background: 'transparent', color: 'inherit',
                        border: '1px solid #334155', borderRadius: 6, padding: '0 8px'
                    }}
                    title="Search scope"
                >
                    <option value={SEARCH_MODE.IDS_NAMES}>IDs / Names</option>
                    <option value={SEARCH_MODE.FULL_TEXT}>Full Text</option>
                </select>


            </div>

            {/* 공용 FilterControls 재사용 */}
            <FilterControls
                timeRangeFilterProps={timeRangeFilterProps}
                envFilterProps={envFilterProps}
                builderFilterProps={builderFilterProps}
                onRefresh={onRefresh}
            />
        </div>
    );
}

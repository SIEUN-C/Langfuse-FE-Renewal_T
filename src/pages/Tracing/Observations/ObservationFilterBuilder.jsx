import React from 'react';
import FilterBuilder from 'components/FilterControls/FilterBuilder';
import { observationsFilterConfig } from '../config/observationFilterConfig';

/**
 * 관측치 탭 전용 FilterBuilder 래퍼
 * - 공용 FilterBuilder는 그대로 재사용
 * - config만 우리 탭 전용으로 주입
 */
export default function ObservationFilterBuilder({ value, onChange, configOverride }) {
    // 필요하면 상위에서 configOverride로 확장 가능
    const config = Array.isArray(configOverride) && configOverride.length > 0
        ? configOverride
        : observationsFilterConfig;

    return (
        <FilterBuilder
            value={value}
            onChange={onChange}
            config={config}
        />
    );
}

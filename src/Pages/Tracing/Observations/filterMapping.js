// src/Pages/Tracing/Observations/filterMapping.js
export function buildFilterState({ from, selectedEnvs = [], typeCsv, levelCsv }) {
    const filters = [];
    if (from) {
        filters.push({ column: "Start Time", type: "datetime", operator: ">=", value: from });
    }
    if (selectedEnvs.length) {
        filters.push({ column: "environment", type: "stringOptions", operator: "any of", value: selectedEnvs });
    }
    if (typeCsv) {
        filters.push({ column: "type", type: "stringOptions", operator: "any of", value: typeCsv.split(',') });
    }
    if (levelCsv) {
        filters.push({ column: "level", type: "stringOptions", operator: "any of", value: levelCsv.split(',') });
    }
    return filters;
}

// Builder 배열([{column, value, ...}]) → 우리가 쓰는 간단 키로 압축
export function squeezeBuilderFilters(builderFilters = []) {
    const out = {};
    for (const f of builderFilters) {
        const col = (f?.column || f?.key || '').toLowerCase();
        const val = f?.value ?? '';
        if (!val) continue;

        if (col === 'type') {
            out.typeCsv = Array.isArray(val) ? val.join(',') : String(val);
        } else if (col === 'level') {
            out.levelCsv = Array.isArray(val) ? val.join(',') : String(val);
        }
        // 필요 시: model/tags 등 확장
    }
    return out;
}

// ✅ to(End time) 까지 포함한 새 빌더
export function buildFilterStateWithRange({ from, to, selectedEnvs = [], typeCsv, levelCsv }) {
    const filters = buildFilterState({ from, selectedEnvs, typeCsv, levelCsv });
    if (to) {
        filters.push({ column: "Start Time", type: "datetime", operator: "<=", value: to });
    }
    return filters;
}
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

// src/Pages/Tracing/Observations/filterMapping.js

// 서버까지 내려갈 수 있는 기본 타입
const BASE_TYPES = new Set(["GENERATION", "SPAN", "EVENT"]);

// 3000에서 사용하는 확장 타입 (프론트에서만 추가 필터)
const EXTRA_TYPES = new Set([
    "AGENT", "TOOL", "CHAIN", "RETRIEVER", "EVALUATOR", "EMBEDDING", "GUARDRAIL",
]);

// ──────────────────────────────────────────────────────────────
// 서버로 보낼 filter 배열 생성 (기존과 동일한 형태 유지)
// ──────────────────────────────────────────────────────────────
export function buildFilterState({ from, selectedEnvs = [], typeCsv, levelCsv }) {
    const filters = [];
    if (from) {
        filters.push({ column: "Start Time", type: "datetime", operator: ">=", value: from });
    }
    if (selectedEnvs.length) {
        filters.push({
            column: "environment",
            type: "stringOptions",
            operator: "any of",
            value: selectedEnvs,
        });
    }
    if (typeCsv) {
        filters.push({
            column: "type",
            type: "stringOptions",
            operator: "any of",
            value: typeCsv.split(","),
        });
    }
    if (levelCsv) {
        filters.push({
            column: "level",
            type: "stringOptions",
            operator: "any of",
            value: levelCsv.split(","),
        });
    }
    return filters;
}

// Builder([{column,value,…}]) → 간단 키로 압축
//  - 기본 타입은 typeCsv로 묶어서 서버에 전달
//  - 확장 타입은 typeGroups로 분리 (프론트에서 후처리)
export function squeezeBuilderFilters(builderFilters = []) {
    let typeCsv = "";
    let levelCsv = "";
    let typeGroups = [];

    for (const f of builderFilters) {
        const col = (f?.column || f?.key || "").toLowerCase();
        const raw = f?.value ?? "";
        if (raw === "" || raw == null) continue;

        const arr = Array.isArray(raw)
            ? raw
            : String(raw).split(",").map((s) => s.trim()).filter(Boolean);

        if (col === "type") {
            const base = arr.filter((v) => BASE_TYPES.has(v));
            const extra = arr.filter((v) => EXTRA_TYPES.has(v));
            if (base.length) typeCsv = base.join(",");
            if (extra.length) typeGroups = extra;
        } else if (col === "level") {
            levelCsv = Array.isArray(raw) ? raw.join(",") : String(raw);
        }
    }
    return { typeCsv, levelCsv, typeGroups };
}

// to(End time) 포함
export function buildFilterStateWithRange({ from, to, selectedEnvs = [], typeCsv, levelCsv }) {
    const filters = buildFilterState({ from, selectedEnvs, typeCsv, levelCsv });
    if (to) {
        filters.push({ column: "Start Time", type: "datetime", operator: "<=", value: to });
    }
    return filters;
}

// ──────────────────────────────────────────────────────────────
// 확장 타입 추정 + 프론트 후처리용 유틸
//  - 백엔드가 subtype/typeGroup 같은 정확한 필드를 주면 그걸 우선 사용
// ──────────────────────────────────────────────────────────────
export function guessTypeGroup(row = {}) {
    const direct = row.typeGroup || row.subtype;
    if (typeof direct === "string" && EXTRA_TYPES.has(direct)) return direct;

    const name = String(row.name || "").toLowerCase();
    const model = String(row.model || "").toLowerCase();
    const tags = Array.isArray(row.traceTags) ? row.traceTags.join(" ").toLowerCase() : "";

    if (/(embed|embedding)/.test(model) || /embed/.test(name)) return "EMBEDDING";
    if (/(guard|moderation)/.test(model) || /(guard|moderation)/.test(name)) return "GUARDRAIL";
    if (/agent/.test(name) || /agent/.test(tags)) return "AGENT";
    if (/tool/.test(name) || /tool/.test(tags)) return "TOOL";
    if (/chain/.test(name) || /chain/.test(tags)) return "CHAIN";
    if (/retriev/.test(name) || /retriev/.test(tags)) return "RETRIEVER";
    if (/eval|evaluator/.test(name) || /eval/.test(tags)) return "EVALUATOR";
    return null;
}

export function filterByTypeGroups(rows, typeGroups = []) {
    if (!Array.isArray(typeGroups) || typeGroups.length === 0) return rows;
    return rows.filter((r) => typeGroups.includes(guessTypeGroup(r)));
}

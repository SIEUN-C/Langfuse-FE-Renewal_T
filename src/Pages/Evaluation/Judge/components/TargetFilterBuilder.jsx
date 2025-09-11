import React, { useEffect, useState } from "react";
import { tracesFilterOptions } from "../services/evaluatorsApi";
import FilterBuilder from "components/FilterControls/FilterBuilder";

export default function TargetFilterBuilder({ projectId, value = "[]", onChange, disabled }) {
    const [filterConfig, setFilterConfig] = useState([]);
    const [filters, setFilters] = useState([]);

    // 서버에서 컬럼 옵션 불러오기
    useEffect(() => {
        if (!projectId) return;
        tracesFilterOptions({ projectId })
            .then((res) => {
                const options = Array.isArray(res?.options) ? res.options : [];
                setFilterConfig(
                    options.map((o) => ({
                        key: o.id,
                        label: o.label,
                        type: mapType(o.type),
                        operators: o.operators?.length ? o.operators : ["="],
                        hasMetaKey: o.id === "metadata",
                        options: o.values || [],
                    }))
                );
            })
            .catch(() => setFilterConfig([]));
    }, [projectId]);

    // 상위(JSON 문자열) → 내부 배열
    useEffect(() => {
        try {
            const arr = JSON.parse(value || "[]");
            const next = toBuilderFilters(arr);
            // 동일하면 setState 생략 (불필요한 재렌더 방지)
            const currStr = JSON.stringify(toUiJson(filters));
            const nextStr = JSON.stringify(toUiJson(next));
            if (currStr !== nextStr) setFilters(next);
        } catch {
            setFilters([]);
        }
        // filters를 의존성에 넣지 않는 게 포인트(동등성 가드로 비교만 사용)
    }, [value]);

    // 내부 배열 → 상위(JSON 문자열)
    useEffect(() => {
        if (disabled) return;
        const s = JSON.stringify(toUiJson(filters));
        if (s !== (value || "[]")) onChange?.(s);
    }, [filters, onChange, disabled, value]);

    return (
        <FilterBuilder
            filters={filters}
            onFilterChange={setFilters}
            filterConfig={filterConfig}
            disabled={disabled}
        />
    );
}

// ---------- helpers ----------
function mapType(t = "") {
    const lower = t.toLowerCase();
    if (lower.includes("date") || lower.includes("time")) return "date";
    if (lower.includes("enum") || lower.includes("category")) return "categorical";
    if (lower.includes("int") || lower.includes("float") || lower.includes("number")) return "number";
    return "string";
}

function toBuilderFilters(arr) {
    return (Array.isArray(arr) ? arr : []).map((f, i) => {
        // BE 스키마(op/columnId) → UI 스키마(column/operator) 보정
        const beColumn = f.columnId || f.key;
        const uiColumn = f.column ?? beColumn ?? "";
        // datasetId ↔ Dataset 매핑
        const fixedColumn = uiColumn === "datasetId" ? "Dataset" : uiColumn;
        return {
            id: i + 1,
            column: fixedColumn,
            operator: f.operator || f.op || "=",
            value: f.value ?? "",
            metaKey: f.metaKey || "",
        };
    });
}

function toUiJson(filters) {
    return (Array.isArray(filters) ? filters : []).map((f) => ({
        column: f.column,
        operator: f.operator,
        value: f.value,
        ...(f.metaKey ? { metaKey: f.metaKey } : {}),
    }));
}

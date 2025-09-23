import React, { useEffect, useState } from "react";
import { tracesFilterOptions, allDatasetMeta } from "../services/evaluatorsApi";
import FilterBuilder from "components/FilterControls/FilterBuilder";
import {
    tracesTableColsWithOptions,
    evalTraceTableCols,
    datasetFormFilterColsWithOptions,
    evalDatasetFormFilterCols,
} from "./cols";

export default function TargetFilterBuilder({ projectId, value = "[]", onChange, disabled }) {
    const [filterConfig, setFilterConfig] = useState([]);
    const [filters, setFilters] = useState([]);

    // 이 useEffect는 서버에서 필터 옵션을 불러오는 역할을 하므로 그대로 둡니다.
    useEffect(() => {
        if (!projectId) return;
        // ... (기존 옵션 로딩 코드는 변경 없음) ...
        const baseTrace = tracesTableColsWithOptions({}, evalTraceTableCols);
        const baseDs = datasetFormFilterColsWithOptions({ datasetId: [] }, evalDatasetFormFilterCols);
        setFilterConfig([...baseTrace, ...baseDs].map(c => ({
            key: c.id, label: c.name, type: mapTypeFromDefinition(c),
            operators: pickOps(c), hasMetaKey: c.id === "metadata", options: c.options || [],
        })));
        Promise.all([
            tracesFilterOptions({ projectId }).catch(() => null),
            allDatasetMeta({ projectId }).catch(() => []),
        ])
            .then(([fo, datasets]) => {
                const runtime = {
                    name: (fo?.name?.values ?? []).map(v => ({ value: v })),
                    environment: (fo?.environment?.values ?? []).map(v => ({ value: v })),
                    tags: (fo?.tags?.values ?? []).map(v => ({ value: v })),
                    score_categories: (fo?.score_categories?.values ?? []).map(v => ({ value: v })),
                    scores_avg: fo?.scores_avg?.values ?? [],
                };
                const traceCols = tracesTableColsWithOptions(runtime, evalTraceTableCols);
                const datasetCols = datasetFormFilterColsWithOptions(
                    { datasetId: (Array.isArray(datasets) ? datasets : []).map(d => ({ value: d.id, label: d.name })) },
                    evalDatasetFormFilterCols
                );
                const cols = [...traceCols, ...datasetCols].map(c => ({
                    key: c.id, label: c.name, type: mapTypeFromDefinition(c),
                    operators: pickOps(c), hasMetaKey: c.id === "metadata",
                    options: c.options || [],
                }));
                setFilterConfig(cols);
            })
            .catch(() => setFilterConfig([]));
    }, [projectId]);

    // ========================[수정 1/3: useEffect 로직 변경]========================
    // 주석: 부모로부터 받은 value prop이 변경될 때만 내부 상태를 업데이트합니다.
    useEffect(() => {
        try {
            // 현재 내부 상태를 외부 포맷(JSON 문자열)으로 변환
            const internalStateAsString = JSON.stringify(toUiJson(filters, filterConfig));
            
            // 외부에서 받은 값과 내부 상태를 변환한 값이 이미 같다면, 아무것도 하지 않습니다.
            // 이렇게 하면 불필요한 재동기화를 막아 루프를 차단합니다.
            if (internalStateAsString === (value || "[]")) {
                return;
            }

            // 외부 값이 바뀌었으므로 내부 상태를 업데이트합니다.
            const arr = JSON.parse(value || "[]");
            setFilters(toBuilderFilters(arr));
        } catch {
            setFilters([]);
        }
    }, [value, filterConfig]); // `filters`를 의존성 배열에서 제거하는 것이 매우 중요합니다.
    // ========================================================================


    // ========================[수정 2/3: useEffect 삭제 및 핸들러 추가]========================
    // 주석: 무한 루프의 원인이었던 "내부 -> 외부" 동기화 useEffect를 완전히 삭제합니다.
    /*
    useEffect(() => {
      if (disabled) return;
      const s = JSON.stringify(toUiJson(filters, filterConfig));
      if (s !== (value || "[]")) onChange?.(s);
    }, [filters, onChange, disabled, value, filterConfig]);
    */

    // 주석: 대신, 사용자가 FilterBuilder를 조작했을 때만 부모에게 알리는 핸들러 함수를 만듭니다.
    const handleFilterChange = (newFilters) => {
        // 1. 내부 상태를 먼저 업데이트합니다.
        setFilters(newFilters);
        // 2. 변경된 내부 상태를 외부 포맷으로 변환하여 부모에게 알립니다(onChange 호출).
        if (!disabled) {
            onChange?.(JSON.stringify(toUiJson(newFilters, filterConfig)));
        }
    };
    // ========================================================================

    if (!Array.isArray(filterConfig) || filterConfig.length === 0) {
        return <div style={{ opacity: .7, fontSize: 12 }}>Loading filter metadata…</div>;
    }
    return (
        <FilterBuilder
            filters={filters}
            // ========================[수정 3/3: 새 핸들러 연결]========================
            // 주석: onFilterChange prop에 setFilters 대신 새로 만든 핸들러를 연결합니다.
            onFilterChange={handleFilterChange}
            // =================================================================
            filterConfig={filterConfig}
            disabled={disabled}
        />
    );
}

// ... helpers (mapTypeFromDefinition, pickOps, toBuilderFilters, toUiJson) ...

/* ───────────────── helpers ───────────────── */

function mapTypeFromDefinition(c) {
    const t = String(c.type || "").toLowerCase();
    if (t.includes("date") || t.includes("time")) return "date";
    if (t.includes("number")) return "number";
    if (t.includes("object")) return "stringObject"; // metadata/scores_avg 등
    if (t.includes("options") || t.includes("category")) return "stringOptions";
    if (t.includes("boolean")) return "boolean";
    return "string";
}

function pickOps(c) {
    const t = mapTypeFromDefinition(c);
    if (t === "stringOptions") return ["any of", "none of"];
    if (t === "arrayOptions") return ["any of", "none of"];
    if (t === "number") return ["=", "≠", ">", "<", "between", "is null", "is not null"];
    if (t === "date") return ["before", "after", "between", "is null", "is not null"];
    if (t === "stringObject") return ["has key", "key equals", "contains", "is null", "is not null"];
    if (t === "boolean") return ["=", "≠", "is null", "is not null"];
    return ["contains", "=", "≠", "is null", "is not null"];
}

// 서버→UI (columnId/op → column/operator), 내부 상태의 column은 항상 "키"
function toBuilderFilters(arr) {
    return (Array.isArray(arr) ? arr : []).map((f, i) => {
        // 내부 상태는 항상 "키(id)"를 저장한다 (라벨 X)
        let key = f.columnId || f.key || f.column || "";
        if (key === "Dataset") key = "datasetId"; // 역보정 (혹시 라벨이 들어왔던 경우)
        return {
            id: i + 1,
            column: key,                                 // 키로 저장
            operator: f.operator || f.op || "=",
            value: f.value ?? "",
            metaKey: f.metaKey || "",
        };
    });
}

// UI→서버 (키를 columnId로 사용, Dataset → datasetId 역변환)
function toUiJson(filters, filterConfig = []) {
    const typeMap = new Map(filterConfig.map(c => [c.key, c.type]));
    return (Array.isArray(filters) ? filters : []).map((f) => {
        const key = f.column || "";                            // ★ 키 정의
        const columnId = key === "Dataset" ? "datasetId" : key;
        const type =
            typeMap.get(key) ||
            (columnId === "datasetId" ? "stringOptions" : "string");
        return {
            column: columnId,   // 일부 서버는 column, 일부는 columnId 사용 → 둘 다 맞춰주면 안전
            columnId,
            type,
            operator: f.operator,
            value: f.value,
            ...(f.metaKey ? { metaKey: f.metaKey } : {}),
        };
    });
}
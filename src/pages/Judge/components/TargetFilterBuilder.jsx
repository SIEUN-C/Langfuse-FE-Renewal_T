import React, { useEffect, useState } from "react";
import { tracesFilterOptions, allDatasetMeta } from "../services/evaluatorsApi";
import FilterBuilder from "components/FilterControls/FilterBuilder";
import {
    tracesTableColsWithOptions,
    evalTraceTableCols,
    datasetFormFilterColsWithOptions,
    evalDatasetFormFilterCols,
} from "./cols"; // ← cols.js 위치가 같다면 OK. 다르면 경로 조정

export default function TargetFilterBuilder({ projectId, value = "[]", onChange, disabled }) {
    const [filterConfig, setFilterConfig] = useState([]); // [{key,label,type,operators,hasMetaKey,options}]
    const [filters, setFilters] = useState([]);           // [{id,column,operator,value,metaKey?}]  column은 "키"

    // 서버 옵션 불러와 정답 스키마에 주입
    useEffect(() => {
        if (!projectId) return;

        // 0) 기본 컬럼 세팅(옵션 없이) → UI가 바로 열린다
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
                // 1) 서버가 준 distinct 값만 추려 런타임 옵션으로 변환
                const runtime = {
                    name: (fo?.name?.values ?? []).map(v => ({ value: v })),
                    environment: (fo?.environment?.values ?? []).map(v => ({ value: v })),
                    tags: (fo?.tags?.values ?? []).map(v => ({ value: v })),
                    score_categories: (fo?.score_categories?.values ?? []).map(v => ({ value: v })),
                    scores_avg: fo?.scores_avg?.values ?? [],
                };

                // 2) 정답 컬럼 세트 + 옵션 주입
                const traceCols = tracesTableColsWithOptions(runtime, evalTraceTableCols);
                const datasetCols = datasetFormFilterColsWithOptions(
                    { datasetId: (Array.isArray(datasets) ? datasets : []).map(d => ({ value: d.id, label: d.name })) },
                    evalDatasetFormFilterCols
                );

                // 3) FilterBuilder 설정 포맷으로 변환 (키/라벨/타입/연산자)
                const cols = [...traceCols, ...datasetCols].map(c => ({
                    key: c.id,                  // ★ 내부/서버 일치 키
                    label: c.name,              // 표시용 라벨
                    type: mapTypeFromDefinition(c),
                    operators: pickOps(c),
                    hasMetaKey: c.id === "metadata",
                    options: c.options || [],
                }));

                setFilterConfig(cols);
            })
            .catch(() => setFilterConfig([]));
    }, [projectId]);

    // 상위(JSON 문자열) → 내부 배열
    useEffect(() => {
        try {
            const arr = JSON.parse(value || "[]");
            const next = toBuilderFilters(arr);
            // 동등성 비교로 불필요 렌더 방지
            const currStr = JSON.stringify(toUiJson(filters, filterConfig));
            const nextStr = JSON.stringify(toUiJson(next, filterConfig));
            if (currStr !== nextStr) setFilters(next);
        } catch {
            setFilters([]);
        }
    }, [value, filterConfig]); // filters는 의존성 제외 (동등성 가드로 처리)

    // 내부 배열 → 상위(JSON 문자열)
    useEffect(() => {
        if (disabled) return;
        const s = JSON.stringify(toUiJson(filters, filterConfig));
        if (s !== (value || "[]")) onChange?.(s);
    }, [filters, onChange, disabled, value, filterConfig]);

    if (!Array.isArray(filterConfig) || filterConfig.length === 0) {
        return <div style={{ opacity: .7, fontSize: 12 }}>Loading filter metadata…</div>;
    }
    return (
        <FilterBuilder
            filters={filters}
            onFilterChange={setFilters}
            filterConfig={filterConfig}
            disabled={disabled}
        />
    );
}

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

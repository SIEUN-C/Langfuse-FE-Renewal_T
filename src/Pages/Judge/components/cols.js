// 프론트 전용 "정답지" 컬럼 정의 + 옵션 주입 유틸(JS 버전)

//
// ── 작은 헬퍼 ────────────────────────────────────────────────────────────────────
// options 배열을 {value,label} 통일형으로 변환
export function formatColumnOptions(col, options = []) {
    const norm = (arr) =>
        (Array.isArray(arr) ? arr : []).map((it) => {
            if (it && typeof it === "object") {
                const v = it.value ?? it.id ?? it.name ?? it.label ?? String(it);
                const l = it.label ?? it.name ?? it.value ?? String(v);
                return { value: v, label: l };
            }
            return { value: it, label: String(it) };
        });
    return { ...col, options: norm(options) };
}

// ── 공통 타입 힌트(주석) ─────────────────────────────────────────────────────────
// ColumnDefinition(JS Doc)
// {
//   name: string,            // UI 라벨
//   id: string,              // 키(프론트/서버 공통 식별자)
//   type: string,            // "string" | "number" | "boolean" | "datetime" |
//                            // "stringOptions" | "arrayOptions" | "stringObject" | "numberObject" | "categoryOptions"
//   internal?: string,       // 서버 쿼리용 별칭/실 컬럼 (백엔드가 해석)
//   options?: Array<{value,label}>,
//   nullable?: boolean,
//   internalNote?: string    // (선택) 설명용
// }

// ── Trace 전용 컬럼(12개) ────────────────────────────────────────────────────────
export const tracesOnlyCols = [
    { name: "⭐️", id: "bookmarked", type: "boolean", internal: "t.bookmarked" },
    { name: "ID", id: "id", type: "string", internal: "t.id" },
    {
        name: "Name",
        id: "name",
        type: "stringOptions",
        internal: 't."name"',
        options: [], // runtime 주입
        nullable: true,
    },
    {
        name: "Environment",
        id: "environment",
        type: "stringOptions",
        internal: 't."environment"',
        options: [], // runtime 주입
    },
    { name: "Timestamp", id: "timestamp", type: "datetime", internal: 't."timestamp"' },
    { name: "User ID", id: "userId", type: "string", internal: 't."user_id"', nullable: true },
    { name: "Session ID", id: "sessionId", type: "string", internal: 't."session_id"', nullable: true },
    { name: "Metadata", id: "metadata", type: "stringObject", internal: 't."metadata"' },
    { name: "Version", id: "version", type: "string", internal: 't."version"', nullable: true },
    { name: "Release", id: "release", type: "string", internal: 't."release"', nullable: true },
    {
        name: "Level",
        id: "level",
        type: "stringOptions",
        internal: '"level"',
        options: [{ value: "DEBUG" }, { value: "DEFAULT" }, { value: "WARNING" }, { value: "ERROR" }],
    },
    { name: "Tags", id: "tags", type: "arrayOptions", internal: 't."tags"', options: [] }, // runtime 주입
];

// ── Trace 테이블(메트릭 포함) ────────────────────────────────────────────────────
export const tracesTableCols = [
    ...tracesOnlyCols,
    { name: "Input Tokens", id: "inputTokens", type: "number", internal: 'generation_metrics."promptTokens"', nullable: true },
    { name: "Output Tokens", id: "outputTokens", type: "number", internal: 'generation_metrics."completionTokens"', nullable: true },
    { name: "Error Level Count", id: "errorCount", type: "number", internal: 'generation_metrics."errorCount"' },
    { name: "Warning Level Count", id: "warningCount", type: "number", internal: 'generation_metrics."warningCount"' },
    { name: "Default Level Count", id: "defaultCount", type: "number", internal: 'generation_metrics."defaultCount"' },
    { name: "Debug Level Count", id: "debugCount", type: "number", internal: 'generation_metrics."debugCount"' },
    { name: "Total Tokens", id: "totalTokens", type: "number", internal: 'generation_metrics."totalTokens"', nullable: true },
    // UI alias(필요 없으면 숨김 처리 가능)
    { name: "Tokens", id: "tokens", type: "number", internal: 'generation_metrics."totalTokens"', nullable: true },
    { name: "Scores (numeric)", id: "scores_avg", type: "numberObject", internal: "scores_avg" },
    {
        name: "Scores (categorical)",
        id: "score_categories",
        type: "categoryOptions",
        internal: "score_categories",
        options: [], // runtime 주입
        nullable: true,
    },
    { name: "Latency (s)", id: "latency", type: "number", internal: "observation_metrics.latency" },
    { name: "Input Cost ($)", id: "inputCost", type: "number", internal: '"calculatedInputCost"', nullable: true },
    { name: "Output Cost ($)", id: "outputCost", type: "number", internal: '"calculatedOutputCost"', nullable: true },
    { name: "Total Cost ($)", id: "totalCost", type: "number", internal: '"calculatedTotalCost"', nullable: true },
];

// ── Dataset 전용 ────────────────────────────────────────────────────────────────
export const datasetCol = {
    name: "Dataset",
    id: "datasetId", // 핵심: 서버 키는 datasetId
    type: "stringOptions",
    internal: 'di."dataset_id"',
    options: [], // runtime 주입
};
export const datasetOnlyCols = [datasetCol];

// ── 평가 화면에서 쓰는 "세트" ────────────────────────────────────────────────────
export const evalTraceTableCols = tracesOnlyCols;
export const evalDatasetFormFilterCols = datasetOnlyCols;

// ── 런타임 옵션 타입(JS Doc)
// TraceOptions: {
//   scores_avg?: string[],                                // numberObject 키 목록
//   score_categories?: Array<{value,label}|{value}|string>,
//   name?: Array<{value,label}|{value}|string>,
//   tags?: Array<{value,label}|{value}|string>,
//   environment?: Array<{value,label}|{value}|string>,
// }
// DatasetOptions: { datasetId: Array<{value,label}|{value}|string> }

// ── 옵션 주입 유틸 ──────────────────────────────────────────────────────────────
export function datasetFormFilterColsWithOptions(options = {}, cols = evalDatasetFormFilterCols) {
    return cols.map((col) => {
        if (col.id === "datasetId") {
            return formatColumnOptions(col, options.datasetId ?? []);
        }
        return col;
    });
}

export function tracesTableColsWithOptions(options = {}, cols = tracesTableCols) {
    return cols.map((col) => {
        if (col.id === "scores_avg") {
            return formatColumnOptions(col, options.scores_avg ?? []);
        }
        if (col.id === "name") {
            return formatColumnOptions(col, options.name ?? []);
        }
        if (col.id === "tags") {
            return formatColumnOptions(col, options.tags ?? []);
        }
        if (col.id === "environment") {
            return formatColumnOptions(col, options.environment ?? []);
        }
        if (col.id === "score_categories") {
            return formatColumnOptions(col, options.score_categories ?? []);
        }
        return col;
    });
}

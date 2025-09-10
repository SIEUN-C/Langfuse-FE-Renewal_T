// src/Pages/Evaluation/Judge/components/evalMapping.js

// --- 유틸: 템플릿에서 변수명 뽑기 (vars 우선, 없으면 prompt 파싱) ---
export function extractVarNames(template) {
    const arr = Array.isArray(template?.vars)
        ? template.vars.filter(v => typeof v === "string" && v.trim())
        : null;

    if (arr && arr.length) return arr;

    const p = String(template?.prompt || template?.promptText || "");
    const names = [...p.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
    return [...new Set(names)];
}

// --- 템플릿의 변수 정의에서 기본 매핑 생성 (1번은 input, 나머지는 output 관례) ---
export function buildDefaultMappingFromTemplate(template) {
    const vars = extractVarNames(template);
    return vars.map((name, idx) => ({
        templateVar: name,                 // 예: 'query', 'generation', 'ground_truth'
        object: "trace",
        objectVariable: idx === 0 ? "input" : "output",
        jsonPath: "",
    }));
}

// 저장된 config.variableMapping(Object) → form rows(Array)
export function rowsFromConfigMapping(mappingObj = {}) {
    return Object.entries(mappingObj).map(([k, v]) => ({
        templateVar: k,
        object: v.object || "trace",
        objectVariable: v.variable || v.objectVariable || "input",
        jsonPath: v.jsonPath || "",
    }));
}

// form rows(Array) → API payload용 Object
export function mappingObjFromRows(rows = [], templateVars = []) {
    const out = {};
    rows.forEach((r, i) => {
        const key = r.templateVar || templateVars[i];
        if (!key) return;
        out[key] = {
            object: r.object,
            variable: r.objectVariable,
            ...(r.jsonPath ? { jsonPath: r.jsonPath } : {}),
        };
    });
    return out;
}



// JsonPath 아주 얕은 추출($.a.b)
export function pickByJsonPath(root, path) {
    if (!path || !path.startsWith("$."))
        return root;
    try {
        return path
            .slice(2)
            .split(".")
            .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), root);
    } catch {
        return undefined;
    }
}

// 트레이스 1건 + 매핑 rows로 변수 → 값 맵 생성 (metadata 지원)
export function buildVarValuesFromTrace(trace, rows) {
    const tryParse = (v) => {
        if (typeof v !== "string") return v;
        try { return JSON.parse(v); } catch { return v; }
    };

    const varValues = {};
    for (const r of rows) {
        let base;
        if (r.object === "trace") {
            if (r.objectVariable === "input") base = tryParse(trace?.input);
            else if (r.objectVariable === "output") base = tryParse(trace?.output);
            else if (r.objectVariable === "metadata") base = trace?.metadata ?? trace?.meta;
        }
        const val = pickByJsonPath(base, r.jsonPath);
        varValues[r.templateVar] = val ?? base ?? null;
    }
    return varValues;
}

// 프롬프트 문자열에 {{var}} 치환
export function fillPrompt(promptText, varValues) {
    return String(promptText || "").replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const v = varValues[key];
        try {
            return typeof v === "string" ? v : JSON.stringify(v);
        } catch {
            return String(v ?? "");
        }
    });
}

// createJob payload 빌더 (trace-only 가정)
export function toCreatePayload(
    {
        projectId, evalTemplateId, scoreName,
        target = "live",
        filter = "[]",
        mappingRows = [],
        samplingPct = 100,
        delaySec = 30,
        runsOnNew = true,
        runsOnExisting = false,
    },
    templateVars = []
) {
    const parsedFilter = safeParseArray(filter);
    const variableMapping = mappingObjFromRows(mappingRows, templateVars);
    return {
        projectId,
        evalTemplateId,
        scoreName,
        target: "trace",
        filter: parsedFilter,
        variableMapping,
        sampling: Math.max(0, Math.min(1, Number((samplingPct / 100).toFixed(3)))),
        delay: Math.max(0, Number(delaySec)) * 1000, // ms
        timeScope:
            runsOnNew && runsOnExisting ? "BOTH"
                : runsOnNew ? "NEW"
                    : runsOnExisting ? "EXISTING"
                        : "NEW",
    };
}

function safeParseArray(s) {
    const raw = (s || "").trim();
    if (!raw) return [];
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) throw new Error("Filter must be an array");
    return normalizeFilters(v);
}


// form rows(Array) → (업데이트 전용) API payload용 Array
function mappingArrayFromRows(rows = [], templateVars = []) {
    return (rows || []).map((r, i) => {
        const lfObj =
            r.object === 'dataset' ? 'dataset_item'
                : (r.object || 'trace'); // 현재 UI는 'trace'만 있으므로 기본값 'trace'

        return {
            // ★ BE 정식 스키마 키들만 보냄
            templateVariable: r.templateVar || templateVars[i] || '',
            objectName: lfObj === 'trace' ? null : (r.objectName ?? null), // trace면 null 허용
            langfuseObject: lfObj,
            selectedColumnId: String(r.objectVariable || ''), // 'input' | 'output' | 'metadata' 등
            jsonSelector: (r.jsonPath ?? null), // null 허용
        };
    });
}

export function toUpdateConfigFromForm(form, template) {
    const {
        scoreName, filterText, mappingRows = [],
        samplingPct = 100, delaySec = 30,
        runsOnNew = true, runsOnExisting = false,
    } = form;

    const vars = extractVarNames(template);

    const filter = (() => {
        const raw = String(filterText || '').trim();
        if (!raw) return [];
        const v = JSON.parse(raw);
        if (!Array.isArray(v)) throw new Error('Filter must be an array');
        return normalizeFilters(v);
    })();

    const variableMapping = mappingArrayFromRows(mappingRows, vars);
    const delayMs = Math.max(0, Number(delaySec)) * 1000;

    return {
        ...(scoreName ? { scoreName: scoreName.trim() } : {}),
        filter,
        variableMapping,
        sampling: Math.max(0, Math.min(1, Number((samplingPct / 100).toFixed(3)))),
        delayMs,
    };
}

// ----- filter 호환 변환: UI형(operator/type) → BE형(op) -----
export function normalizeFilters(filters) {
    if (!Array.isArray(filters)) return [];
    const opMap = {
        'any of': 'anyOf',
        'none of': 'noneOf',
        'is': 'is',
        'is not': 'isNot',
        'contains': 'contains',
        'not contains': 'notContains',
        'starts with': 'startsWith',
        'ends with': 'endsWith',
        'before': 'before',
        'after': 'after',
        '<': 'lt', '<=': 'lte', '>': 'gt', '>=': 'gte',
    };
    return filters.map((f) => {
        if (!f || typeof f !== 'object') return f;
        const { operator, type, values, value, ...rest } = f;
        // op 우선, 없으면 operator를 매핑
        const op = rest.op ?? (operator ? (opMap[operator] || operator) : undefined);
        // value/values 단일도 배열로 보정
        let v = value ?? values ?? null;
        if (v != null && !Array.isArray(v)) v = [v];
        const out = { ...rest, ...(op ? { op } : {}), ...(v != null ? { value: v } : {}) };
        // 불필요한 필드 제거(type/operator)
        return out;
    });
}
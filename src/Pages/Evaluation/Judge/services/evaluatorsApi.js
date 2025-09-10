// src/Pages/Evaluation/Judge/components/service/evaluatorsApi.js
const TRPC_BASE = '/api/trpc';

/** tRPC Query (GET) */
async function trpcQuery(proc, input) {
    const url = `${TRPC_BASE}/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input ?? {} }))}`;
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    const text = await res.text().catch(() => '');
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { }
    if (!res.ok || data?.error) {
        throw new Error(`tRPC[GET] ${proc} failed: ${res.status} ${data?.error?.message || text}`);
    }
    return data?.result?.data?.json ?? null;
}

/** tRPC Mutation (POST) */
async function trpcMutation(proc, input) {
    const res = await fetch(`${TRPC_BASE}/${proc}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: input ?? {} }),
    });
    const text = await res.text().catch(() => '');
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { }
    if (!res.ok || data?.error) {
        throw new Error(`tRPC[POST] ${proc} failed: ${res.status} ${data?.error?.message || text}`);
    }
    return data?.result?.data?.json ?? null;
}

/* ========== Templates / Running Evaluators / Etc... 그대로 ========= */
export const templateNames = (p) => trpcQuery('evals.templateNames', p);
export const templateById = (p) => trpcQuery('evals.templateById', p);
export const allTemplates = (p) => trpcQuery('evals.allTemplates', p);
export const createTemplate = (p) => trpcMutation('evals.createTemplate', p);

export const counts = (p) => trpcQuery('evals.counts', p);
export const listRunningConfigs = (p) => trpcQuery('evals.allConfigs', p);
export const getRunningConfig = (p) => trpcQuery('evals.configById', p);
export const createJob = (p) => trpcMutation('evals.createJob', p);
export const updateEvalJob = (p) => trpcMutation('evals.updateEvalJob', p);
export const deleteEvalJob = (p) => trpcMutation('evals.deleteEvalJob', p);

export const tracesFilterOptions = (p) => trpcQuery('traces.filterOptions', p);
export const environmentFilterOptions = (p) => trpcQuery('projects.environmentFilterOptions', p);
export const allDatasetMeta = (p) => trpcQuery('datasets.allDatasetMeta', p);
export const getEvalLogs = (p) => trpcQuery('evals.getLogs', p);
export const updateAllDatasetEvalJobStatusByTemplateId =
    (p) => trpcMutation('evals.updateAllDatasetEvalJobStatusByTemplateId', p);


async function listTracesForPreview({ projectId, filter, page, limit }) {
    return trpcQuery('traces.all', {
        projectId,
        searchQuery: '',                 // or null
        searchType: ['id'],              // ✅ 배열. 기본은 ['id']면 충분
        filter: filter ?? [],            // ✅ 키 이름은 filter
        orderBy: { column: 'timestamp', order: 'DESC' }, // ✅ 객체
        page,
        limit,
    });
}

async function getTraceDetail({ projectId, id }) {
    return trpcQuery('traces.byIdWithObservationsAndScores', {
        projectId,
        traceId: id,       // ✅ 키 이름 traceId
    });
}

export async function getPreviewRows({
    projectId, filter = [], limit = 10, target = 'trace', timeScope = 'EXISTING',
}) {
    // target, timeScope는 서버 스키마에 없으니 프리뷰에는 굳이 보내지 않음
    const list = await listTracesForPreview({ projectId, filter, page: 0, limit });
    const items = list?.traces ?? [];
    const ids = items.slice(0, limit).map((t) => t.id);

    return Promise.all(ids.map((id) => getTraceDetail({ projectId, id })));
}


// ⚠️ create payload는 evalMapping.toCreatePayload만 사용 (단일 진실원칙)
// export function buildCreatePayload(form) {

//     // filter: 문자열 → 배열
//     let filterArr = [];
//     try {
//         const raw = (form.filter || "").trim();
//         if (raw) filterArr = JSON.parse(raw);
//         if (!Array.isArray(filterArr)) filterArr = [];
//     } catch { filterArr = []; }


//     // ★ 서버가 요구하는 mapping 키로 변환
//     const mapping = (form.variableMappingRows || []).map(r => ({
//         // array 순서가 템플릿 vars 순서와 매칭되므로 templateVariable은 옵션처럼 취급해도 됨
//         templateVariable: r.templateVar,                      // (선택) 있어도 무해
//         langfuseObject: r.object === "dataset" ? "dataset_item" : r.object, // "trace" | "dataset_item" ...
//         selectedColumnId: r.objectVariable,                   // "input" | "output"
//         jsonSelector: r.jsonPath?.trim() || undefined,        // 선택
//     }));


//     return {
//         projectId: form.projectId,
//         evalTemplateId: form.evalTemplateId,
//         target: form.target === "dataset" ? "dataset" : "trace", // "trace" | "dataset"

//         // ✅ 서버가 required로 요구하는 필드들
//         scoreName: (form.scoreName?.trim() || form.template?.name || ""),
//         filter: filterArr,                         // []
//         mapping,                                   // [{ templateVariable, object, variable, jsonSelector? }, ...]
//         sampling: typeof form.sampling === "number" ? form.sampling : 1, // 0~1

//         // 원본 UI에 있던 값들도 같이 (대부분 optional이지만 안전)
//         delayMs: Math.round((form.delaySec ?? 30) * 1000),
//         runOnNew: !!form.runsOnNew,
//         runOnExisting: !!form.runsOnExisting,
//     };
// }
// src/Pages/Evaluation/Judge/components/service/evaluatorsApi.js
const TRPC_BASE = '/api/trpc';

/** tRPC Query (GET) */
async function trpcQuery(proc, input, opts = {}) {
    const url = `${TRPC_BASE}/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input ?? {} }))}`;
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    const text = await res.text().catch(() => '');
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { }
    if (!res.ok || data?.error) {
        if (!opts.silent) {
            console.error('[tRPC GET ERROR]', proc, { status: res.status, input, body: text?.slice?.(0, 500) });
        }
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

// ─────────────────────────────────────────────────────────────────────────────
// 프로젝트별 성공 콤보 & allInput 지원 여부 캐시
const LIST_CALL_CACHE = new Map(); // Map<projectId, ({projectId, ...}) => {proc, payload}>
const DISABLE_ALLINPUT_BY_PROJECT = new Map(); // Map<projectId, boolean>

function isAllInputDisabled(projectId) {
    const key = `__lf_no_allinput_${projectId}`;
    if (DISABLE_ALLINPUT_BY_PROJECT.has(projectId)) return DISABLE_ALLINPUT_BY_PROJECT.get(projectId);
    let v = false;
    try { v = localStorage.getItem(key) === 'true'; } catch { }
    DISABLE_ALLINPUT_BY_PROJECT.set(projectId, v);
    return v;
}
function disableAllInput(projectId) {
    const key = `__lf_no_allinput_${projectId}`;
    DISABLE_ALLINPUT_BY_PROJECT.set(projectId, true);
    try { localStorage.setItem(key, 'true'); } catch { }
}

async function listTracesForPreview({ projectId, filterBE, filterUI, page, limit }) {
    // 서버/버전에 따라 컬럼명이 다름 → 순차 시도
    const orderColumns = ['timestamp', 'startTime', 'createdAt'];

    // 0) 프로젝트 캐시 먼저
    const cached = LIST_CALL_CACHE.get(projectId);
    if (cached) {
        try {
            const { proc, payload } = cached({ projectId, filterBE, filterUI, page, limit });
            return await trpcQuery(proc, payload, { silent: true });
        } catch {
            LIST_CALL_CACHE.delete(projectId); // 캐시 무효화
        }
    }

    let lastErr;
    const hasFilterBE = Array.isArray(filterBE) && filterBE.length > 0;

    // 1) ✔ BE 스키마(allInput) 먼저 (필터가 있을 때)
    if (hasFilterBE && !isAllInputDisabled(projectId)) {
        for (const col of orderColumns) {
            try {
                const inputBE = {
                    projectId,
                    orderBy: { column: col, order: 'DESC' },
                    page,
                    limit,
                    filter: filterBE,
                    searchQuery: '',
                };
                const out = await trpcQuery('traces.allInput', inputBE, { silent: true });
                LIST_CALL_CACHE.set(projectId, ({ projectId, filterBE, page, limit }) => ({
                    proc: 'traces.allInput',
                    payload: {
                        projectId,
                        orderBy: { column: col, order: 'DESC' },
                        page,
                        limit,
                        filter: Array.isArray(filterBE) ? filterBE : [],
                        searchQuery: '',
                    },
                }));
                return out;
            } catch (err) {
                const msg = String(err?.message || '');
                if (msg.includes('No procedure found') || msg.includes('404')) {
                    disableAllInput(projectId); // 이 프로젝트는 allInput 미지원
                    break; // UI 경로로 넘어감
                } else {
                    lastErr = err;
                }
            }
        }
    }

    // 2) UI 스키마(traces.all) 시도
    const searchCombos = [
        { searchQuery: '', searchType: ['id'] },
        { searchQuery: '', searchType: ['full_text'] },
        { searchQuery: '', searchType: [] },
    ];
    for (const col of orderColumns) {
        for (const s of searchCombos) {
            try {
                const inputUI = {
                    projectId,
                    orderBy: { column: col, order: 'DESC' },
                    page,
                    limit,
                    filter: Array.isArray(filterUI) ? filterUI : [],
                    ...s,
                };
                if (!Array.isArray(inputUI.searchType)) inputUI.searchType = [];
                const out = await trpcQuery('traces.all', inputUI, { silent: true });
                LIST_CALL_CACHE.set(projectId, ({ projectId, filterUI, page, limit }) => ({
                    proc: 'traces.all',
                    payload: {
                        projectId,
                        orderBy: { column: col, order: 'DESC' },
                        page,
                        limit,
                        filter: Array.isArray(filterUI) ? filterUI : [],
                        ...s,
                    },
                }));
                return out;
            } catch (err) {
                lastErr = err;
            }
        }
    }

    // 3) 마지막 폴백: 필터가 없을 때 allInput 한 번 더 시도 (프로젝트에 따라 지원)
    if (!hasFilterBE && !isAllInputDisabled(projectId)) {
        for (const col of orderColumns) {
            try {
                const inputBE = {
                    projectId,
                    orderBy: { column: col, order: 'DESC' },
                    page,
                    limit,
                    filter: [],
                    searchQuery: '',
                };
                const out = await trpcQuery('traces.allInput', inputBE, { silent: true });
                LIST_CALL_CACHE.set(projectId, ({ projectId, filterBE, page, limit }) => ({
                    proc: 'traces.allInput',
                    payload: {
                        projectId,
                        orderBy: { column: col, order: 'DESC' },
                        page,
                        limit,
                        filter: Array.isArray(filterBE) ? filterBE : [],
                        searchQuery: '',
                    },
                }));
                return out;
            } catch (err) {
                const msg = String(err?.message || '');
                if (msg.includes('No procedure found') || msg.includes('404')) {
                    disableAllInput(projectId);
                    break;
                } else {
                    lastErr = err;
                }
            }
        }
    }

    throw lastErr;
}

async function getTraceDetail({ projectId, id }) {
    try {
        return await trpcQuery('traces.byIdWithObservationsAndScores', { projectId, traceId: id });
    } catch {
        return await trpcQuery('traces.byId', { projectId, traceId: id });
    }
}

export async function getPreviewRows({
    projectId, filterBE = [], filterUI = [], limit = 10,
}) {
    const list = await listTracesForPreview({
        projectId,
        filterBE,
        filterUI,
        page: 0,
        limit,
    });
    // 목록 응답 모양을 유연하게 처리
    const items =
        Array.isArray(list?.traces) ? list.traces :
            Array.isArray(list?.items) ? list.items :
                Array.isArray(list?.data) ? list.data : [];
    const ids = items.slice(0, limit).map((t) => t.id);

    return Promise.all(ids.map((id) => getTraceDetail({ projectId, id })));
}

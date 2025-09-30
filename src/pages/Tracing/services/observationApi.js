// src/Pages/Tracing/Observations/ObservationsApi.js
import { trpcQuery } from './trpcClient';

export async function listGenerations(req) {
    const safe = {
        projectId: String(req.projectId),
        filter: Array.isArray(req.filter) ? req.filter : [],
        page: Number.isFinite(req.page) ? req.page : 0,
        limit: Number.isFinite(req.limit) ? req.limit : 50,
        orderBy: req.orderBy ?? { column: 'startTime', order: 'DESC' },
        searchType: Array.isArray(req.searchType) ? req.searchType : [],
        searchQuery: typeof req.searchQuery === 'string' ? req.searchQuery : '',
    };
    return trpcQuery('generations.all', safe);
}

// ✅ 관측치 상세 (I/O 포함) — 서버가 요구하는 traceId, projectId, observationId(+ truncated)로 고정
export async function getObservationById({ observationId, traceId, projectId, truncated }) {
    const payload = {
        observationId: String(observationId),   // ← 이름을 observationId로 고정 (서버 스키마에 맞춰)
        traceId: String(traceId),
        projectId: String(projectId),
        ...(typeof truncated === 'boolean' ? { truncated } : {}),
    };
    return trpcQuery('observations.byId', payload);
}

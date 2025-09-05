// src/Pages/Tracing/Observations/ObservationsTab.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'components/DataTable/DataTable';
import { makeObservationColumns } from './observationColumns';
import { listGenerations, getObservationById } from './ObservationsApi';
import { buildFilterStateWithRange, squeezeBuilderFilters } from './filterMapping';
import ObservationDetailPanel from './ObservationDetailPanel';
import { SEARCH_MODE } from './searchModes';

const pick = (...vals) => vals.find(v => v !== undefined && v !== null);

export default function ObservationsTab({
    projectId,
    searchQuery,
    searchMode,                // ✅ 상단 검색 모드 문자열("IDs / Names" | "Full Text")
    selectedEnvs,
    timeRangeFilter,
    builderFilters = [],
}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);

    // ────────────────── 검색 모드 처리 ──────────────────
    // 상단 SearchInput은 문자열이므로 두 케이스를 모두 지원
    const isFullText =
        searchMode === 'Full Text' || searchMode === SEARCH_MODE?.FULL_TEXT;
    const SEARCHTYPE_ID = useRef(['id']).current;
    const SEARCHTYPE_CONTENT = useRef(['content']).current;
    const searchTypeApi = isFullText ? SEARCHTYPE_CONTENT : SEARCHTYPE_ID;


    // ────────────────── 값 스냅샷(참조 대신 내용) ──────────────────
    const dep_time = JSON.stringify({
        from: timeRangeFilter?.startDate?.toISOString?.() || null,
        to: timeRangeFilter?.endDate?.toISOString?.() || null,
    });
    const dep_envs = JSON.stringify((selectedEnvs || []).map(e => e.name));
    const dep_builder = JSON.stringify(builderFilters || []);
    const dep_query_raw = (searchQuery || '').trim();

    // ────────────────── 검색어만 디바운스 ──────────────────
    const [debouncedQuery, setDebouncedQuery] = useState(dep_query_raw);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(dep_query_raw), 250);
        return () => clearTimeout(t);
    }, [dep_query_raw]);

    // ────────────────── 요청 본문 만들기 ──────────────────
    const fullRequest = useMemo(() => {
        const time = JSON.parse(dep_time);
        const envs = JSON.parse(dep_envs);
        const bfs = JSON.parse(dep_builder);
        const { typeCsv, levelCsv } = squeezeBuilderFilters(bfs);

        const base = {
            projectId,
            filter: buildFilterStateWithRange({
                from: time.from,
                to: time.to,
                selectedEnvs: envs,
                typeCsv,
                levelCsv,
            }),
            page: 0,
            limit: 50,
            orderBy: { column: 'startTime', order: 'DESC' },
            // ✅ 서버가 싫어하는 빈 배열([])은 보내지 않음
            //    Full Text인 경우에만 명시적으로 보냄
            // ✅ 검색어가 있을 때만 searchType + searchQuery 전송
            ...(debouncedQuery ? { searchType: searchTypeApi, searchQuery: debouncedQuery } : {}),
        };

        return base;
    }, [projectId, dep_time, dep_envs, dep_builder, debouncedQuery, isFullText]);

    // ────────────────── 최신 요청만 반영 가드 ──────────────────
    const reqIdRef = useRef(0);

    const load = useCallback(async () => {
        if (!projectId) {
            setError('프로젝트가 선택되지 않았습니다.');
            return;
        }
        const myReqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const res = await listGenerations(fullRequest);
            // 이미 더 최신 요청이 있다면 무시
            if (reqIdRef.current !== myReqId) return;

            const gens = res?.generations ?? [];
            const baseRows = gens.map(g => ({
                id: g.id,
                traceId: g.traceId,
                type: g.type,
                traceName: g.traceName,
                startTime: g.startTime,
                endTime: g.endTime,
                timeToFirstToken: g.timeToFirstToken,
                scores: g.scores,
                latency: g.latency,
                totalCost: g.totalCost,
                inputCost: g.inputCost,
                outputCost: g.outputCost,
                input: pick(g.input, g.inputText, g.prompt, null),
                output: pick(g.output, g.outputText, g.completion, null),
                name: g.name,
                version: g.version,
                model: g.model,
                modelId: g.internalModelId,
                level: g.level,
                statusMessage: g.statusMessage,
                usage: {
                    inputUsage: g.inputUsage,
                    outputUsage: g.outputUsage,
                    totalUsage: g.totalUsage,
                    promptTokens: g.usage?.promptTokens,
                    completionTokens: g.usage?.completionTokens,
                    totalTokens: g.usage?.totalTokens,
                },
                promptId: g.promptId,
                promptName: g.promptName,
                promptVersion: g.promptVersion?.toString(),
                traceTags: g.traceTags,
                timestamp: g.traceTimestamp,
                usageDetails: g.usageDetails || {},
                costDetails: g.costDetails || {},
                environment: g.environment,
            }));
            setRows(baseRows);
        } catch (e) {
            if (reqIdRef.current !== myReqId) return; // 최신요청 아님: 무시
            console.error('load generations failed:', e);
            setError(e.message || 'Failed to load observations');
        } finally {
            if (reqIdRef.current === myReqId) setLoading(false);
        }
    }, [projectId, fullRequest]);

    // 변경될 때마다 호출 (검색어는 위에서 250ms 디바운스됨)
    useEffect(() => { load(); }, [load]);

    // ────────────────── 행 클릭 시 필요한 상세만 지연 로드(+캐시) ──────────────────
    const detailCacheRef = useRef(new Map());
    const ensureHydrated = useCallback(async (r) => {
        if (!r || detailCacheRef.current.has(r.id)) return;
        try {
            const d = await getObservationById({ observationId: r.id, traceId: r.traceId, projectId });
            const hydratedInput = pick(d?.input, d?.inputText, d?.prompt, d?.messages ? JSON.stringify(d.messages) : null, d?.metadata?.input, d?.usageDetails?.input);
            const hydratedOutput = pick(d?.output, d?.outputText, d?.completion, d?.response ? JSON.stringify(d.response) : null, d?.metadata?.output, d?.usageDetails?.output);
            detailCacheRef.current.set(r.id, { input: hydratedInput, output: hydratedOutput });
            if (hydratedInput != null || hydratedOutput != null) {
                setRows(prev => prev.map(row => row.id === r.id ? { ...row, input: hydratedInput ?? row.input, output: hydratedOutput ?? row.output } : row));
            }
        } catch (e) {
            console.warn('hydrate failed', r.id, e);
        }
    }, [projectId]);

    return (
        <>
            {selected && (
                <ObservationDetailPanel
                    key={`${selected.traceId}:${selected.id}`}
                    observation={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            {loading && <div style={{ opacity: .7, margin: '8px 0' }}>Loading…</div>}
            {error && <div style={{ color: '#ff6b6b', margin: '8px 0' }}>{error}</div>}

            <DataTable
                columns={makeObservationColumns(projectId).map(c => ({ ...c, visible: true }))}
                data={rows}
                keyField="id"
                onRowClick={async (row) => {
                    setSelected({ id: row.id, traceId: row.traceId, projectId });
                    if (row.type === 'GENERATION' && (row.input == null || row.output == null)) {
                        await ensureHydrated(row);
                    }
                }}
                renderEmptyState={() => <div>No observations found.</div>}
                showCheckbox={false}
                showFavorite={false}
                showDelete={false}
            />
        </>
    );
}

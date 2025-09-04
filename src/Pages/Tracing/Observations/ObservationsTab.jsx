// src/Pages/Tracing/Observations/ObservationsTab.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'components/DataTable/DataTable';
import { makeObservationColumns } from './observationColumns';
import { listGenerations } from './ObservationsApi';
import { buildFilterState } from './filterMapping';
import { fetchObservationDetails } from './ObservationDetailApi'; // ← 상세 API
import { getObservationById } from './ObservationsApi';
import ObservationDetailPanel from './ObservationDetailPanel';


// 유틸: 다중 후보 중 첫 non-null/undefined 반환
const pick = (...vals) => vals.find(v => v !== undefined && v !== null);


export default function ObservationsTab({
    projectId, searchQuery, selectedEnvs, timeRangeFilter, builderFilters = [],
}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef({ aborted: false });
    const [selected, setSelected] = useState(null); // {id, traceId, projectId}


    useEffect(() => {
        return () => { abortRef.current.aborted = true; };
    }, []);

    // (나중 확장용) fullRequest는 일단 보관만
    const fullRequest = useMemo(() => {
        const fromISO = timeRangeFilter?.startDate?.toISOString();
        const envs = (selectedEnvs || []).map(e => e.name);
        const typeCsv = builderFilters.find(b => b.column === 'Type')?.value;
        const levelCsv = builderFilters.find(b => b.column === 'Level')?.value;

        return {
            projectId,
            filter: buildFilterState({ from: fromISO, selectedEnvs: envs, typeCsv, levelCsv }),
            page: 0,
            limit: 50,
            orderBy: { column: 'startTime', order: 'DESC' },
            searchType: [],                 // 3000과 동일하게 빈 배열
            searchQuery: searchQuery || undefined,
        };
    }, [projectId, timeRangeFilter, selectedEnvs, builderFilters, searchQuery]);

    const load = useCallback(async () => {
        if (!projectId) {
            setError('프로젝트가 선택되지 않았습니다.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const payload = {
                projectId,
                filter: [], // 필요 시 buildFilterState(...) 결과로 교체
                page: 0,
                limit: 50,
                orderBy: { column: 'startTime', order: 'DESC' },
                searchType: [],                 // 절대 null/undefined 금지
                searchQuery: searchQuery || '', // 빈 문자열로 고정
            };

            const res = await listGenerations(payload);
            const gens = res?.generations ?? [];
            const baseRows = gens.map((g) => ({
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
                // 1차 값(목록이 주는 얕은 필드)
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

            // ▲ 여기까지는 1차 목록. 이제 I/O가 비어있는 GENERATION만 상세로 하이드레이트
            const targets = baseRows.filter(
                r => r.type === 'GENERATION' && (r.input == null || r.output == null)
            );
            if (targets.length === 0) return;

            const CONCURRENCY = 5; // 동시 요청 5개 제한
            let i = 0;
            const worker = async () => {
                while (i < targets.length && !abortRef.current.aborted) {
                    const idx = i++;
                    const t = targets[idx];
                    try {
                        const detail = await getObservationById({
                            observationId: t.id,
                            traceId: t.traceId,
                            projectId,       // ← 상위 스코프의 projectId
                            truncated: false // ← 잘리지 않게
                        });
                        const hydratedInput = pick(
                            detail?.input,
                            detail?.inputText,
                            detail?.prompt,
                            // 메시지/배열 형태면 문자열로
                            detail?.messages ? JSON.stringify(detail.messages) : null,
                            detail?.metadata?.input,
                            detail?.usageDetails?.input
                        );
                        const hydratedOutput = pick(
                            detail?.output,
                            detail?.outputText,
                            detail?.completion,
                            detail?.response ? JSON.stringify(detail.response) : null,
                            detail?.metadata?.output,
                            detail?.usageDetails?.output
                        );

                        if (hydratedInput != null || hydratedOutput != null) {
                            setRows(prev =>
                                prev.map(r =>
                                    r.id === t.id
                                        ? {
                                            ...r,
                                            input: hydratedInput ?? r.input,
                                            output: hydratedOutput ?? r.output,
                                        }
                                        : r
                                )
                            );
                        }
                        console.log('[hydrate] targets', targets.map(t => t.id));
                    } catch (e) {
                        // 상세 실패는 조용히 스킵(테이블은 계속 보이게)
                        console.warn('hydrate failed', t.id, e);
                    }
                }
            };
            await Promise.all(Array.from({ length: CONCURRENCY }, worker));
        } catch (e) {
            console.error('load generations failed:', e);
            setError(e.message || 'Failed to load observations');
        } finally {
            setLoading(false);
        }
    }, [projectId, searchQuery]);


    useEffect(() => { load(); }, [load]);

    return (
        <>

            {selected && (
                <ObservationDetailPanel
                    key={`${selected.traceId}:${selected.id}`}   // ← 클릭마다 새 컴포넌트
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
                onRowClick={(row) => setSelected({ id: row.id, traceId: row.traceId, projectId })}
                renderEmptyState={() => <div>No observations found.</div>}
                showCheckbox={false}
                showFavorite={false}
                showDelete={false}
            />
        </>
    );
}

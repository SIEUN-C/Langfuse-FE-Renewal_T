import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { getObservationById } from '../services/ObservationApi';
import { fetchTraceDetails } from '../services/TraceDetailApi';
import TraceTimeline from '../components/TraceTimeline';
import TraceDetailView from '../components/TraceDetailView';
import styles from '../components/TraceDetailPanel.module.css';
import normalizeForDetailView from '../utils/normalizeForDetailView';



// 다양한 형태의 콜백 인자에서 관측치 id 추출
const extractObsId = (...args) => {
    for (const a of args) {
        if (!a) continue;
        if (typeof a === 'string') return a;
        if (typeof a === 'object') {
            const hit = [
                a.id, a.observationId, a.nodeId, a.uuid,
                a.observation?.id, a.data?.id, a.payload?.id,
            ].find(Boolean);
            if (hit) return hit;
        }
    }
    return null;
};

// (유지) 메시지 → 문자열 유틸
function stringifyMessages(messages) {
    if (!Array.isArray(messages)) return null;
    try {
        return messages
            .map(m => `${m.role || ''}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
            .join('\n');
    } catch {
        return JSON.stringify(messages);
    }
}

export default function ObservationDetailPanel({ observation, onClose }) {
    // 좌: 트리 / 우: 상세
    const [traceDetails, setTraceDetails] = useState(null);
    const [selected, setSelected] = useState(() =>
        observation
            ? {
                id: observation.id,
                traceId: observation.traceId || undefined,
                projectId: observation.projectId || undefined,
            }
            : null
    );

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // 트리 로드
    useEffect(() => {
        if (!observation?.traceId) return;
        (async () => {
            try {
                const t = await fetchTraceDetails(observation.traceId);
                setTraceDetails(t);
            } catch (e) {
                console.warn('load trace details failed', e);
            }
        })();
    }, [observation?.traceId]);

    // ✅ 컴포넌트 **내부**에서 인덱스 생성 (traceDetails/observation 접근 OK)
    const nodeIndex = useMemo(() => {
        const idx = { byId: {}, projectId: traceDetails?.projectId ?? observation?.projectId };
        const walk = (n) => {
            if (!n) return;
            const oid = n.id ?? n.observationId ?? n.nodeId ?? n.uuid;
            if (oid) {
                idx.byId[String(oid)] = {
                    traceId: n.traceId ?? observation?.traceId,
                    projectId: n.projectId ?? idx.projectId,
                };
            }
            (n.children || []).forEach(walk);
        };
        // 트리 구조가 t.tree 이거나 t 자체일 수 있어 방어
        const root = traceDetails?.tree ?? traceDetails;
        if (Array.isArray(root)) root.forEach(walk);
        else walk(root);
        return idx;
    }, [traceDetails, observation?.traceId, observation?.projectId]);

    // 상세 로드
    useEffect(() => {
        let cancel = false;
        (async () => {
            const projectId = selected?.projectId ?? traceDetails?.projectId;
            if (!selected?.id || !selected?.traceId || !projectId) {
                console.log('[detail-load skipped]', { selected, projectId });
                return;
            }

            console.log('[detail-load firing]', { selected, projectId });
            setLoading(true);
            setDetails(null);
            setErr(null);
            try {
                const raw = await getObservationById({
                    observationId: selected.id,
                    traceId: selected.traceId,
                    projectId,
                    truncated: false,
                });
                if (!cancel) setDetails(normalizeForDetailView(raw));
            } catch (e) {
                if (!cancel) setErr(e?.message || 'Failed to load observation');
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => { cancel = true; };
    }, [selected?.id, selected?.traceId, selected?.projectId, traceDetails?.projectId]);

    const handleSelectFromTree = useCallback((...args) => {
        console.log('[TraceTimeline click args]', args);

        // 1) 콜백 인자에서 먼저 시도
        let nextId = extractObsId(...args);

        // 2) 실패하면 DOM 위임으로 data-*에서 시도 (첫 번째 인자가 이벤트일 수 있음)
        if (!nextId && args.length && args[0]?.target) {
            let el = args[0].target;
            for (let hop = 0; hop < 6 && el; hop++) {
                const get = (k) => el.getAttribute?.(k);
                nextId =
                    get?.('data-observation-id') ||
                    get?.('data-id') ||
                    get?.('data-node-id') ||
                    get?.('data-oid');
                if (nextId) break;
                el = el.parentElement;
            }
        }

        if (!nextId) {

            return;
        }

        const idxHit = nodeIndex.byId[String(nextId)] || {};
        const nextTraceId = idxHit.traceId ?? observation?.traceId;
        const nextProjectId = idxHit.projectId ?? traceDetails?.projectId ?? observation?.projectId;

        setSelected({
            id: String(nextId),
            traceId: nextTraceId ? String(nextTraceId) : undefined,   // '' 넣지 않기
            projectId: nextProjectId ? String(nextProjectId) : undefined,
        });
        // nodeIndex(트리 인덱스), 그리고 보정에 쓰는 trace/project 의존성만 넣기
    }, [nodeIndex, observation?.traceId, observation?.projectId, traceDetails?.projectId]);

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.tracePill}><span>Observation</span></div>
                    <span className={styles.traceId}>{selected?.id}</span>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.iconButton} onClick={onClose} title="Close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.panelBody}>
                <div className={styles.timelineSection} onClick={(e) => handleSelectFromTree(e)}>
                    <TraceTimeline
                        details={traceDetails}
                        onObservationSelect={handleSelectFromTree}
                        onSelect={handleSelectFromTree}
                        onNodeClick={handleSelectFromTree}
                        onClickNode={handleSelectFromTree}
                        selectedId={selected?.id}
                        selectedObservationId={selected?.id}
                        activeId={selected?.id}
                    />
                </div>
                <div className={styles.detailSection}>
                    <TraceDetailView
                        key={`${selected?.id || 'trace-root'}:${selected?.traceId || ''}`}
                        details={details}
                        isLoading={loading}
                        error={err}
                    />
                </div>
            </div>
        </div>
    );
}

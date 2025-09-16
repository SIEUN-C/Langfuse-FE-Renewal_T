import React from 'react';
import dayjs from 'dayjs';
import IOCell from '../Observations/ObservationIocell'; // 경로/파일명 맞추기

const msPretty = (ms) => {
    if (ms == null) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

const tokens = (row) => {
    const u = row.usageDetails || {};
    const i = u.input ?? row.inputUsage ?? 0;
    const o = u.output ?? row.outputUsage ?? 0;
    const t = u.total ?? row.totalUsage ?? (i + o);
    return `${i} → ${o} (Σ ${t})`;
};

const cost = (row) => {
    const v = row.totalCost ?? row.costDetails?.total;
    return v == null ? '—' : `$${Number(v).toFixed(8)}`;
};

// 작은 뱃지 스타일(없으면 기본 span)
const Tag = ({ children }) => (
    <span style={{
        display: 'inline-block',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '0 6px',
        fontSize: 12,
        lineHeight: '18px',
        marginRight: 6,
        whiteSpace: 'nowrap'
    }}>
        {children}
    </span>
);

// Prompt 셀: promptName(+version) 또는 fallback 프리뷰
function PromptCell({ row }) {
    const name = row.promptName || row.promptId || null;
    const ver = row.promptVersion ? ` v${row.promptVersion}` : '';
    if (name) return <span title={`${name}${ver}`}>{name}{ver}</span>;
    // fallback: input 프리뷰를 짧게
    const s = typeof row.input === 'string' ? row.input : (row.input ? JSON.stringify(row.input) : '');
    const preview = s ? (s.length > 60 ? s.slice(0, 60) + '…' : s) : '—';
    return <span title={s}>{preview}</span>;
}

// Trace Tags 셀
function TraceTagsCell({ row }) {
    const tags = Array.isArray(row.traceTags) ? row.traceTags : [];
    if (tags.length === 0) return '—';
    return <span>{tags.map((t, idx) => <Tag key={idx}>{t}</Tag>)}</span>;
}

// Correctness(eval) 셀: scores 에서 ‘Correctness’(대소문자 변형 허용) 찾아 표시
function CorrectnessCell({ row }) {
    const scores = row.scores || {};
    // 가능한 키 후보를 유연하게 탐색
    const keys = Object.keys(scores);
    const k = keys.find(k =>
        k.toLowerCase() === 'correctness' ||
        k.toLowerCase() === '# correctness (eval)'.replace(/\s+/g, '')
    );
    if (!k) return '—';

    // Langfuse score 구조가 { value, comment, … } 또는 primitive 둘 다 가능성 고려
    const v = scores[k];
    const val = (v && typeof v === 'object') ? (v.value ?? v.score ?? v.result ?? null) : v;
    if (val == null) return '—';

    // 숫자면 소수 한 자리로 정리(원하면 조정)
    const shown = typeof val === 'number' ? Number(val.toFixed(2)) : String(val);
    return <span title={`${k}: ${shown}`}>{shown}</span>;
}

// ✅ columns factory
export const makeObservationColumns = (projectId) => ([
    { header: 'Start Time', accessor: (row) => row.startTime ? dayjs(row.startTime).format('YYYY-MM-DD HH:mm:ss') : '—' },
    { header: 'Type', accessor: (row) => row.type ?? '—' },
    { header: 'Name', accessor: (row) => row.name ?? '—' },

    // Prompt
    { header: 'Prompt', accessor: (row) => <PromptCell row={row} /> },

    // Input/Output — 상세 하이드레이트
    { header: 'Input', accessor: (row) => <IOCell row={row} projectId={projectId} col="input" /> },
    { header: 'Output', accessor: (row) => <IOCell row={row} projectId={projectId} col="output" /> },

    // Environment / Trace Tags / Metadata / Correctness(eval)
    { header: 'Environment', accessor: (row) => row.environment ?? '—' },
    { header: 'Trace Tags', accessor: (row) => <TraceTagsCell row={row} /> },
    { header: 'Metadata', accessor: (row) => <IOCell row={row} projectId={projectId} col="metadata" singleLine={true} /> },
    { header: '# Correctness (eval)', accessor: (row) => <CorrectnessCell row={row} /> },

    // 나머지 수치
    { header: 'Total Cost', accessor: (row) => cost(row) },
    { header: 'Time to First Token', accessor: (row) => msPretty(row.timeToFirstToken) },
    { header: 'Tokens', accessor: (row) => tokens(row) },
    { header: 'Model', accessor: (row) => row.model ?? '—' },
    { header: 'Env', accessor: (row) => row.environment ?? '—' },
]);

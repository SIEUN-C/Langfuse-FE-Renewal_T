import React from 'react';
import dayjs from 'dayjs';
import IOCell from '../Observations/ObservationIocell'; // 경로/파일명 맞추기
import { Sigma, MoveRight, Tag } from 'lucide-react';
import styles from '../Tracing.module.css';

// Correctness(eval) 셀: scores 에서 ‘Correctness’(대소문자 변형 허용) 찾아 표시
// function CorrectnessCell({ row }) {
//     const scores = row.scores || {};
//     // 가능한 키 후보를 유연하게 탐색
//     const keys = Object.keys(scores);
//     const k = keys.find(k =>
//         k.toLowerCase() === 'correctness' ||
//         k.toLowerCase() === '# correctness (eval)'.replace(/\s+/g, '')
//     );
//     if (!k) return '—';

//     // Langfuse score 구조가 { value, comment, … } 또는 primitive 둘 다 가능성 고려
//     const v = scores[k];
//     const val = (v && typeof v === 'object') ? (v.value ?? v.score ?? v.result ?? null) : v;
//     if (val == null) return '—';

//     // 숫자면 소수 한 자리로 정리(원하면 조정)
//     const shown = typeof val === 'number' ? Number(val.toFixed(2)) : String(val);
//     return <span title={`${k}: ${shown}`}>{shown}</span>;
// }

// ✅ columns factory
export const makeObservationColumns = (projectId, rowHeight) => {
    const isSingleLine = rowHeight === 'small';

    return ([
        {
            id: 'startTime',
            header: 'Start Time',
            accessor: (row) => row.startTime ? dayjs(row.startTime).format('YYYY-MM-DD HH:mm:ss') : '-',
            defaultVisible: true,
        },
        {
            id: 'type',
            header: 'Type',
            accessor: (row) => row.type ?? '-',
            isMandatory: true
        },
        {
            id: 'name',
            header: 'Name',
            accessor: (row) => row.name ?? '-',
            isMandatory: true
        },
        {
            id: 'input',
            header: 'Input',
            accessor: (row) => <IOCell row={row} projectId={projectId} col="input" singleLine={isSingleLine} rowHeight={rowHeight} />,
            defaultVisible: true,
        },
        {
            id: 'output',
            header: 'Output',
            accessor: (row) => <IOCell row={row} projectId={projectId} col="output" singleLine={isSingleLine} rowHeight={rowHeight}/>,
            defaultVisible: true,
        },
        {
            id: 'level',
            header: 'Level',
            accessor: (row) => row.level ?? '-',
            defaultVisible: true,
        },
        {
            id: 'statusMessage',
            header: 'Status Message',
            accessor: (row) => row.statusMessage ?? '-',
            defaultVisible: false,
        },
        {
            id: 'latency',
            header: 'Latency',
            accessor: (row) => (row.latency != null ? `${row.latency.toFixed(2)}s` : '-'),
            defaultVisible: true,
        },
        {
            id: 'totalCost',
            header: 'Total Cost', accessor: (row) => {
                if (row.totalCost == null) return '-';

                if (Number(row.totalCost) === 0) return '$0.00';

                return `$${Number(row.totalCost).toFixed(6)}`
            },
            defaultVisible: true,
        },
        {
            id: 'timeToFirstToken',
            header: 'Time To First Token',
            accessor: (row) => row.timeToFirstToken ?? '-',
            defaultVisible: true,
        },
        {
            id: 'tokens',
            header: 'Tokens', accessor: (row) => {
                const inputTokens = row.usageDetails?.input ?? row.inputUsage ?? 0;
                const outputTokens = row.usageDetails?.output ?? row.outputUsage ?? 0;
                const totalTokens = row.usageDetails?.total ?? row.totalUsage ?? (inputTokens + outputTokens);

                if (inputTokens === 0 && outputTokens === 0) {
                    return '-';
                }

                return (
                    <div>
                        {inputTokens} <MoveRight size={10} /> {outputTokens} (<Sigma size={10} /> {totalTokens})
                    </div>
                );
            },
            defaultVisible: true,
        },
        {
            id: 'model',
            header: 'Model',
            accessor: (row) => row.model ?? '-',
            defaultVisible: true,
        },
        {
            id: 'prompt',
            header: 'Prompt',
            accessor: (row) => row.prompt ?? '-',
            defaultVisible: true,
        },
        {
            id: 'environment',
            header: 'Environment', accessor: (row) => {
                const environment = row.environment ?? '-';

                return (
                    <span className={styles.cellButton}>
                        {environment}
                    </span>
                )
            },
            defaultVisible: true,
        },
        {
            id: 'traceTags',
            header: 'Trace Tags', accessor: (row) => {
                if (!Array.isArray(row.traceTags) || row.traceTags.length === 0) {
                    return '-';
                }

                return (
                    <div className={styles.tagContainer}>
                        {row.traceTags.map((tag) => (
                            <span key={tag} className={styles.tagItem}>
                                <Tag size={10} /> {tag}
                            </span>
                        ))}
                    </div>
                )
            },
            defaultVisible: true,
        },
        {
            id: 'metadata',
            header: 'Metadata',
            accessor: (row) => <IOCell row={row} projectId={projectId} col="metadata" singleLine={isSingleLine} rowHeight={rowHeight}/>,
            defaultVisible: true,
        },
        {
            id: 'endTime',
            header: 'End Time',
            accessor: (row) => row.endTime ? dayjs(row.endTime).format('YYYY-MM-DD HH:mm:ss') : '-',
            defaultVisible: false,
        },
        {
            id: 'observationId',
            header: 'ObservationID',
            accessor: (row) => row.id ?? '-',
            defaultVisible: false,
        },
        {
            id: 'traceName',
            header: 'Trace Name',
            accessor: (row) => row.traceName ?? '-',
            defaultVisible: false,
        },
        {
            id: 'traceId',
            header: 'Trace ID',
            accessor: (row) => row.traceId ?? '-',
            defaultVisible: false,
        },
        {
            id: 'modelId',
            header: 'Model ID',
            accessor: (row) => row.modelId ?? '-',
            defaultVisible: false,
        },
        {
            id: 'version',
            header: 'version',
            accessor: (row) => row.version ?? '-',
            defaultVisible: false,
        },
        {
            id: 'tokensPerSecond',
            header: 'Tokens Per Second', accessor: (row) => {
                const totalTokens = row.usageDetails?.total ?? row.totalUsage;
                const latency = row.latency;

                if (latency > 0 && totalTokens != null) {
                    if (totalTokens === 0) {
                        return '0.00';
                    }

                    const tps = totalTokens / latency;
                    return tps.toFixed(2);
                }

                return '-';
            },
            defaultVisible: false,
        },
        {
            id: 'inputTokens',
            header: 'Input Tokens',
            accessor: (row) => row.usageDetails?.input ?? row.inputUsage ?? '-',
            defaultVisible: false,
        },
        {
            id: 'outputTokens',
            header: 'Output Tokens',
            accessor: (row) => row.usageDetails?.output ?? row.outputUsage ?? '-',
            defaultVisible: false,
        },
        {
            id: 'totalTokens',
            header: 'Total Tokens',
            accessor: (row) => row.usageDetails?.total ?? row.totalUsage ?? '-',
            defaultVisible: false,
        },
        {
            id: 'inputCost',
            header: 'Input Cost',
            accessor: (row) => (row.inputCost != null ? `$${Number(row.inputCost).toFixed(6)}` : '-'),
            defaultVisible: false,
        },
        {
            id: 'outputCost',
            header: 'Output Cost',
            accessor: (row) => (row.outputCost != null ? `$${Number(row.outputCost).toFixed(6)}` : '-'),
            defaultVisible: false,
        },
    ]);
};

// src/Pages/Tracing/Observations/IOCell.jsx
import { useEffect, useState } from 'react';
import { getObservationById } from '../services/ObservationApi';
import styles from '../Tracing.module.css';

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

export default function IOCell({ row, projectId, col = 'input', singleLine = true, rowHeight }) {
    const [val, setVal] = useState('');
    const [isJson, setIsJson] = useState(false);

    useEffect(() => {
        if (!row?.id || !row?.traceId || !projectId) return;

        getObservationById({
            observationId: row.id,
            traceId: row.traceId,
            projectId,
            truncated: false, // ← 자르지 말고 받기 (또는 키 자체 생략)
        })
            .then((d) => {
                // 여러 후보 경로를 OR로 묶기 (버전별 차이 흡수)
                const pick = (...xs) => xs.find((v) => v !== undefined && v !== null);

                const raw =
                    col === 'output'
                        ? pick(
                            d.output,
                            d.outputText,
                            d.completion,
                            typeof d.response === 'string' ? d.response : d.response ? JSON.stringify(d.response) : null,
                            d.metadata?.output,
                            d.usageDetails?.output
                        )

                        : col === 'metadata'
                            ? d.metadata
                            : pick(
                                d.input,
                                d.inputText,
                                d.prompt,
                                stringifyMessages(d.messages),
                                d.metadata?.input,
                                d.usageDetails?.input
                            );
                const s = typeof raw === 'string' ? raw : raw ? JSON.stringify(raw, null, 2) : '';
                try {
                    if (typeof raw !== 'string') {
                        setIsJson(true);
                        setVal(s);
                    } else {
                        JSON.parse(s);
                        setIsJson(true);
                        setVal(s);
                    }
                } catch (error) {
                    setIsJson(false);
                    setVal(s);
                }
            })
            .catch(() => setVal(''));
    }, [row?.id, row?.traceId, projectId, col]);

    if (!val) return <span>-</span>

    if (isJson && rowHeight !== 'small') {
        const formattedJson = JSON.stringify(JSON.parse(val), null, 2);
        return (
            <span className={`${styles.commentBox} ${styles[rowHeight]}`}>
                <pre>{formattedJson}</pre>
            </span>
        );
    }

    // 일반 텍스트 또는 compact JSON일 경우
    const preview = val.length > 200 ? `${val.slice(0, 200)}…` : val;
    return (
        <span title={val} className={`${styles.commentBox} ${styles[rowHeight]}`}>
            {preview}
        </span>
    );
}
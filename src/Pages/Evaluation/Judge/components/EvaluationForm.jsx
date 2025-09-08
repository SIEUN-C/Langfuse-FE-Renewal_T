import React, { useMemo, useState, useEffect } from "react";
import styles from "./EvaluationForm.module.css";
import { getPreviewRows } from "../services/evaluatorsApi";

export default function EvaluationForm({
    mode = "create",
    projectId,
    template,
    preventRedirect = false,
    onSubmit,
}) {
    // ----- 초기값 -----
    const [scoreName, setScoreName] = useState(template?.name ?? "");
    const [targetSource, setTargetSource] = useState("live"); // 'live' | 'dataset'
    const [runsOnNew, setRunsOnNew] = useState(true);
    const [runsOnExisting, setRunsOnExisting] = useState(false);

    const [samplingPct, setSamplingPct] = useState(100); // UI는 % (0~100)
    const [delaySec, setDelaySec] = useState(30);        // UI는 초

    const [filterText, setFilterText] = useState("[]");  // JSON 배열 원문 (문자열)
    const [mappingRows, setMappingRows] = useState([
        { templateVar: "query", object: "trace", objectVariable: "input", jsonPath: "" },
        { templateVar: "generation", object: "trace", objectVariable: "output", jsonPath: "" },
    ]);

    const [error, setError] = useState("");

    const variableOptions = useMemo(() => ([
        { label: "input", value: "input" },
        { label: "output", value: "output" },
    ]), []);

    // ----- 매핑 행 조작 -----
    const addRow = () =>
        setMappingRows((rows) => [...rows, { templateVar: "", object: "trace", objectVariable: "input", jsonPath: "" }]);

    const changeRow = (i, key, value) =>
        setMappingRows((rows) => {
            const next = [...rows];
            next[i] = { ...next[i], [key]: value };
            return next;
        });

    const removeRow = (i) =>
        setMappingRows((rows) => rows.filter((_, idx) => idx !== i));

    // ★ 프리뷰 상태
    const [previewRows, setPreviewRows] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');

    // ★ 프리뷰 로딩 함수
    useEffect(() => {
        if (!projectId) return;

        let cancelled = false;
        const load = async () => {
            setPreviewError('');
            setPreviewLoading(true);
            try {
                // filterText 문자열을 배열로 변환 (빈 문자열이면 빈 배열)
                let parsed = [];
                const raw = (filterText || '').trim();
                if (raw) {
                    const tmp = JSON.parse(raw);
                    if (!Array.isArray(tmp)) throw new Error('Filter must be an array');
                    parsed = tmp;
                }

                const rows = await getPreviewRows({
                    projectId,
                    filter: parsed,
                    limit: 10,
                });

                if (!cancelled) setPreviewRows(rows);
            } catch (e) {
                if (!cancelled) {
                    console.error('preview error', e);
                    setPreviewError('프리뷰 로딩에 실패했습니다.');
                    setPreviewRows([]);
                }
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        };

        // 살짝 디바운스
        const t = setTimeout(load, 200);
        return () => { cancelled = true; clearTimeout(t); };
    }, [projectId, filterText, targetSource, runsOnNew, runsOnExisting]);


    // ----- 제출 -----
    const handleExecute = () => {
        setError("");

        // filter 유효성만 확인 (문자열로 onSubmit에 넘기고, payload 빌더에서 parse)
        try {
            const raw = (filterText || "").trim();
            if (raw) {
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) throw new Error("Filter must be an array");
            }
        } catch (e) {
            setError(
                'Target filter는 JSON 배열이어야 합니다. 예: [] 또는 [{"column":"Dataset","op":"anyOf","value":["...id..."]}]'
            );
            return;
        }

        if (Number.isNaN(+samplingPct) || samplingPct < 0 || samplingPct > 100) {
            setError("Sampling은 0~100% 사이여야 합니다.");
            return;
        }
        if (Number.isNaN(+delaySec) || delaySec < 0) {
            setError("Delay(초)는 0 이상의 숫자여야 합니다.");
            return;
        }

        // 객체 형태 variableMapping (키=templateVar)
        const variableMappingObj = {};
        for (const r of mappingRows) {
            if (!r.templateVar) continue;
            variableMappingObj[r.templateVar] = {
                object: r.object,                 // 'trace' | 'dataset'
                variable: r.objectVariable,       // 'input' | 'output'
                ...(r.jsonPath ? { jsonPath: r.jsonPath } : {}),
            };
        }

        // 배열 형태도 함께 전달 (toCreatePayload에서 우선 사용)
        const variableMappingRows = mappingRows.map(r => ({
            templateVar: r.templateVar,
            object: r.object,
            objectVariable: r.objectVariable,
            jsonPath: r.jsonPath,
        }));

        onSubmit({
            projectId,
            evalTemplateId: template?.latestId ?? template?.id,
            scoreName: scoreName?.trim(),

            // 내부 표현은 'live' | 'dataset' 로 통일 (payload 빌더가 trace/dataset으로 변환)
            target: targetSource,

            // 문자열 그대로 넘기면 payload 빌더가 파싱/검증
            filter: filterText,

            // 두 형태 모두 전달 (호환성)
            variableMapping: variableMappingObj,
            variableMappingRows,

            sampling: Number((samplingPct / 100).toFixed(3)), // 0~1
            delaySec: Number(delaySec),                       // 초 (payload 빌더가 ms 변환)
            runsOnNew,
            runsOnExisting,

            // timeScope는 payload 빌더에서 계산해도 되지만 여기서도 넘겨도 무방
            // timeScope: runsOnNew && !runsOnExisting ? "NEW" : "EXISTING",
        });
    };

    return (
        <div className={styles.formRoot}>
            {/* 상단: 참조 Evaluator */}
            <div className={styles.row}>
                <label className={styles.label}>Referenced Evaluator</label>
                <div className={styles.tag}>{template?.name ?? "-"}</div>
            </div>

            {/* Score name */}
            <div className={styles.row}>
                <label className={styles.label}>Generated Score Name</label>
                <input
                    className={styles.input}
                    value={scoreName}
                    onChange={(e) => setScoreName(e.target.value)}
                    placeholder="e.g., Helpfulness"
                />
            </div>

            {/* Target 섹션 */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>Target</div>

                <div className={styles.fieldsetRow}>
                    <div className={styles.radioGroup}>
                        <label className={styles.radio}>
                            <input
                                type="radio"
                                name="targetSource"
                                checked={targetSource === "live"}
                                onChange={() => setTargetSource("live")}
                            />
                            <span>Live tracing data</span>
                        </label>
                        <label className={styles.radio}>
                            <input
                                type="radio"
                                name="targetSource"
                                checked={targetSource === "dataset"}
                                onChange={() => setTargetSource("dataset")}
                            />
                            <span>Dataset runs</span>
                        </label>
                    </div>
                </div>

                <div className={styles.fieldsetRow}>
                    <div className={styles.checkboxGroup}>
                        <div className={styles.checkbox}>
                            <input
                                id="newTraces"
                                type="checkbox"
                                checked={runsOnNew}
                                onChange={(e) => setRunsOnNew(e.target.checked)}
                            />
                            <label htmlFor="newTraces">New traces</label>
                        </div>
                        <div className={styles.checkbox}>
                            <input
                                id="existingTraces"
                                type="checkbox"
                                checked={runsOnExisting}
                                onChange={(e) => setRunsOnExisting(e.target.checked)}
                            />
                            <label htmlFor="existingTraces">Existing traces</label>
                        </div>
                    </div>
                </div>

                {/* Sampling */}
                <div className={styles.fieldsetRow}>
                    <label className={styles.smallLabel}>Sampling (0–1)</label>
                    <div className={styles.sliderRow}>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={samplingPct}
                            onChange={(e) => setSamplingPct(+e.target.value)}
                            className={styles.range}
                        />
                        <div className={styles.sliderVal}>{samplingPct}%</div>
                    </div>
                    <div className={styles.helpText}>
                        이 설정은 필터와 일치한 트레이스 중에서 샘플링 비율을 의미합니다.
                    </div>
                </div>

                {/* Delay */}
                <div className={styles.fieldsetRow}>
                    <label className={styles.smallLabel}>Delay (seconds)</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={delaySec}
                        onChange={(e) => setDelaySec(e.target.value)}
                    />
                    <div className={styles.helpText}>
                        Between first Trace/Dataset event and evaluation execution.
                    </div>
                </div>

                {/* Filter */}
                <div className={styles.fieldsetRow}>
                    <label className={styles.smallLabel}>Target filter (optional, 배열 그대로 전달)</label>
                    <textarea
                        className={styles.textarea}
                        rows={6}
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="[]"
                    />
                </div>

                {/* ★ 프리뷰 섹션 */}
                <div className={styles.previewHeader}>Preview sample matched traces</div>
                {previewLoading && <div className={styles.previewNote}>Loading…</div>}
                {previewError && <div className={styles.error}>{previewError}</div>}
                {!previewLoading && !previewError && (
                    <div className={styles.previewTable}>
                        <div className={styles.previewHead}>
                            <div>Timestamp</div>
                            <div>Name</div>
                            <div>Input</div>
                            <div>Output</div>
                            <div>Observation Levels</div>
                            <div>Latency</div>
                        </div>
                        {previewRows.map((r) => {
                            // 서버 응답이 문자열 JSON으로 오는 경우 안전 해제
                            const safeParse = (s) => {
                                try { const v = JSON.parse(s); return typeof v === 'string' ? v : s; }
                                catch { return s; }
                            };
                            const input = (typeof r.input === 'string') ? safeParse(r.input) : (r.input ?? '');
                            const output = (typeof r.output === 'string') ? safeParse(r.output) : (r.output ?? '');
                            const obsCount = Array.isArray(r.observations) ? r.observations.length : 0;
                            const ts = r.timestamp ? new Date(r.timestamp).toLocaleString() : '-';
                            const lat = (typeof r.latency === 'number') ? `${(r.latency).toFixed(2)}s` : '-';

                            return (
                                <div key={r.id} className={styles.previewRow}>
                                    <div>{ts}</div>
                                    <div className={styles.cellMono}>{r.name || '-'}</div>
                                    <div className={styles.cellEllip}>{String(input)}</div>
                                    <div className={styles.cellEllip}>{String(output)}</div>
                                    <div>{obsCount}</div>
                                    <div>{lat}</div>
                                </div>
                            );
                        })}
                        {previewRows.length === 0 && (
                            <div className={styles.previewEmpty}>프리뷰에 표시할 트레이스가 없습니다.</div>
                        )}
                    </div>
                )}
            </section>

            {/* Variable mapping */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>Variable mapping</div>

                <div className={styles.mappingHeader}>
                    <div>Template var</div>
                    <div>Object</div>
                    <div>Object variable</div>
                    <div>JsonPath (optional)</div>
                    <div />
                </div>

                {mappingRows.map((r, i) => (
                    <div key={i} className={styles.mappingRow}>
                        <input
                            className={styles.input}
                            value={r.templateVar}
                            onChange={(e) => changeRow(i, "templateVar", e.target.value)}
                            placeholder="query"
                        />
                        <select
                            className={styles.select}
                            value={r.object}
                            onChange={(e) => changeRow(i, "object", e.target.value)}
                        >
                            <option value="trace">trace</option>
                            <option value="dataset">dataset</option>
                        </select>
                        <select
                            className={styles.select}
                            value={r.objectVariable}
                            onChange={(e) => changeRow(i, "objectVariable", e.target.value)}
                        >
                            {variableOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <input
                            className={styles.input}
                            value={r.jsonPath}
                            onChange={(e) => changeRow(i, "jsonPath", e.target.value)}
                            placeholder="$.foo.bar"
                        />
                        <button type="button" className={styles.ghostBtn} onClick={() => removeRow(i)}>✕</button>
                    </div>
                ))}

                <div className={styles.mappingActions}>
                    <button type="button" className={styles.secondaryBtn} onClick={addRow}>
                        + Add mapping
                    </button>
                </div>
            </section>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.footer}>
                <button type="button" className={styles.primaryBtn} onClick={handleExecute}>
                    Execute
                </button>
            </div>
        </div>
    );




}

import React, { useMemo, useState, useEffect } from "react";
import styles from "./EvaluationForm.module.css";
import { getPreviewRows } from "../services/evaluatorsApi";
import {
    buildDefaultMappingFromTemplate,
    buildVarValuesFromTrace,
    fillPrompt,
    toCreatePayload,
    extractVarNames,
    normalizeFilters,

} from "./evalMapping";

import TargetFilterBuilder from "./TargetFilterBuilder";

export default function EvaluationForm({


    mode = "create",
    projectId,
    template,
    preventRedirect = false,
    onSubmit,
    preset, // view/edit에서 내려주는 초기값 {mappingRows, filterText, samplingPct, delaySec, runsOnNew, runsOnExisting}
}) {



    // ----- 초기값 -----
    const [scoreName, setScoreName] = useState(template?.name ?? "");
    const [runsOnNew, setRunsOnNew] = useState(true);
    const [runsOnExisting, setRunsOnExisting] = useState(false);
    const [samplingPct, setSamplingPct] = useState(100);
    const [delaySec, setDelaySec] = useState(30);
    const [filterText, setFilterText] = useState("[]");
    const [mappingRows, setMappingRows] = useState([]);

    // 옵션 (dataset 제거)
    const OBJECT_OPTIONS = [{ label: "Trace", value: "trace" }];
    const OBJVAR_OPTIONS = [
        { label: "Input", value: "input" },
        { label: "Output", value: "output" },
        { label: "Metadata", value: "metadata" },
    ];

    // ✅ 템플릿 변수명( {{var}} )을 vars → prompt 순서로 추출
    const templateVars = useMemo(() => extractVarNames(template), [template]);

    const isReadOnly = mode === 'view';
    const submitLabel = mode === 'create' ? 'Execute' : 'Update';

    // 1) create 모드: 템플릿 기반 기본 매핑 자동 주입
    useEffect(() => {
        if (mode === "create") {
            setMappingRows(buildDefaultMappingFromTemplate(template));
            if (!scoreName) setScoreName(template?.name ?? "");
        }
    }, [template, mode]);


    // ✨ 템플릿 변수명으로 매핑 행의 templateVar를 보정해 주기 (프리뷰/저장 둘 다 동일 키 사용)
    const rowsForPreview = useMemo(() => {
        return (mappingRows || []).map((r, i) => ({
            ...r,
            templateVar: r.templateVar || templateVars[i] || r.templateVar,  // 없으면 템플릿 순서로 주입
        }));
    }, [mappingRows, templateVars]);

    // 2) view/edit 모드: Detail preset 상태 주입
    useEffect(() => {
        if (mode === "create" || !preset) return;
        if (Array.isArray(preset.mappingRows)) setMappingRows(preset.mappingRows);
        if (typeof preset.filterText === "string") setFilterText(preset.filterText);
        if (Number.isFinite(preset.samplingPct)) setSamplingPct(preset.samplingPct);
        if (Number.isFinite(preset.delaySec)) setDelaySec(preset.delaySec);
        if (typeof preset.runsOnNew === "boolean") setRunsOnNew(preset.runsOnNew);
        if (typeof preset.runsOnExisting === "boolean") setRunsOnExisting(preset.runsOnExisting);
    }, [
        mode,
        preset?.mappingRows,
        preset?.filterText,
        preset?.samplingPct,
        preset?.delaySec,
        preset?.runsOnNew,
        preset?.runsOnExisting,
    ]);

    // 매핑 행 조작
    const changeRow = (i, key, value) =>
        setMappingRows(rows => {
            const next = [...rows];
            const curr = { ...next[i] };
            if (key === "object") {
                curr.object = value;
                curr.objectVariable = "input"; // 객체가 바뀌면 기본값 리셋
            } else {
                curr[key] = value;
            }
            next[i] = curr;
            return next;
        });

    // --- 프리뷰 상태 ---
    const [previewRows, setPreviewRows] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");

    // 프롬프트 치환 프리뷰
    const [promptPreview, setPromptPreview] = useState("");
    const templatePromptText = useMemo(
        () => template?.prompt ?? template?.promptText ?? "",
        [template]
    );

    useEffect(() => {
        try {
            const sample = Array.isArray(previewRows) && previewRows.length ? previewRows[0] : null;
            if (!sample || !templatePromptText) {
                setPromptPreview("");
                return;
            }
            const values = buildVarValuesFromTrace(sample, rowsForPreview);
            setPromptPreview(fillPrompt(templatePromptText, values));
        } catch {
            setPromptPreview("");
        }
    }, [previewRows, rowsForPreview, templatePromptText]);

    // 프리뷰 로딩
    useEffect(() => {
        if (!projectId) return;
        let cancelled = false;
        const load = async () => {
            setPreviewError("");
            setPreviewLoading(true);
            try {
                let parsedUI = [];
                let parsedBE = [];
                const raw = (filterText || "").trim();
                if (raw) {
                    let tmp = JSON.parse(raw);
                    // BE 스키마(op/columnId) 들어오면 UI 스키마로 보정
                    if (Array.isArray(tmp) && tmp.some(f => f && (f.op || f.columnId))) {
                        tmp = tmp.map(f => {
                            const col = f.column ?? f.columnId ?? f.key ?? "";
                            return {
                                column: col === "datasetId" ? "Dataset" : col,
                                operator: f.operator || f.op || "=",
                                value: f.value ?? "",
                                ...(f.metaKey ? { metaKey: f.metaKey } : {}),
                            };
                        });
                    }
                    if (!Array.isArray(tmp)) throw new Error("Filter must be an array");
                    // UI singleFilter에 type 보강
                    parsedUI = tmp.map(f => ({
                        ...f,
                        type:
                            f.type ??
                            (f.column === "Dataset"
                                ? "stringOptions"
                                : (String(f.column || "").toLowerCase().includes("time") ? "datetime" : "string")),
                    }));
                    parsedBE = normalizeFilters(tmp).map(f =>
                        f?.column === 'Dataset' ? { ...f, column: 'datasetId' } : f
                    );
                }
                const rows = await getPreviewRows({
                    projectId,
                    filterBE: parsedBE,
                    filterUI: parsedUI,
                    limit: 10
                });


                if (!cancelled) setPreviewRows(rows);
            } catch (e) {
                if (!cancelled) {
                    console.error("preview error", e);
                    setPreviewError("프리뷰 로딩에 실패했습니다.");
                    setPreviewRows([]);
                }
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        };
        const t = setTimeout(load, 200);
        return () => { cancelled = true; clearTimeout(t); };
    }, [projectId, filterText, runsOnNew, runsOnExisting]);

    // 제출
    const [error, setError] = useState("");
    const handleExecute = () => {
        setError("");
        try {
            const raw = (filterText || "").trim();
            if (raw) {
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) throw new Error("Filter must be an array");
            }
        } catch {
            setError('Target filter는 JSON 배열이어야 합니다. 예: [] 또는 [{"column":"Dataset","op":"anyOf","value":["...id..."]}]');
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
        if (mode === "create") {
            const payload = toCreatePayload({
                projectId,
                evalTemplateId: template?.latestId ?? template?.id,
                scoreName: (scoreName || template?.name || "").trim(),
                target: "trace",
                filter: filterText,
                mappingRows: rowsForPreview,
                samplingPct,
                delaySec,
                runsOnNew,
                runsOnExisting,
            }, templateVars);
            console.log('[createJob payload]', payload); // 1회 확인용
            onSubmit?.(payload);
        } else if (mode === "edit") {
            // edit 모드는 '폼 상태' 그대로 넘김
            onSubmit?.({
                projectId,
                evalTemplateId: template?.latestId ?? template?.id,
                scoreName: (scoreName || template?.name || "").trim(),
                filterText,
                mappingRows: rowsForPreview,
                samplingPct,
                delaySec,
                runsOnNew,
                runsOnExisting,
            });
        }
    };

    // // 템플릿 변수(라벨 표기용) 
    // const templateVars = extractVarNames(template);

    return (
        <div className={styles.formRoot}>

            {/* Score name */}
            <div className={styles.row}>
                <label className={styles.label}>Generated Score Name</label>
                <input
                    className={styles.input}
                    value={scoreName}
                    onChange={(e) => setScoreName(e.target.value)}
                    placeholder="e.g., Helpfulness"
                    disabled={isReadOnly}
                />
            </div>

            {/* Target (Trace 고정) + 필터/샘플 미리보기 */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>Target</div>

                <div className={styles.fieldsetRow}>
                    <div className={styles.radioGroup}>
                        <label className={styles.radio}>
                            <input type="radio" checked readOnly />
                            <span>Live tracing data</span>
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
                                disabled={isReadOnly}
                            />
                            <label htmlFor="newTraces">New traces</label>
                        </div>
                        <div className={styles.checkbox}>
                            <input
                                id="existingTraces"
                                type="checkbox"
                                checked={runsOnExisting}
                                onChange={(e) => setRunsOnExisting(e.target.checked)}
                                disabled={isReadOnly}
                            />
                            <label htmlFor="existingTraces">Existing traces</label>
                        </div>
                    </div>
                </div>

                <div className={styles.fieldsetRow}>
                    <label className={styles.smallLabel}>Target filter</label>
                    <TargetFilterBuilder
                        projectId={projectId}
                        value={filterText}
                        onChange={setFilterText}
                        disabled={isReadOnly}
                    />
                </div>

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
                            const safeParse = (s) => {
                                try { const v = JSON.parse(s); return typeof v === "string" ? v : s; }
                                catch { return s; }
                            };
                            const input = (typeof r.input === "string") ? safeParse(r.input) : (r.input ?? "");
                            const output = (typeof r.output === "string") ? safeParse(r.output) : (r.output ?? "");
                            const obsCount = Array.isArray(r.observations) ? r.observations.length : 0;
                            const ts = r.timestamp ? new Date(r.timestamp).toLocaleString() : "-";
                            const lat = (typeof r.latency === "number") ? `${(r.latency).toFixed(2)}s` : "-";

                            return (
                                <div key={r.id} className={styles.previewRow}>
                                    <div>{ts}</div>
                                    <div className={styles.cellMono}>{r.name || "-"}</div>
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

                <div className={styles.fieldsetRow}>
                    <label className={styles.smallLabel}>Sampling</label>
                    <div className={styles.sliderRow}>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={samplingPct}
                            onChange={(e) => setSamplingPct(+e.target.value)}
                            className={styles.range}
                            disabled={isReadOnly}
                        />
                        <div className={styles.sliderVal}>{samplingPct}%</div>
                    </div>
                </div>

                <div className={styles.fieldsetRow}>
                    <label className={styles.smallLabel}>Delay (seconds)</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        step={1}
                        value={delaySec}
                        onChange={(e) => setDelaySec(e.target.value)}
                        disabled={isReadOnly}
                    />
                </div>




            </section>

            {/* Variable mapping (프롬프트 프리뷰 포함) */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>Variable mapping</div>

                {/* 프롬프트 프리뷰 */}
                <div className={styles.mappingPromptBlock}>
                    <div className={styles.mappingPromptHeader}>
                        <span>Evaluation Prompt Preview</span>
                        <span className={styles.pill}>Trace</span>
                    </div>
                    <textarea
                        className={styles.textarea}
                        rows={8}
                        value={promptPreview}
                        readOnly
                        placeholder="프리뷰 가능한 트레이스가 없거나 템플릿 프롬프트가 비어있습니다."
                    />
                    <div className={styles.helpText}>
                        템플릿의 <code>{'{{var}}'}</code> 자리에 현재 매핑과 첫 샘플 트레이스가 치환된 결과입니다.
                    </div>
                </div>

                {/* 변수 카드들 */}
                {mappingRows.map((r, i) => (
                    <div key={i} className={styles.mappingBlock}>
                        <div className={styles.varTitle}>
                            <code>{`{{${templateVars[i] || r.templateVar || ""}}}`}</code>
                        </div>

                        <div className={styles.mappingGrid}>
                            <div className={styles.fcol}>
                                <div className={styles.fieldLabel}>Object</div>
                                <select
                                    className={styles.select}
                                    value={r.object}
                                    onChange={(e) => changeRow(i, "object", e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    {OBJECT_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.fcol}>
                                <div className={styles.fieldLabel}>Object variable</div>
                                <select
                                    className={styles.select}
                                    value={r.objectVariable}
                                    onChange={(e) => changeRow(i, "objectVariable", e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    {OBJVAR_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.fcol}>
                                <div className={styles.fieldLabel}>JsonPath</div>
                                <input
                                    className={styles.input}
                                    value={r.jsonPath}
                                    onChange={(e) => changeRow(i, "jsonPath", e.target.value)}
                                    placeholder="Optional"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {error && <div className={styles.error}>{error}</div>}

            {!isReadOnly && (
                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={handleExecute}
                    >
                        {mode === 'create' ? 'Execute' : 'Update'}
                    </button>
                </div>
            )}
        </div>
    );
}

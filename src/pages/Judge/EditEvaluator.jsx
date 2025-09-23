// src/pages/Judge/EditEvaluator.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useProjectId from "hooks/useProjectId";
import styles from "./UseEvaluator.module.css";
import EvaluationForm from "./components/EvaluationForm.jsx";

// ========================[수정 1/3]========================
// 주석: evaluatorsApi.js에 정의된 실제 함수 이름을 import 합니다.
import { getRunningConfig, updateEvalJob } from "./services/evaluatorsApi.js";
// ==========================================================

export default function EditEvaluator() {
    const { projectId } = useProjectId();
    const { evaluationId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!evaluationId || !projectId) {
            setLoading(false);
            return;
        }
        const loadJob = async () => {
            try {
                setLoading(true);
                // ========================[수정 2/3]========================
                // 주석: getEvaluationJobById -> getRunningConfig로 API 함수를 변경합니다.
                const jobData = await getRunningConfig({ projectId, id: evaluationId });
                // ==========================================================
                setJob(jobData);
            } catch (e) {
                setError("Failed to load evaluation job.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadJob();
    }, [projectId, evaluationId]);

    const handleSubmit = async (formState) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            // [수정] '참고 payload'의 구조에 맞춰 payload를 재구성합니다.
            const payload = {
                projectId,
                evalConfigId: evaluationId, // 1. ID 필드 이름 변경

                // 2. config 객체로 설정값 그룹화
                config: {
                    scoreName: formState.scoreName,
                    filter: JSON.parse(formState.filterText || "[]"),

                    // 3. 'mapping'을 'variableMapping'으로 변경하고 내부 구조 변환
                    variableMapping: formState.mappingRows.map(row => ({
                        templateVariable: row.templateVar,
                        langfuseObject: row.object,
                        selectedColumnId: row.objectVariable,
                        jsonSelector: row.jsonPath || null
                    })),

                    sampling: formState.samplingPct / 100,
                    delay: formState.delaySec * 1000,
                    timeScope: [
                        ...(formState.runsOnNew ? ["NEW"] : []),
                        ...(formState.runsOnExisting ? ["EXISTING"] : []),
                    ],
                }
            };

            await updateEvalJob(payload);

            navigate("/llm-as-a-judge");
        } catch (e) {
            console.error(e);
            // 서버가 보낸 자세한 에러 메시지를 alert에 포함하면 디버깅에 도움이 됩니다.
            const errorMessage = e?.response?.data?.error?.json?.message || e.message;
            alert(`수정에 실패했습니다.\n${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    // 이 부분은 EvaluationForm이 요구하는 preset 객체를 만드는 부분이므로 변경할 필요가 없습니다.
    const formPreset = useMemo(() => {
        if (!job) return null;
        return {
            scoreName: job.scoreName,
            mappingRows: job.mapping,
            filterText: JSON.stringify(job.filter),
            samplingPct: (job.sampling ?? 1) * 100,
            delaySec: (job.delay ?? 0) / 1000,
            runsOnNew: job.timeScope?.includes("NEW") ?? false,
            runsOnExisting: job.timeScope?.includes("EXISTING") ?? false,
        };
    }, [job]);

    if (loading) return <div className={styles.pageMessage}>Loading…</div>;
    if (error) return <div className={styles.pageError}>{error}</div>;
    if (!job) return <div className={styles.pageMessage}>Evaluation Job not found.</div>;

    return (
        <div className={styles.container}>

            <EvaluationForm
                mode="edit"
                projectId={projectId}
                template={job.evalTemplate}
                preset={formPreset}
                preventRedirect
                onSubmit={handleSubmit}
                isSubmitting={submitting}
            />
        </div>
    );
}
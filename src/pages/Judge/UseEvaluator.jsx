import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useProjectId from "hooks/useProjectId";
import styles from "./UseEvaluator.module.css"; // 없으면 Templates.module.css 재사용해도 됨
import EvaluationForm from "./components/EvaluationForm.jsx";
import { getTemplateById } from "./services/libraryApi.js";
import { createJob, getPreviewRows } from "./services/evaluatorsApi.js";
import { toCreatePayload } from './components/evalMapping.js';



export default function UseEvaluator() {
    const { projectId } = useProjectId();
    const { templateId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancel = false;
        async function load() {
            // projectId도 준비될 때까지 기다림 (에러 띄우지 말고 return만)
            if (!templateId || !projectId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const t = await getTemplateById(projectId, templateId);
                if (!cancel) setTemplate(t);
            } catch (e) {
                if (!cancel) setError("Failed to load template.");
                console.error(e);
            } finally {
                if (!cancel) setLoading(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, [projectId, templateId]);

    const handleSubmit = async (form) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = toCreatePayload(form);
            console.log("[UseEvaluator] toCreatePayload:", payload);
            await createJob(payload);
            // ✅ 성공 시 Running Evaluators 리스트로 이동
            navigate("/llm-as-a-judge");
        } catch (e) {
            console.error(e);
            alert(`실행에 실패했습니다.\n${e?.message || ''}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.pageMessage}>Loading…</div>;
    if (error) return <div className={styles.pageError}>{error}</div>;
    if (!template) return <div className={styles.pageMessage}>Template not found.</div>;

    return (
        <div className={styles.container}>

            {/* Step2 폼만! */}
            <EvaluationForm
                mode="create"
                projectId={projectId}
                template={template}
                preventRedirect
                onSubmit={handleSubmit}
                isSubmitting={submitting}
            />
        </div>
    );
}

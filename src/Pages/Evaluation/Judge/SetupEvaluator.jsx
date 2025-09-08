import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useProjectId from 'hooks/useProjectId';
import { templateNames, templateById, createJob } from '../Judge/services/evaluatorsApi';
import EvaluationForm from './components/EvaluationForm';
import styles from './SetupEvaluator.module.css';

export default function SetupEvaluator() {
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const [sp] = useSearchParams();
  const ref = sp.get('ref');

  const [step, setStep] = useState(ref ? 2 : 1);
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');              // ❗ 훅은 최상단

  // Step1: 템플릿 목록 불러오기
  useEffect(() => {
    if (step !== 1 || !projectId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await templateNames({ projectId, page: 0, limit: 100 });
        if (!alive) return;
        setTemplates(res?.templates ?? []);
      } catch (e) {
        console.error('templateNames error', e);
        if (alive) setTemplates([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [step, projectId]);

  // ref로 들어온 경우: 단건 불러와서 Step2로
  useEffect(() => {
    if (!ref || !projectId) return;
    (async () => {
      try {
        const t = await templateById({ projectId, id: ref });
        setCurrentTemplate(t);
        setStep(2);
      } catch (e) {
        console.error('templateById error', e);
      }
    })();
  }, [ref, projectId]);

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase();
    if (!q) return templates;
    return templates.filter(t => (t.name || '').toLowerCase().includes(q));
  }, [templates, query]);

  const handleSelect = async (latestId) => {
    try {
      const t = await templateById({ projectId, id: latestId });
      setCurrentTemplate(t);
      setStep(2);
    } catch (e) {
      console.error('templateById error', e);
    }
  };

  const handleSubmit = async (formValues) => {
    const payload = toCreatePayload(formValues, projectId, currentTemplate);
    await createJob(payload);
    // 생성 후 목록으로
    navigate('/llm-as-a-judge'); // 라우트에 맞게 조정 가능
  };

  // ---------- Step 1 ----------
  if (step === 1) {
    return (
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.title}>Set up evaluator</div>
          <div className={styles.stepper}>
            <span className={styles.stepOn}>1. Select Evaluator</span>
            <span className={styles.sep}>›</span>
            <span>2. Run Evaluator</span>
          </div>
          <div className={styles.subtle}>
            Current default model: test / Qwen3-30B-A3B-Instruct-… (예시 텍스트)
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <input
              className={styles.searchInput}
              placeholder="Search evaluators…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={styles.list}>
            <div className={styles.sectionTitle}>Langfuse managed evaluators</div>

            {loading && (
              <div style={{ padding: '16px', color: '#9ab2d6' }}>Loading…</div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ padding: '16px', color: '#9ab2d6' }}>No results</div>
            )}

            {!loading && filtered.map((t) => (
              <div
                key={t.latestId}
                className={styles.item}
                onClick={() => handleSelect(t.latestId)}
              >
                <div className={styles.left}>
                  <div className={styles.nameRow}>
                    <span className={styles.flag} aria-hidden />
                    <span className={styles.name}>{t.name}</span>
                  </div>
                  <div className={styles.metaRow}>
                    {t.partner && <span className={styles.badge}>{t.partner}</span>}
                    <span className={styles.badge}>v{t.version}</span>
                    {t.usageCount != null && (
                      <span className={styles.badge}>Used {t.usageCount}</span>
                    )}
                  </div>
                </div>

                <div className={styles.right}>
                  <a
                    className={styles.externalLink}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <button className={styles.btn} onClick={() => navigate(-1)}>
            + Create Custom Evaluator
          </button>
          <button className={`${styles.btn} ${styles.primary}`} disabled>
            Use Selected Evaluator
          </button>
        </footer>
      </div>
    );
  }

  // ---------- Step 2 ----------
  if (step === 2 && currentTemplate) {
    return (
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.title}>Set up evaluator</div>
          <div className={styles.stepper}>
            <span>1. Select Evaluator</span>
            <span className={styles.sep}>›</span>
            <span className={styles.stepOn}>2. Run Evaluator</span>
          </div>
          <div className={styles.subtle}>{currentTemplate.name}</div>
        </header>

        <section className={styles.card}>
          <div style={{ padding: 16 }}>
            <EvaluationForm
              mode="create"
              projectId={projectId}
              template={currentTemplate}
              preventRedirect={false}
              onSubmit={handleSubmit}
            />
          </div>
        </section>
      </div>
    );
  }

  return null;
}

const toCreatePayload = (form, projectId, template) => {
  // --- 1) filter: 문자열/배열 모두 허용, 최종은 배열 ---
  let parsedFilter = [];
  try {
    if (typeof form.filter === "string") {
      const raw = form.filter.trim();
      parsedFilter = raw ? JSON.parse(raw) : [];
    } else if (Array.isArray(form.filter)) {
      parsedFilter = form.filter;
    }
  } catch {
    parsedFilter = [];
  }
  if (!Array.isArray(parsedFilter)) parsedFilter = [];

  // --- 2) variable mapping: rows | array | object 모두 수용 후 표준 스키마로 변환 ---
  let rows = [];
  if (Array.isArray(form.variableMappingRows)) {
    rows = form.variableMappingRows;
  } else if (Array.isArray(form.variableMapping)) {
    rows = form.variableMapping;
  } else if (form.variableMapping && typeof form.variableMapping === "object") {
    rows = Object.entries(form.variableMapping).map(([templateVar, v]) => ({
      templateVar,
      object: v.object || v.source || "trace",
      objectVariable: v.objectVariable || v.variable || "input",
      jsonPath: v.jsonPath || v.path || ""
    }));
  }

  // UI의 'dataset'을 BE 스키마의 'dataset_item'으로 치환
  const toLangfuseObject = (obj) => (obj === "dataset" ? "dataset_item" : obj);

  // BE가 기대하는 스키마로 rename: templateVariable / langfuseObject / selectedColumnId
  const mapping = (rows || [])
    .filter(r => r && r.templateVar) // 템플릿 변수 없는 행 제거
    .map(r => ({
      templateVariable: r.templateVar,
      langfuseObject: toLangfuseObject(r.object),       // 'trace' | 'dataset_item' | …
      selectedColumnId: r.objectVariable,               // 'input' | 'output'
      ...(r.jsonPath ? { jsonPath: r.jsonPath } : {})
    }));

  // --- 3) timeScope: 배열로 만들어야 함 ---
  let timeScope = [];
  if (form.runsOnNew) timeScope.push("NEW");
  if (form.runsOnExisting) timeScope.push("EXISTING");
  if (timeScope.length === 0) timeScope = ["EXISTING"]; // 기본값

  // --- 4) target: 'live'|'dataset' -> 'trace'|'dataset'
  const target = form.target === "live" ? "trace" : "dataset";

  return {
    projectId,
    evalTemplateId: template.latestId ?? template.id,
    scoreName: form.scoreName?.trim(),
    target,                      // 'trace' | 'dataset'
    filter: parsedFilter,        // 배열
    mapping,                     // <-- 표준 스키마
    sampling: Number(form.sampling ?? 1),                         // 0~1
    delay: Math.max(0, Math.floor(Number(form.delaySec ?? 0) * 1000)), // 초→ms
    timeScope,                  // <-- 배열
  };
};

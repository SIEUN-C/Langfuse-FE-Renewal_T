import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EvaluationForm from './components/EvaluationForm';
import styles from './EvaluationDetail.module.css';
import useProjectId from 'hooks/useProjectId';
import { rowsFromConfigMapping, buildVarValuesFromTrace, fillPrompt } from "../Judge/components/evalMapping";
import { toUpdateConfigFromForm } from "../Judge/components/evalMapping";
import { useMemo } from "react";
import { toScopeArray, computeFinalStatus, isEditable } from '../Judge/components/evalstatus';
import { getEvaluatorConfigById } from '../Judge/services/judgeApi';
import { updateEvalJob } from './services/evaluatorsApi';


const EvaluationDetail = ({ onClose }) => {
  const { projectId } = useProjectId();
  const [searchParams] = useSearchParams();
  const peekId = searchParams.get('peek');

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  // 작고 가벼운 토스트 유틸
  const showToast = (message, type = 'success', ttl = 2500) => {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), ttl);
  };

  // ⬇️ 컴포넌트 내부에 둬야 detail, projectId, peekId, setDetail 접근 가능
  const handleUpdate = async (formState) => {
    try {
      const config = toUpdateConfigFromForm(
        formState,
        detail?.template || detail?.evalTemplate
      );

      // 🔎 타입 체크 로그
      console.log('[UPDATE] config =', config, {
        filterType: typeof config.filter,
        filterIsArray: Array.isArray(config.filter),
        vmType: typeof config.variableMapping,
        vmIsArray: Array.isArray(config.variableMapping),
      });


      await updateEvalJob({
        projectId,
        evalConfigId: detail.id,
        config,
      });
      // 저장 후 최신값 다시 로드 + edit 끄기
      const fresh = await getEvaluatorConfigById({ projectId, id: peekId });
      setDetail(fresh);
      setEditMode(false);
      showToast('Running evaluator updated'); // ✅ 성공 토스트
    } catch (e) {
      setErr(e?.message || 'Failed to update configuration');
      showToast(e?.message || 'Update failed', 'error'); // ❌ 에러 토스트
    }
  };


  // 디테일 로딩 (실제 API 사용)
  useEffect(() => {
    let mounted = true;
    // peekId와 projectId 둘 다 있어야 호출
    if (!peekId || !projectId) return;

    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await getEvaluatorConfigById({ projectId, id: peekId });
        if (mounted) {
          if (res) setDetail(res);   // 서버가 finalStatus까지 계산해줌
          else { setErr('Evaluator not found'); setDetail(null); }
        }
      } catch (e) {
        if (mounted) setErr(e?.message || 'Failed to load detail');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [peekId, projectId]);


  // 상태 토글 (ACTIVE <-> INACTIVE)
  const handleStatusToggle = async (checked) => {
    if (!detail || !canToggleStatus) return;
    setToggling(true);
    setErr('');
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      await updateEvalJob({
        projectId,
        evalConfigId: detail.id,
        config: { status: newStatus },
      });
      const fresh = await getEvaluatorConfigById({ projectId, id: detail.id });
      setDetail(fresh);
      showToast(`Status set to ${String(fresh.status || newStatus).toLowerCase()}`);
    } catch (e) {
      setErr(e?.message || 'Failed to update status');
      showToast(e?.message || 'Status update failed', 'error');
    } finally {
      setToggling(false);
    }
  };


  const beToUiFilters = (arr) =>
    (Array.isArray(arr) ? arr : []).map((f) => {
      const col = f.column ?? f.columnId ?? f.key ?? "";
      const column = col === "datasetId" ? "Dataset" : col;
      return {
        column,
        type: column === "Dataset" ? "stringOptions"
          : (String(column).toLowerCase().includes("time") ? "datetime" : "string"),
        operator: f.operator || f.op || "=",
        value: f.value ?? "",
        ...(f.metaKey ? { metaKey: f.metaKey } : {}),
      };
    });


  // ✅ preset은 항상 같은 순서로 호출되도록, early return들보다 위에서 계산
  const presetMemo = useMemo(() => {
    if (!detail) {
      return { mappingRows: [], filterText: "[]", samplingPct: 100, delaySec: 30, runsOnNew: true, runsOnExisting: false };
    }

    const mappingRows = rowsFromConfigMapping(detail?.variableMapping || {});
    const filterText = JSON.stringify(beToUiFilters(detail?.filter ?? []));
    const samplingPct = Math.round((detail?.sampling ?? 1) * 100);
    const delaySec = Math.round((detail?.delay ?? 0) / 1000);

    const scope = toScopeArray(detail?.timeScope).map(s => s.toUpperCase());
    const runsOnNew = scope.includes('NEW');
    const runsOnExisting = scope.includes('EXISTING');

    return { mappingRows, filterText, samplingPct, delaySec, runsOnNew, runsOnExisting };
  }, [detail]);


  if (!peekId) {
    return (
      <div className={styles.container}>
        <p>Select an evaluation to see the details.</p>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.container}>Loading details...</div>;
  }

  if (err && !detail) {
    return <div className={styles.container}>Error: {err}</div>;
  }

  if (!detail) return null;

  // -----------------------------
  // ✅ 편집 가능/불가 플래그를 한 곳에서 계산
  // -----------------------------
  const finalStatus = String(detail.finalStatus || computeFinalStatus(detail)).toUpperCase();

  const scopeArr = toScopeArray(detail?.timeScope).map(s => String(s).toUpperCase());
  const isExistingOnly = scopeArr.includes('EXISTING') && !scopeArr.includes('NEW');

  // 폼/토글 전반이 가능한지 (FINISHED 금지, EXISTING-only 금지)
  const canEdit = finalStatus !== 'FINISHED' && !isExistingOnly;

  // 상태 토글이 가능한지 (Edit Mode가 켜져 있어야 함)
  const canToggleStatus = canEdit && editMode && !toggling;

  const isActive = finalStatus === 'ACTIVE';

  // 디버그(필요시)
  console.debug('[EvalDetail flags]', {
    finalStatus, scopeArr, isExistingOnly, canEdit, editMode, canToggleStatus
  });


  const editable = isEditable(detail); // EXISTING-only면 false



  return (
    <div className={styles.container}>
      {/* 최상단 헤더 */}
      <div className={styles.panelHeader}>
        <span>Running evaluator</span>
        <span className={styles.evaluatorId}>{detail.id}</span>
        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={styles.content}>
        <div className={styles.configHeader}>
          <div className={styles.configTitle}>
            <h2>Configuration</h2>
            <span className={`${styles.statusPill} ${isActive ? styles.active : styles.inactive}`}>
              {finalStatus.toLowerCase()}
            </span>

            {/* 상태 토글: Edit Mode가 켜져 있고(canToggleStatus) 편집 가능할 때만 */}
            <label
              className={`${styles.toggleSwitch} ${!canToggleStatus ? styles.disabled : ''}`}
              aria-disabled={!canToggleStatus}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => handleStatusToggle(e.target.checked)}
                disabled={!canToggleStatus}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.editMode}>
            <span>Edit Mode</span>
            {/* Edit Mode 스위치: FINISHED 또는 EXISTING-only면 비활성화 */}
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={canEdit ? editMode : false}
                onChange={(e) => canEdit && setEditMode(e.target.checked)}
                disabled={!canEdit}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        {/* 폼: Edit Mode가 켜져 있고(canEdit도 true여야)만 'edit' 모드 */}
        <div className={styles.formWrapper}>
          <EvaluationForm
            mode={canEdit ? (editMode ? 'edit' : 'view') : 'view'}
            projectId={projectId}
            template={detail?.template || detail?.evalTemplate || null}
            preset={presetMemo}
            preventRedirect
            onSubmit={canEdit && editMode ? handleUpdate : undefined}
          />
        </div>

        {err ? <p className={styles.errorText}><strong>Error:</strong> {err}</p> : null}
      </div>


      {toast && (
        <div
          className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess
            }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default EvaluationDetail;

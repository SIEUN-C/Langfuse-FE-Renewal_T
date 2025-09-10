import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRunningConfig, updateEvalJob } from '../Judge/services/evaluatorsApi';
import EvaluationForm from './components/EvaluationForm';
import styles from './EvaluationDetail.module.css';
import useProjectId from 'hooks/useProjectId';
import { rowsFromConfigMapping, buildVarValuesFromTrace, fillPrompt } from "../Judge/components/evalMapping";
import { toUpdateConfigFromForm } from "../Judge/components/evalMapping";





const EvaluationDetail = ({ onClose }) => {
  const { projectId } = useProjectId();
  const [searchParams] = useSearchParams();
  const peekId = searchParams.get('peek');

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [toggling, setToggling] = useState(false);

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
      const fresh = await getRunningConfig({ projectId, id: peekId });
      setDetail(fresh);
      setEditMode(false);
    } catch (e) {
      setErr(e?.message || 'Failed to update configuration');
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
        const res = await getRunningConfig({ projectId, id: peekId });
        console.log('[Detail] projectId, peekId, res =', projectId, peekId, res);

        if (mounted) {
          if (res) setDetail(res);
          else {
            setErr('Evaluator not found (check if peek is a Job Config ID)');
            setDetail(null);
          }
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
    if (!detail) return;
    setToggling(true);
    setErr('');
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      await updateEvalJob({
        projectId,
        evalConfigId: detail.id,
        config: { status: newStatus },
      });
      setDetail(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (e) {
      // 백엔드 제약(예: EXISTING-only는 INACTIVE 불가) 시 에러 떨어짐
      setErr(e?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

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

  const isActive = detail.status === 'ACTIVE';

  // 현재 설정을 Form이 그대로 재현할 수 있게 preset 구성
  const mappingPreset = rowsFromConfigMapping(detail?.variableMapping || {});
  const filterTextPreset = JSON.stringify(detail?.filter ?? []);
  const samplingPctPreset = Math.round((detail?.sampling ?? 1) * 100);
  const delaySecPreset = Math.round((detail?.delay ?? 0) / 1000);
  const runsOnNewPreset = (detail?.timeScope ?? 'BOTH') !== 'EXISTING';
  const runsOnExistingPreset = (detail?.timeScope ?? 'BOTH') !== 'NEW';



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
        {/* Configuration 헤더: 상태 토글 + Edit 모드 토글 */}
        <div className={styles.configHeader}>
          <div className={styles.configTitle}>
            <h1>Configuration</h1>
            <span className={`${styles.statusPill} ${isActive ? styles.active : styles.inactive}`}>
              {isActive ? 'active' : 'inactive'}
            </span>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => handleStatusToggle(e.target.checked)}
                disabled={toggling}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.editMode}>
            <span>Edit Mode</span>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        {/* 공용 폼 삽입: view/edit 모드로 재사용 */}
        <div className={styles.formWrapper}>
          <EvaluationForm
            mode={editMode ? 'edit' : 'view'}
            projectId={projectId}
            template={detail?.template || detail?.evalTemplate || null}
            preset={{
              mappingRows: mappingPreset,
              filterText: filterTextPreset,
              samplingPct: samplingPctPreset,
              delaySec: delaySecPreset,
              runsOnNew: runsOnNewPreset,
              runsOnExisting: runsOnExistingPreset,
            }}
            preventRedirect
            onSubmit={editMode ? handleUpdate : undefined}
          />
        </div>

        {/* 에러 메시지 (토글 실패 등) */}
        {err ? (
          <p className={styles.errorText}>
            <strong>Error:</strong> {err}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default EvaluationDetail;

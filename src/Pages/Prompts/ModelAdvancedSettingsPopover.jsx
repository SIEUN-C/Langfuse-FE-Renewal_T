// src/Pages/Prompts/ModelAdvancedSettingsPopover.jsx

// --- ▼▼▼ [수정] Playground 버전과 동일하게 필요한 모든 React Hooks와 라이브러리를 import 합니다. ▼▼▼ ---
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ModelAdvancedSettingsPopover.module.css'; // CSS 파일명은 그대로 사용합니다.
// --- ▲▲▲ [수정] 완료 ▲▲▲ ---


// API 키를 가져오는 함수 (이전과 동일)
function unwrapTrpcJson(json) {
  return json?.result?.data?.json ?? json?.result?.data ?? json;
}

async function fetchProviderMaskedKey(provider, projectId) {
  if (!provider || !projectId) {
    return { key: "Invalid parameters" };
  }
  try {
    const encodedInput = encodeURIComponent(JSON.stringify({ json: { projectId } }));
    const response = await fetch(`/api/trpc/llmApiKey.all?input=${encodedInput}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const jsonResponse = await response.json();
    const connections = unwrapTrpcJson(jsonResponse);
    const targetConnection = connections?.data?.find(c => c.provider === provider);

    return { key: targetConnection?.displaySecretKey ?? "Not found" };
  } catch (error) {
    console.error("Failed to fetch masked key:", error);
    return { key: "Error fetching key" };
  }
}

const ModelAdvancedSettingsPopover = ({
  open,
  onClose,
  anchorRef,
  settings, // NewExperimentModal에서는 'settings' prop으로 전달됩니다.
  onSettingChange, // NewExperimentModal에서는 'onSettingChange' prop으로 전달됩니다.
  onReset,
  provider,
  projectId,
}) => {
  const popoverRef = useRef(null);
  const navigate = useNavigate(); // --- [추가] 'Manage keys' 버튼을 위해 useNavigate를 추가합니다.

  // --- ▼▼▼ [수정] Playground 버전의 모든 상태와 로직을 가져옵니다. ▼▼▼ ---
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [apiKey, setApiKey] = useState("");

  // API 키 가져오기
  useEffect(() => {
    if (open && provider && projectId) {
      fetchProviderMaskedKey(provider, projectId).then(data => {
        setApiKey(data.key || "Not configured");
      });
    }
  }, [open, provider, projectId]);

  // 팝업 위치 계산
  useEffect(() => {
    if (open && anchorRef?.current && popoverRef.current) {
      const buttonRect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: buttonRect.bottom + 8,
        left: buttonRect.left,
      });
    }
  }, [open, anchorRef]);

  // 외부 클릭 및 Esc 키로 팝업 닫기
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (
        popoverRef.current && !popoverRef.current.contains(event.target) &&
        anchorRef.current && !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open, onClose, anchorRef]);
  // --- ▲▲▲ [수정] 로직 추가 완료 ▲▲▲ ---

  // --- ▼▼▼ [수정] 부모 컴포넌트의 state 업데이트 방식을 맞추기 위한 헬퍼 함수입니다. ▼▼▼ ---
  const toFloat = (v, fallback) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : fallback);
  const toInt = (v, fallback) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : fallback);
  
  const update = (newParams) => {
    // 부모의 onSettingChange는 객체 전체를 인자로 받으므로, 기존 settings와 새 파라미터를 합쳐서 전달합니다.
    onSettingChange({ ...settings, ...newParams });
  };
  // --- ▲▲▲ [수정] 완료 ▲▲▲ ---

  const handleManageKeys = () => navigate("/settings/llm-connections");

  if (!open) return null;
  
  // --- ▼▼▼ [수정] Playground의 JSX 구조 전체를 가져와서 적용합니다. ▼▼▼ ---
  return (
    <div
      ref={popoverRef}
      className={styles.advWrap}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1100, // 모달(1000)보다 위에 오도록 설정
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Model Advanced Settings"
    >
      <div className={styles.advHeader}>
        <h3 className={styles.advTitle}>Model Advanced Settings</h3>
        <button onClick={onClose} className={styles.advCloseBtn} aria-label="close">×</button>
      </div>

      <div className={styles.advBody}>
        <p className={styles.advDescription}>Configure advanced parameters for your model.</p>

        {/* Temperature */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Temperature</label>
          </div>
          <div className={styles.advParameterControls}>
            <input
              type="number"
              value={settings.temperature ?? 0}
              onChange={(e) => update({ temperature: toFloat(e.target.value, 0) })}
              className={styles.advValueInput}
              step="0.1" min="0" max="2"
            />
            <div
              className={`${styles.advToggleSwitch} ${settings.useTemperature ? styles.advToggleOn : ""}`}
              onClick={() => update({ useTemperature: !settings.useTemperature })}
              role="switch"
              aria-checked={!!settings.useTemperature}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>
        {settings.useTemperature && (
          <div className={styles.advSliderRow}>
            <input
              type="range"
              value={settings.temperature ?? 0}
              onChange={(e) => update({ temperature: toFloat(e.target.value, 0) })}
              className={styles.advSlider}
              min="0" max="2" step="0.1"
            />
          </div>
        )}

        {/* Output token limit */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Output token limit</label>
          </div>
          <div className={styles.advParameterControls}>
            <input
              type="number"
              value={settings.maxTokens ?? 1024}
              onChange={(e) => update({ maxTokens: toInt(e.target.value, 1024) })}
              className={styles.advValueInput}
              min="1"
            />
            <div
              className={`${styles.advToggleSwitch} ${settings.useMaxTokens ? styles.advToggleOn : ""}`}
              onClick={() => update({ useMaxTokens: !settings.useMaxTokens })}
              role="switch"
              aria-checked={!!settings.useMaxTokens}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>

        {/* Top P */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Top P</label>
          </div>
          <div className={styles.advParameterControls}>
            <input
              type="number"
              value={settings.topP ?? 1}
              onChange={(e) => update({ topP: toFloat(e.target.value, 1) })}
              className={styles.advValueInput}
              step="0.05" min="0" max="1"
            />
            <div
              className={`${styles.advToggleSwitch} ${settings.useTopP ? styles.advToggleOn : ""}`}
              onClick={() => update({ useTopP: !settings.useTopP })}
              role="switch"
              aria-checked={!!settings.useTopP}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>
        {settings.useTopP && (
          <div className={styles.advSliderRow}>
            <input
              type="range"
              value={settings.topP ?? 1}
              onChange={(e) => update({ topP: toFloat(e.target.value, 1) })}
              className={styles.advSlider}
              min="0" max="1" step="0.05"
            />
          </div>
        )}

        {/* Additional options */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Additional options</label>
            <div className={styles.advHelpIcon} title="Additional configuration options">?</div>
          </div>
          <div className={styles.advParameterControls}>
            <div
              className={`${styles.advToggleSwitch} ${settings.additionalOptions ? styles.advToggleOn : ""}`}
              onClick={() => update({ additionalOptions: !settings.additionalOptions })}
              role="switch"
              aria-checked={!!settings.additionalOptions}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>

        {/* API key */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>API key</label>
          </div>
          <div className={styles.advParameterControls}>
            <button
              type="button"
              onClick={handleManageKeys}
              className={styles.advApiKeyBtn}
              title="LLM 키 관리 페이지로 이동"
            >
              {apiKey || "API Key 없음"}
            </button>
          </div>
        </div>
      </div>
      {/* --- [추가] 스크린샷에 보이는 Reset 버튼을 위한 푸터 추가 --- */}
      <div className={styles.advFooter}>
        <button onClick={onReset} className={styles.advResetButton}>Reset to defaults</button>
      </div>
    </div>
  );
  // --- ▲▲▲ [수정] JSX 완료 ▲▲▲ ---
};

export default ModelAdvancedSettingsPopover;
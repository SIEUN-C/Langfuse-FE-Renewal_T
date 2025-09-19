import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ModelAdvancedSettings.module.css';
import { fetchLlmApiKeys } from './ModelAdvancedSettingsApi';
import CodeBlock from 'components/CodeBlock/CodeBlock'

export const DEFAULT_SETTINGS = {
  useTemperature: false,
  useTopP: false,
  useMaxTokens: false,
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
  additionalOptions: false,
  additionalOptionsValue: "{\n\n}",
};

const ModelAdvancedSettings = ({
  // --- Core Props ---
  open,
  onClose,
  anchorRef,
  settings,
  onSettingChange,
  projectId,
  provider,
  onReset,
  useFixedPosition = false,
}) => {
  const popoverRef = useRef(null);
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isJsonValid, setIsJsonValid] = useState(true);

  // --- JSON 유효성 검사 ---
  useEffect(() => {
    // additionalOptions가 활성화되어 있을 때만 유효성을 검사합니다.
    if (settings.additionalOptions) {
      const jsonString = settings.additionalOptionsValue ?? '';

      // 빈 문자열이거나 기본 중괄호만 있는 경우, 오류로 간주하지 않습니다.
      if (jsonString.trim() === '' || jsonString.trim() === '{}' || jsonString.trim() === '{\n  \n}') {
        setIsJsonValid(true);
        return;
      }

      try {
        JSON.parse(jsonString);
        setIsJsonValid(true); // 파싱 성공!
      } catch (e) {
        setIsJsonValid(false); // 파싱 실패!
      }
    } else {
      // 토글이 꺼지면 경고 상태를 초기화합니다.
      setIsJsonValid(true);
    }
  }, [settings.additionalOptions, settings.additionalOptionsValue]);

  // --- API Key Fetching Logic ---
  useEffect(() => {
    if (!open || !projectId || !provider) return;

    const fetchKey = async () => {
      try {
        const keys = await fetchLlmApiKeys(projectId);
        const targetConnection = keys.find(c => c.provider === provider);
        setApiKey(targetConnection?.displaySecretKey ?? 'Not configured');
      } catch (error) {
        console.error("API Key fetch failed:", error);
        setApiKey("Not configured");
      }
    };
    fetchKey();
  }, [open, projectId, provider]);

  // --- Positioning Logic ---
  useEffect(() => {
    if (open && useFixedPosition && anchorRef?.current && popoverRef.current) {
      const buttonRect = anchorRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8; // 여백

      let left = buttonRect.right + margin;
      if (left + popoverRect.width > viewportWidth) {
        left = buttonRect.left - popoverRect.width - margin;
      }
      left = Math.max(margin, left);

      // --- 세로 위치 계산 (수정된 로직) ---
      // 1. 기본적으로 버튼 아래에 위치하도록 시도
      let top = buttonRect.bottom + margin;

      // 2. 아래쪽 공간이 부족하면 위쪽으로 보냄
      if (top + popoverRect.height > viewportHeight) {
        top = buttonRect.top - popoverRect.height - margin;
      }

      // 3. 위로 보내도 화면 상단을 벗어나면, 화면 상단에 붙임
      top = Math.max(margin, top);

      // 4. 그래도 화면 하단을 벗어나는 경우 (내용이 너무 길어서), 화면 하단에 붙임
      top = Math.min(top, viewportHeight - popoverRect.height - margin);


      setPosition({ top, left });
    }
    // 💡 의존성 배열에 'settings'를 추가하여 settings가 바뀔 때마다 이 로직이 재실행되도록 합니다.
  }, [open, anchorRef, useFixedPosition, settings]);

  // --- Close on Outside Click / Escape Key ---
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

  // --- State Update Helpers ---
  const toFloat = (v, fallback) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : fallback);
  const toInt = (v, fallback) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : fallback);

  const update = (newParams) => {
    onSettingChange({ ...settings, ...newParams });
  };

  const handleManageKeys = () => navigate(`/project/${projectId}/settings/llm-connections`);

  if (!open) return null;

  const popoverStyle = useFixedPosition ? {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
    zIndex: 1000,
  } : {};

  return (
    <div
      ref={popoverRef}
      className={styles.advWrap}
      style={popoverStyle}
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
              disabled={!settings.useTemperature}
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

        {/* Output token limit (maxTokens) */}
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
              disabled={!settings.useMaxTokens}
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
        {settings.useMaxTokens && (
          <div className={styles.advSliderRow}>
            <input
              type="range"
              value={settings.maxTokens ?? 1024}
              onChange={(e) => update({ maxTokens: toInt(e.target.value, 1024) })}
              className={styles.advSlider}
              min="100" max="8192" step="100"
            />
          </div>
        )}

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
              disabled={!settings.useTopP}
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
        {settings.additionalOptions && (
          <div className={styles.jsonEditorContainer}>
            <CodeBlock
              code={settings.additionalOptionsValue ?? ""}
              onChange={(value) => update({ additionalOptionsValue: value })}
              language="json"
              className={`${styles.jsonCodeBlock} ${!isJsonValid ? styles.invalidJson : ''}`}
            />
            {!isJsonValid && (
              <div className={styles.jsonWarning}>
                형식이 올바르지 않습니다.
              </div>
            )}
          </div>
        )}

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
              {apiKey}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.advFooter}>
        <button onClick={onReset} className={styles.advResetButton}>Reset to defaults</button>
      </div>
    </div>
  );
};

export default ModelAdvancedSettings;
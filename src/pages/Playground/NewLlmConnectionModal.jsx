// src/Pages/Playground/NewLlmConnectionModal.jsx
import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import styles from "./NewLlmConnectionModal.module.css";
import PropTypes from "prop-types";
import { upsertLlmConnection } from "./lib/llmConnections";

function NewLlmConnectionModal({ isOpen, onClose, projectId: projectIdProp, initial = null }) {
  if (!isOpen) return null;

  // helpers
  const headersArrayToRecord = (arr = []) =>
    arr.reduce((acc, h) => {
      const k = (h?.key || "").trim();
      if (k) acc[k] = (h?.value || "").trim();
      return acc;
    }, {});

  const isEdit = !!initial;

  // base states
  const [adapter, setAdapter] = useState("openai");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");              // 실제 입력되는 새 키
  const [baseUrl, setBaseUrl] = useState("");
  const [enableDefaultModels, setEnableDefaultModels] = useState(true);

  // advanced
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extraHeaders, setExtraHeaders] = useState([]);
  const [customModels, setCustomModels] = useState([]);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // API Key 잠금(수정 모드에서 기본 잠금, 클릭하면 해제)
  const [apiLocked, setApiLocked] = useState(isEdit);
  const [apiDisplay, setApiDisplay] = useState("");      // 잠금 상태에서 보이는 마스킹 문자열

  const projectId = projectIdProp;

  // 초기값 주입
  useEffect(() => {
    if (!initial) return;
    setAdapter(String(initial.adapter || "openai"));
    setName(String(initial.provider || ""));
    setBaseUrl(String(initial.baseURL || initial.baseUrl || ""));
    setEnableDefaultModels(
      !!(initial.withDefaultModels ?? initial.useDefaultModels ?? initial.enableDefaultModels),
    );

    const hdrs =
      initial.extraHeaders && typeof initial.extraHeaders === "object"
        ? Object.entries(initial.extraHeaders).map(([key, value]) => ({ key, value }))
        : [];
    setExtraHeaders(hdrs);

    setCustomModels(
      Array.isArray(initial.customModels)
        ? initial.customModels
        : Array.isArray(initial.models)
        ? initial.models
        : [],
    );

    // API Key: 잠금 + 마스킹 표시
    setApiLocked(true);
    setApiKey(""); // 실제 전송값은 비워둠(입력 없으면 서버에서 기존키 유지)
    setApiDisplay(String(initial.displaySecretKey || "••••••"));
    setShowAdvancedSettings(!!(hdrs.length || initial.baseURL || initial.baseUrl || (initial.customModels && initial.customModels.length)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // 행 편집 핸들러들
  const handleAddHeader = () => setExtraHeaders((prev) => [...prev, { key: "", value: "" }]);
  const handleRemoveHeader = (idx) => setExtraHeaders((prev) => prev.filter((_, i) => i !== idx));
  const handleHeaderChange = (idx, field, value) =>
    setExtraHeaders((prev) => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || { key: "", value: "" }), [field]: value };
      return next;
    });

  const handleAddCustomModel = () => setCustomModels((prev) => [...prev, ""]);
  const handleRemoveCustomModel = (idx) => setCustomModels((prev) => prev.filter((_, i) => i !== idx));
  const handleCustomModelChange = (idx, value) =>
    setCustomModels((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

  // 저장
  const handleSave = async () => {
    setErrorMsg("");
    setOkMsg("");

    if (!projectId) return setErrorMsg("projectId가 누락되었습니다.");
    if (!name.trim()) return setErrorMsg("Provider name을 입력해 주세요.");
    if (!isEdit && !apiKey.trim()) return setErrorMsg("API Key를 입력해 주세요.");

    // header 키 중복 방지
    const keys = extraHeaders.map((h) => (h.key || "").trim()).filter(Boolean);
    const dup = keys.find((k, i) => keys.indexOf(k) !== i);
    if (dup) return setErrorMsg(`Duplicate header key: "${dup}"`);

    setSubmitting(true);
    try {
      const payload = {
        adapter,
        provider: name.trim(),
        baseURL: baseUrl.trim() || undefined,
        // 수정 모드에서 입력 칸이 잠겨 있거나(= 변경 안 함) 입력을 비웠으면 secretKey 전달하지 않음 → 서버에서 기존 값 유지
        ...(apiLocked || !apiKey.trim() ? {} : { secretKey: apiKey.trim() }),
        extraHeaders: headersArrayToRecord(extraHeaders),
        customModels: customModels.filter(Boolean),
        enableDefaultModels: !!enableDefaultModels,
        ...(initial?.id ? { id: initial.id } : {}),
      };

      await upsertLlmConnection(payload, { projectId });
      setOkMsg("연결이 저장되었습니다.");
      setTimeout(() => onClose(), 500);
    } catch (e) {
      setErrorMsg(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  // API Key 입력칸 클릭 시: 잠금 해제 + 값 비우고 포커스 유지
  const unlockApiKeyOnFocus = () => {
    if (!apiLocked) return;
    setApiLocked(false);
    setApiKey("");
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modalContent} ${styles.light}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="llm-connection-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="llm-connection-title" className={styles.modalTitle}>
            {isEdit ? "Update LLM Connection" : "New LLM Connection"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
          {okMsg && <div className={styles.okBox}>{okMsg}</div>}

          {/* LLM adapter (수정 모드 잠금) */}
          <div className={styles.formGroup}>
            <label htmlFor="llm-adapter">LLM adapter</label>
            <p>Schema that is accepted at that provider endpoint.</p>
            <select
              id="llm-adapter"
              value={adapter}
              onChange={(e) => setAdapter(e.target.value)}
              disabled={isEdit}
              aria-disabled={isEdit}
              className={isEdit ? styles.inputDisabled : undefined}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="azure">Azure</option>
              <option value="bedrock">Bedrock</option>
              <option value="google-vertex-ai">Google Vertex AI</option>
              <option value="google-ai-studio">Google AI Studio</option>
            </select>
          </div>

          {/* Provider name (수정 모드 잠금) */}
          <div className={styles.formGroup}>
            <label htmlFor="provider-name">Provider name</label>
            <p>Key to identify the connection within Langfuse.</p>
            <input
              id="provider-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. openai"
              readOnly={isEdit}
              aria-readonly={isEdit}
              className={isEdit ? styles.inputDisabled : undefined}
              autoFocus={!isEdit}
            />
          </div>

          {/* API Key (수정 모드: 잠금 → 클릭 시 해제/새 값 입력) */}
          <div className={styles.formGroup}>
            <label htmlFor="api-key">API Key</label>
            <p>Your API keys are stored encrypted in your database.</p>
            <input
              id="api-key"
              type="password"
              value={apiLocked ? apiDisplay : apiKey}
              onChange={(e) => (!apiLocked ? setApiKey(e.target.value) : void 0)}
              onFocus={unlockApiKeyOnFocus}
              readOnly={apiLocked}
              aria-readonly={apiLocked}
              placeholder={isEdit ? "(click to change)" : "sk-..."}
              className={apiLocked ? styles.inputReadonly : undefined}
            />
            {isEdit && (
              <small className={styles.helpText}>
                Click the field to replace the existing key. Leave it as-is to keep the current key.
              </small>
            )}
          </div>

          {/* 고급 설정 토글 */}
          {!showAdvancedSettings ? (
            <button
              type="button"
              className={styles.advancedLink}
              onClick={() => setShowAdvancedSettings(true)}
            >
              Show advanced settings
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.advancedLink}
                onClick={() => setShowAdvancedSettings(false)}
              >
                Hide advanced settings
              </button>

              <div className={styles.advancedSettings}>
                {/* Base URL */}
                <div className={styles.formGroup}>
                  <label htmlFor="api-base-url">API Base URL</label>
                  <p>
                    Leave blank to use the default base URL for the given LLM adapter. OpenAI
                    default: https://api.openai.com/v1
                  </p>
                  <input
                    id="api-base-url"
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="default"
                  />
                </div>

                {/* Extra headers */}
                <div className={styles.formGroup}>
                  <label>Extra Headers</label>
                  <p>
                    Optional additional HTTP headers to include with requests towards LLM provider.
                    All header values stored encrypted in your database.
                  </p>

                  {extraHeaders.map((header, index) => (
                    <div key={index} className={styles.headerInput}>
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                        placeholder="Header name"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                        placeholder="Header value"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(index)}
                        aria-label="Remove header"
                        title="Remove header"
                        className={styles.iconBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button type="button" className={styles.addMore} onClick={handleAddHeader}>
                    + Add Header
                  </button>
                </div>

                {/* Enable default models */}
                <div className={styles.formGroup}>
                  <label className={styles.switchRow}>
                    <span>Enable default models</span>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={enableDefaultModels}
                        onChange={(e) => setEnableDefaultModels(e.target.checked)}
                      />
                      <span className={`${styles.slider} ${styles.round}`}></span>
                    </span>
                  </label>
                  <p>Default models for the selected adapter will be available in Langfuse features.</p>
                </div>

                {/* Custom models */}
                <div className={styles.formGroup}>
                  <label>Custom models</label>
                  <p>Custom model names accepted by given endpoint.</p>

                  {customModels.map((model, index) => (
                    <div key={index} className={styles.customModelInput}>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => handleCustomModelChange(index, e.target.value)}
                        placeholder={`Custom model name ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomModel(index)}
                        aria-label="Remove custom model"
                        title="Remove custom model"
                        className={styles.iconBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button type="button" className={styles.addMore} onClick={handleAddCustomModel}>
                    + Add custom model name
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.createButton}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={submitting || !name.trim() || (!isEdit && !apiKey.trim())}
          >
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create connection"}
          </button>
        </div>
      </div>
    </div>
  );
}

NewLlmConnectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string,
  initial: PropTypes.object, // 수정 모드일 때 기존 값
};

export default NewLlmConnectionModal;

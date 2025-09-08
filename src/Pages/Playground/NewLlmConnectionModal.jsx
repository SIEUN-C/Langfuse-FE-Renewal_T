import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import styles from "./NewLlmConnectionModal.module.css";
import PropTypes from "prop-types";
import { upsertLlmConnection } from "./lib/llmConnections";

function NewLlmConnectionModal({ isOpen, onClose, projectId: projectIdProp }) {
  if (!isOpen) return null;

  // 배열 헤더 → 레코드
  const headersArrayToRecord = (arr = []) =>
    arr.reduce((acc, h) => {
      const k = (h?.key || "").trim();
      if (k) acc[k] = (h?.value || "").trim();
      return acc;
    }, {});

  // 기본 입력 상태
  const [adapter, setAdapter] = useState("openai");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(""); // 공백이면 default 사용
  const [enableDefaultModels, setEnableDefaultModels] = useState(true);

  // 고급 설정
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extraHeaders, setExtraHeaders] = useState([]);
  const [customModels, setCustomModels] = useState([]);

  // UX 상태
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // 새로 추가된 행에 자동 포커스를 주기 위한 인덱스 저장
  const [focusFlags, setFocusFlags] = useState({
    headerIndex: null,
    modelIndex: null,
  });

  // ⚠️ env fallback 제거: 상위에서 받은 값만 사용 (상태/헤더와 반드시 일치)
  const projectId = projectIdProp;

  // ─────────────────────────────────────────────────────────────
  // 행 추가/삭제 핸들러 (+ 자동 포커스 플래그 세팅)
  // ─────────────────────────────────────────────────────────────
  const handleAddHeader = () => {
    setExtraHeaders((prev) => [...prev, { key: "", value: "" }]);
    setFocusFlags((f) => ({ ...f, headerIndex: extraHeaders.length })); // 새 인덱스
  };
  const handleRemoveHeader = (idx) => {
    setExtraHeaders((prev) => prev.filter((_, i) => i !== idx));
    setFocusFlags((f) => (f.headerIndex === idx ? { ...f, headerIndex: null } : f));
  };
  const handleHeaderChange = (idx, field, value) =>
    setExtraHeaders((prev) => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || { key: "", value: "" }), [field]: value };
      return next;
    });

  const handleAddCustomModel = () => {
    setCustomModels((prev) => [...prev, ""]);
    setFocusFlags((f) => ({ ...f, modelIndex: customModels.length })); // 새 인덱스
  };
  const handleRemoveCustomModel = (idx) => {
    setCustomModels((prev) => prev.filter((_, i) => i !== idx));
    setFocusFlags((f) => (f.modelIndex === idx ? { ...f, modelIndex: null } : f));
  };
  const handleCustomModelChange = (idx, value) =>
    setCustomModels((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

  // Enter: 다음 행 추가 / Ctrl+Enter: 저장
  const onRowKeyDown = (e, type) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (type === "header") handleAddHeader();
      if (type === "model") handleAddCustomModel();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
      e.preventDefault();
      handleCreateConnection();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 저장
  // ─────────────────────────────────────────────────────────────
  const handleCreateConnection = async () => {
    setErrorMsg("");
    setOkMsg("");

    if (!projectId) {
      setErrorMsg("projectId가 누락되었습니다. 프로젝트 선택을 확인해 주세요.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("이름(name)을 입력해 주세요.");
      return;
    }
    if (!apiKey.trim()) {
      setErrorMsg("API Key를 입력해 주세요.");
      return;
    }

    // 중복 헤더키 가드(선택)
    const keys = extraHeaders.map((h) => (h.key || "").trim()).filter(Boolean);
    const dup = keys.find((k, i) => keys.indexOf(k) !== i);
    if (dup) {
      setErrorMsg(`Duplicate header key: "${dup}"`);
      return;
    }

    setSubmitting(true);
    try {
      const frontPayload = {
        // 🔑 핵심: adapter 키로 맞춘다 (schema 금지)
        adapter,
        provider: name.trim(),
        baseURL: baseUrl.trim() || undefined,
        secretKey: apiKey.trim(),
        extraHeaders: headersArrayToRecord(extraHeaders),
        customModels: customModels.filter(Boolean),
        enableDefaultModels: !!enableDefaultModels, // 이름도 맞춰서 보냄
      };

      await upsertLlmConnection(frontPayload, { projectId });
      setOkMsg("연결이 저장되었습니다.");
      setTimeout(() => onClose(), 600);
    } catch (e) {
      setErrorMsg(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
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
        aria-labelledby="new-llm-connection-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="new-llm-connection-title" className={styles.modalTitle}>
            New LLM Connection
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

          {/* 스샷 순서: LLM adapter → Provider name → API Key */}
          <div className={styles.formGroup}>
            <label htmlFor="llm-adapter">LLM adapter</label>
            <p>Schema that is accepted at that provider endpoint.</p>
            <select
              id="llm-adapter"
              value={adapter}
              onChange={(e) => setAdapter(e.target.value)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="azure">Azure</option>
              <option value="bedrock">Bedrock</option>
              <option value="google-vertex-ai">Google Vertex AI</option>
              <option value="google-ai-studio">Google AI Studio</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="provider-name">Provider name</label>
            <p>Key to identify the connection within Langfuse.</p>
            <input
              id="provider-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. openai"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="api-key">API Key</label>
            <p>Your API keys are stored encrypted in your database.</p>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

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
                <div className={styles.formGroup}>
                  <label htmlFor="api-base-url">API Base URL</label>
                  <p>
                    Leave blank to use the default base URL for the given LLM adapter. OpenAI default: https://api.openai.com/v1
                  </p>
                  <input
                    id="api-base-url"
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="default"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Extra Headers</label>
                  <p>
                    Optional additional HTTP headers to include with requests
                    towards LLM provider. All header values stored encrypted in
                    your database.
                  </p>

                  {extraHeaders.map((header, index) => (
                    <div key={index} className={styles.headerInput}>
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                        placeholder="Header name"
                        autoFocus={!!focusFlags && focusFlags.headerIndex === index}
                        onKeyDown={(e) => onRowKeyDown(e, "header")}
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                        placeholder="Header value"
                        onKeyDown={(e) => onRowKeyDown(e, "header")}
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

                  <button
                    type="button"
                    className={styles.addMore}
                    onClick={handleAddHeader}
                  >
                    + Add Header
                  </button>
                </div>

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
                  <p>
                    Default models for the selected adapter will be available in
                    Langfuse features.
                  </p>
                </div>

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
                        autoFocus={!!focusFlags && focusFlags.modelIndex === index}
                        onKeyDown={(e) => onRowKeyDown(e, "model")}
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

                  <button
                    type="button"
                    className={styles.addMore}
                    onClick={handleAddCustomModel}
                  >
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
              handleCreateConnection();
            }}
            disabled={submitting || !name.trim() || !apiKey.trim()}
          >
            {submitting ? "Saving..." : "Create connection"}
          </button>
        </div>
      </div>
    </div>
  );
}

NewLlmConnectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string, // ⚠️ 상위에서 꼭 넘겨줄 것
};

export default NewLlmConnectionModal;

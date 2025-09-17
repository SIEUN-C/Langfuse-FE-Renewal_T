import React, { useEffect, useRef, useState, useMemo } from "react";
import styles from "./DefaultModelModal.module.css";
import { Settings2 } from 'lucide-react';
import ModelAdvancedSettings, { DEFAULT_SETTINGS } from "../../../components/ModelAdvancedSettings/ModelAdvancedSettings";
import { fetchLlmApiKeys, upsertDefaultModel } from '../services/libraryApi'
import useProjectId from 'hooks/useProjectId'

export default function DefaultModelModal({
  isOpen,
  onClose,
  onUpdate,
  provider,
  modelName,
  projectId,
}) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [setting, setSetting] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  const [selectedProvider, setSelectedProvider] = useState(provider || '');
  const [selectedModelName, setSelectedModelName] = useState(modelName || '');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [ismodalOpen, setIsModalOpen] = useState(false);
  const settingsButtonRef = useRef(null);
  const [modelSettings, setModelSettings] = useState(DEFAULT_SETTINGS);

  // ESC로 닫기 & 모달 열릴 때 첫 포커스
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (
        dialogRef.current && !dialogRef.current.contains(event.target) &&
        settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)
      ) {
        onClose?.();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        // 확인 모달이 열려있으면 그것만 닫고, 그렇지 않으면 메인 모달을 닫음
        if (isConfirmModalOpen) {
          setIsConfirmModalOpen(false);
        } else {
          onClose?.();
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, isConfirmModalOpen]);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    const fetchKeys = async () => {
      setIsLoadingKeys(true);
      try {
        const keys = await fetchLlmApiKeys(projectId);

        setApiKeys(keys);
      } catch (error) {
        console.error("API keys를 가져오는데 실패했습니다.", error);
        setApiKeys([]);
      } finally {
        setIsLoadingKeys(false);
      }
    };
    fetchKeys();
  }, [isOpen, projectId]);

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setSelectedProvider(newProvider);
    setSelectedModelName('');
  };

  const handleSettingChange = (newSettings) => {
    setModelSettings(newSettings);
  }

  const handleConfirmUpdate = async () => {
    if (confirmText.trim().toLowerCase() !== 'update' || isUpdating) return;

    const selectedApiKey = apiKeys.find(key => key.provider === selectedProvider);
    if (!selectedProvider || !selectedModelName || !selectedApiKey) {
      console.error("Provider와 Model을 모두 선택해야 합니다");
      return;
    }

    setIsUpdating(true);

    const modelParams = {};
    if (modelSettings.useTemperature) modelParams.temperature = modelSettings.temperature;
    if (modelSettings.useTopP) modelParams.top_p = modelSettings.topP;
    if (modelSettings.useMaxTokens) modelParams.max_tokens = modelSettings.maxTokens;

    const modelData = {
      projectId: projectId,
      provider: selectedProvider,
      adapter: selectedApiKey.adapter,
      model: selectedModelName,
      modelParams: modelParams,
    };

    try {
      await upsertDefaultModel(modelData);
      onUpdate?.();

      setConfirmText("");
      setIsConfirmModalOpen(false);
      onClose();
    } catch (error) {
      console.error('기본 모델 업데이트에 실패했습니다.', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const availableModels = useMemo(() => {
    if (!selectedProvider || apiKeys.length === 0) {
      return [];
    }
    const selectedApiKey = apiKeys.find(key => key.provider === selectedProvider);

    return selectedApiKey?.customModels || [];
  }, [selectedProvider, apiKeys]);

  if (!isOpen) return null;

  return (
    <div className={styles.dmcOverlay} role="presentation">
      <div
        className={styles.dmcModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dmc-title"
        ref={dialogRef}
      >
        {/* 헤더 */}
        <div className={styles.dmcHeader}>
          <h2 id="dmc-title" className={styles.dmcTitle}>
            Default model configuration
          </h2>
          <div className={styles.dmcHeaderActions}>
            <button
              ref={settingsButtonRef}
              className={styles.iconBtn}
              onClick={() => setIsModalOpen(true)}>
              <Settings2 />
            </button>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              ref={closeBtnRef}
            >
              X
            </button>
          </div>
          <ModelAdvancedSettings
            open={ismodalOpen}
            onClose={() => setIsModalOpen(false)}
            anchorRef={settingsButtonRef}
            settings={modelSettings}
            onSettingChange={handleSettingChange}
            onReset={() => setModelSettings(DEFAULT_SETTINGS)}
            projectId={projectId}
            provider={selectedProvider}
            useFixedPosition={true}
          />
        </div>

        {/* 본문 */}
        <div className={styles.dmcBody}>
          <div className={styles.dmcField}>
            <label htmlFor="provider" className={styles.dmcLabel}>Provider</label>
            <div className={styles.dmcSelectWrap}>
              <select
                id="provider"
                value={selectedProvider}
                onChange={handleProviderChange}
                className={styles.dmcSelect}
                disabled={isLoadingKeys}
              >
                <option value="" disabled>Select a provider</option>
                {isLoadingKeys ? (
                  <option>Loading providers...</option>
                ) : (
                  apiKeys.map(key => (
                    <option key={key.id} value={key.provider}>
                      {key.provider}
                    </option>
                  ))
                )}
              </select>
              <span className={styles.dmcCaret} aria-hidden>▾</span>
            </div>
          </div>

          <div className={styles.dmcField}>
            <label htmlFor="model" className={styles.dmcLabel}>Model name</label>
            <div className={styles.dmcSelectWrap}>
              <select
                id="model"
                value={selectedModelName}
                onChange={(e) => setSelectedModelName(e.target.value)}
                className={styles.dmcSelect}
                disabled={!selectedProvider || availableModels.length === 0}
              >
                <option value="" disabled>Select a model</option>
                {selectedProvider && availableModels.length > 0 ? (
                  availableModels.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                ) : (
                  <option disabled>No models available for this provider</option>
                )}
              </select>
              <span className={styles.dmcCaret} aria-hidden>▾</span>
            </div>
          </div>

          <p className={styles.dmcHint}>
            Select a model which supports function calling.
          </p>
        </div>

        {/* 푸터 */}
        <div className={styles.dmcFooter}>
          <button className={`${styles.btn} ${styles.ghost}`} type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.primary}`}
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={!selectedProvider || !selectedModelName}
          >
            Update
          </button>
        </div>
        {isConfirmModalOpen && (
          // 뒷 배경을 다시 어둡게 처리
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmModal}>
              <h3>Please confirm</h3>
              <p>
                Updating the default model will impact any currently running evaluators that use it.
                Please confirm that you want to proceed with this change.
              </p>
              <label htmlFor="confirmInput">Type "update" to confirm</label>
              <input
                id="confirmInput"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={styles.confirmInput}
              />
              <div className={styles.confirmActions}>
                <button
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={() => setIsConfirmModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  // 'update'라고 정확히 입력했을 때만 활성화
                  disabled={confirmText.trim().toLowerCase() !== 'update' || isUpdating}
                  onClick={handleConfirmUpdate}
                >
                  {isUpdating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
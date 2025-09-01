// src/Pages/Prompts/ModelAdvancedSettingsPopover.jsx

import React, { useState, useEffect } from 'react';
import styles from './ModelAdvancedSettingsPopover.module.css';

// ======================= ▼▼▼ 핵심 수정 ▼▼▼ =======================
// 문제가 되었던 import를 삭제하고, 해당 파일의 기능을 여기에 직접 추가합니다.

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
// ======================= ▲▲▲ 수정 완료 ▲▲▲ =======================


const ModelAdvancedSettingsPopover = ({
  open,
  onClose,
  anchorRef,
  settings,
  onSettingChange,
  onReset,
  apiKeyDisplayValue, // Prompts 팀용 prop
  provider,           // Playground 팀용 prop
  projectId,          // Playground 팀용 prop
}) => {
  const [internalApiKey, setInternalApiKey] = useState(null);

  useEffect(() => {
    if (!apiKeyDisplayValue && open && provider && projectId) {
      // 이제 컴포넌트 내부에 있는 함수를 안전하게 호출합니다.
      fetchProviderMaskedKey(provider, projectId).then(setInternalApiKey);
    }
  }, [open, provider, projectId, apiKeyDisplayValue]);

  const finalApiKey = apiKeyDisplayValue ?? internalApiKey?.key ?? "Not configured";
  const safeSettings = settings || { temperature: 0, maxTokens: 0, topP: 0 };

  if (!open) return null;

  // JSX 부분은 이전과 동일합니다.
  return (
    <div
      ref={anchorRef}
      className={styles.popover}
      style={{
        position: 'absolute',
        top: anchorRef.current ? anchorRef.current.offsetTop + anchorRef.current.offsetHeight + 5 : 'auto',
        left: anchorRef.current ? anchorRef.current.offsetLeft : 'auto',
        zIndex: 1000,
      }}
    >
      <div className={styles.header}>
        <h4>Model Parameters</h4>
        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>
      <div className={styles.content}>
        <div className={styles.settingRow}>
          <label>Temperature</label>
          <input
            type="number"
            step="0.1"
            value={safeSettings.temperature}
            onChange={(e) => onSettingChange('temperature', parseFloat(e.target.value))}
          />
        </div>
        <div className={styles.settingRow}>
          <label>Max tokens</label>
          <input
            type="number"
            value={safeSettings.maxTokens}
            onChange={(e) => onSettingChange('maxTokens', parseInt(e.target.value, 10))}
          />
        </div>
        <div className={styles.settingRow}>
          <label>Top P</label>
          <input
            type="number"
            step="0.1"
            value={safeSettings.topP}
            onChange={(e) => onSettingChange('topP', parseFloat(e.target.value))}
          />
        </div>

        <div className={styles.apiKeySection}>
            <span>API Key</span>
            <span className={styles.apiKeyValue}>{finalApiKey}</span>
        </div>
      </div>
      <div className={styles.footer}>
        <button onClick={onReset} className={styles.resetButton}>Reset</button>
      </div>
    </div>
  );
};

export default ModelAdvancedSettingsPopover;
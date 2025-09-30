import React, { useEffect, useRef, useState } from "react";
import { Clipboard, Trash2 } from "lucide-react";
import commonStyles from "../layout/SettingsCommon.module.css";
import apiKeyStyles from "../layout/Apikeys.module.css";
import { updateOrgApiKeyNote } from "../lib/orgApiKeys"; // 백엔드 호출(조직 API키 노트 업데이트)
import { updateProjectApiKeyNote } from "../lib/projectApiKeys";

function NoteCell({ keyId, initialValue, organizationId, projectId, onPatched }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue || "");
  const [value, setValue] = useState(initialValue || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // 외부에서 값이 바뀌면 동기화
  useEffect(() => {
    if (!editing) {
      setDraft(initialValue || "");
      if (typeof setValue === "function") {
        setValue(initialValue || "");
      } 
    }
  }, [initialValue, editing]);

  // 편집 들어가면 포커스
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = async () => {
    if (saving) return;
    const next = (draft || "").trim();
    // 값이 안 바뀌었으면 저장 X
    if (next === (initialValue || "")) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      if (projectId) {
        await updateProjectApiKeyNote(projectId, keyId, next);
      } else {
        await updateOrgApiKeyNote({ orgId: organizationId, keyId, note: next });
      }
      setValue(next);
      onPatched?.(keyId, next); // 부모 목록 최신화(옵션)
      setEditing(false);
    } catch (e) {
      alert("노트 저장 실패: " + (e?.message || "unknown"));
      // 실패 시 편집 유지
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(initialValue || "");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        className={apiKeyStyles.note}
        title="Edit note"
        onClick={() => setEditing(true)}
        style={{ cursor: "text" }}
      >
        {value || "Click to add note"}
      </div>
    );
  }

  // 기존 UI 유지: 별도 버튼 없이, 바깥 클릭(blur) 자동 저장
  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      className={apiKeyStyles.input} // 모듈에 있는 .input 재사용
      placeholder="Type note and click outside to save"
      disabled={saving}
      onBlur={save}                   // ← 바깥 클릭 시 저장
      onKeyDown={(e) => {
        if (e.key === "Enter") save(); // Enter 저장
        if (e.key === "Escape") cancel(); // Esc 취소
      }}
    />
  );
}

export default function ApiKeysTable({ keys, onDelete, organizationId, projectId, onNotePatched }) {
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert("복사되었습니다.");
    });
  };

  return (
    <div className={commonStyles.keyList}>
      <div className={`${commonStyles.keyRow} ${commonStyles.keyHeader}`}>
        <div>Created</div>
        <div>Note</div>
        <div>Public Key</div>
        <div>Secret Key</div>
        <div>Actions</div>
      </div>

      {keys.map((key) => (
        <div key={key.id} className={commonStyles.keyRow}>
          <div>{new Date(key.createdAt).toLocaleDateString()}</div>

          <NoteCell
            keyId={key.id}
            initialValue={key.note}
            organizationId={organizationId}
            projectId={projectId}
            onPatched={(id, note) => {
              // 선택: 부모에서 상태 반영하고 싶으면 콜백으로 전달
              onNotePatched?.(id, note);
            }}
          />

          <div>
            <div className={apiKeyStyles.publicKeyCell}>
              <span>{key.publicKey}</span>
              <button
                onClick={() => copyToClipboard(key.publicKey)}
                className={apiKeyStyles.copyButton}
                aria-label="Copy public key"
                title="Copy"
              >
                <Clipboard size={14} />
              </button>
            </div>
          </div>

          <div className={apiKeyStyles.secretKeyCell}>{key.displaySecretKey}</div>

          <div>
            <button
              onClick={() => onDelete(key.id)}
              className={apiKeyStyles.deleteButton}
              aria-label="Delete key"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

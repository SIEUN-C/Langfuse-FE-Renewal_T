import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Info, Plus } from "lucide-react";
import commonStyles from "./layout/SettingsCommon.module.css";
import { getCodeSnippets } from "./codeSnippets";
import useApiKeys from "./lib/useApiKeys";
import { ApiKeysTable, ApiKeyModal } from "./form";
import { resolveOrgId } from "./lib/sessionOrg";

const ApiKeys = () => {
  const { projectId } = useOutletContext();
  const { keys, loading, error, create, remove, patchLocal } = useApiKeys(projectId);

  const [orgId, setOrgId] = useState("");
  const [newKeyDetails, setNewKeyDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const host = import.meta.env.VITE_LANGFUSE_BASE_URL || "http://localhost:3000";

   useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!projectId) return;
        const id = await resolveOrgId(projectId);
        if (!cancelled) setOrgId(id);
      } catch (e) {
        console.warn("resolveOrgId failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const codeSnippets = useMemo(() => {
    if (!newKeyDetails?.secretKey) return {};
    return getCodeSnippets({
      publicKey: newKeyDetails.publicKey,
      secretKey: newKeyDetails.secretKey,
      host,
    });
  }, [newKeyDetails, host]);

  const handleCreateNewKey = async () => {
    setIsCreating(true);
    try {
      const newKey = await create();
      setNewKeyDetails(newKey);
      setIsModalOpen(true);
    } catch (e) {
      alert(`API 키 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id) => {
    if (!window.confirm("정말로 이 API 키를 삭제하시겠습니까?")) return;
    try {
      await remove(id);
      alert("API 키가 삭제되었습니다.");
    } catch (e) {
      alert(`API 키 삭제 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className={commonStyles.container}>
      <header className={commonStyles.header}>
        <h3 className={commonStyles.title}>
          Project API Keys <Info size={12} />
        </h3>
      </header>

      {loading && <p>Loading API Keys...</p>}
      {error && <p style={{ color: "red" }}>{String(error)}</p>}

      {!loading && !error && (
        <ApiKeysTable 
        keys={keys} 
        onDelete={handleDeleteKey}
        organizationId={orgId}
        projectId={projectId}
        onNotePatched={(id, note) => { patchLocal(id, note); }}
        />
      )}

      <button
        onClick={handleCreateNewKey}
        className={commonStyles.createButton}
        disabled={isCreating}
      >
        {isCreating ? (
          "Creating..."
        ) : (
          <>
            <Plus size={16} /> Create new API key
          </>
        )}
      </button>

      {isModalOpen && newKeyDetails && (
        <ApiKeyModal
          host={host}
          newKeyDetails={newKeyDetails}
          codeSnippets={codeSnippets}
          onClose={() => {
            setIsModalOpen(false);
            setNewKeyDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default ApiKeys;

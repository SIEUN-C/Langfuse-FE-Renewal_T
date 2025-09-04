// src/Pages/Settings/General.jsx
import { Copy } from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import commonStyles from "./layout/SettingsCommon.module.css";
import styles from "./layout/General.module.css";

import TransferProjectForm from "./form/TransferProjectForm";
import DeleteProjectForm from "./form/DeleteProjectForm";

import { trpcMutation } from "./lib/trpc";
import { resolveOrgId, fetchSession } from "./lib/sessionOrg";
import { trpcTryManyMutation } from "./lib/trpcTryMany";
import JsonDebugCard from "./form/JsonDebugCard";
import DangerZone from "./form/DangerZone";   //분리한 DangerZone 사용
import CreateProjectInline from "./CreateProjectInline";
import { useNavigate } from "react-router-dom";

// 서버 절차명 후보들
const DELETE_PROC_CANDIDATES = [
  "projects.delete",
  "project.delete",
  "projects.hardDelete",
  "project.hardDelete",
];
const TRANSFER_PROC_CANDIDATES = [
  "projects.transfer",
  "project.transferOwnership",
  "projects.transferOwnership",
];

export default function General() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [project, setProject] = useState(null);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [isPristine, setIsPristine] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 모달 상태
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [session, setSession] = useState(null);
  const [org, setOrg] = useState(null);

  // 초기 로드
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const s = await fetchSession();
        setSession(s);

        const orgs = Array.isArray(s?.user?.organizations) ? s.user.organizations : [];
        const firstProj =
          orgs.flatMap((o) => Array.isArray(o.projects) ? o.projects : [])[0] || null;
        if (!firstProj) {
          setError("프로젝트를 찾을 수 없습니다.");
          return;
        }
        setProject(firstProj);
        setProjectNameInput(firstProj.name || "");

        let orgId = null;
        try {
          orgId = await resolveOrgId(firstProj.id);
        } catch {}
        const found =
          orgs.find((o) => o.id === orgId) ||
          orgs.find((o) => (o.projects || []).some((p) => p.id === firstProj.id)) ||
          orgs[0] ||
          null;
        setOrg(found);
      } catch (e) {
        setError(e?.message || "프로젝트 로드 실패");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 이름 변경
  const handleSave = useCallback(async () => {
    if (!project) return;
    const newName = projectNameInput.trim();
    if (!newName || newName === project.name) return;
    try {
      setSaving(true);
      await trpcMutation("projects.update", { projectId: project.id, newName });
      setProject((p) => (p ? { ...p, name: newName } : p));
      setIsPristine(true);
      alert("프로젝트 이름이 변경되었습니다.");
    } catch (e) {
      alert(`이름 변경 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [project, projectNameInput]);

  // 삭제 실행
  const handleConfirmDelete = useCallback(async () => {
    if (!project) return;
    try {
      await trpcTryManyMutation(DELETE_PROC_CANDIDATES, { projectId: project.id });
      alert("프로젝트가 삭제되었습니다.");
      setIsDeleteModalOpen(false);
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  }, [project]);

  // 이전 실행
  const handleConfirmTransfer = useCallback(async (selectedOrgId) => {
    if (!project) return;
    try {
      const targetOrganizationId = selectedOrgId || (await resolveOrgId(project.id));
      await trpcTryManyMutation(TRANSFER_PROC_CANDIDATES, {
        projectId: project.id,
        targetOrganizationId,
        targetOrgId: targetOrganizationId,
      });
      alert("프로젝트가 이전되었습니다.");
      setIsTransferModalOpen(false);

      // 최신 세션으로 현재 조직의 남은 프로젝트 수 확인
     const s = await fetchSession();
     const currentOrgId = org?.id || null;
     const updatedOrg = (s?.user?.organizations || []).find(o => o.id === currentOrgId);
     const remaining = (updatedOrg?.projects || []).filter(p => p.id !== project.id);

     if (!updatedOrg || remaining.length === 0) {
       // Settings 페이지에서 곧장 'New Project' 인라인 UI를 띄움
       setProject(null);
       setShowCreate(true);
       return;
     }
     // 남은 프로젝트가 있다면 프로젝트 선택 화면으로(팀 라우트에 맞춰 변경)
     navigate(`/projects/select?orgId=${currentOrgId}`, {
       replace: true,
       state: { projects: remaining },
     });

    } catch (e) {
      alert(`이전 실패: ${e.message}`);
    }
  }, [project, org, navigate]);

  // 입력 UX
  const handleFocus = () => { if (isPristine) setProjectNameInput(""); };
  const handleBlur = () => {
    if (project && projectNameInput.trim() === "") {
      setProjectNameInput(project.name || "");
      setIsPristine(true);
    }
  };
  const handleChange = (e) => {
    if (isPristine) setIsPristine(false);
    setProjectNameInput(e.target.value);
  };

  const isSaveDisabled =
    !project || saving || projectNameInput.trim() === "" ||
    projectNameInput.trim() === project?.name;

  const metadata = useMemo(() => ({
    project: project ? { name: project.name, id: project.id } : null,
    org: org ? { name: org.name, id: org.id } : null,
  }), [project, org]);

  if (isLoading) return <div className={commonStyles.container}>Loading project data...</div>;
  if (error) return <div className={commonStyles.container} style={{ color: "#ef4444" }}>Error: {error}</div>;
  if (!project || showCreate) {
    return (
      <CreateProjectInline
        orgId={org?.id || ""}
        defaultName="my-llm-project"
        goNext="project"
      />
    );
  }
  return (
    <div className={commonStyles.container}>
      {/* Host Name */}
      <h3 className={commonStyles.title}>Host Name</h3>
      <section className={commonStyles.section}>
        <p className={commonStyles.p}>When connecting to Langfuse, use this hostname / baseurl.</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="text"
            value={import.meta.env.VITE_LANGFUSE_BASE_URL || "Not Set"}
            readOnly
            className={commonStyles.input}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(import.meta.env.VITE_LANGFUSE_BASE_URL || "Not Set");
              alert("Host Name이 클립보드에 복사되었습니다!");
            }}
            className={commonStyles.input}
            title="Copy Host Name"
            style={{ width: "48px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 0 }}
          >
            <Copy size={20} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* Project Name */}
      <h3 className={commonStyles.title}>Project Name</h3>
      <section className={commonStyles.section}>
        {projectNameInput && projectNameInput !== project.name ? (
          <p className={commonStyles.p}>
            Your Project will be renamed from "{project.name}" to "{projectNameInput}".
          </p>
        ) : (
          <p className={commonStyles.p}>Your Project is currently '{project.name}'.</p>
        )}

        <input
          type="text"
          value={projectNameInput}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${commonStyles.input} ${isPristine ? styles.inputPristine : ""}`}
        />
        <button className={commonStyles.button} onClick={handleSave} disabled={isSaveDisabled}>
          {saving ? "Saving..." : "Save"}
        </button>
      </section>

      {/* Debug Info */}
      <h3 className={commonStyles.title}>Debug Information</h3>
      <section className={commonStyles.section}>
        <JsonDebugCard title="Metadata" data={metadata} />
      </section>

      {/* Danger Zone (분리된 컴포넌트) */}
      <DangerZone
        confirmMode="none"
        onTransfer={() => setIsTransferModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Modals */}
      <TransferProjectForm
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirm={handleConfirmTransfer}
        currentProjectName={project.name}
        currentOrgName={org?.name}
        currentOrgId={org?.id}
        organizations={session?.user?.organizations || []}
      />
      <DeleteProjectForm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={project.name}
      />
    </div>
  );
}
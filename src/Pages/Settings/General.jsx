// src/Pages/Settings/General.jsx
import { Copy } from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import commonStyles from "./layout/SettingsCommon.module.css";
import styles from "./layout/General.module.css";

import TransferProjectForm from "./form/TransferProjectForm";
import DeleteProjectForm from "./form/DeleteProjectForm";

import { trpcMutation } from "./lib/trpc";
import { resolveOrgId, fetchSession } from "./lib/sessionOrg";
import { trpcTryManyMutation } from "./lib/trpcTryMany";
import { trpcTryManyQuery } from "./lib/trpcTryManyQuery";
import JsonDebugCard from "./form/JsonDebugCard";
import DangerZone from "./form/DangerZone";
import CreateProjectInline from "./CreateProjectInline";
import { useDispatch } from "react-redux";
import { setProject } from "../../state/currentProject.slice";

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

// project 단건 조회 후보들
const PROJECT_BY_ID_CANDIDATES = [
  "projects.byId",
  "project.byId",
  "projects.get",
  "project.get",
  "projects.detail",
];

export default function General() {
  const dispatch = useDispatch();
  const { projectId: routePid } = useParams();
  const navigate = useNavigate();

  const [effectivePid, setEffectivePid] = useState(routePid || null);

  const [showCreate, setShowCreate] = useState(false);
  const [project, setProjectState] = useState(null);
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

  // URL → localStorage → null
  useEffect(() => {
    if (!routePid) {
      try {
        const stored = localStorage.getItem("projectId");
        if (stored) setEffectivePid(stored);
        else setEffectivePid(null);
      } catch {
        setEffectivePid(null);
      }
    } else {
      setEffectivePid(routePid);
      try {
        localStorage.setItem("projectId", routePid);
      } catch {}
    }
  }, [routePid]);

  // 초기 로드 + effectivePid 변화
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!effectivePid) {
          setProjectState(null);
          setOrg(null);
          setError("URL/스토리지에서 projectId를 찾지 못했습니다.");
          return;
        }

        const s = await fetchSession();
        setSession(s);

        const orgs = Array.isArray(s?.user?.organizations) ? s.user.organizations : [];
        const allProjects = orgs.flatMap((o) =>
          Array.isArray(o.projects) ? o.projects : []
        );

        // 1) 세션에서 먼저 찾기
        let foundProj = allProjects.find((p) => p.id === effectivePid) || null;

        // 2) 단건 조회 폴백
        if (!foundProj) {
          try {
            const p = await trpcTryManyQuery(PROJECT_BY_ID_CANDIDATES, { projectId: effectivePid });
            if (p && p.id === effectivePid) {
              foundProj = { id: p.id, name: p.name || "(no name)", ...p };
            } else {
              throw new Error("Project not found from API");
            }
          } catch (e) {
            setProjectState(null);
            setOrg(null);
            setError("해당 프로젝트를 찾을 수 없습니다.");
            return;
          }
        }

        setProjectState(foundProj);
        setProjectNameInput(foundProj.name || "");
        // 전역 라벨 보정
        dispatch(setProject({ id: foundProj.id, name: foundProj.name || null }));

        // org 매칭
        let resolvedOrgId = null;
        try {
          resolvedOrgId = await resolveOrgId(foundProj.id);
        } catch {}

        const byPayloadOrg =
          (foundProj.organizationId && orgs.find((o) => o.id === foundProj.organizationId)) || null;

        const foundOrg =
          byPayloadOrg ||
          orgs.find((o) => o.id === resolvedOrgId) ||
          orgs.find((o) => (o.projects || []).some((p) => p.id === foundProj.id)) ||
          null;

        setOrg(foundOrg);

        // orgId 저장
        try {
          if (foundOrg?.id) localStorage.setItem("orgId", foundOrg.id);
        } catch {}
      } catch (e) {
        setError(e?.message || "프로젝트 로드 실패");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [effectivePid, dispatch]);

  // 이름 변경
  const handleSave = useCallback(async () => {
    if (!project) return;
    const newName = projectNameInput.trim();
    if (!newName || newName === project.name) return;
    try {
      setSaving(true);
      await trpcMutation("projects.update", { projectId: project.id, newName });
      setProjectState((p) => (p ? { ...p, name: newName } : p));
      setIsPristine(true);
      alert("프로젝트 이름이 변경되었습니다.");
    } catch (e) {
      alert(`이름 변경 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [project, projectNameInput]);

  // ✅ 삭제 실행: 성공 후 남은 프로젝트 판단 → 라우팅
  const handleConfirmDelete = useCallback(async () => {
    if (!project) return;
    try {
      // 1) 서버 삭제
      await trpcTryManyMutation(DELETE_PROC_CANDIDATES, { projectId: project.id });

      // 2) 로컬 정리
      setIsDeleteModalOpen(false);
      try {
        const storedPid = localStorage.getItem("projectId");
        if (storedPid === project.id) localStorage.removeItem("projectId");
      } catch {}
      // 전역 라벨 초기화
      dispatch(setProject({ id: null, name: null }));

      // 3) 최신 세션 재조회 후 라우팅 결정
      const s = await fetchSession();
      const currentOrgId = org?.id || null;
      const updatedOrg = (s?.user?.organizations || []).find((o) => o.id === currentOrgId);

      // 방금 삭제된 프로젝트 제외한 목록
      const remaining = (updatedOrg?.projects || []).filter((p) => p.id !== project.id);

      if (!updatedOrg || remaining.length === 0) {
        // 🔹 남은 프로젝트가 없으면 인라인 생성 UI 표시
        setProjectState(null);
        setShowCreate(true);
        return;
      }

      // 🔹 남은 프로젝트 선택 화면으로 이동
      navigate(`/projects/select?orgId=${currentOrgId}`, {
        replace: true,
        state: { projects: remaining },
      });

      alert("프로젝트가 삭제되었습니다.");
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  }, [project, org, navigate, dispatch]);

  // 이전 실행 (참고: 삭제와 동일한 라우팅 로직 사용)
  const handleConfirmTransfer = useCallback(
    async (selectedOrgId) => {
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

        // 최신 세션 반영 후 현재 조직의 남은 프로젝트 판단
        const s = await fetchSession();
        const currentOrgId = org?.id || null;
        const updatedOrg = (s?.user?.organizations || []).find((o) => o.id === currentOrgId);
        const remaining = (updatedOrg?.projects || []).filter((p) => p.id !== project.id);

        if (!updatedOrg || remaining.length === 0) {
          setProjectState(null);
          setShowCreate(true);
          return;
        }

        navigate(`/projects/select?orgId=${currentOrgId}`, {
          replace: true,
          state: { projects: remaining },
        });
      } catch (e) {
        alert(`이전 실패: ${e.message}`);
      }
    },
    [project, org, navigate]
  );

  // 입력 UX
  const handleFocus = () => {
    if (isPristine) setProjectNameInput("");
  };
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
    !project ||
    saving ||
    projectNameInput.trim() === "" ||
    projectNameInput.trim() === project?.name;

  const metadata = useMemo(
    () => ({
      project: project ? { name: project.name, id: project.id } : null,
      org: org ? { name: org.name, id: org.id } : null,
    }),
    [project, org]
  );

  if (isLoading)
    return <div className={commonStyles.container}>Loading project data...</div>;
  if (error)
    return (
      <div className={commonStyles.container} style={{ color: "#ef4444" }}>
        Error: {error}
      </div>
    );

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
        <p className={commonStyles.p}>
          When connecting to Langfuse, use this hostname / baseurl.
        </p>
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
              navigator.clipboard.writeText(
                import.meta.env.VITE_LANGFUSE_BASE_URL || "Not Set"
              );
              alert("Host Name이 클립보드에 복사되었습니다!");
            }}
            className={commonStyles.input}
            title="Copy Host Name"
            style={{
              width: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 0,
            }}
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
            Your Project will be renamed from "{project.name}" to "
            {projectNameInput}".
          </p>
        ) : (
          <p className={commonStyles.p}>
            Your Project is currently '{project.name}'.
          </p>
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

      {/* Danger Zone */}
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
        title="Delete this project?"
        message={`정말 프로젝트 "${project.name}"를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        currentProjectName={project.name}
        currentOrgName={org?.name}
        currentOrgId={org?.id}
        organizations={session?.user?.organizations || []}
      />
    </div>
  );
}

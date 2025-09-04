import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import commonStyles from "./layout/SettingsCommon.module.css";
import { trpcMutation } from "./lib/trpc"; // tRPC 래퍼 사용 :contentReference[oaicite:0]{index=0}
import { trpcTryManyMutation } from "./lib/trpcTryMany";
import { fetchSession } from "./lib/sessionOrg";


/**
 * Settings 내부에서 쓰는 "New Project" 인라인 카드.
 * props:
 *  - orgId: string (필수)  → 어떤 조직에 만들지
 *  - defaultName?: string  → 기본 값, 없으면 'my-llm-project'
 *  - onCreated?: (created) => void  → 성공 후 후처리(선택)
 *  - goNext?: 'setup-tracing' | 'project' | null
 *      - 'setup-tracing' (기본): 셋업 트레이싱 단계로 이동
 *      - 'project'        : 새 프로젝트의 기본 페이지로 이동
 *      - null             : 라우팅 안 하고 onCreated만 호출
 */
export default function CreateProjectInline({
  orgId,
  defaultName = "my-llm-project",
  onCreated,
  goNext = "setup-tracing",
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  const [stepOrgDone, setStepOrgDone] = useState(false);
  const [stepInviteDone, setStepInviteDone] = useState(false);

  useEffect(() => {
   (async () => {
     // 1) 세션에서 org 존재 여부 확인 → Step 1
     const s = await fetchSession(); // /api/auth/session
     const orgs = (s?.user?.organizations || []);
     const org = orgs.find(o => o.id === orgId);
     setStepOrgDone(!!orgId && !!org); // org가 보이면 완료

     // 2) 멤버/초대 수 파악 → Step 2
     // 서버 구현이 다를 수 있어 tRPC 절차명을 후보로 시도
     const MEMBER_PROCS = [
       "organizations.listMembers",
       "organization.listMembers",
       "organizations.members",
       "organization.members",
     ];
     const INVITE_PROCS = [
       "organizations.listInvites",
       "organization.listInvites",
       "organizations.invites",
       "organization.invites",
     ];

     let members = null, invites = null;
     try {
       members = await trpcTryManyMutation(MEMBER_PROCS, { organizationId: orgId });
     } catch {}
     try {
       invites = await trpcTryManyMutation(INVITE_PROCS, { organizationId: orgId });
     } catch {}

     // members 형식은 서버마다 다를 수 있어 보수적으로 길이 추정
     const memberCount = Array.isArray(members) ? members.length
                        : (typeof members === "object" && typeof members?.count === "number") ? members.count
                        : (Array.isArray(members?.users) ? members.users.length : null);
     const inviteCount = Array.isArray(invites) ? invites.length
                        : (typeof invites === "object" && typeof invites?.count === "number") ? invites.count
                        : (Array.isArray(invites?.items) ? invites.items.length : 0);

     // 멤버 2명 이상(나 + 1) 또는 초대 1건 이상이면 완료
     if ((memberCount !== null && memberCount >= 2) || (inviteCount && inviteCount > 0)) {
       setStepInviteDone(true);
       return;
     }

     // tRPC가 없거나 실패했으면 세션으로 추정(멤버 필드가 있다면)
     const roughMembers = Array.isArray(org?.members) ? org.members.length : null;
     setStepInviteDone(roughMembers !== null ? roughMembers >= 2 : false);
   })();
 }, [orgId]);



  useEffect(() => { inputRef.current?.focus(); }, []);

  const create = useCallback(async () => {
    if (!name.trim()) {
      setErr("프로젝트 이름을 입력해주세요.");
      inputRef.current?.focus();
      return;
    }
    if (!orgId) {
      setErr("조직 정보가 없습니다.");
      return;
    }

    try {
      setErr("");
      setLoading(true);
      // 서버는 { id, name, role } 또는 null을 반환할 수 있음(성공 시 null도 정상) :contentReference[oaicite:1]{index=1}
      const created = await trpcMutation("projects.create", {
        name: name.trim(),
        organizationId: orgId,
        orgId,
      });

      onCreated?.(created || null);

      // 성공 후 설정 페이지로 이동 (id 없을 때도 커버)
      let newId = created?.id;
      if (!newId) {
        // 일부 서버는 create 응답에 id를 안 넣는 경우가 있어 세션으로 추정
        try {
          const s = await fetchSession();
          const org = (s?.user?.organizations || []).find(o => o.id === orgId);
          // 가장 최근 생성처럼 보이는 걸 추정(이름 일치 + 최근 정렬 등 필요시 보강)
          const byName = (org?.projects || []).filter(p => p.name === name.trim());
          newId = (byName[byName.length - 1] || org?.projects?.[org.projects.length - 1])?.id || null;
        } catch {}
      }

          if (goNext === "project" && newId) {
          // 새 projectId 저장
        try {
          localStorage.setItem("projectId", newId);
          if (orgId) localStorage.setItem("orgId", orgId);
        } catch {}

        // F5 효과: 전체 새로고침 → 최신 세션 반영된 상태에서 SettingsPage로 진입
        window.location.href = `/project/${newId}/settings`;  
      }

    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [name, orgId, onCreated, goNext, navigate]);

  const onKey = (e) => { if (e.key === "Enter") create(); };

  return (
    <div className={commonStyles.container}>
      <h3 className={commonStyles.title}>Setup</h3>

      <nav className={commonStyles.section} style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: stepOrgDone ? "#16a34a" : "#6b7280" }}>
        {stepOrgDone ? "✓" : "○"} 1. Create Organization
       </span>
        <span style={{ opacity: .6 }}>›</span>
        <span style={{ fontWeight: 600, color: stepInviteDone ? "#16a34a" : "#6b7280" }}>
        {stepInviteDone ? "✓" : "○"} 2. Invite Members
        </span>
        <span style={{ opacity: .6 }}>›</span>
        <span style={{ fontWeight: 700 }}>3. Create Project</span>
        <span style={{ opacity: .6 }}>›</span>
        <span style={{ opacity: .7 }}>4. Setup Tracing</span>
      </nav>

      <section className={commonStyles.section} style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>New Project</h2>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          Projects are used to group traces, datasets, evals and prompts. Multiple environments are best separated via tags within a project.
        </p>

        <label htmlFor="project-name" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Project name</label>
        <input
          id="project-name"
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          className={commonStyles.input}
          placeholder="Enter project name"
          disabled={loading}
        />

        {err && <p style={{ color: "#dc2626", marginTop: 8, fontSize: 13 }}>{err}</p>}

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={create}
            disabled={loading}
            className={commonStyles.button}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </section>
    </div>
  );
}

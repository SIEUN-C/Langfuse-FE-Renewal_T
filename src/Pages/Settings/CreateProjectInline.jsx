import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import commonStyles from "./layout/SettingsCommon.module.css";
import { trpcMutation } from "./lib/trpc"; // POST용 래퍼  :contentReference[oaicite:5]{index=5}
import { trpcTryManyQuery } from "./lib/trpcTryManyQuery"; // GET용 멀티 시도  :contentReference[oaicite:6]{index=6}
import { fetchSession } from "./lib/sessionOrg"; // 세션/조직 캐시  :contentReference[oaicite:7]{index=7}



/**
 * Settings 내부에서 쓰는 "New Project" 인라인 카드.
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

  // 멤버/초대 상태 로더(서버별 후보 절차명 + 파라미터 키 호환)
  const loadInviteState = useCallback(async () => {
    if (!orgId) return;

    // 1) 세션에서 org 존재 여부 확인 → Step 1
    const s = await fetchSession(); // /api/auth/session  :contentReference[oaicite:8]{index=8}
    const orgs = (s?.user?.organizations || []);
    const org = orgs.find((o) => o.id === orgId);
    setStepOrgDone(!!orgId && !!org);

    let members = null, invites = null;

    // members: { orgId } → 실패 시 { organizationId } 순차 시도
    try {
      members = await trpcTryManyQuery(
     ["members.allFromOrg", "organizations.listMembers", "organization.listMembers", "organizations.members", "organization.members"],
     { orgId, page: 0, limit: 50 }
   );
    } catch {
      try {
        members = await trpcTryManyQuery(
       ["members.allFromOrg", "organizations.listMembers", "organization.listMembers", "organizations.members", "organization.members"],
       { organizationId: orgId, page: 0, limit: 50 }
     );
      } catch {
        members = null;
      }
    }

    // invites: { orgId } → 실패 시 { organizationId } 순차 시도
    try {
      invites = await trpcTryManyQuery(INVITE_PROCS, { orgId, page: 0, limit: 50 });
    } catch {
      try {
        invites = await trpcTryManyQuery(INVITE_PROCS, { organizationId: orgId, page: 0, limit: 50 });
      } catch {
        invites = null;
      }
    }

    // 멤버 수 추정(서버 응답 다양성 대응)
    const memberCount =
      Array.isArray(members?.memberships) ? members.memberships.length :
      Array.isArray(members?.users)       ? members.users.length :
      Array.isArray(members)              ? members.length :
      typeof members?.count === "number"  ? members.count : null;

    // 초대 수 추정
    const inviteCount =
      Array.isArray(invites?.items)       ? invites.items.length :
      Array.isArray(invites)              ? invites.length :
      typeof invites?.count === "number"  ? invites.count : 0;

    // 멤버 2명 이상(나 + 1) 또는 초대 1건 이상이면 완료
    if ((memberCount !== null && memberCount >= 2) || (inviteCount && inviteCount > 0)) {
      setStepInviteDone(true);
      return true;
    }

    // tRPC가 없거나 실패했으면 세션으로 추정(멤버 필드가 있다면)
    const roughMembers = Array.isArray(org?.members) ? org.members.length : null;
    setStepInviteDone(roughMembers !== null ? roughMembers >= 2 : false);
    return false;
  }, [orgId]);

  // 최초 1회 + 포커스/가시성 변화 시 재검사 + 짧은 폴링(최대 60초)
  useEffect(() => {
    let stopped = false;
    let timer = null;

    const refresh = async () => {
      const done = await loadInviteState();
      if (done) {
        if (timer) clearInterval(timer);
        timer = null;
      }
    };

    // 즉시 1회
    refresh();

    // 탭 포커스/가시성 복귀 시 재검사
    const onFocus = () => refresh();
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    // 짧은 폴링: 5초 간격, 최대 12번(=60초)
    let count = 0;
    timer = setInterval(async () => {
      if (stopped) return;
      count += 1;
      if (count > 12) { clearInterval(timer); return; }
      await refresh();
    }, 5000);

    return () => {
      stopped = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      if (timer) clearInterval(timer);
    };
  }, [loadInviteState]);

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
      // 프로젝트 생성은 POST(tRPC mutation)  :contentReference[oaicite:9]{index=9}
      const created = await trpcMutation("projects.create", {
        name: name.trim(),
        organizationId: orgId,
        orgId,
      });

      onCreated?.(created || null);

      // 성공 후 설정 페이지로 이동 (id 없을 때도 커버)
      let newId = created?.id;
      if (!newId) {
        try {
          const s = await fetchSession();
          const org = (s?.user?.organizations || []).find(o => o.id === orgId);
          const byName = (org?.projects || []).filter(p => p.name === name.trim());
          newId = (byName[byName.length - 1] || org?.projects?.[org.projects.length - 1])?.id || null;
        } catch {}
      }

      if (goNext === "project" && newId) {
        try {
          localStorage.setItem("projectId", newId);
          if (orgId) localStorage.setItem("orgId", orgId);
        } catch {}
        window.location.href = `/project/${newId}/setup?openKeyModal=1`;
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

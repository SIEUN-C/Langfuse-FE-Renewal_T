// src/Pages/Settings/SetupInviteMembers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Send, X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import commonStyles from "./layout/SettingsCommon.module.css";
import { trpcTryManyMutation } from "./lib/trpcTryMany";
import { trpcTryManyQuery } from "./lib/trpcTryManyQuery";
import { fetchSession } from "./lib/sessionOrg";

/** /organization/:orgId/setup 패턴에서 orgId 추출 */
function getOrgIdFromPath() {
  try {
    const m = window.location.pathname.match(/\/organization\/([^/]+)\/setup/i);
    return m?.[1] || "";
  } catch {
    return "";
  }
}

/** 역할별 초대 권한 체크 */
function getAvailableInviteRoles(currentUserRole) {
  const roleHierarchy = {
    OWNER: ["OWNER", "ADMIN", "MEMBER", "VIEWER", "NONE"],
    ADMIN: ["ADMIN", "MEMBER", "VIEWER", "NONE"],
    MEMBER: ["MEMBER", "VIEWER", "NONE"],
    VIEWER: ["VIEWER", "NONE"],
    NONE: ["NONE"],
  };

  return roleHierarchy[currentUserRole] || ["MEMBER"];
}

/** RoleSelect 컴포넌트 */
function RoleSelect({ value, onChange, currentUserRole = "MEMBER", disabled = false }) {
  const availableRoles = getAvailableInviteRoles(currentUserRole);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={commonStyles.input}
      style={{
        width: 200,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {availableRoles.map((role) => (
        <option key={role} value={role}>
          {role.charAt(0) + role.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}

/** 프레젠테이션 전용 모달(훅 없음; 경고 방지) */
function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 8, 23, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#0b1220",
          border: "1px solid #334155",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderBottom: "1px solid #1f2937",
          }}
        >
          <h4 className={commonStyles.title} style={{ fontSize: 18, margin: 0 }}>
            {title}
          </h4>
          <button
            className={commonStyles.button}
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

export default function SetupInviteMembers() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // orgId 해석: 경로 → 쿼리 → localStorage
  const pathOrgId = getOrgIdFromPath();
  const queryOrgId = params.get("orgId") || "";
  const storedOrgId = (() => {
    try {
      return localStorage.getItem("orgId") || "";
    } catch {
      return "";
    }
  })();
  const resolvedOrgId = pathOrgId || queryOrgId || storedOrgId || "";

  // 세션/조직
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  useEffect(() => {
    (async () => {
      setLoadingSession(true);
      const s = await fetchSession();
      setSession(s || null);
      setLoadingSession(false);
    })();
  }, []);
  const me = session?.user || {};
  const org = useMemo(
    () => (session?.user?.organizations || []).find((o) => o.id === resolvedOrgId) || null,
    [session, resolvedOrgId]
  );
  const firstProjectId = org?.projects?.[0]?.id || null;

  // 현재 사용자의 조직 내 역할 확인
  const myOrgRole = useMemo(() => {
    if (!org || !me?.id) return "MEMBER";
    const membership = org.memberships?.find((m) => m.userId === me.id);
    return membership?.role || "OWNER";
  }, [org, me]);

  // ----- 통합 목록 상태(멤버 + 초대) -----
  const [memberships, setMemberships] = useState([]); // 서버 멤버
  const [pendingInvites, setPendingInvites] = useState([]); // 초대(대기)
  const [loadingList, setLoadingList] = useState(false);

  // 멤버와 초대 데이터를 하나의 테이블용 데이터로 합치기 (본인 제외)
  const combinedTableData = useMemo(() => {
    const activeMembers = memberships
      .filter((m) => m?.user?.email && m?.user?.email !== me?.email)
      .map((m) => {
        const membershipId = m.membershipId || m.id;
        return {
          id: membershipId, // row id는 membership id로 고정
          type: "member",
          name: m?.user?.name || "—",
          email: m?.user?.email || "—",
          role: (m?.role || m?.orgRole || "MEMBER").toString().toUpperCase(),
          status: "Active",
          isMe: false,
          user: m?.user,
          originalData: m,
        };
      });

    const invitedMembers = pendingInvites.map((inv) => ({
      id: inv.id,
      type: "invite",
      name: inv?.name || "—",
      email: inv?.email || "—",
      role: (inv?.orgRole || inv?.organizationRole || "MEMBER").toString().toUpperCase(),
      status: "Invited",
      isMe: false,
      invitedOn: inv?.invitedOn,
      invitedBy: inv?.invitedByName || inv?.invitedBy || "—",
      originalData: inv,
    }));

    return [...activeMembers, ...invitedMembers];
  }, [memberships, pendingInvites, me]);

  async function loadMembers() {
    const orgId = resolvedOrgId || org?.id || "";
    if (!orgId) return;
    setLoadingList(true);
    try {
      // 1) 멤버 목록
      const memberCandidates = ["members.allFromOrg", "organizations.listMembers", "organization.members"];
      const m = await trpcTryManyQuery(memberCandidates, { orgId, page: 0, limit: 50 });

      const list =
        Array.isArray(m?.memberships) ? m.memberships :
        Array.isArray(m?.data) ? m.data :
        Array.isArray(m?.items) ? m.items :
        Array.isArray(m) ? m : [];

      // membershipId 보강
      const normalized = list.map((mm) => ({
        ...mm,
        membershipId: mm.membershipId || mm.id,
      }));
      setMemberships(normalized);

      // 2) 초대 목록
      try {
        const inviteCandidates = ["members.allInvitesFromOrg", "invites.allFromOrg", "organizations.listInvites"];
        const inv = await trpcTryManyQuery(inviteCandidates, { orgId, page: 0, limit: 50 });

        const items =
          inv?.invitations ||
          inv?.data?.json?.invitations ||
          inv?.items ||
          inv?.data ||
          (Array.isArray(inv) ? inv : []);

        const formattedInvites = Array.isArray(items)
          ? items.map((invite) => ({
              id: invite.id,
              email: invite.email,
              orgRole: invite.orgRole,
              organizationRole: invite.orgRole,
              status: "PENDING",
              invitedOn: invite.createdAt,
              invitedByUser: invite.invitedByUser,
              invitedByName: invite.invitedByUser?.name || "—",
              originalData: invite,
            }))
          : [];

        setPendingInvites(formattedInvites);
      } catch (inviteError) {
        console.error("초대 목록 로드 실패:", inviteError);
        setPendingInvites([]);
      }
    } catch (error) {
      console.error("멤버 로드 전체 실패:", error);
    } finally {
      setLoadingList(false);
    }
  }

  // 초기 로드 & orgId/세션 변동 시 재로드
  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedOrgId, !!session]);

  // ----- "+ Add new member" → 모달 초대 -----
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER"); // MEMBER | OWNER | ADMIN | VIEWER | NONE
  const [inviting, setInviting] = useState(false);
  const emailRef = useRef(null);
  useEffect(() => {
    if (inviteOpen) emailRef.current?.focus();
  }, [inviteOpen]);

  // ESC로 모달 닫기
  useEffect(() => {
    if (!inviteOpen) return;
    const onKey = (e) => e.key === "Escape" && setInviteOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inviteOpen]);

  const onClickAddMember = () => {
    if (firstProjectId) {
      navigate(`/project/${firstProjectId}/settings/members`);
    } else {
      setInviteOpen(true);
    }
  };

  async function sendInvite(e) {
    e?.preventDefault?.();
    if (inviting) return;

    const orgId = resolvedOrgId || org?.id || "";
    if (!orgId) {
      alert("조직 ID를 찾을 수 없어요. 다시 시도해 주세요.");
      return;
    }
    const email = inviteEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      alert("이메일 형식이 올바르지 않아요.");
      return;
    }

    // 권한 체크
    const availableRoles = getAvailableInviteRoles(myOrgRole);
    if (!availableRoles.includes(inviteRole)) {
      alert(`${inviteRole} 역할로 초대할 권한이 없습니다. 다른 역할을 선택해 주세요.`);
      return;
    }

    setInviting(true);
    try {
      const candidates = [
        "members.create",
        "organizations.inviteMember",
        "organization.invites.create",
        "organizations.addMemberByEmail",
      ];

      let finalRole = inviteRole;
      let inviteSuccess = false;
      let lastError = null;

      try {
        await trpcTryManyMutation(candidates, { orgId, email, orgRole: inviteRole });
        inviteSuccess = true;
      } catch (err) {
        lastError = err;
        if (inviteRole !== "MEMBER" && availableRoles.includes("MEMBER")) {
          try {
            await trpcTryManyMutation(candidates, { orgId, email, orgRole: "MEMBER" });
            finalRole = "MEMBER";
            inviteSuccess = true;
            alert(`${inviteRole} 권한으로 초대할 수 없어 MEMBER로 초대했습니다.`);
          } catch (fallbackErr) {
            console.error("MEMBER 폴백도 실패:", fallbackErr);
            lastError = fallbackErr;
          }
        }
      }

      if (!inviteSuccess) {
        throw lastError || new Error("초대 처리 중 알 수 없는 오류가 발생했습니다.");
      }

      // 낙관적 업데이트
      setPendingInvites((cur) => [
        {
          id: `local-${Date.now()}`,
          email,
          orgRole: finalRole,
          organizationRole: finalRole,
          status: "PENDING",
          invitedOn: new Date().toISOString(),
          invitedByName: me?.name || me?.email || "—",
        },
        ...cur,
      ]);

      if (finalRole === inviteRole) {
        alert("초대 메일을 보냈어요!");
      }
      setInviteEmail("");
      setInviteOpen(false);

      setTimeout(() => {
        loadMembers();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert(`초대에 실패했어요: ${err?.message || "Unknown error"}`);
    } finally {
      setInviting(false);
    }
  }

  // 역할 업데이트 함수 (멤버십 기준)
  async function updateMemberRole(memberId, newRole) {
    const orgId = resolvedOrgId || org?.id || "";
    if (!orgId) return;

    const availableRoles = getAvailableInviteRoles(myOrgRole);
    if (!availableRoles.includes(newRole)) {
      alert(`${newRole} 역할로 변경할 권한이 없습니다.`);
      return;
    }

    try {
      const candidates = ["members.updateRole", "organizations.updateMemberRole", "organization.members.update"];

      await trpcTryManyMutation(candidates, {
        orgId,
        membershipId: memberId, // 핵심: membershipId 사용
        role: newRole,
        orgRole: newRole,
      });

      // 낙관적 업데이트
      setMemberships((cur) =>
        cur.map((m) => ((m.membershipId || m.id) === memberId ? { ...m, role: newRole, orgRole: newRole } : m))
      );

      loadMembers();
    } catch (err) {
      console.error(err);
      alert(`역할 변경에 실패했어요: ${err?.message || "Unknown error"}`);
    }
  }

  // 멤버 제거 함수 (membershipId 사용)
  async function removeMember(memberId) {
    const orgId = resolvedOrgId || org?.id || "";
    if (!orgId) {
      alert("조직 ID를 찾을 수 없어요.");
      return;
    }

    try {
      const input = { orgId, orgMembershipId: memberId };
      await trpcTryManyMutation(["members.deleteMembership"], input);

      setMemberships((cur) => cur.filter((m) => (m.membershipId || m.id) !== memberId));
      alert("멤버를 제거했습니다.");
      loadMembers();
    } catch (err) {
      console.error("멤버 제거 최종 오류:", err);
      alert(`멤버 제거에 실패했어요: ${err?.message || "Unknown error"}`);
    }
  }

  // 초대 취소 함수 (기존 로직 유지)
  async function cancelInvite(inviteId) {
    const orgId = resolvedOrgId || org?.id || "";
    if (!orgId) {
      alert("조직 ID를 찾을 수 없어요.");
      return;
    }

    try {
      const candidates = [
        "members.deleteInvite",
        "members.removeInvite",
        "members.cancelInvite",
        "invites.delete",
        "invites.cancel",
        "invites.remove",
        "organizations.cancelInvite",
        "organizations.deleteInvite",
        "organization.invites.cancel",
        "organization.invites.delete",
      ];

      const paramVariations = [
        { orgId, inviteId },
        { orgId, id: inviteId },
        { organizationId: orgId, inviteId },
        { organizationId: orgId, id: inviteId },
        { inviteId },
        { id: inviteId },
      ];

      let success = false;
      for (const params of paramVariations) {
        try {
          await trpcTryManyMutation(candidates, params);
          success = true;
          break;
        } catch {
          continue;
        }
      }

      if (!success) {
        setPendingInvites((cur) => cur.filter((inv) => inv.id !== inviteId));
        alert("초대를 취소했습니다. (로컬에서만 제거)");
        return;
      }

      setPendingInvites((cur) => cur.filter((inv) => inv.id !== inviteId));
      alert("초대를 취소했습니다.");
      loadMembers();
    } catch (err) {
      console.error("초대 취소 최종 오류:", err);
      alert(`초대 취소에 실패했어요: ${err?.message || "Unknown error"}`);
    }
  }

  // 스타일
  const steps = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#94a3b8",
    margin: "8px 0 14px",
  };
  const done = { color: "#93c5fd", fontWeight: 700 };
  const active = { fontWeight: 700, color: "#e2e8f0" };
  const chev = { opacity: 0.7 };
  const card = { background: "#0b1220", border: "1px solid #1f2937", borderRadius: 12, padding: 20 };

  if (loadingSession) {
    return (
      <div className={commonStyles.container} style={{ paddingTop: 16 }}>
        Loading...
      </div>
    );
  }

  return (
    <div className={commonStyles.container} style={{ paddingTop: 16 }}>
      <div style={steps}>
        <span style={done}>1. Create Organization ✓</span>
        <span style={chev}>›</span>
        <span style={active}>2. Invite Members</span>
        <span style={chev}>›</span>
        <span>3. Create Project</span>
        <span style={chev}>›</span>
        <span>4. Setup Tracing</span>
      </div>

      <div style={card}>
        <h3 className={commonStyles.title} style={{ margin: 0, fontSize: 22 }}>
          Organization Members
        </h3>
        <p className={commonStyles.description} style={{ marginTop: 6 }}>
          Invite members to your organization to collaborate on projects. You can always add more members later.
        </p>

        {/* 헤더 버튼들 */}
        <div style={{ display: "flex", gap: 8, margin: "12px 0 10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            className={commonStyles.button}
            style={{ background: "#0b1220", border: "1px solid #334155", color: "#e2e8f0" }}
          >
            Columns <span style={{ marginLeft: 6, opacity: 0.8 }}>5/5</span>
          </button>
          <button
            className={commonStyles.button}
            onClick={onClickAddMember}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            title={firstProjectId ? "Go to project members" : "Invite to organization"}
          >
            <Plus size={16} /> Add new member
          </button>
        </div>

        {/* 통합 테이블 */}
        <div style={{ overflowX: "auto", borderTop: "1px solid #1f2937" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Email", "Organization Role", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 8px",
                      borderBottom: "1px solid #1f2937",
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {combinedTableData.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 9999,
                          background: "#1f2937",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {String(item.name || item.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{item.email}</td>
                  <td style={{ padding: "12px 8px" }}>
                    {item.type === "member" ? (
                      <RoleSelect
                        value={item.role}
                        onChange={(newRole) => updateMemberRole(item.id, newRole)}
                        currentUserRole={myOrgRole}
                        disabled={false}
                      />
                    ) : (
                      <div
                        style={{
                          width: 160,
                          padding: "8px 10px",
                          border: "1px solid #334155",
                          borderRadius: 8,
                          background: "#0b1220",
                          color: "#e2e8f0",
                        }}
                      >
                        {item.role}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      color: item.status === "Active" ? "#94a3b8" : "#eab308",
                    }}
                  >
                    {item.status}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {item.type === "member" ? (
                      <button
                        title="Remove member"
                        onClick={() => {
                          if (confirm(`${item.name}을(를) 조직에서 제거하시겠습니까?`)) {
                            removeMember(item.id); // item.id === membershipId
                          }
                        }}
                        style={{
                          opacity: 1,
                          cursor: "pointer",
                          background: "transparent",
                          border: "1px solid #334155",
                          borderRadius: 8,
                          padding: 6,
                          color: "#e2e8f0",
                        }}
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <button
                        title="Cancel invitation"
                        onClick={() => {
                          if (confirm("이 초대를 취소하시겠습니까?")) {
                            cancelInvite(item.id);
                          }
                        }}
                        style={{
                          opacity: 1,
                          cursor: "pointer",
                          background: "transparent",
                          border: "1px solid #334155",
                          borderRadius: 8,
                          padding: 6,
                          color: "#e2e8f0",
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 하단 컨트롤 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 8px",
              borderTop: "1px solid #1f2937",
            }}
          >
            <div style={{ marginLeft: "auto" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>Rows per page</span>
              <select
                defaultValue="10"
                style={{
                  background: "#0b1220",
                  color: "#e2e8f0",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: "6px 8px",
                }}
              >
                {[10, 20, 30, 40, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              Page{" "}
              <input
                value="1"
                readOnly
                style={{
                  width: 40,
                  textAlign: "center",
                  background: "#0b1220",
                  color: "#e2e8f0",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  padding: "4px 6px",
                }}
              />{" "}
              of 1
            </div>
          </div>
          {loadingList && <div style={{ padding: "8px 0", color: "#94a3b8" }}>Refreshing…</div>}
        </div>
      </div>

      {/* Next */}
      <div style={{ marginTop: 16 }}>
        <button
          className={commonStyles.button}
          onClick={() =>
            navigate(
              `/settings/select-project?orgId=${encodeURIComponent(resolvedOrgId || org?.id || "")}&create=1`
            )
          }
          style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155" }}
        >
          Next
        </button>
      </div>

      {/* 초대 모달 */}
      <Modal open={!firstProjectId && inviteOpen} onClose={() => setInviteOpen(false)} title="Invite to Organization">
        <form onSubmit={sendInvite}>
          <label className={commonStyles.label} htmlFor="invite-email">
            Email
          </label>
          <input
            id="invite-email"
            ref={emailRef}
            type="email"
            required
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className={commonStyles.input}
          />

          <label className={commonStyles.label} htmlFor="invite-role">
            Role
          </label>
          <RoleSelect value={inviteRole} onChange={setInviteRole} currentUserRole={myOrgRole} disabled={false} />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={() => setInviteOpen(false)} className={commonStyles.button}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className={commonStyles.button}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Send size={16} /> {inviting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

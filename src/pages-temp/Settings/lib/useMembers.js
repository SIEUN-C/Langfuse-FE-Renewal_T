// src/Pages/Settings/lib/useMembers.js
import { useCallback, useEffect, useState } from "react";
import {
  listProjectMembers,
  inviteProjectMember,
  updateProjectMemberRole,
} from "./ProjectMembers";
import {
  listOrgMembers,
  inviteOrgMember,
  updateOrgMemberRole,
} from "./OrgMembers";
import { resolveOrgId } from "./sessionOrg";
import { removeMembershipUniversal } from "./removeMembership";

/**
 * 멤버 목록 훅
 * - 기본: project 라우터 사용
 * - 404 등 실패 시: org 라우터로 자동 폴백
 */
export default function useMembers(projectId) {
  const [route, setRoute] = useState("project"); // 'project' | 'org'
  const [orgId, setOrgId] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const page = meta.page;
  const limit = meta.limit;
  const search = ""; // 필요하면 상태로 승격

  // orgId 준비 (프로젝트 기준 조직 찾기)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!projectId) return;
        const id = await resolveOrgId(projectId);
        if (!cancelled) setOrgId(id);
      } catch (e) {
        // org가 전혀 없을 수도 있으므로 조용히 무시
        console.warn("resolveOrgId failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErr(null);

    // 1) 프로젝트 라우터 먼저 시도
    if (route === "project") {
      try {
        const res = await listProjectMembers(projectId, { page, limit, search });
        const list = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        setItems(list);
        setMeta({
          page: res?.page ?? page,
          limit: res?.limit ?? limit,
          totalItems: res?.totalItems ?? list.length,
          totalPages: res?.totalPages ?? Math.max(1, Math.ceil((res?.totalItems ?? list.length) / (res?.limit ?? limit))),
        });
        setLoading(false);
        return;
      } catch (e) {
        // 404면 org 라우터로 전환
        const msg = e?.message || "";
        const is404 = /404|Not Found/i.test(msg);
        if (!is404) {
          // 기타 에러는 그대로 노출
          setErr(msg || "Failed to load members");
          setLoading(false);
          return;
        }
        setRoute("org");
      }
    }

    // 2) 조직 라우터 폴백
    try {
      const oid = orgId || (await resolveOrgId(projectId));
      const res = await listOrgMembers(oid, { page, limit, search });
      const list = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      setItems(list);
      setMeta({
        page: res?.page ?? page,
        limit: res?.limit ?? limit,
        totalItems: res?.totalItems ?? list.length,
        totalPages: res?.totalPages ?? Math.max(1, Math.ceil((res?.totalItems ?? list.length) / (res?.limit ?? limit))),
      });
    } catch (e2) {
      setErr(e2?.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [projectId, orgId, route, page, limit]);

  useEffect(() => { reload(); }, [reload]);

  // 페이지/리밋 setter
  const setPage = useCallback((p) => setMeta((m) => ({ ...m, page: p })), []);
  const setLimit = useCallback((l) => setMeta((m) => ({ ...m, limit: l })), []);

  // 초대 (실제 초대 API 호출 + 404 폴백 + 리로드)
  const invite = useCallback(async ({ email, role }) => {
    if (!projectId) throw new Error("projectId not provided");

    // 낙관적 UI 반영
    const optimistic = {
      id: "temp-" + Math.random().toString(36).slice(2),
      name: email.split("@")[0],
      email,
      organizationRole: role,
      projectRole: null,
      memberSince: new Date().toISOString(),
    };
    const snapshot = items;
    setItems((prev) => [optimistic, ...prev]);

    try {
      if (route === "project") {
        try {
          await inviteProjectMember(projectId, { email, role });
        } catch (e) {
          const is404 = /404|Not Found/i.test(e?.message || "");
          if (!is404) throw e;
          const oid = orgId || (await resolveOrgId(projectId));
          await inviteOrgMember(oid, { email, role });
          setRoute("org");
        }
      } else {
        const oid = orgId || (await resolveOrgId(projectId));
        await inviteOrgMember(oid, { email, role });
      }
      await reload();
    } catch (e) {
      // 실패 시 롤백
      setItems(snapshot);
      throw e;
    }
  }, [projectId, orgId, route, items, reload]);

  // 역할변경 (프로젝트 → 404 시 조직으로 폴백)
  const updateRole = useCallback(async (memberId, role) => {
    if (!projectId) throw new Error("projectId not provided");
    const snapshot = items;
    setItems((prev) => prev.map((m) => (m.id === memberId ? { ...m, organizationRole: role } : m)));
    try {
      if (route === "project") {
        try {
          await updateProjectMemberRole(projectId, memberId, role);
        } catch (e) {
          const is404 = /404|Not Found/i.test(e?.message || "");
          if (!is404) throw e;
          const oid = orgId || (await resolveOrgId(projectId));
          await updateOrgMemberRole(oid, memberId, role);
          setRoute("org");
        }
      } else {
        const oid = orgId || (await resolveOrgId(projectId));
        await updateOrgMemberRole(oid, memberId, role);
      }
    } catch (e) {
      setItems(snapshot); // 롤백
      throw e;
    }
  }, [projectId, orgId, route, items]);

  // 삭제: 서버 표준 members.deleteMembership 1순위 + 폴백
  const remove = useCallback(async (memberId) => {
    if (!projectId) throw new Error("projectId not provided");
    const snapshot = items;
    setItems((prev) => prev.filter((m) => m.id !== memberId));
    try {
      const oid = orgId || (await resolveOrgId(projectId));
      await removeMembershipUniversal({
        membershipId: memberId, // 목록에서 내려오는 m.id가 "멤버십 ID"
        orgId: oid,
        projectId,
      });
    } catch (e) {
      setItems(snapshot); // 롤백
      throw e;
    }
  }, [projectId, orgId, items]);

  // 로컬 패치(서버 호출 없이 즉시 반영용)
  const patchLocal = useCallback((memberId, patch) => {
    setItems((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
  }, []);

  return {
    items,
    meta,
    loading,
    error: err,
    route,       // 디버깅용(현재 사용중인 라우터)
    setPage,
    setLimit,
    reload,
    invite,
    updateRole,
    remove,
    patchLocal,
  };
}

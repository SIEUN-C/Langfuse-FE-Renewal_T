// src/Pages/Settings/lib/useMembers.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listProjectMembers,
  inviteProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from "./ProjectMembers";
import {
  listOrgMembers,
  inviteOrgMember,
  updateOrgMemberRole,
  removeOrgMember,
} from "./OrgMembers";
import { resolveOrgId } from "./sessionOrg";

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
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        setItems(items);
        setMeta({
          page: res?.page ?? page,
          limit: res?.limit ?? limit,
          totalItems: res?.totalItems ?? items.length,
          totalPages: res?.totalPages ?? Math.max(1, Math.ceil((res?.totalItems ?? items.length) / (res?.limit ?? limit))),
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
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      setItems(items);
      setMeta({
        page: res?.page ?? page,
        limit: res?.limit ?? limit,
        totalItems: res?.totalItems ?? items.length,
        totalPages: res?.totalPages ?? Math.max(1, Math.ceil((res?.totalItems ?? items.length) / (res?.limit ?? limit))),
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

  // 낙관적 초대
  const invite = useCallback(async ({ email, role }) => {
    if (!projectId) throw new Error("projectId not provided");
    const optimistic = {
      id: "temp-" + Math.random().toString(36).slice(2),
      name: email.split("@")[0],
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    const snapshot = { items, meta };
    setItems((prev) => [optimistic, ...prev]);
 try {
   const res = await listProjectMembers(projectId, { page, limit, search });
   const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
   setItems(items);
   setMeta({
     page: res?.page ?? page,
     limit: res?.limit ?? limit,
     totalItems: res?.totalItems ?? items.length,
     totalPages: res?.totalPages ?? Math.max(1, Math.ceil((res?.totalItems ?? items.length) / (res?.limit ?? limit))),
   });
   setLoading(false);
   return;
 } catch (_ignore) {
   // 그냥 org로 바로 재시도
 }

  // 2) 조직 라우터 폴백
  try {
    const oid = orgId || (await resolveOrgId(projectId));
    const res = await listOrgMembers(oid, { page, limit, search });
    const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
    setItems(items);
    setMeta({
      page: res?.page ?? page,
      limit: res?.limit ?? limit,
      totalItems: res?.totalItems ?? items.length,
      totalPages: res?.totalPages ?? Math.max(1, Math.ceil((res?.totalItems ?? items.length) / (res?.limit ?? limit))),
    });
  } catch (e2) {
    setErr(e2?.message || "Failed to load members");
  } finally {
    setLoading(false);
  }
}, [projectId, orgId, page, limit, search]);

  // 낙관적 역할변경
  const updateRole = useCallback(async (memberId, role) => {
    if (!projectId) throw new Error("projectId not provided");
    const snapshot = items;
    setItems((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    try {
      if (route === "project") {
        await updateProjectMemberRole(projectId, memberId, role);
      } else {
        const oid = orgId || (await resolveOrgId(projectId));
        await updateOrgMemberRole(oid, memberId, role);
      }
    } catch (e) {
      setItems(snapshot); // 롤백
      throw e;
    }
  }, [projectId, orgId, route, items]);

  // 낙관적 삭제
  const remove = useCallback(async (memberId) => {
    if (!projectId) throw new Error("projectId not provided");
    const snapshot = items;
    setItems((prev) => prev.filter((m) => m.id !== memberId));
    try {
      if (route === "project") {
        await removeProjectMember(projectId, memberId);
      } else {
        const oid = orgId || (await resolveOrgId(projectId));
        await removeOrgMember(oid, memberId);
      }
    } catch (e) {
      setItems(snapshot); // 롤백
      throw e;
    }
  }, [projectId, orgId, route, items]);

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

import { useCallback, useEffect, useState } from "react";
import {
  listInvitesFromProject,
  listInvitesFromOrg,
  createInvite,
  cancelInvite as cancelInviteApi, // ✅ 추가
} from "./MemberInvites";
import { resolveOrgId } from "./sessionOrg";

export default function useMemberInvites(projectId) {
  const [route, setRoute] = useState("project");
  const [orgId, setOrgId] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      if (projectId) setOrgId(await resolveOrgId(projectId));
    })();
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const { page, limit } = meta;
    setLoading(true);
    setErr(null);

    try {
      if (route === "project") {
        try {
          const res = await listInvitesFromProject(projectId, { page, limit });
          setItems(res.items);
          // 메타만 깔끔히 저장
          setMeta((m) => ({
            ...m,
            page: res.page,
            limit: res.limit,
            totalItems: res.totalItems,
            totalPages: res.totalPages,
          }));
          setLoading(false);
          return;
        } catch (e) {
          // 404면 org 라우트로 폴백
          if (!/404|Not Found/i.test(e?.message || "")) {
            setErr(e?.message || "Failed to load invites");
            setLoading(false);
            return;
          }
          setRoute("org");
        }
      }

      // 조직 라우트
      const _ = orgId || (await resolveOrgId(projectId));
      const res = await listInvitesFromOrg(projectId, { page, limit });
      setItems(res.items);
      setMeta((m) => ({
        ...m,
        page: res.page,
        limit: res.limit,
        totalItems: res.totalItems,
        totalPages: res.totalPages,
      }));
    } catch (e2) {
      setErr(e2?.message || "Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [projectId, orgId, route, meta.page, meta.limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setPage = useCallback((p) => setMeta((m) => ({ ...m, page: p })), []);
  const setLimit = useCallback((l) => setMeta((m) => ({ ...m, limit: l })), []);

  const sendInvite = useCallback(
    async ({ email, orgRole, projectRole }) => {
      await createInvite(projectId, { email, orgRole, projectRole });
      await reload();
    },
    [projectId, reload],
  );

  /** ✅ 초대 취소 (낙관적 업데이트 + 실패 시 롤백) */
  const cancelInvite = useCallback(
    async (inviteId) => {
      if (!projectId) throw new Error("projectId not provided");
      const snapshot = items;
      // UI에서 먼저 제거
      setItems((prev) => prev.filter((it) => it.id !== inviteId));
      try {
        await cancelInviteApi(projectId, inviteId);
        await reload();
      } catch (e) {
        // 실패 시 롤백
        setItems(snapshot);
        throw e;
      }
    },
    [projectId, items, reload],
  );

  return {
    items,
    meta,
    loading,
    error: err,
    route,
    setPage,
    setLimit,
    reload,
    sendInvite,
    cancelInvite, // ✅ 화면에서 이걸 호출하세요!
  };
}

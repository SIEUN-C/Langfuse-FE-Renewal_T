// src/Pages/Settings/lib/useMemberInvites.js
import { useCallback, useEffect, useState } from "react";
import { listInvitesFromProject, listInvitesFromOrg, createInvite } from "./MemberInvites";
import { resolveOrgId } from "./sessionOrg";

export default function useMemberInvites(projectId) {
  const [route, setRoute] = useState("project");
  const [orgId, setOrgId] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => { if (projectId) setOrgId(await resolveOrgId(projectId)); })();
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const { page, limit } = meta;
    setLoading(true); setErr(null);
    try {
      if (route === "project") {
        try {
          const res = await listInvitesFromProject(projectId, { page, limit });
          setItems(res.items); setMeta(res);
          setLoading(false); return;
        } catch (e) {
          if (!/404|Not Found/i.test(e?.message || "")) { setErr(e?.message || "Failed to load invites"); setLoading(false); return; }
          setRoute("org");
        }
      }
      const oid = orgId || (await resolveOrgId(projectId));
      const res = await listInvitesFromOrg(projectId, { page, limit });
      setItems(res.items); setMeta(res);
    } catch (e2) {
      setErr(e2?.message || "Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [projectId, orgId, route, meta.page, meta.limit]);

  useEffect(() => { reload(); }, [reload]);

  const sendInvite = useCallback(async ({ email, orgRole, projectRole }) => {
    await createInvite(projectId, { email, orgRole, projectRole });
    await reload();
  }, [projectId, reload]);

  return { items, meta, loading, error: err, setPage: (p)=>setMeta(m=>({ ...m, page:p })), setLimit: (l)=>setMeta(m=>({ ...m, limit:l })), reload, sendInvite };
}

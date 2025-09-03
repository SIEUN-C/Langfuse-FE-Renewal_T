// src/Pages/Settings/lib/sessionOrg.js

export async function fetchSession() {
  try {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * projectId가 속한 조직을 우선으로 반환.
 * 없으면: 최근 사용 orgId → 프로젝트 보유 조직 → 첫 조직
 */
export async function resolveOrgId(projectId) {
  const s = await fetchSession();
  const orgs = (s && s.user && s.user.organizations) || [];

  // 1) projectId가 속한 조직
  if (projectId) {
    const hit = orgs.find(o =>
      (o.projects || []).some(p => p.id === projectId)
    );
    if (hit) {
      localStorage.setItem("orgId", hit.id);
      return hit.id;
    }
  }

  // 2) 최근 사용 orgId
  const last = localStorage.getItem("orgId");
  if (last && orgs.some(o => o.id === last)) return last;

  // 3) 프로젝트가 있는 조직
  const withProjects = orgs.find(o => (o.projects || []).length > 0);
  if (withProjects) {
    localStorage.setItem("orgId", withProjects.id);
    return withProjects.id;
  }

  // 4) 첫 조직
  if (orgs[0] && orgs[0].id) {
    localStorage.setItem("orgId", orgs[0].id);
    return orgs[0].id;
  }

  throw new Error("No organizations in session");
}

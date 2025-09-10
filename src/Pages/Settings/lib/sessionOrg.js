// src/Pages/Settings/lib/sessionOrg.js

export function pickSessionBase() {
  const base = import.meta.env.VITE_API_BASE || window.__API_BASE__;
  if (!base) return { base: "", absolute: false };
  try {
    // 상대경로('/api' 같은)면 그대로 사용하되 absolute=false
   if (base.startsWith("/")) {
     return { base, absolute: false };
   }
    const t = new URL(base);
    const here = window.location;
    const same =
      t.protocol === here.protocol &&
      t.hostname === here.hostname &&
      String(t.port || "") === String(here.port || "");
    return { base, absolute: !same };
  } catch {
    return { base: "", absolute: false };
  }
}
const { base: SESSION_BASE, absolute: SESSION_ABS } = pickSessionBase();
const toUrl = (p) => (SESSION_ABS ? `${SESSION_BASE}${p}` : p);

export async function fetchSession() {
  try {
    const res = await fetch(toUrl("/api/auth/session"), {
      credentials: "include",
      ...(SESSION_ABS ? { mode: "cors" } : {}),
    });
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

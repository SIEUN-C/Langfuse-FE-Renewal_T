// src/components/PageHeader/PageHeader.jsx
// ⬇️ 변경된 부분들만 반영한 전체 파일 (교체)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanelLeft, ChevronDown, Info, Settings, Plus, Users, Search } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./PageHeader.module.css";
import ProjectSwitcher from "./ProjectSwitcher";
import { useDispatch, useSelector } from "react-redux";
import { setOrganization } from "../../state/currentOrg.slice";
import { setProject } from "../../state/currentProject.slice";

export default function PageHeader({
  orgName = "Organization",
  envBadge = "Hobby",
  title,
  onToggleSidebar,
  rightActions,
  flushLeft = false,
  sessionLoader,
}) {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [params] = useSearchParams();

  const [isOrgOpen, setOrgOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const orgMenuRef = useRef(null);

  const orgNameFromStore = useSelector((s) => s.currentOrg?.name);
  const orgIdFromStore = useSelector((s) => s.currentOrg?.id);
  const selectedProjectName = useSelector((s) => s.currentProject?.name);

  const isSetupPath = useMemo(() => location.pathname.startsWith("/setup"), [location.pathname]);
  const isSearchMode = useMemo(() => {
    try { return location.pathname === "/" && new URLSearchParams(location.search).has("search"); }
    catch { return false; }
  }, [location.pathname, location.search]);

  // 👉 조직 컨텍스트가 있는지(= orgId가 어디든 있는지) 판단
  const urlOrgId = params.get("orgId") || "";
  const hasOrgContext = useMemo(() => {
    if (urlOrgId || orgIdFromStore) return true;
    try { return !!localStorage.getItem("orgId"); } catch { return false; }
  }, [urlOrgId, orgIdFromStore]);

  // ✅ 최소 헤더는 “/?search” 또는 “/setup 이면서 아직 조직이 없을 때”만 적용
  const isMinimalHeader = isSearchMode || (isSetupPath && !hasOrgContext);

  const routePid = useMemo(() => {
    const m = location.pathname.match(/\/project\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [location.pathname]);

  useEffect(() => {
    const onDoc = (e) => {
      if (isOrgOpen && orgMenuRef.current && !orgMenuRef.current.contains(e.target)) setOrgOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isOrgOpen]);

  const ensureSession = async () => {
    if (session || !sessionLoader) return;
    try { setLoading(true); const s = await sessionLoader(); setSession(s); }
    finally { setLoading(false); }
  };

  const orgs = useMemo(() => session?.user?.organizations ?? [], [session]);

  const currentOrg = useMemo(() => {
    if (!orgs.length) return null;
    let lsOrgId = ""; try { lsOrgId = localStorage.getItem("orgId") || ""; } catch {}
    const wantedId = urlOrgId || orgIdFromStore || lsOrgId;
    if (wantedId) {
      const byId = orgs.find((o) => o.id === wantedId);
      if (byId) return byId;
    }
    const byName = orgs.find((o) => o.name === (orgNameFromStore || orgName));
    return byName || orgs[0] || null;
  }, [orgs, urlOrgId, orgIdFromStore, orgNameFromStore, orgName]);

  const openOrgMenu = async () => { await ensureSession(); setOrgOpen((v) => !v); };

  const pickOrg = (orgId) => {
    setOrgOpen(false);
    const o = orgs.find((x) => x.id === orgId);
    if (o) {
      dispatch(setOrganization({ id: o.id, name: o.name }));
      try { localStorage.setItem("orgId", o.id); localStorage.setItem("orgName", o.name); } catch {}
    }
    setTimeout(() => nav(`/settings/select-project?orgId=${orgId}`), 0);
  };

  const goOrgSettings = (orgId) => {
    setOrgOpen(false);
    const o = orgs.find((x) => x.id === orgId);
    if (o) {
      dispatch(setOrganization({ id: o.id, name: o.name }));
      try { localStorage.setItem("orgId", o.id); localStorage.setItem("orgName", o.name); } catch {}
    }
    setTimeout(() => nav(`/org/${orgId}/settings`), 0);
  };

  const goNewOrganization = () => { setOrgOpen(false); setTimeout(() => nav(`/setup`), 0); };

  useEffect(() => {
    (async () => {
      if (!routePid || selectedProjectName) return;
      if (!session) await ensureSession();
      const allProjects = (session?.user?.organizations || []).flatMap(o => o.projects || []);
      const p = allProjects.find(x => x.id === routePid);
      if (p) {
        dispatch(setProject({ id: p.id, name: p.name || null }));
        try { localStorage.setItem("projectId", p.id); localStorage.setItem("projectName", p.name || ""); } catch {}
      }
    })();
  }, [routePid, selectedProjectName, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const isProjectSelectPage = location.pathname.startsWith("/settings/select-project");
  const firstProjectId =
    currentOrg && Array.isArray(currentOrg.projects) && currentOrg.projects.length
      ? currentOrg.projects[0].id : "";

  // 타이틀: /setup → “Setup”, /?search → “Organizations”
  const headerTitle = isSetupPath
    ? "Setup"
    : isSearchMode
    ? "Organizations"
    : (isMinimalHeader
        ? "Organization"
        : (isProjectSelectPage
            ? (currentOrg?.name || orgNameFromStore || orgName || "Organization")
            : title));

  return (
    <header className={`${styles.header} ${flushLeft ? styles.flush : ""}`}>
      {/* Top */}
      <div className={styles.topRow}>
        <div className={styles.rowInner}>
          <button className={styles.toggleButton} onClick={onToggleSidebar} aria-label="Toggle sidebar" title="Toggle sidebar">
            <PanelLeft size={18} />
          </button>

          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            {isMinimalHeader ? (
              <div className={styles.dropdownRoot}>
                <span className={styles.crumbBtn} style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 8px",background:"transparent",border:"none",color:"#93c5fd",borderRadius:"6px",fontSize:"14px",fontWeight:"500",cursor:"default"}}>
                  Organization
                </span>
              </div>
            ) : (
              <>
                <div className={styles.dropdownRoot} ref={orgMenuRef}>
                  <button type="button" className={styles.crumbBtn} onClick={openOrgMenu} style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 8px",background:"transparent",border:"none",color:"#93c5fd",borderRadius:"6px",cursor:"pointer",fontSize:"14px",fontWeight:"500"}}>
                    <span>{orgNameFromStore || currentOrg?.name || orgName}</span>
                    <ChevronDown size={14} />
                  </button>
                  {isOrgOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>Organizations</div>
                      <div className={styles.dropdownList}>
                        {loading && <div className={styles.dropdownItemMuted}>Loading…</div>}
                        {!loading && (session?.user?.organizations ?? []).map((o) => (
                          <div className={styles.dropdownRow} key={o.id}>
                            <button className={styles.dropdownItem} onClick={() => pickOrg(o.id)} title={o.name}>{o.name}</button>
                            <button className={styles.iconBtn} onClick={() => goOrgSettings(o.id)} title="Open organization settings" aria-label="Open organization settings">
                              <Settings size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className={styles.dropdownFooter}>
                        <button className={styles.footerBtn} onClick={goNewOrganization}>
                          <Plus size={16} /><span>New Organization</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isProjectSelectPage && (
                  <>
                    <span className={styles.separator} aria-hidden>/</span>
                    <ProjectSwitcher currentProjectId={routePid || null} />
                  </>
                )}
              </>
            )}
          </nav>

          <div className={styles.topRight}>
            {!isSearchMode && !isSetupPath && !isProjectSelectPage && rightActions}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottomRow}>
        <div className={styles.rowInner}>
          <h2 className={styles.pageTitle} title={typeof headerTitle === "string" ? headerTitle : undefined}>
            <span className={styles.titleText}>{headerTitle}</span>
            <span className={styles.infoDot} aria-hidden><Info size={14} /></span>
          </h2>

          {/* /?search 하단 우측: Search + New Organization */}
          <div className={styles.rightActions}>
            {isSearchMode ? (
              <div className={styles.searchActions}>
                <div className={styles.searchWrap}>
                  <Search size={16} className={styles.searchIcon} />
                  <input className={styles.searchInput} placeholder="Search projects" aria-label="Search projects" />
                </div>
                <button className={styles.primaryBtn} onClick={() => nav("/setup")}>
                  <Plus size={16} /><span>New Organization</span>
                </button>
              </div>
            ) : (
              !isMinimalHeader && isProjectSelectPage && currentOrg && (
                <>
                  <button className={styles.iconBtn} title="Organization settings" aria-label="Organization settings" onClick={() => nav(`/org/${currentOrg.id}/settings`)}>
                    <Settings size={16} />
                  </button>
                  <button className={styles.iconBtn} title="Members" aria-label="Members" disabled={!firstProjectId} onClick={() => firstProjectId && nav(`/project/${firstProjectId}/settings/members`)}>
                    <Users size={16} />
                  </button>
                  <button className={styles.primaryBtn} onClick={() => nav(`/settings/select-project?orgId=${currentOrg.id}&create=1`)}>
                    + New project
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// src/components/PageHeader/PageHeader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanelLeft, ChevronDown, Info, Settings, Plus, Users } from "lucide-react";
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

  // /setup 페이지 여부
  const isSetupPage = useMemo(() => location.pathname.startsWith("/setup"), [location.pathname]);

  // 하위 라우트여도 안전하게 projectId 추출
  const routePid = useMemo(() => {
    const m = location.pathname.match(/\/project\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [location.pathname]);

  const urlOrgId = params.get("orgId") || "";

  useEffect(() => {
    const onDoc = (e) => {
      if (isOrgOpen && orgMenuRef.current && !orgMenuRef.current.contains(e.target)) {
        setOrgOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isOrgOpen]);

  const ensureSession = async () => {
    if (session || !sessionLoader) return;
    try {
      setLoading(true);
      const s = await sessionLoader();
      setSession(s);
    } finally {
      setLoading(false);
    }
  };

  const orgs = useMemo(() => session?.user?.organizations ?? [], [session]);

  const currentOrg = useMemo(() => {
    if (!orgs.length) return null;

    // URL ?orgId → Redux → localStorage → name 순
    let lsOrgId = "";
    try { lsOrgId = localStorage.getItem("orgId") || ""; } catch {}
    const wantedId = urlOrgId || orgIdFromStore || lsOrgId;

    if (wantedId) {
      const byId = orgs.find((o) => o.id === wantedId);
      if (byId) return byId;
    }
    const byName = orgs.find((o) => o.name === (orgNameFromStore || orgName));
    return byName || orgs[0] || null;
  }, [orgs, urlOrgId, orgIdFromStore, orgNameFromStore, orgName]);

  const openOrgMenu = async () => {
    await ensureSession();
    setOrgOpen((v) => !v);
  };

  const pickOrg = (orgId) => {
    setOrgOpen(false);
    const o = orgs.find((x) => x.id === orgId);
    if (o) {
      dispatch(setOrganization({ id: o.id, name: o.name }));
      try {
        localStorage.setItem("orgId", o.id);
        localStorage.setItem("orgName", o.name);
      } catch {}
    }
    setTimeout(() => nav(`/settings/select-project?orgId=${orgId}`), 0);
  };

  const goOrgSettings = (orgId) => {
    setOrgOpen(false);
    const o = orgs.find((x) => x.id === orgId);
    if (o) {
      dispatch(setOrganization({ id: o.id, name: o.name }));
      try {
        localStorage.setItem("orgId", o.id);
        localStorage.setItem("orgName", o.name);
      } catch {}
    }
    setTimeout(() => nav(`/org/${orgId}/settings`), 0);
  };

  const goNewOrganization = () => {
    setOrgOpen(false);
    setTimeout(() => nav(`/settings/organizations/new`), 0);
  };

  // ✅ 세션이 준비되면 routePid 기준으로 프로젝트 이름 자동 보정
  useEffect(() => {
    (async () => {
      if (!routePid) return;
      if (selectedProjectName) return; // 이미 셋팅되어 있으면 패스
      if (!session) await ensureSession();
      const allProjects = (session?.user?.organizations || []).flatMap(o => o.projects || []);
      const p = allProjects.find(x => x.id === routePid);
      if (p) {
        dispatch(setProject({ id: p.id, name: p.name || null }));
        try {
          localStorage.setItem("projectId", p.id);
          localStorage.setItem("projectName", p.name || "");
        } catch {}
      }
    })();
  }, [routePid, selectedProjectName, session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SelectProjectPage 전용 헤더(타이틀 옆에 아이콘) ─────────────────
  const isProjectSelectPage = location.pathname.startsWith("/settings/select-project");
  const firstProjectId =
    currentOrg && Array.isArray(currentOrg.projects) && currentOrg.projects.length
      ? currentOrg.projects[0].id
      : "";

  // ✅ /setup에서는 항상 'Organization'만
  const headerTitle = isSetupPage
    ? "Organization"
    : (isProjectSelectPage
        ? (currentOrg?.name || orgNameFromStore || orgName || "Organization")
        : title);

  return (
    <header className={`${styles.header} ${flushLeft ? styles.flush : ""}`}>
      {/* Top strip */}
      <div className={styles.topRow}>
        <div className={styles.rowInner}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>

          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            {/* /setup에서는 그냥 텍스트만 */}
            {isSetupPage ? (
              <div className={styles.dropdownRoot}>
                <span
                  className={styles.crumbBtn}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#93c5fd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "default",
                  }}
                >
                  Organization
                </span>
              </div>
            ) : (
              <>
                {/* Organization switcher */}
                <div className={styles.dropdownRoot} ref={orgMenuRef}>
                  <button
                    type="button"
                    className={styles.crumbBtn}
                    onClick={openOrgMenu}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#93c5fd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    <span>{orgNameFromStore || orgName}</span>
                    <ChevronDown size={14} />
                  </button>

                  {isOrgOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>Organizations</div>
                      <div className={styles.dropdownList}>
                        {loading && <div className={styles.dropdownItemMuted}>Loading…</div>}
                        {!loading &&
                          orgs.map((o) => (
                            <div className={styles.dropdownRow} key={o.id}>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => pickOrg(o.id)}
                                title={o.name}
                              >
                                {o.name}
                              </button>
                              <button
                                className={styles.iconBtn}
                                onClick={() => goOrgSettings(o.id)}
                                title="Open organization settings"
                                aria-label="Open organization settings"
                              >
                                <Settings size={16} />
                              </button>
                            </div>
                          ))}
                      </div>
                      <div className={styles.dropdownFooter}>
                        <button className={styles.footerBtn} onClick={goNewOrganization}>
                          <Plus size={16} />
                          <span>New Organization</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ProjectSwitcher는 SelectProjectPage가 아닐 때만 표시 */}
                {!isProjectSelectPage && (
                  <>
                    <span className={styles.separator} aria-hidden>/</span>
                    {/* ✅ routePid를 확실하게 넘긴다 */}
                    <ProjectSwitcher currentProjectId={routePid || null} />
                  </>
                )}
              </>
            )}
          </nav>

          {/* top-right 영역: /setup에서는 숨김 */}
          <div className={styles.topRight}>
            {!isProjectSelectPage && !isSetupPage && rightActions}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className={styles.bottomRow}>
        <div className={styles.rowInner}>
          <h2
            className={styles.pageTitle}
            title={typeof headerTitle === "string" ? headerTitle : undefined}
          >
            <span className={styles.titleText}>{headerTitle}</span>
            <span className={styles.infoDot} aria-hidden>
              <Info size={14} />
            </span>
          </h2>

          {/* 오른쪽 액션: /setup에서는 숨김 */}
          <div className={styles.rightActions}>
            {!isSetupPage && isProjectSelectPage && currentOrg && (
              <>
                <button
                  className={styles.iconBtn}
                  title="Organization settings"
                  aria-label="Organization settings"
                  onClick={() => goOrgSettings(currentOrg.id)}
                >
                  <Settings size={16} />
                </button>
                <button
                  className={styles.iconBtn}
                  title="Members"
                  aria-label="Members"
                  disabled={!firstProjectId}
                  onClick={() => firstProjectId && nav(`/project/${firstProjectId}/settings/members`)}
                >
                  <Users size={16} />
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={() => nav(`/settings/select-project?orgId=${currentOrg.id}&create=1`)}
                >
                  + New project
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

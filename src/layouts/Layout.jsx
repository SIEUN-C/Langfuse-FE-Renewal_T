// src/layouts/Layout.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import { Outlet, NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  Activity,
  MessageCircleCode,
  FlaskConical,
  SquareStack,
  Lightbulb,
  Database,
  Settings,
  Search,
  ChevronDown,
} from "lucide-react";

import styles from "./Layout.module.css";
import PageHeader from "../components/PageHeader/PageHeader";

import useProjectId from "../hooks/useProjectId";
import useHeaderMeta from "../hooks/useHeaderMeta";
import { fetchSession } from "../Pages/Settings/lib/sessionOrg";

export default function Layout({ session }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ /setup 여부: 사이드바는 그대로, 메뉴만 숨김
  const isSetup = useMemo(
    () => location.pathname === "/setup" || location.pathname.startsWith("/setup"),
    [location.pathname]
  );

  // 현재 활성 프로젝트 ID (세션 검증 포함)
  const { projectId: activeProjectId } = useProjectId({
    location,
    validateAgainstSession: true,
  });

  // 헤더에 뿌릴 조직/프로젝트/배지
  const { orgName, projectName, envBadge } = useHeaderMeta(activeProjectId);

  const [headerConfig, setHeaderConfig] = useState({});

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);

  const user = session?.user || session || {};

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch("/api/auth/csrf");
        if (!res.ok) throw new Error("CSRF 토큰을 가져올 수 없습니다.");
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (e) {
        console.error("CSRF 토큰을 가져오는 중 오류 발생:", e);
      }
    };
    fetchCsrfToken();
  }, []);

  const handleSignOut = async () => {
    if (!csrfToken) {
      alert("로그아웃을 처리할 수 없습니다. 페이지를 새로고침 후 다시 시도해 주세요.");
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, json: "true" }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "알 수 없는 오류" }));
        alert(`로그아웃 실패: ${errorData.message}`);
      }
    } catch (error) {
      alert(`로그아웃 중 네트워크 오류가 발생했습니다. ${error.message}`);
    } finally {
      window.location.href = "/login";
    }
  };

 // Layout.jsx의 mainMenuSections 부분만 수정

const mainMenuSections = [
  {
    title: null,
    items: [
      { 
        label: "Home", 
        icon: <Home size={18} />, 
        path: activeProjectId ? `/project/${activeProjectId}` : "/home" 
      }
    ],
  },
  {
    title: "Dashboards",
    items: [
      { label: "Dashboards", icon: <LayoutDashboard size={18} />, path: "/dashboards" }
    ],
  },
  {
    title: "Observability",
    items: [
      { label: "Tracing", icon: <Activity size={18} />, path: "/trace" },
      { label: "Sessions", icon: <MessageCircleCode size={18} />, path: "/sessions" },
    ],
  },
  {
    title: "Prompt Management",
    items: [
      { label: "Prompts", icon: <FlaskConical size={18} />, path: "/prompts" },
      { label: "Playground", icon: <SquareStack size={18} />, path: "/playground" },
    ],
  },
  {
    title: "Evaluation",
    items: [
      { label: "LLM-as-a-Judge", icon: <Lightbulb size={18} />, path: "/llm-as-a-judge" },
      { label: "Datasets", icon: <Database size={18} />, path: "/datasets" },
    ],
  },
];

  const bottomMenu = [{ label: "Settings", icon: <Settings size={18} />, path: "/settings" }];

// Layout.jsx의 isPathActive 함수 최종 수정

const isPathActive = (path) => {
  const currentPath = location.pathname;
  
  // Home 경로는 정확히 일치할 때만 (하위 경로 제외)
  if (path.includes("/project/")) {
    return currentPath === path; // 정확히 일치할 때만
  }
  
  // 다른 페이지들은 포함 여부로 확인
  if (path === "/playground") {
    return currentPath.includes("/playground");
  }
  
  if (path === "/dashboards") {
    return currentPath.includes("/dashboards");
  }
  
  if (path === "/trace") {
    return currentPath.includes("/trace");
  }
  
  if (path === "/sessions") {
    return currentPath.includes("/sessions");
  }
  
  if (path === "/prompts") {
    return currentPath.includes("/prompts");
  }
  
  if (path === "/llm-as-a-judge") {
    return currentPath.includes("/llm-as-a-judge");
  }
  
  if (path === "/datasets") {
    return currentPath.includes("/datasets");
  }
  
  if (path === "/settings") {
    return currentPath.includes("/settings");
  }
  
  // 기본 매칭
  return !!matchPath({ path, end: path === "/" }, currentPath);
};

const navClass = (path) => () => {  // { isActive } 제거
  const finalIsActive = isPathActive(path);
  return `${styles.menuItem} ${finalIsActive ? styles.active : ""} ${collapsed ? styles.iconOnly : ""}`.trim();
};

  const sectionActive = (section) => section.items.some(({ path }) => isPathActive(path));

  // /project/:id/... 인 경우 공통 prefix 제거해서 라우트 매칭 통일
  const stripProjectPrefix = (p) => {
    const m = p.match(/^\/project\/[^/]+(\/.*)?$/);
    return m ? m[1] || "/" : p;
  };

  const pageTitle = useMemo(() => {
    const p = stripProjectPrefix(location.pathname);
    if (p === "/") return "Home";
    if (p.startsWith("/llm-as-a-judge")) return "LLM-as-a-Judge";
    if (p.startsWith("/datasets")) return "Datasets";
    if (p.startsWith("/scores")) return "Evaluators";
    if (p.startsWith("/dashboards/llm")) return "LLM Dashboard";
    if (p.startsWith("/prompts")) return "Prompts";
    if (p.startsWith("/playground")) return "Playground";
    if (p.startsWith("/trace")) return "Trace";
    if (p.startsWith("/sessions")) return "Sessions";
    if (p.startsWith("/settings")) return "Settings";
    return "Langfuse";
  }, [location.pathname]);

  const headerRightActionsDefault = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/datasets")) {
      return (
        <button
          type="button"
          className={`${styles.headerActionPrimary ?? ""}`.trim()}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/datasets?new=1")}
        >
          + New dataset
        </button>
      );
    }
    return null;
  }, [location.pathname, navigate]);

  // 헤더 우측 액션 최종 묶음
  const headerRightActionsCombined = headerConfig.rightActions ?? headerRightActionsDefault;

  return (
    <div className={styles.layout}>
      {/* ✅ 사이드바는 항상 표시 */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.header}>
          <div className={styles.logoArea}>
            <div className={styles.logoText}>{!collapsed && <span>Langfuse</span>}</div>
          </div>
          {!collapsed && <div className={styles.divider} />}
          {!collapsed && (
            <div className={styles.searchBox} role="search">
              <div className={styles.searchText}>
                <Search size={12} aria-hidden />
                <span>Go to...</span>
              </div>
              <span className={styles.hotkey}>Ctrl K</span>
            </div>
          )}
        </div>

        <div className={styles.menuWrapper}>
          {/* ✅ /setup에서는 메뉴 목록을 렌더링하지 않음 */}
          {!isSetup && (
            <ul className={styles.menu} role="menu" aria-label="Main navigation">
              {mainMenuSections.map((section, i) => (
                <li key={i}>
                  {section.title && !collapsed && (
                    <div
                      className={`${styles.sectionTitle} ${
                        sectionActive(section) ? styles.sectionTitleActive : ""
                      }`}
                    >
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      className={navClass(item.path)}
                      end={item.path === "/"}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      role="menuitem"
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                  {i < mainMenuSections.length - 1 && <div className={styles.sectionDivider}></div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {/* ✅ /setup에서는 하단 Settings 메뉴도 숨김, 로그인 정보(유저 메뉴)는 그대로 표시 */}
          {!isSetup && (
            <ul className={`${styles.menu} ${styles.bottomMenu}`} role="menu" aria-label="Secondary navigation">
              {bottomMenu.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={navClass(item.path)}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  role="menuitem"
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </ul>
          )}

          {/* 👇 로그인 정보(아바타/이메일/드롭다운)는 항상 표시 */}
          <div ref={userMenuRef} className={styles.userMenuContainer}>
            {isUserMenuOpen && !collapsed && (
              <div className={styles.userMenuPopover}>
                <div className={styles.popoverUserInfo}>
                  <div className={styles.popoverAvatar}>{user?.name?.charAt(0).toUpperCase()}</div>
                  <div className={styles.popoverUserText}>
                    <div className={styles.popoverUserName}>{user?.name}</div>
                    <div className={styles.popoverUserEmail}>{user?.email}</div>
                  </div>
                </div>
                <div className={styles.popoverSection}>
                  <button className={styles.signOutButton} onClick={handleSignOut}>
                    Sign out
                  </button>
                </div>
              </div>
            )}

            <div className={styles.userInfo} onClick={() => setIsUserMenuOpen((prev) => !prev)}>
              <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase()}</div>
              {!collapsed && (
                <>
                  <div className={styles.userText}>
                    <div className={styles.popoverUserName}>{user?.name}</div>
                    <div className={styles.popoverUserEmail}>{user?.email}</div>
                  </div>
                  <div className={styles.userMenuToggle}>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: isUserMenuOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 영역은 그대로 */}
      <main className={styles.mainContainer}>
        <PageHeader
          orgName={orgName}
          projectName={projectName}
          envBadge={envBadge}
          title={headerConfig.title ?? pageTitle}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          flushLeft
          // /setup에서는 우측 액션 숨김 (필요 시 노출 가능)
          rightActions={isSetup ? null : headerRightActionsCombined}
          sessionLoader={fetchSession}
          currentProjectId={activeProjectId}
        />
        <div className={styles.pageBody}>
          <Outlet context={{ setHeader: setHeaderConfig }} />
        </div>
      </main>
    </div>
  );
}

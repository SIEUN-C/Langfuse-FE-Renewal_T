// src/components/PageHeader/ProjectSwitcher.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSession } from "../../Pages/Settings/lib/sessionOrg";
import { Settings as SettingsIcon, ChevronDown, Plus, Check } from "lucide-react";
import styles from "./ProjectSwitcher.module.css";
import { useDispatch, useSelector } from "react-redux";
import { setProject } from "../../state/currentProject.slice";
import { setOrganization } from "../../state/currentOrg.slice";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

export default function ProjectSwitcher({ currentProjectId }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const dispatch = useDispatch();

  // 전역에 저장된 현재 프로젝트 이름 (Optimistic 라벨)
  const selectedName = useSelector((s) => s.currentProject.name);

  // 항상 settings/general로 이동
  const gotoProjectSettings = (pid, pname) => {
    if (!pid) return;
    setOpen(false);

    // 1) 즉시 전역 업데이트 → 라벨/화면 즉시 반영
    dispatch(setProject({ id: pid, name: pname ?? null }));

    // 2) 조직 전역 갱신 (클릭한 프로젝트가 속한 org로)
   let orgForPid = org;
   if (!orgForPid && session?.user?.organizations) {
     orgForPid = (session.user.organizations || []).find(o =>
       (o.projects || []).some(p => p.id === pid)
     ) || null;
   }
   if (orgForPid) {
     dispatch(setOrganization({ id: orgForPid.id, name: orgForPid.name }));
     try {
       localStorage.setItem("orgId", orgForPid.id);
       localStorage.setItem("orgName", orgForPid.name);
     } catch {}
   }

    // 라우팅 이동
    setTimeout(() => nav(`/project/${pid}/settings/general`), 0);
  };

  useEffect(() => {
    (async () => {
      const s = await fetchSession();
      setSession(s || null);
    })();
  }, []);

  // 세션에서 org/projects 만들기 + 폴백 로직
  const { org, projects, currentProject } = useMemo(() => {
    const orgs = session?.user?.organizations || [];
    const allProjects = orgs.flatMap((o) => Array.isArray(o.projects) ? o.projects : []);

    let foundOrg = null;

    // 1) currentProjectId가 포함된 org
    if (currentProjectId) {
      foundOrg = orgs.find((o) => (o.projects || []).some((p) => p.id === currentProjectId)) || null;
    }

    // 2) 없으면 localStorage orgId
    if (!foundOrg) {
      try {
        const lsOrgId = localStorage.getItem("orgId");
        if (lsOrgId) foundOrg = orgs.find((o) => o.id === lsOrgId) || null;
      } catch {}
    }

    // 3) 그래도 없으면 프로젝트가 있는 첫 조직
    if (!foundOrg) {
      foundOrg = orgs.find((o) => (o.projects || []).length > 0) || null;
    }

    // 기본 노출 리스트
    let list = [];
    if (foundOrg) list = Array.isArray(foundOrg.projects) ? foundOrg.projects : [];
    if (!list.length) list = allProjects;

    // 현재 프로젝트(리스트 기준으로 탐색)
    const cur = list.find((p) => p.id === currentProjectId) || null;

    return { org: foundOrg, projects: list, currentProject: cur };
  }, [session, currentProjectId]);

  // 오버레이 닫기(외부 클릭/ESC)
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (
        btnRef.current && !btnRef.current.contains(t) &&
        menuRef.current && !menuRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goNewProject = () => {
    setOpen(false);
    const orgId = org?.id || "";
    const target = orgId
      ? `/settings/select-project?orgId=${orgId}&create=1`
      : `/settings/select-project?create=1`;
    setTimeout(() => nav(target), 0);
  };

  // 라벨: 전역 이름 > 세션에서 찾은 현재 프로젝트 이름 > 기본
  const label = selectedName || currentProject?.name || "Projects";

  return (
    <div className={styles["ps-switcherWrap"]}>
      <button
        ref={btnRef}
        type="button"
        className={styles["ps-switcherButton"]}
        onClick={() => setOpen((v) => !v)}
        title="Switch Project"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="project-switcher-menu"
      >
        <span className={styles["ps-switcherLabel"]}>{label}</span>
        <ChevronDown size={16} className={styles["ps-switcherCaret"]} />
      </button>

      {open && (
        <div
          ref={menuRef}
          id="project-switcher-menu"
          className={styles["ps-switcherMenu"]}
          role="menu"
          aria-label="Project switcher"
        >
          <div className={styles["ps-switcherHeader"]}>Projects</div>

          <ul className={styles["ps-switcherList"]}>
            {projects?.length ? (
              projects.map((p) => {
                const isActive = p.id === currentProjectId;
                return (
                  <li
                    key={p.id}
                    className={cx(
                      styles["ps-switcherRow"],
                      isActive && styles["isActive"]
                    )}
                  >
                    <button
                      type="button"
                      className={styles["ps-switcherNameBtn"]}
                      onClick={() => gotoProjectSettings(p.id, p.name)}
                      title={p.name}
                      role="menuitem"
                      aria-current={isActive ? "true" : undefined}
                    >
                      {isActive && <Check size={16} className={styles["ps-activeIcon"]} />}
                      <span className={styles["ps-switcherNameText"]}>{p.name}</span>
                    </button>
                    <button
                      type="button"
                      className={styles["ps-switcherGear"]}
                      onClick={() => gotoProjectSettings(p.id, p.name)}
                      aria-label={`Open ${p.name} settings`}
                      title="Open project settings"
                    >
                      <SettingsIcon size={16} />
                    </button>
                  </li>
                );
              })
            ) : (
              <li className={styles["ps-switcherEmpty"]}>No projects</li>
            )}
          </ul>

          <button
            type="button"
            className={styles["ps-switcherCreate"]}
            onClick={goNewProject}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      )}
    </div>
  );
}

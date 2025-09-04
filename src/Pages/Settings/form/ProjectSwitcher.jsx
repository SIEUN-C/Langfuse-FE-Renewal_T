// src/Pages/Settings/form/ProjectSwitcher.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSession } from "../lib/sessionOrg";
import { Settings as SettingsIcon, ChevronDown } from "lucide-react";
import styles from "../layout/SettingsPage.module.css";

export default function ProjectSwitcher({ currentProjectId }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    (async () => {
      const s = await fetchSession();
      setSession(s || null);
    })();
  }, []);

  // 현재 프로젝트가 속한 조직/프로젝트 목록 찾기
  const { org, projects } = useMemo(() => {
    const orgs = session?.user?.organizations || [];
    let foundOrg = null;
    for (const o of orgs) {
      const ps = Array.isArray(o.projects) ? o.projects : [];
      if (ps.some((p) => p.id === currentProjectId)) {
        foundOrg = o;
        break;
      }
    }
    const list = foundOrg?.projects || [];
    return { org: foundOrg, projects: list };
  }, [session, currentProjectId]);

  // 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!btnRef.current) return;
      if (!btnRef.current.parentElement?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const goProjectSettings = (pid) => {
    setOpen(false);
    nav(`/project/${pid}/settings`);
  };

  const goNewProject = () => {
    setOpen(false);
    const orgId = org?.id || "";
    if (orgId) nav(`/projects/select?orgId=${orgId}`);
    else nav(`/projects/select`);
  };

  const label = org?.name || "Projects";

  return (
    <div className={styles.switcherWrap}>
      <button
        ref={btnRef}
        type="button"
        className={styles.switcherButton}
        onClick={() => setOpen((v) => !v)}
        title="Switch Project"
      >
        <span className={styles.switcherLabel}>{label}</span>
        <ChevronDown size={16} className={styles.switcherCaret} />
      </button>

      {open && (
        <div className={styles.switcherMenu}>
          <div className={styles.switcherHeader}>Projects</div>
          <ul className={styles.switcherList}>
            {projects.map((p) => (
              <li key={p.id} className={styles.switcherItem}>
                <button
                  className={styles.switcherItemMain}
                  onClick={() => goProjectSettings(p.id)}
                  title={p.name}
                >
                  <span className={styles.switcherItemName}>{p.name}</span>
                </button>
                <button
                  className={styles.switcherGear}
                  onClick={() => goProjectSettings(p.id)}
                  aria-label="Open project settings"
                  title="Open project settings"
                >
                  <SettingsIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
          <button className={styles.switcherNew} onClick={goNewProject}>
            + New Project
          </button>
        </div>
      )}
    </div>
  );
}

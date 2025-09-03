// src/layouts/SettingsSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./SettingsSidebar.module.css";

export default function SettingsSidebar({ projectId }) {
  const base = `/project/${projectId}/settings`;

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <NavLink to={base} end className={({ isActive }) => isActive ? styles.active : ""}>
          General
        </NavLink>
        <NavLink to={`${base}/api-keys`} className={({ isActive }) => isActive ? styles.active : ""}>
          API Keys
        </NavLink>
        <NavLink to={`${base}/llm-connections`} className={({ isActive }) => isActive ? styles.active : ""}>
          LLM Connections
        </NavLink>
        <NavLink to={`${base}/models`} className={({ isActive }) => isActive ? styles.active : ""}>
          Models
        </NavLink>
        <NavLink to={`${base}/scores`} className={({ isActive }) => isActive ? styles.active : ""}>
          Scores
        </NavLink>
        <NavLink to={`${base}/members`} className={({ isActive }) => isActive ? styles.active : ""}>
          Members
        </NavLink>
      </nav>
    </aside>
  );
}

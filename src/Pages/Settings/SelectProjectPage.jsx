// src/Pages/Settings/SelectProjectPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateProjectInline from "./CreateProjectInline";
import { fetchSession } from "./lib/sessionOrg";
import commonStyles from "./layout/SettingsCommon.module.css";

/**
 * 조직(orgId)에 속한 프로젝트를 선택하거나,
 * 없으면 새 프로젝트를 생성하도록 하는 페이지
 */
export default function SelectProjectPage() {
  const [params] = useSearchParams();
  const orgId = params.get("orgId") || "";
  const nav = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await fetchSession();
      setSession(s);
      setLoading(false);
    })();
  }, []);

  // 현재 org 찾기
  const org = useMemo(() => {
    const orgs = session?.user?.organizations || [];
    return orgs.find((o) => o.id === orgId) || null;
  }, [session, orgId]);

  const projects = useMemo(() => org?.projects || [], [org]);

  if (loading) {
    return <div className={commonStyles.container}>Loading...</div>;
  }

  // 프로젝트가 없으면 CreateProjectInline을 바로 보여줌
  if (!org || projects.length === 0) {
    return (
      <div className={commonStyles.container}>
        <h2 className={commonStyles.title}>Create a new project</h2>
        <CreateProjectInline
          orgId={orgId}
          defaultName="my-llm-project"
          goNext="project"
        />
      </div>
    );
  }

  // 프로젝트가 있으면 선택 리스트
  return (
    <div className={commonStyles.container}>
      <h2 className={commonStyles.title}>Select a project</h2>
      <ul style={{ display: "grid", gap: 8, maxWidth: 560 }}>
        {projects.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => nav(`/project/${p.id}/settings`)}
              className={commonStyles.button}
              style={{ width: "100%", textAlign: "left" }}
            >
              {p.name} <span style={{ opacity: 0.6 }}>({p.id})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// src/Pages/Settings/SelectProjectPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateProjectInline from "./CreateProjectInline";
import { fetchSession } from "./lib/sessionOrg";
import commonStyles from "./layout/SettingsCommon.module.css";
import { Settings as GearIcon, Users } from "lucide-react";

import { useDispatch } from "react-redux";
import { setProject } from "../../state/currentProject.slice";
import { setOrganization } from "../../state/currentOrg.slice";

export default function SelectProjectPage() {
  const [params] = useSearchParams();
  const orgId = params.get("orgId") || "";
  const forceCreate = params.get("create") === "1";
  const nav = useNavigate();
  const dispatch = useDispatch();

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

  const orgs = useMemo(() => session?.user?.organizations || [], [session]);
  const org = useMemo(() => (orgId ? orgs.find((o) => o.id === orgId) || null : null), [orgs, orgId]);
  const projects = useMemo(() => org?.projects || [], [org]);

  // 헤더/스토리지 동기화
  useEffect(() => {
    if (!org) return;
    try {
      localStorage.setItem("orgId", org.id);
      localStorage.setItem("orgName", org.name);
    } catch {}
    dispatch(setOrganization({ id: org.id, name: org.name }));
  }, [org, dispatch]);

  const syncAndRemember = (proj) => {
    if (!proj) return;
    try {
      localStorage.setItem("projectId", proj.id);
      localStorage.setItem("projectName", proj.name || "");
      if (org) {
        localStorage.setItem("orgId", org.id);
        localStorage.setItem("orgName", org.name);
      }
    } catch {}
    dispatch(setProject({ id: proj.id, name: proj.name || null }));
    if (org) dispatch(setOrganization({ id: org.id, name: org.name }));
  };

  const gotoProjectTrace = (proj) => {
    syncAndRemember(proj);
    nav(`/project/${proj.id}/trace`);
  };

  const gotoProjectSettings = (proj) => {
    syncAndRemember(proj);
    nav(`/project/${proj.id}/settings/general`);
  };

  if (loading) return <div className={commonStyles.container}>Loading...</div>;

  // Organizations 목록 (orgId가 없을 때) - 조직별 섹션으로 표시
  if (!orgId) {
    return (
      <div className={commonStyles.container} style={{ paddingTop: 24 }}>
        {/* 각 조직별로 섹션 나누어 표시 */}
        {orgs.map((org) => (
          <div key={org.id} style={{ marginBottom: "40px" }}>
            {/* 조직 헤더 */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#e2e8f0",
                margin: 0
              }}>
                {org.name}
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button 
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#475569";
                    e.target.style.borderColor = "#64748b";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.borderColor = "#475569";
                  }}
                  title="Organization settings" 
                  onClick={() => nav(`/org/${org.id}/settings`)} 
                  aria-label="Organization settings"
                >
                  <GearIcon size={16} />
                </button>
                
                <button 
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#475569";
                    e.target.style.borderColor = "#64748b";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.borderColor = "#475569";
                  }}
                  title="Members"
                  onClick={() => nav(`/project/${org.projects?.[0]?.id ?? ""}/settings/members`)}
                  aria-label="Members"
                >
                  <Users size={16} />
                </button>
                
                <button 
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#3b82f6";
                  }}
                  onClick={() => nav(`/settings/select-project?orgId=${org.id}&create=1`)}
                >
                  + New project
                </button>
              </div>
            </div>

            {/* 해당 조직의 프로젝트들 */}
            {org.projects && org.projects.length > 0 ? (
              <div style={{ 
                display: "grid", 
                gap: 16, 
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
              }}>
                {org.projects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      padding: "20px",
                      backgroundColor: "#1e293b",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#334155";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1e293b";
                    }}
                  >
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 16, 
                      marginBottom: 16, 
                      wordBreak: "break-word",
                      color: "#e2e8f0"
                    }}>
                      {project.name}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        style={{
                          padding: "8px 16px",
                          border: "1px solid #475569",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          color: "#e2e8f0",
                          fontSize: "14px",
                          fontWeight: "500",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#475569";
                          e.target.style.borderColor = "#64748b";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.borderColor = "#475569";
                        }}
                        onClick={() => {
                          // 프로젝트 클릭시 해당 조직도 함께 동기화
                          try {
                            localStorage.setItem("projectId", project.id);
                            localStorage.setItem("projectName", project.name || "");
                            localStorage.setItem("orgId", org.id);
                            localStorage.setItem("orgName", org.name);
                          } catch {}
                          dispatch(setProject({ id: project.id, name: project.name || null }));
                          dispatch(setOrganization({ id: org.id, name: org.name }));
                          nav(`/project/${project.id}/trace`);
                        }}
                      >
                        Go to project
                      </button>

                      <button
                        style={{
                          width: "32px",
                          height: "32px",
                          border: "1px solid #475569",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          color: "#e2e8f0",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#475569";
                          e.target.style.borderColor = "#64748b";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.borderColor = "#475569";
                        }}
                        title="Project settings"
                        onClick={() => {
                          // 프로젝트 클릭시 해당 조직도 함께 동기화
                          try {
                            localStorage.setItem("projectId", project.id);
                            localStorage.setItem("projectName", project.name || "");
                            localStorage.setItem("orgId", org.id);
                            localStorage.setItem("orgName", org.name);
                          } catch {}
                          dispatch(setProject({ id: project.id, name: project.name || null }));
                          dispatch(setOrganization({ id: org.id, name: org.name }));
                          nav(`/project/${project.id}/settings/general`);
                        }}
                        aria-label="Project settings"
                      >
                        <GearIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "20px",
                textAlign: "center",
                color: "#94a3b8",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px"
              }}>
                No projects in this organization
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Create 강제 또는 프로젝트 없음
  if (forceCreate || !org || projects.length === 0) {
    return (
      <div className={commonStyles.container} style={{ paddingTop: 24 }}>
        <CreateProjectInline orgId={orgId} defaultName="my-llm-project" goNext="project" />
      </div>
    );
  }

  // Projects 그리드 (PageHeader에서 조직명과 액션 버튼들을 처리하므로 여기는 카드만)
  return (
    <div className={commonStyles.container} style={{ paddingTop: 24 }}>
      <div style={{ 
        display: "grid", 
        gap: 16, 
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
      }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "#1e293b",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1e293b";
            }}
          >
            <div style={{ 
              fontWeight: 600, 
              fontSize: 16, 
              marginBottom: 16, 
              wordBreak: "break-word", 
              color: "#e2e8f0"
            }} title={p.name}>
              {p.name}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                style={{
                  padding: "8px 16px",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  backgroundColor: "transparent",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#475569";
                  e.target.style.borderColor = "#64748b";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.borderColor = "#475569";
                }}
                onClick={() => gotoProjectTrace(p)}
              >
                Go to project
              </button>

              <button
                style={{
                  width: "32px",
                  height: "32px",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  backgroundColor: "transparent",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#475569";
                  e.target.style.borderColor = "#64748b";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.borderColor = "#475569";
                }}
                title="Project settings"
                onClick={() => gotoProjectSettings(p)}
                aria-label="Project settings"
              >
                <GearIcon size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
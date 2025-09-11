// src/Pages/Settings/SelectProjectPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateProjectInline from "./CreateProjectInline";
import { trpcTryManyMutation } from "./lib/trpcTryMany";
import { fetchSession } from "./lib/sessionOrg";
import commonStyles from "./layout/SettingsCommon.module.css";
import { Settings as GearIcon, Users, Plus, BookOpen, MessageSquare } from "lucide-react";

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

  // ✅ 1) 조직이 하나도 없을 때: Get Started 카드(라이트 레이아웃을 우리 다크 톤으로)
  if (orgs.length === 0) {
    const card = {
      border: "1px solid #334155",
      backgroundColor: "#0f172a",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 2px 4px rgba(0,0,0,.1)",
    };
    const title = { fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0, marginBottom: 6 };
    const desc = { color: "#94a3b8", margin: 0, marginBottom: 16, lineHeight: 1.6 };
    const pill = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #334155",
      background: "#0b1220",
      color: "#e2e8f0",
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
    };
    const pillSoft = { ...pill, background: "#0f172a" };

    return (
      <div className={commonStyles.container} style={{ paddingTop: 24 }}>
        <div style={card}>
          <h3 style={title}>Get Started</h3>
          <p style={desc}>
            Create an organization to get started. Alternatively, ask your organization admin to invite you.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={pill}
              onClick={() => nav("/setup")}
              title="New Organization"
            >
              <Plus size={16} />
              <span>New Organization</span>
            </button>
            <a
              href="https://langfuse.com/docs"
              target="_blank"
              rel="noreferrer"
              style={pillSoft}
              title="Docs"
            >
              <BookOpen size={16} />
              <span>Docs</span>
            </a>
            <a
              href="https://langfuse.com/docs/ask-ai"
              target="_blank"
              rel="noreferrer"
              style={pillSoft}
              title="Ask AI"
            >
              <MessageSquare size={16} />
              <span>Ask AI</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 2) orgId 없음 → 모든 조직 섹션(어두운 카드들) 렌더
  if (!orgId) {
    return (
      <div className={commonStyles.container} style={{ paddingTop: 24 }}>
        {orgs.map((org) => (
          <div key={org.id} style={{ marginBottom: "40px" }}>
            {/* 조직 헤더 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#e2e8f0",
                  margin: 0,
                }}
              >
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
                    e.currentTarget.style.backgroundColor = "#475569";
                    e.currentTarget.style.borderColor = "#64748b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "#475569";
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
                    e.currentTarget.style.backgroundColor = "#475569";
                    e.currentTarget.style.borderColor = "#64748b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "#475569";
                  }}
                  title="Members"
                  onClick={() =>
                    nav(`/project/${org.projects?.[0]?.id ?? ""}/settings/members`)
                  }
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
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                  }}
                  onClick={() => nav(`/settings/select-project?orgId=${org.id}&create=1`)}
                >
                  + New project
                </button>
              </div>
            </div>

            {/* 해당 조직의 프로젝트들 */}
            {org.projects && org.projects.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
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
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 16,
                        wordBreak: "break-word",
                        color: "#e2e8f0",
                      }}
                    >
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
                          e.currentTarget.style.backgroundColor = "#475569";
                          e.currentTarget.style.borderColor = "#64748b";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.borderColor = "#475569";
                        }}
                        onClick={() => {
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
                          e.currentTarget.style.backgroundColor = "#475569";
                          e.currentTarget.style.borderColor = "#64748b";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.borderColor = "#475569";
                        }}
                        title="Project settings"
                        onClick={() => {
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
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#94a3b8",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                }}
              >
                No projects in this organization
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ✅ 3) 특정 orgId가 있는 경우: 인라인 생성 or 프로젝트 그리드
  if (forceCreate || !org || projects.length === 0) {
    return (
      <div className={commonStyles.container} style={{ paddingTop: 24 }}>
        <CreateProjectInline orgId={orgId} defaultName="my-llm-project" goNext="project" />
      </div>
    );
  }

  // Projects 그리드 (orgId로 필터된 케이스)
  return (
    <div className={commonStyles.container} style={{ paddingTop: 24 }}>
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
      >
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
            <div
              style={{
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 16,
                wordBreak: "break-word",
                color: "#e2e8f0",
              }}
              title={p.name}
            >
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
                  e.currentTarget.style.backgroundColor = "#475569";
                  e.currentTarget.style.borderColor = "#64748b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#475569";
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
                  e.currentTarget.style.backgroundColor = "#475569";
                  e.currentTarget.style.borderColor = "#64748b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#475569";
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

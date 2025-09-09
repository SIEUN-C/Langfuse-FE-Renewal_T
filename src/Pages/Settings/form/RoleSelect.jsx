// src/Pages/Settings/form/RoleSelect.jsx
import React from "react";

/** 역할별 권한 설명(스냅샷 텍스트) */
const ROLE_DETAILS = {
  OWNER: {
    label: "Owner",
    org: [
      "projects: create, transfer_org",
      "organization: CRUD_apiKeys, update, delete",
      "organizationMembers: CUD, read",
      "langfuseCloudBilling: CRUD",
    ],
    project: [
      "project: read, update, delete",
      "projectMembers: read, CUD",
      "apiKeys: read, CUD",
      "integrations: CRUD",
      "objects: publish, bookmark, tag",
      "traces: delete",
      "scoreConfigs: CUD, read",
      "datasets: CUD",
      "prompts: CUD, read",
      "promptProtectedLabels: CUD",
      "models: CUD",
      "evalTemplate: CUD, read",
      "evalJob: CUD, read",
      "evalJobExecution: read",
      "evalDefaultModel: read, CUD",
      "llmApiKeys: read, create, update, delete",
      "llmSchemas: CUD, read",
      "llmTools: CUD, read",
      "batchExports: create, read",
      "comments: CUD, read",
      "annotationQueues: read, CUD",
      "annotationQueueAssignments: read, CUD",
      "promptExperiments: CUD, read",
      "auditLogs: read",
      "dashboards: read, CUD",
      "TableViewPresets: CUD, read",
      "automations: CUD, read",
    ],
    note: "Muted scopes are inherited from lower role.",
  },
  ADMIN: {
    label: "Admin",
    org: ["organization: CRUD_apiKeys, update", "organizationMembers: read, CUD"],
    project: [
      "project: read, update",
      "projectMembers: read, CUD",
      "apiKeys: read, CUD",
      "integrations: CRUD",
      "objects: publish, bookmark, tag",
      "traces: delete",
      "scoreConfigs: CUD, read",
      "datasets: CUD",
      "prompts: CUD, read",
      "models: CUD",
      "evalTemplate: CUD, read",
      "evalJob: CUD, read",
      "evalJobExecution: read",
      "evalDefaultModel: read",
      "llmApiKeys: read, create, update, delete",
      "llmSchemas: read, CUD",
      "llmTools: read, CUD",
      "batchExports: create, read",
      "comments: CUD, read",
      "annotationQueues: read, CUD",
      "annotationQueueAssignments: read, CUD",
      "promptExperiments: CUD, read",
      "dashboards: read, CUD",
      "TableViewPresets: read, CUD",
      "automations: read, CUD",
    ],
    note: "Muted scopes are inherited from lower role.",
  },
  MEMBER: {
    label: "Member",
    org: ["organizationMembers: read"],
    project: [
      "project: read",
      "projectMembers: read",
      "apiKeys: read",
      "objects: publish, bookmark, tag",
      "scores: CUD",
      "scoreConfigs: read, CUD",
      "datasets: CUD",
      "prompts: read, CUD",
      "evalTemplate: read, CUD",
      "evalJob: read",
      "evalJobExecution: read",
      "evalDefaultModel: read, CUD",
      "llmApiKeys: read",
      "llmSchemas: read",
      "llmTools: read",
      "batchExports: create, read",
      "comments: read, CUD",
      "annotationQueues: read",
      "annotationQueueAssignments: read",
      "promptExperiments: CUD, read",
      "dashboards: read",
      "TableViewPresets: read",
      "automations: read",
    ],
    note: "Muted scopes are inherited from lower role.",
  },
  VIEWER: {
    label: "Viewer",
    org: ["None"],
    project: [
      "project: read",
      "prompts: read",
      "evalTemplate: read",
      "scoreConfigs: read",
      "evalJob: read",
      "evalJobExecution: read",
      "llmApiKeys: read",
      "llmSchemas: read",
      "llmTools: read",
      "comments: read",
      "annotationQueues: read",
      "promptExperiments: read",
      "dashboards: read",
      "TableViewPresets: read",
      "automations: read",
    ],
    note: "Muted scopes are inherited from lower role.",
  },
  NONE: {
    label: "None",
    org: ["No access to organization resources by default."],
    project: ["User needs to be granted project-level access via project roles."],
    note: "",
  },
};

// 라벨/코드 어떤 값이 오든 내부는 코드값으로 통일
const toCode = (v) => {
  const k = String(v || "").trim().toUpperCase();
  if (["OWNER","ADMIN","MEMBER","VIEWER","NONE"].includes(k)) return k;
  // (보강용) 라벨이 그대로 들어오는 케이스 방어
  if (k === "OWNER") return "OWNER";
  if (k === "ADMIN") return "ADMIN";
  if (k === "MEMBER") return "MEMBER";
  if (k === "VIEWER") return "VIEWER";
  if (k === "NONE") return "NONE";
  return "MEMBER";
};

export default function RoleSelect({ value = "MEMBER", onChange }) {
  const code = toCode(value);
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(code);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER", "NONE"];

  React.useEffect(() => { setHover(code); }, [code]);

  React.useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (!menuRef.current || !btnRef.current) return;
      if (!menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label = ROLE_DETAILS[code]?.label || code;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          minWidth: 140,
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #22324a",
          background: "#0f172a",
          color: "#e2e8f0",
          textAlign: "left",
        }}
      >
        {label}
        <span style={{ float: "right", opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 1000,      // 패널이 항상 위로
            top: "100%",
            left: 0,
            marginTop: 6,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {/* 왼쪽: 역할 리스트 */}
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 6,
              width: 180,
              background: "#0b1220",
              color: "#cbd5e1",
              border: "1px solid #22324a",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            }}
          >
            {ROLES.map((r) => (
              <li
                key={r}
                role="option"
                aria-selected={r === code}
                onMouseEnter={() => setHover(r)}
                onFocus={() => setHover(r)}
                onClick={() => { onChange?.(r); setOpen(false); }}
                tabIndex={0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  borderRadius: 6,
                  background: r === code ? "rgba(148,163,184,.15)" : "transparent",
                }}
              >
                <span style={{ width: 14, textAlign: "center" }}>{r === code ? "✓" : ""}</span>
                <span>{ROLE_DETAILS[r]?.label || r}</span>
              </li>
            ))}
          </ul>

          {/* 오른쪽: 설명 패널 */}
          <div
            style={{
              marginLeft: 8,
              width: 360,
              background: "#0b1220",
              color: "#e2e8f0",
              border: "1px solid #22324a",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,.35)",
              padding: "12px 14px",
              maxHeight: 420,
              overflow: "auto",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Role: {ROLE_DETAILS[hover]?.label || hover}
            </div>

            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Organization Scopes</div>
            <ul style={{ margin: "0 0 10px 16px", padding: 0 }}>
              {(ROLE_DETAILS[hover]?.org || []).map((s, i) => (
                <li key={`o-${i}`} style={{ marginBottom: 4 }}>{s}</li>
              ))}
              {(!ROLE_DETAILS[hover]?.org || ROLE_DETAILS[hover].org.length === 0) && <li>None</li>}
            </ul>

            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Project Scopes</div>
            <ul style={{ margin: "0 0 10px 16px", padding: 0 }}>
              {(ROLE_DETAILS[hover]?.project || []).map((s, i) => (
                <li key={`p-${i}`} style={{ marginBottom: 4 }}>{s}</li>
              ))}
              {(!ROLE_DETAILS[hover]?.project || ROLE_DETAILS[hover].project.length === 0) && <li>None</li>}
            </ul>

            {ROLE_DETAILS[hover]?.note && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>Note: {ROLE_DETAILS[hover].note}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

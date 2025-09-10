import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import commonStyles from "./layout/SettingsCommon.module.css";
import CreateProjectInline from "./CreateProjectInline";

export default function SetupOrganizationPage() {
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const createOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: orgName }),
      });

      if (!res.ok) throw new Error("조직 생성 실패");

      const data = await res.json();
      setOrgId(data.id);

      // localStorage에 저장
      try {
        localStorage.setItem("orgId", data.id);
        localStorage.setItem("orgName", data.name);
      } catch {}

    } catch (err) {
      setError(err.message || "조직 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Organization 생성 완료되면 프로젝트 생성 컴포넌트로 전환
  if (orgId) {
    return (
      <CreateProjectInline
        orgId={orgId}
        defaultName="my-llm-project"
        goNext="project"
      />
    );
  }

  return (
    <div className={commonStyles.container} style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Create your organization
      </h2>
      <form onSubmit={createOrg}>
        <input
          type="text"
          placeholder="Organization name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className={commonStyles.input}
          required
        />
        {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
        <button
          type="submit"
          className={commonStyles.button}
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </div>
  );
}

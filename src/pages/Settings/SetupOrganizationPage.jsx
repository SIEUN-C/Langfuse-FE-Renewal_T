// src/Pages/Settings/SetupOrganizationPage.jsx
import React, { useRef, useState } from "react";
import commonStyles from "./layout/SettingsCommon.module.css";
import { trpcMutation } from "./lib/trpc"; 

export default function SetupOrganizationPage() {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  const createOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      // ✅ 생성은 POST 전용: trpcMutation 사용(옵션 B 일관성)
      const created = await trpcMutation("organizations.create", {
        name: orgName.trim(),
      });

      if (!created?.id) throw new Error("응답 파싱 실패");

      // 저장
      try {
        localStorage.setItem("orgId", created.id);
        localStorage.setItem("orgName", created.name || "");
      } catch {}

      // ✅ 3000 플로우와 동일한 초대 스텝으로 이동
      window.location.assign(
        `/organization/${encodeURIComponent(created.id)}/setup?orgstep=invite-members`
      );

      // 5173 패턴을 유지하고 싶다면 아래로 교체:
      // window.location.assign(`/setup/members?orgId=${encodeURIComponent(created.id)}`);
    } catch (err) {
      setError(err?.message || "조직 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 스타일
  const card = { background: "#0b1220", border: "1px solid #1f2937", borderRadius: 12, padding: 20 };
  const steps = { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#94a3b8", margin: "8px 0 14px" };
  const active = { fontWeight: 700, color: "#e2e8f0" };
  const chev = { opacity: 0.7 };

  return (
    <div className={commonStyles.container} style={{ paddingTop: 16 }}>
      <div style={steps}>
        <span style={active}>1. Create Organization</span>
        <span style={chev}>›</span>
        <span>2. Invite Members</span>
        <span style={chev}>›</span>
        <span>3. Create Project</span>
        <span style={chev}>›</span>
        <span>4. Setup Tracing</span>
      </div>

      <div style={card}>
        <h3 className={commonStyles.title} style={{ margin: 0, fontSize: 22 }}>
          New Organization
        </h3>
        <p className={commonStyles.description} style={{ marginTop: 6 }}>
          Organizations are used to manage your projects and teams.
        </p>

        <form onSubmit={createOrg} ref={formRef} style={{ marginTop: 16 }}>
          <div className={commonStyles.formGroup}>
            <label className={commonStyles.label} htmlFor="orgName">
              Organization name
            </label>
            <input
              id="orgName"
              type="text"
              placeholder="my-org"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className={commonStyles.input}
              required
            />
          </div>

          {error && <p style={{ color: "#ef4444", marginTop: 8 }}>{error}</p>}

          <button
            type="submit"
            className={commonStyles.button}
            style={{ marginTop: 12, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155" }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}

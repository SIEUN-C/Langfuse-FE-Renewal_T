// src/Pages/Settings/SetupTracingPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Info, Plus, Copy } from "lucide-react";
import commonStyles from "./layout/SettingsCommon.module.css";
import useApiKeys from "./lib/useApiKeys";

// 탭 콘텐츠 생성: keys가 있으면 실제 값, 없으면 placeholder
function buildTabs(host, keys) {
  const H = (host || "http://localhost:3000").replace(/\/+$/, "");
  const sk = keys?.secretKey || "<secret key>";
  const pk = keys?.publicKey || "<public key>";

  return {
    Python: {
      lead: "",
      install: `pip install langfuse`,
      blocks: [
        {
          label: "",
          code: `from langfuse import Langfuse

langfuse = Langfuse(
  secret_key="${sk}",
  public_key="${pk}",
  host="${H}"
)`,
        },
      ],
      footDocs: { label: "Python docs", href: "https://langfuse.com/docs/observability/sdk/python/overview" },
    },
    "JS/TS": {
      lead: "",
      install: `npm install langfuse`,
      blocks: [
        {
          label: "",
          code: `import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  secretKey: "${sk}",
  publicKey: "${pk}",
  baseUrl: "${H}"
});`,
        },
      ],
      footDocs: { label: "JS/TS docs", href: "https://langfuse.com/docs/observability/sdk/js-ts/overview" },
    },
    OpenAI: {
      lead:
        "The integration is a drop-in replacement for the OpenAI Python SDK. By changing the import, Langfuse will capture all LLM calls and send them to Langfuse asynchronously.",
      install: `pip install langfuse`,
      blocks: [
        {
          label: ".env",
          code: `LANGFUSE_SECRET_KEY=${sk}
LANGFUSE_PUBLIC_KEY=${pk}
LANGFUSE_HOST="${H}"`,
        },
        {
          label: "",
          code: `# remove: import openai

from langfuse.openai import openai`,
        },
      ],
      footDocs: { label: "OpenAI Integration docs", href: "https://langfuse.com/docs/integrations/openai/python" },
    },
    Langchain: {
      lead:
        "The integration uses the Langchain callback system to automatically capture detailed traces of your Langchain executions.",
      install: `pip install langfuse`,
      blocks: [
        {
          label: "",
          code: `from langfuse import Langfuse
from langfuse.langchain import CallbackHandler

langfuse = Langfuse(
  public_key="${pk}",
  secret_key="${sk}",
  host="${H}"
)

langfuse_handler = CallbackHandler()

# <Your Langchain code here>

# Add handler to run/invoke/call/chat
chain.invoke({"input": "<user_input>"}, config={"callbacks": [langfuse_handler]})`,
        },
      ],
      footDocs: { label: "Langchain Integration docs", href: "https://langfuse.com/docs/integrations/langchain/python" },
    },
    "Langchain JS": {
      lead:
        "The integration uses the Langchain callback system to automatically capture detailed traces of your Langchain executions.",
      install: `npm install langfuse-langchain`,
      blocks: [
        {
          label: "",
          code: `import { callbackHandler } from "langfuse-langchain";

// Initialize Langfuse callback handler
const langfuseHandler = new callbackHandler({
  publicKey: "${pk}",
  secretKey: "${sk}",
  baseUrl: "${H}"
});

// Your Langchain implementation
const chain = new LLMChain(...);

// Add handler as callback when running the Langchain agent
await chain.invoke(
  { input: "<user_input>" },
  { callbacks: [langfuseHandler] }
);`,
        },
      ],
      footDocs: { label: "Langchain Integration docs", href: "https://langfuse.com/docs/integrations/langchain/js-ts" },
    },
    Other: {
      lead:
        'Use the API or one of the native integrations (e.g. LiteLLM, Flowise, and Langflow) to integrate with Langfuse.',
      install: "",
      blocks: [],
      footDocs: null,
    },
  };
}

export default function SetupTracingPage() {
  const { projectId } = useParams();
  const nav = useNavigate();

  // 생성 API는 여기서 직접 호출(모달 X)
  const { loading, error, create } = useApiKeys(projectId);

  // 방금 생성된 키만 메모리에 보관(페이지 떠나면 사라짐)
  const [createdKeys, setCreatedKeys] = useState(null);

  // 다크 UI 유지
  const card = useMemo(
    () => ({ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 12, padding: 20 }),
    []
  );

  const steps = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#94a3b8",
    margin: "8px 0 14px",
  };
  const done = { color: "#93c5fd", fontWeight: 700 };
  const active = { fontWeight: 700, color: "#e2e8f0" };
  const chev = { opacity: 0.7 };

  const host = import.meta.env.VITE_LANGFUSE_BASE_URL || "http://localhost:3000";

  const [tab, setTab] = useState("Python");
  const tabs = useMemo(() => buildTabs(host, createdKeys), [host, createdKeys]);
  const cur = tabs[tab];

  const copy = (t) =>
    t && navigator.clipboard.writeText(t).then(() => alert("복사되었습니다."));

  const preBase = {
    background: "#0b1220",
    border: "1px solid #374151",
    borderRadius: 8,
    padding: 12,
    overflowX: "auto",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.5,
    color: "#e2e8f0",
  };

  const CopyBtn = ({ onClick, aria }) => (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{
        position: "absolute",
        right: 8,
        top: 8,
        border: "1px solid #334155",
        background: "#0b1220",
        color: "#e2e8f0",
        borderRadius: 8,
        padding: "6px 8px",
      }}
    >
      <Copy size={14} />
    </button>
  );

  const onCreate = async () => {
    try {
      const k = await create(); // { id, publicKey, secretKey, ... }
      if (!k?.secretKey || !k?.publicKey) throw new Error("키 생성 실패");
      setCreatedKeys({ secretKey: k.secretKey, publicKey: k.publicKey });
    } catch (e) {
      alert(`API 키 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className={commonStyles.container} style={{ paddingTop: 16 }}>
      <div style={steps}>
        <span style={done}>1. Create Organization ✓</span>
        <span style={chev}>›</span>
        <span style={done}>2. Invite Members ✓</span>
        <span style={chev}>›</span>
        <span style={done}>3. Create Project ✓</span>
        <span style={chev}>›</span>
        <span style={active}>4. Setup Tracing</span>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* API Keys */}
        <section style={card}>
          <h3 style={{ margin: 0, fontSize: 22, color: "#e2e8f0" }}>
            API Keys <Info size={14} style={{ verticalAlign: "-2px" }} />
          </h3>
          <p style={{ marginTop: 8, color: "#94a3b8" }}>
            These keys are used to authenticate your API requests. You can create more keys later in the project settings.
          </p>
          <p style={{ marginTop: 6, color: "#94a3b8" }}>
            You need to create an API key to start tracing your application.
          </p>

          <button
            onClick={onCreate}
            disabled={loading}
            className={commonStyles.button}
            style={{
              marginTop: 8,
              background: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid #334155",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
            }}
          >
            {loading ? "Creating..." : (<><Plus size={16} /> Create API Key</>)}
          </button>
          {error && <p style={{ marginTop: 10, color: "#ef4444" }}>{String(error)}</p>}

          {/* 생성 후: Secret/Public/Host 필드 노출 */}
          {createdKeys && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 10, color: "#e2e8f0", fontWeight: 600 }}>Secret Key</div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input
                  readOnly
                  value={createdKeys.secretKey}
                  className={commonStyles.input}
                  style={{ background: "#0b1220", color: "#e2e8f0", border: "1px solid #334155" }}
                />
                <CopyBtn onClick={() => copy(createdKeys.secretKey)} aria="Copy secret key" />
              </div>

              <div style={{ marginBottom: 10, color: "#e2e8f0", fontWeight: 600 }}>Public Key</div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input
                  readOnly
                  value={createdKeys.publicKey}
                  className={commonStyles.input}
                  style={{ background: "#0b1220", color: "#e2e8f0", border: "1px solid #334155" }}
                />
                <CopyBtn onClick={() => copy(createdKeys.publicKey)} aria="Copy public key" />
              </div>

              <div style={{ marginBottom: 10, color: "#e2e8f0", fontWeight: 600 }}>Host</div>
              <div style={{ position: "relative" }}>
                <input
                  readOnly
                  value={host}
                  className={commonStyles.input}
                  style={{ background: "#0b1220", color: "#e2e8f0", border: "1px solid #334155" }}
                />
                <CopyBtn onClick={() => copy(host)} aria="Copy host" />
              </div>
            </div>
          )}
        </section>

        {/* Setup Tracing */}
        <section style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 20, color: "#e2e8f0" }}>Setup Tracing</h3>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#3f2d15",
                color: "#facc15",
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: 9999 }} />
              pending
            </span>
          </div>
          <p style={{ marginTop: 8, color: "#94a3b8" }}>
            Tracing is used to track and analyze your LLM calls. You can always skip this step and setup tracing later.
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {Object.keys(tabs).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={commonStyles.button}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: tab === t ? "#1e293b" : "#0b1220",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                  fontWeight: 600,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Lead */}
          {cur.lead && <p style={{ marginTop: 10, color: "#94a3b8" }}>{cur.lead}</p>}

          {/* Install */}
          {cur.install && (
            <div style={{ position: "relative", marginTop: 10 }}>
              <pre style={preBase}>{cur.install}</pre>
              <CopyBtn onClick={() => copy(cur.install)} aria="Copy install" />
            </div>
          )}

          {/* Code blocks */}
          {cur.blocks.map((b, i) => (
            <div key={i} style={{ position: "relative", marginTop: 10 }}>
              {b.label ? (
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: -9,
                    fontSize: 12,
                    background: "#0b1220",
                    padding: "0 6px",
                    color: "#94a3b8",
                  }}
                >
                  {b.label}
                </div>
              ) : null}
              <pre style={{ ...preBase, paddingTop: b.label ? 16 : 12, minHeight: 120 }}>{b.code}</pre>
              <CopyBtn onClick={() => copy(b.code)} aria="Copy code" />
            </div>
          ))}

          {/* Footer + Skip */}
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 12 }}>
            See{" "}
            <a href="https://langfuse.com/docs/observability/get-started" target="_blank" rel="noreferrer">
              Quickstart
            </a>
            {cur.footDocs ? (
              <>
                {" "}
                and{" "}
                <a href={cur.footDocs.href} target="_blank" rel="noreferrer">
                  {cur.footDocs.label}
                </a>{" "}
                for more details and an end-to-end example.
              </>
            ) : null}
            <br />
            Do you have questions or issues? Check out this{" "}
            <a href="https://langfuse.com/faq/all/missing-traces" target="_blank" rel="noreferrer">
              FAQ post
            </a>
            ,{" "}
            <a href="https://langfuse.com/docs/ask-ai" target="_blank" rel="noreferrer">
              Ask AI
            </a>{" "}
            or{" "}
            <a href="https://langfuse.com/support" target="_blank" rel="noreferrer">
              get support
            </a>
            .
          </p>

          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => nav(`/project/${projectId}/trace`)}
              className={commonStyles.button}
              style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155" }}
            >
              Skip for now
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

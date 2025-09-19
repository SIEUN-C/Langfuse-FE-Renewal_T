// src/Pages/Playground/Playground.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom"; // ✅ URL에서 projectId 읽기
import styles from "./Playground.module.css";
import {
  Plus,
  Play,
  RotateCcw,
  Wrench,
  BookText,
  Variable,
  Settings,
} from "lucide-react";

import ChatBox from "../../components/ChatBox/ChatBox";
import NewLlmConnectionModal from "./NewLlmConnectionModal";
import PlaygroundPanel from "./PlaygroundPanel";
import NewItemModal from "./NewItemModal";
import SavePromptPopover from "./SavePromptPopover";

import useTools from "./hooks/useTools";
import useSchemas from "./hooks/useSchemas";
import useLlmConnections from "./hooks/useLlmConnections";

import {
  extractVariablesFromMessages,
  extractPlaceholders,
  fillVariables,
  expandPlaceholders,
} from "./lib/vars";
import toServerBody from "./lib/toServerBody";

import ToolsPanel from "./components/ToolsPanel";
import SchemaPanel from "./components/SchemaPanel";
import VariablesPanel from "./components/VariablesPanel";
import StreamSettingsPopover from "./components/StreamSettingsPopover";
import ModelHeader from "./components/ModelHeader";
import ModelAdvancedSettings, { DEFAULT_SETTINGS } from "../../components/ModelAdvancedSettings/ModelAdvancedSettings";

// 세션에서 현재 사용 가능한 org/projects를 가져오는 유틸
import { fetchSession } from "../Settings/lib/sessionOrg";

const API_URL = "/api/chatCompletion";

const getInitialMessages = () => {
  const savedDataString = sessionStorage.getItem('promptDataForPlayground');
  if (savedDataString) {
    try {
      const savedData = JSON.parse(savedDataString);
      if (Array.isArray(savedData.messages)) {
        return savedData.messages;
      }
    } catch (error) {
      console.error("sessionStorage 데이터 파싱 오류:", error);
    }
  }
  return null;
};

function PlaygroundComponent({
  PROJECT_ID,
  onCopy,
  onRemove,
  showRemoveButton,
  panelId,
  onRegisterRunner,
}) {
  // 메시지/변수
  const [messages, setMessages] = useState(() => getInitialMessages() || []);
  const [varNames, setVarNames] = useState([]);
  const [varValues, setVarValues] = useState({});
  const [placeholders, setPlaceholders] = useState([]);

  // 모달/패널
  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'tool'|'schema'|null
  const [editingTool, setEditingTool] = useState(null);
  const [editingSchema, setEditingSchema] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] = useState(false);

  // 모델 고급 설정
  const [modelAdv, setModelAdv] = useState({
    useTemperature: false,
    useTopP: false,
    useMaxTokens: false,
    useFrequencyPenalty: false,
    usePresencePenalty: false,
    temperature: 0.7,
    topP: 1,
    maxTokens: 4096,
    frequencyPenalty: 0,
    presencePenalty: 0,
    stopInput: "",
    apiKeyOverride: "",
  });
  const updateModelAdv = (patch) => setModelAdv((p) => ({ ...p, ...patch }));
  const [isModelAdvOpen, setIsModelAdvOpen] = useState(false);
  const modelAdvBtnRef = useRef(null);

  // Tools/Schemas 훅
  const tools = useTools(PROJECT_ID);
  const schemas = useSchemas(PROJECT_ID);

  // LLM connections 훅
  const {
    connections,
    loading: loadingConn,
    error: connError,
    firstDefault,
  } = useLlmConnections(PROJECT_ID);

  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedAdapter, setSelectedAdapter] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelBtnRef = useRef(null);
  const modelMenuRef = useRef(null);

  // 유틸: 연결/모델 보유 여부
  const hasAnyConnection = connections.length > 0;
  const hasAnyModel = connections.some((c) => (c.customModels?.length ?? 0) > 0);

  useEffect(() => {
    if (!connections.length) {
      setSelectedProvider("");
      setSelectedAdapter("");
      setSelectedModel("");
      return;
    }
    // 최초 로딩 시 기본값 주입 (사용자가 바꿨다면 유지)
    if (!selectedProvider && !selectedModel) {
      setSelectedProvider(firstDefault.provider);
      setSelectedAdapter(firstDefault.adapter);
      setSelectedModel(firstDefault.model);
    }
  }, [connections, firstDefault, selectedProvider, selectedModel]);

  const currentConn = useMemo(
    () =>
      connections.find(
        (c) =>
          c.provider === selectedProvider &&
          (c.adapter ?? "") === (selectedAdapter ?? "")
      ),
    [connections, selectedProvider, selectedAdapter]
  );

  useEffect(() => {
    sessionStorage.removeItem('promptDataForPlayground');
  }, []);

  // 드롭다운 리스트
  const modelMenuItems = useMemo(
    () =>
      connections.flatMap((c) =>
        (c.customModels ?? []).map((m) => ({
          id: `${c.id}::${m}`,
          conn: c,
          model: m,
        }))
      ),
    [connections]
  );
  function pickConnection(item) {
    setSelectedProvider(item.conn.provider);
    setSelectedAdapter(item.conn.adapter ?? "");
    setSelectedModel(item.model);
    setIsModelMenuOpen(false);
  }

  const [streaming, setStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState(null);
  const outputTextRef = useRef("");

  // 메시지 변경 → 변수/placeholder 추출
  useEffect(() => {
    const names = extractVariablesFromMessages(messages);
    setVarNames(names);
    setVarValues((prev) => {
      const next = { ...prev };
      names.forEach((n) => {
        if (!(n in next)) next[n] = "";
      });
      return next;
    });
    setPlaceholders(extractPlaceholders(messages));
  }, [messages]);

  const hasContent = useMemo(
    () => messages.some((m) => (m.content || "").trim().length > 0),
    [messages]
  );
  const disabledReason = useMemo(() => {
    return loadingConn
      ? "Loading LLM connections…"
      : !selectedProvider
        ? "Select a provider"
        : !selectedModel
          ? "Select or type a model"
          : !hasContent
            ? "Add at least one message"
            : "";
  }, [loadingConn, selectedProvider, selectedModel, hasContent]);

  const canSubmit = hasContent && !!selectedProvider && !!selectedModel;
  const togglePanel = (name) => setActivePanel((p) => (p === name ? null : name));

  async function submitNonStreaming(body) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Chat failed");
    }
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json")
      ? await res.json()
      : { content: await res.text() };
    setOutput(data);
  }

  async function submitStreaming(body) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Chat failed");
    }
    outputTextRef.current = "";
    setOutput({ content: "" });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      outputTextRef.current += decoder.decode(value, { stream: true });
      setOutput({ content: outputTextRef.current });
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      alert(
        disabledReason || "Select provider/model and add at least one message."
      );
      return;
    }
    const missing = varNames.filter(
      (v) => !(varValues[v] && String(varValues[v]).trim().length)
    );
    if (missing.length) {
      alert(`Values required for: ${missing.join(", ")}`);
      return;
    }

    const replaced = fillVariables(messages, varValues);
    const expanded = expandPlaceholders(replaced);
    const body = toServerBody({
      projectId: PROJECT_ID,
      messages: expanded,
      schema: schemas.attached,
      streaming,
      modelAdv,
      selectedProvider,
      selectedAdapter,
      selectedModel,
    });

    try {
      setIsSubmitting(true);
      setOutput(null);
      if (streaming) await submitStreaming(body);
      else await submitNonStreaming(body);
    } catch (e) {
      console.error("Submit failed", e);
      alert(e.message || "실행 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Run All 등록
  useEffect(() => {
    if (typeof onRegisterRunner === "function") {
      onRegisterRunner(panelId, handleSubmit);
      return () => onRegisterRunner(panelId, null);
    }
  }, [panelId, onRegisterRunner, handleSubmit]);

  return (
    <div className={styles.panelContainer}>
      <div className={styles.card}>
        <ModelHeader
          loadingConn={loadingConn}
          hasAnyConnection={hasAnyConnection}
          hasAnyModel={hasAnyModel}
          selectedProvider={selectedProvider}
          selectedAdapter={selectedAdapter}
          selectedModel={selectedModel}
          isModelMenuOpen={isModelMenuOpen}
          modelMenuItems={modelMenuItems}
          modelBtnRef={modelBtnRef}
          modelMenuRef={modelMenuRef}
          modelAdvBtnRef={modelAdvBtnRef}
          isModelAdvOpen={isModelAdvOpen}
          modelAdvValues={modelAdv}
          onToggleModelAdv={setIsModelAdvOpen}
          onChangeModelAdv={updateModelAdv}
          onToggleMenu={setIsModelMenuOpen}
          onPickConnection={(item) => {
            pickConnection(item);
          }}
          onOpenLlmModal={() => setIsLlmModalOpen(true)}
          onCopy={onCopy}
          onToggleSavePopover={() => setIsSavePopoverOpen((v) => !v)}
          onRemove={onRemove}
          showRemoveButton={showRemoveButton}
          projectId={PROJECT_ID}
          providerForAdv={selectedProvider}
          onResetModelAdv={() => setModelAdv(DEFAULT_SETTINGS)}
        />
        {isSavePopoverOpen && (
          <SavePromptPopover onSaveAsNew={() => console.log("onSaveAsNew")} />
        )}
        {(loadingConn || connError) && (
          <div className={styles.cardBody}>
            {loadingConn ? (
              <p className={styles.muted}>Loading LLM connections…</p>
            ) : connError ? (
              <p className={styles.errorText}>{connError}</p>
            ) : null}
          </div>
        )}
      </div>

      {(loadingConn || connError) && (
        <div className={styles.cardBody}>
          {loadingConn ? (
            <p className={styles.muted}>Loading LLM connections…</p>
          ) : connError ? (
            <p className={styles.errorText}>{connError}</p>
          ) : null}
        </div>
      )}

      {/* Controls */}
      <div className={styles.controlsBar}>
        <button
          className={styles.controlBtn}
          onClick={() => togglePanel("tools")}
        >
          <Wrench size={14} /> Tools{" "}
          <span className={styles.badge}>{tools.attached.length}</span>
        </button>
        <button
          className={styles.controlBtn}
          onClick={() => togglePanel("schema")}
        >
          <BookText size={14} /> Schema{" "}
          <span className={styles.badge}>{schemas.attached ? 1 : 0}</span>
        </button>
        <button
          className={styles.controlBtn}
          onClick={() => togglePanel("variables")}
        >
          <Variable size={14} /> Variables{" "}
          <span className={styles.badge}>
            {varNames.length + placeholders.length}
          </span>
        </button>
      </div>

      {activePanel === "tools" && (
        <PlaygroundPanel
          title="Tools"
          description="Configure tools for your model to use."
        >
          <ToolsPanel
            attachedTools={tools.attached}
            availableTools={tools.available}
            onAdd={tools.attach}
            onRemove={tools.detach}
            onCreate={() => {
              setEditingTool(null);
              setModalType("tool");
            }}
            onEdit={(tool) => {
              setEditingTool(tool);
              setModalType("tool");
            }}
            onDelete={async (tool) => {
              if (!window.confirm(`Delete tool "${tool.name}"?`)) return;
              try {
                await tools.remove(tool);
              } catch (e) {
                alert(e?.message || "Delete failed");
              }
            }}
            loading={tools.loading}
            error={tools.error}
          />
        </PlaygroundPanel>
      )}

      {activePanel === "schema" && (
        <PlaygroundPanel
          title="Structured Output"
          description="Configure JSON schema for structured output."
        >
          <SchemaPanel
            attached={schemas.attached}
            available={schemas.available}
            onAttach={schemas.attach}
            onDetach={schemas.detach}
            onCreate={() => {
              setEditingSchema(null);
              setModalType("schema");
            }}
            onEdit={(schema) => {
              setEditingSchema(schema);
              setModalType("schema");
            }}
            onDelete={async (schema) => {
              if (!window.confirm(`Delete schema "${schema.name}"?`)) return;
              try {
                await schemas.remove(schema);
              } catch (e) {
                alert(e?.message || "Delete failed");
              }
            }}
            loading={schemas.loading}
            error={schemas.error}
          />
        </PlaygroundPanel>
      )}

      {activePanel === "variables" && (
        <PlaygroundPanel
          title="Variables & Message Placeholders"
          description={
            <>
              Configure variables and message placeholders for your prompts.
              <br />
              Use {"{{variable}}"} in any message to register it here.
            </>
          }
        >
          <VariablesPanel
            names={varNames}
            values={varValues}
            onChangeValue={(name, val) =>
              setVarValues((p) => ({ ...p, [name]: val }))
            }
            onReset={() =>
              setVarValues(Object.fromEntries(varNames.map((n) => [n, ""])))
            }
            placeholders={placeholders}
          />
        </PlaygroundPanel>
      )}

      {/* Messages */}
      <ChatBox
        value={messages}
        onChange={setMessages}
        schema="rolePlaceholder"
        autoInit={messages.length === 0}
      />

      {/* Output */}
      <div className={styles.outputCard}>
        <div className={styles.cardHeader}>
          <span>Output</span>
        </div>
        <div className={styles.outputBody}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {output
              ? typeof output === "string"
                ? output
                : output.content ?? JSON.stringify(output, null, 2)
              : ""}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footerBar}>
        <button
          className={styles.submitBtnFull}
          onClick={handleSubmit}
          disabled={!!disabledReason || isSubmitting}
          title={disabledReason || ""}
        >
          {isSubmitting ? "Running..." : "Submit"}
        </button>
        <div className={styles.footerRight}>
          <button
            className={styles.iconActionBtn}
            title="Streaming settings"
            aria-haspopup="dialog"
            aria-expanded={isStreamSettingsOpen}
            onClick={() => setIsStreamSettingsOpen((v) => !v)}
            type="button"
          >
            <Settings size={16} />
          </button>
        </div>
        <StreamSettingsPopover
          open={isStreamSettingsOpen}
          streaming={streaming}
          onChangeStreaming={setStreaming}
          onClose={() => setIsStreamSettingsOpen(false)}
        />
      </div>

      {/* LLM 연결 모달 */}
      <NewLlmConnectionModal
        isOpen={isLlmModalOpen}
        onClose={() => setIsLlmModalOpen(false)}
        projectId={PROJECT_ID}
      />

      {/* 생성/수정 모달 */}
      {modalType === "tool" && (
        <NewItemModal
          isOpen
          type="tool"
          initialData={
            editingTool
              ? {
                name: editingTool.name,
                description: editingTool.description,
                parameters: editingTool.parameters || {},
              }
              : undefined
          }
          onSubmit={async (form) => {
            try {
              if (editingTool) await tools.update({ id: editingTool.id, ...form });
              else await tools.create(form);
              await tools.refresh();
            } catch (e) {
              alert(e?.message || "Save failed");
            }
          }}
          onClose={() => {
            setModalType(null);
            setEditingTool(null);
          }}
        />
      )}

      {modalType === "schema" && (
        <NewItemModal
          isOpen
          type="schema"
          initialData={
            editingSchema
              ? {
                name: editingSchema.name,
                description: editingSchema.description,
                schema: editingSchema.schema || {},
              }
              : undefined
          }
          onSubmit={async (form) => {
            try {
              if (editingSchema) await schemas.update({ id: editingSchema.id, ...form });
              else await schemas.create(form);
              await schemas.refresh();
            } catch (e) {
              alert(e?.message || "Save failed");
            }
          }}
          onClose={() => {
            setModalType(null);
            setEditingSchema(null);
          }}
        />
      )}
    </div>
  );
}

export default function Playground() {
  const [panels, setPanels] = useState([Date.now()]);
  const { projectId: routeProjectId } = useParams(); // ✅ URL: /project/:projectId/playground
  const [resolvedId, setResolvedId] = useState(null);

  // URL > 세션 fallback 순서로 projectId 결정
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (routeProjectId) {
          if (!cancelled) setResolvedId(routeProjectId);
          return;
        }
        const session = await fetchSession();
        const firstOrg = session?.user?.organizations?.[0];
        const firstProject = firstOrg?.projects?.[0];
        if (!cancelled) setResolvedId(firstProject?.id || "");
      } catch (e) {
        console.error("projectId 결정 실패", e);
        if (!cancelled) setResolvedId("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeProjectId]);

  const addPanel = () => setPanels((prev) => [...prev, Date.now()]);
  const removePanel = (id) => {
    if (panels.length > 1) setPanels((prev) => prev.filter((x) => x !== id));
  };
  const resetPlayground = () => setPanels([Date.now()]);

  const runnersRef = useRef(new Map());
  const registerRunner = (id, fn) => {
    if (typeof fn === "function") runnersRef.current.set(id, fn);
    else runnersRef.current.delete(id);
  };

  const [runningAll, setRunningAll] = useState(false);
  const runAll = async () => {
    if (runningAll) return;
    setRunningAll(true);
    try {
      for (const id of panels) {
        const run = runnersRef.current.get(id);
        if (typeof run === "function") await run();
      }
    } finally {
      setRunningAll(false);
    }
  };

  // projectId 준비 전엔 로딩 UI
  if (resolvedId === null) return <p>Loading session…</p>;
  if (!resolvedId) return <p>No active project found.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.pageToolbar}>
        <span className={styles.windowInfo}>{panels.length} windows</span>
        <button className={styles.actionBtn} onClick={addPanel}>
          <Plus size={16} /> Add Panel
        </button>
        <button
          className={styles.actionBtn}
          onClick={runAll}
          disabled={runningAll}
          title="Ctrl + Enter"
        >
          <Play size={16} /> {runningAll ? "Running..." : "Run All (Ctrl + Enter)"}
        </button>
        <button className={styles.actionBtn} onClick={resetPlayground}>
          <RotateCcw size={16} /> Reset playground
        </button>
      </div>

      <div className={styles.mainGrid}>
        {panels.map((id) => (
          <PlaygroundComponent
            key={id}
            panelId={id}
            onRegisterRunner={registerRunner}
            onCopy={addPanel}
            onRemove={() => removePanel(id)}
            showRemoveButton={panels.length > 1}
            PROJECT_ID={resolvedId} // URL 우선 projectId 주입 (세션은 fallback)
          />
        ))}
      </div>
    </div>
  );
}

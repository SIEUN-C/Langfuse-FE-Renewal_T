import { useEffect, useMemo, useState } from "react";
import { listLlmConnections } from "../lib/llmConnections";

/* 1) 어댑터 별칭 → 표준 키 매핑 */
const ADAPTER_ALIAS = {
  "google-ai-studio": "vertex",
  "google-vertex-ai": "vertex",
  google: "vertex",
  gai: "vertex",
  azure: "azure-openai",          // 'azure'로만 오는 경우 대비
  azure_openai: "azure-openai",
  openai: "openai",
  anthropic: "anthropic",
  ollama: "ollama",
  kobold: "kobold",
};

/* 2) 표준 어댑터별 기본 모델 */
const DEFAULT_MODELS_BY_ADAPTER = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
  anthropic: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
  "azure-openai": ["gpt-4o", "gpt-4o-mini"],
  vertex: [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash-thinking-exp-01-21",
    "gemini-2.5-pro-preview-05-06",
    "gemini-2.5-flash-preview-05-20",
  ],
  ollama: ["llama3.1", "mistral-nemo", "qwen2.5"],
  kobold: [],
};

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(/[, \n]+/).filter(Boolean);
  return [];
}

function canonicalAdapter(adapter) {
  const key = String(adapter || "").toLowerCase();
  return ADAPTER_ALIAS[key] || key || "";
}

function normalizeConnection(row) {
  const adapterCanon = canonicalAdapter(row?.adapter);
  const custom = toArray(row?.customModels ?? row?.models);
  const wantsDefaults = !!(
    row?.withDefaultModels ??
    row?.useDefaultModels ??
    row?.enableDefaultModels
  );
  const defaults = wantsDefaults ? (DEFAULT_MODELS_BY_ADAPTER[adapterCanon] || []) : [];
  const merged = [...new Set([...custom, ...defaults])];

  return {
    ...row,
    adapter: adapterCanon,     // 표준화
    customModels: merged,      // ★ 드롭다운은 이 배열만 씀
  };
}

export default function useLlmConnections(projectId) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);

  useEffect(() => {
    if (!projectId) { setConnections([]); return; }
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const rows = await listLlmConnections(projectId, { abortController: ac });
        const normalized = (rows || []).map(normalizeConnection);
        setConnections(normalized);
      } catch (e) {
        if (!ac.signal.aborted) {
          setErr(e?.message || "Failed to load LLM connections");
          setConnections([]);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [projectId]);

  // 최초 기본 선택값
  const firstDefault = useMemo(() => {
    const first = (connections || [])[0];
    if (!first) return { provider: "", adapter: "", model: "" };
    return {
      provider: first.provider || "",
      adapter: first.adapter ?? "",
      model: first.customModels?.[0] ?? "",
    };
  }, [connections]);

  return { connections, loading, error, firstDefault };
}

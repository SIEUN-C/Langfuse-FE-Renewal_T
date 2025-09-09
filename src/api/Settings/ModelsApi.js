// src/Pages/Settings/lib/ModelsApi.js
import { pickSessionBase } from "./sessionOrg";

export const __MODELS_API_FLAVOR__ = "TRPC"; // 디버그용 표식

const { base: API_BASE } = pickSessionBase();
const trimTrail = (s) => s.replace(/\/+$/, "");
const toUrl = (p) => {
  if (!API_BASE) return `/api${p}`;
  if (API_BASE.startsWith("/")) return `${trimTrail(API_BASE)}${p}`;
  return `${trimTrail(API_BASE)}/api${p}`;
};

// tRPC GET: /api/trpc/{path}?input=<uri-encoded JSON>
function buildGetUrl(path, payload) {
  const input = encodeURIComponent(JSON.stringify({ json: payload }));
  return toUrl(`/trpc/${path}?input=${input}`);
}

async function getTrpc(path, payload, { signal } = {}) {
  // 디버그: 어떤 URL을 치는지 한 번만 찍기
  if (import.meta.env.DEV) {
    console.debug("[ModelsApi/TRPC] GET", path, payload);
  }
  const res = await fetch(buildGetUrl(path, payload), {
    method: "GET",
    credentials: "include",
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[tRPC GET] ${path} ${res.status} ${text}`);
  }
  const data = await res.json().catch(() => null);
  return data?.result?.data?.json ?? data?.json ?? data ?? null;
}

function clampLimit(n, def = 50) {
  const x = Number.isFinite(Number(n)) ? Number(n) : def;
  return Math.max(1, Math.min(100, x));
}

// 0-based page
export async function listModels(page = 0, limit = 50, projectId) {
  const safeLimit = clampLimit(limit, 50);
  const safePage = Math.max(0, Number(page) || 0);
  const pid = projectId || localStorage.getItem("projectId");
  if (!pid) throw new Error("[listModels] projectId is required");

  const json = await getTrpc("models.getAll", { page: safePage, limit: safeLimit, projectId: pid });
  if (!json || !Array.isArray(json.models)) throw new Error("[listModels] invalid response");
  return json; // { models, totalCount }
}

export async function listAllModels(limitPerPage = 50, projectId) {
  const pageSize = clampLimit(limitPerPage, 50);
  const first = await listModels(0, pageSize, projectId);
  const out = [...first.models];
  const total = Number(first.totalCount) || out.length;
  const totalPages = Math.ceil(total / pageSize);

  for (let p = 1; p < totalPages; p++) {
    const next = await listModels(p, pageSize, projectId);
    out.push(...next.models);
  }
  return out;
}

export async function getModel(id, projectId) {
  const all = await listAllModels(50, projectId);
  const hit = all.find((m) => m.id === id);
  if (!hit) throw new Error("[getModel] not found");
  return hit;
}

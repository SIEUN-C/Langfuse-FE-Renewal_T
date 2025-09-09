// src/Pages/Settings/lib/ModelsApi.trpc.js
import { pickSessionBase } from "./sessionOrg";
import superjson from "superjson";

export const __MODELS_API_FLAVOR__ = "TRPC";

const { base: API_BASE } = pickSessionBase();
const trim = (s) => s.replace(/\/+$/, "");
const toUrl = (p) => {
  if (!API_BASE) return `/api${p}`;
  if (API_BASE.startsWith("/")) return `${trim(API_BASE)}${p}`;
  return `${trim(API_BASE)}/api${p}`;
};

// tRPC helpers
const buildGetUrl = (path, payload) =>
  toUrl(`/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: payload }))}`);

async function getTrpc(path, payload, { signal } = {}) {
  const res = await fetch(buildGetUrl(path, payload), {
    method: "GET",
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error(`[tRPC GET] ${path} ${res.status} ${await res.text()}`);
  const data = await res.json().catch(() => null);
  return data?.result?.data?.json ?? data?.json ?? data ?? null;
}

async function postTrpc(path, payload, { signal } = {}) {
  const res = await fetch(toUrl(`/trpc/${path}`), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: payload }),
    signal,
  });
  if (!res.ok) throw new Error(`[tRPC POST] ${path} ${res.status} ${await res.text()}`);
  const data = await res.json().catch(() => null);
  return data?.result?.data?.json ?? data?.json ?? data ?? null;
}

const clamp = (n, def = 50) => Math.max(1, Math.min(100, Number.isFinite(+n) ? +n : def));

// lists (0-based page)
export async function listModels(page = 0, limit = 50, projectId) {
  const pid = projectId || localStorage.getItem("projectId");
  if (!pid) throw new Error("[listModels] projectId is required");
  const json = await getTrpc("models.getAll", { page: Math.max(0, +page || 0), limit: clamp(limit, 50), projectId: pid });
  if (!json || !Array.isArray(json.models)) throw new Error("[listModels] invalid response");
  return json; // { models, totalCount }
}

export async function listAllModels(limitPerPage = 50, projectId) {
  const pageSize = clamp(limitPerPage, 50);
  const first = await listModels(0, pageSize, projectId);
  const out = [...first.models];
  const totalPages = Math.ceil((+first.totalCount || out.length) / pageSize);
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

// Optional (서버에 있으면 사용)
export async function createModel(payload, projectId) {
  const pid = projectId || localStorage.getItem("projectId");
  return postTrpc("models.create", { ...payload, projectId: pid ?? null });
}

export async function deleteModel(id, projectId) {
  const pid = projectId || localStorage.getItem("projectId");
  return postTrpc("models.delete", { id, projectId: pid ?? null });
}

// 이미 있는 listModels(page, limit, projectId) 사용하면 됩니다.
// (0-based page 주의)
export async function listModelsPaged(page0, pageSize, projectId) {
  return listModels(page0, pageSize, projectId); // { models, totalCount }
}

// ──────────────────────────────────────
// tRPC helpers
// ──────────────────────────────────────
const trpcGet = async (path, input) => {
   // 1) SuperJSON 직렬화 (Date/undefined 보존)
   const serialized = superjson.serialize(input); // { json, meta }
   // 2) 세션/환경에 맞는 베이스 URL 사용
   const url = toUrl(`/trpc/${path}`) + `?input=${encodeURIComponent(JSON.stringify(serialized))}`;
   const res = await fetch(url, { credentials: "include" });
   const body = await res.json().catch(() => undefined);
   if (!res.ok || !body) {
     throw new Error(`[tRPC:${path}] HTTP ${res.status} ${JSON.stringify(body)}`);
   }
   // 3) 역직렬화
   const data = body?.result?.data;
   const deserialized = superjson.deserialize(data ?? { json: body });
   return deserialized?.json ?? deserialized;
 };


// ──────────────────────────────────────
// Generations: 목록 / 카운트
// ──────────────────────────────────────
export async function fetchGenerationsPage({
  projectId,
  modelId,                // 선택: 모델 상세에서만 사용
  page = 0,               // 0-based
  limit = 50,
  from,                   // ISO string, 예: new Date(Date.now()-7d).toISOString()
  to = null,              // ISO string or null
  environment = 'default' // string | string[]
}) {
  const filter = [
    { column: 'type', type: 'stringOptions', operator: 'any of', value: [
      'GENERATION','AGENT','TOOL','CHAIN','RETRIEVER','EVALUATOR','EMBEDDING','GUARDRAIL'
    ]},
    ...(from ? [{ column: 'Start Time', type: 'datetime', operator: '>=', value: from }] : []),
    ...(to   ? [{ column: 'Start Time', type: 'datetime', operator: '<=', value: to   }] : []),
    ...(modelId ? [{ column: 'Model ID', type: 'string', operator: '=', value: modelId }] : []),
    { column: 'environment', type: 'stringOptions', operator: 'any of',
      value: Array.isArray(environment) ? environment : [environment] },
  ];

  return await trpcGet('generations.all', {
    projectId,
    filter,
    searchQuery: null,
    searchType: ['id'],
    page,
    limit,
    orderBy: { column: 'startTime', order: 'DESC' },
  });
}

export async function fetchGenerationsCount({
  projectId,
  modelId,
  from,
  to = null,
  environment = 'default',
}) {
  const filter = [
    { column: 'type', type: 'stringOptions', operator: 'any of', value: [
      'GENERATION','AGENT','TOOL','CHAIN','RETRIEVER','EVALUATOR','EMBEDDING','GUARDRAIL'
    ]},
    ...(from ? [{ column: 'Start Time', type: 'datetime', operator: '>=', value: from }] : []),
    ...(to   ? [{ column: 'Start Time', type: 'datetime', operator: '<=', value: to   }] : []),
    ...(modelId ? [{ column: 'Model ID', type: 'string', operator: '=', value: modelId }] : []),
    { column: 'environment', type: 'stringOptions', operator: 'any of',
      value: Array.isArray(environment) ? environment : [environment] },
  ];

  return await trpcGet('generations.countAll', {
    projectId,
    filter,
    searchQuery: null,
    searchType: ['id'],
    page: 0,
    limit: 0,
    orderBy: null,
  });
}

// ──────────────────────────────────────
// Scores: 점수 컬럼 조회
// ──────────────────────────────────────
export async function fetchScoreColumns({ projectId, from, to }) {
  return await trpcGet("scores.getScoreColumns", {
    projectId,
    filter: [{ type: "null", column: "observationId", operator: "is not null", value: "" }],
    fromTimestamp: from ? new Date(from) : undefined, // Date 객체
    toTimestamp: to ? new Date(to) : undefined,
  });
}


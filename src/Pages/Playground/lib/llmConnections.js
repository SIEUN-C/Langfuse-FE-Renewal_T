import { pickSessionBase } from "../../Settings/lib/sessionOrg"; // 경로 확인
const { base: API_BASE, absolute: API_ABS } = pickSessionBase();
const trimTrail = (s) => s.replace(/\/+$/, "");
const toUrl = (p) => {
  // p는 항상 "/trpc/..." 형태로만 넘긴다
  if (!API_BASE) return p; // "" → "/trpc/..."
  if (API_BASE.startsWith("/")) {
    // 상대 베이스: "/api" + "/trpc/..." → "/api/trpc/..."
    return `${trimTrail(API_BASE)}${p}`;
  }
  // 절대 베이스: "http://.../api" + "/trpc/..." → "http://.../api/trpc/..."
  return `${trimTrail(API_BASE)}/api${p}`;
};

// ─────────────────────────────────────────────────────────────
// tRPC: Query=GET, Mutation=POST
//   GET  /api/trpc/{path}?input=<uri-encoded JSON>
//   POST body: { json: payload }
// ─────────────────────────────────────────────────────────────

function buildGetUrl(path, payload) {
  const input = encodeURIComponent(JSON.stringify({ json: payload }));
  return toUrl(`/trpc/${path}?input=${input}`);
}

// Query (GET)
async function getTrpc(path, payload, { abortController } = {}) {
  const res = await fetch(buildGetUrl(path, payload), {
    method: "GET",
    credentials: "include",
    signal: abortController?.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`tRPC GET failed: ${path} (${res.status}) ${text}`);
  }
  const data = await res.json().catch(() => null);
  return data?.result?.data?.json ?? data?.json ?? data ?? null;
}

// Mutation (POST)
async function postTrpc(path, payload, { abortController } = {}) {
  const headers = { "content-type": "application/json" };
  const body = (x) => ({
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(x),
    signal: abortController?.signal,
  });

  // 포맷 A
  let res = await fetch(toUrl(`/trpc/${path}`), body({ json: payload }));
  if (!res.ok) {
    // 호환 포맷 B
    res = await fetch(toUrl(`/trpc/${path}`), body({ json: { method: path, params: payload } }));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`tRPC POST failed: ${path} (${res.status}) ${text}`);
  }
  const data = await res.json().catch(() => null);
  return data?.result?.data?.json ?? data?.json ?? data ?? null;
}

/** 목록 조회 (Query → GET) */
export async function listLlmConnections(projectId, { abortController } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const json = await getTrpc("llmApiKey.all", { projectId }, { abortController });
  return Array.isArray(json) ? json : (json?.data ?? []);
}

/** 생성/수정 (Mutation → POST) */
export async function upsertLlmConnection(data, { projectId, abortController } = {}) {
  if (!projectId) throw new Error("projectId is required");

  const hasId = !!data.id;
  const method = hasId ? "llmApiKey.update" : "llmApiKey.create";

  // 값 정리: 빈 문자열/빈 객체/undefined는 보내지 않음
  const baseURL =
    (data.baseURL ?? data.baseUrl ?? "").trim();
  const secretKey =
    (data.secretKey ?? data.apiKey ?? "").trim();
  const extraHeaders =
    data.extraHeaders && typeof data.extraHeaders === "object"
      ? data.extraHeaders
      : null;
  const customModels = Array.isArray(data.customModels) ? data.customModels : null;
  const withDefaultModels =
    data.withDefaultModels ?? data.useDefaultModels ?? data.enableDefaultModels;

  const payload = {
    projectId,
    ...(hasId ? { id: data.id } : {}),
    // 필수/주요 필드
    adapter: data.adapter,
    provider: data.provider,
    // 선택 필드: 값이 있을 때만 포함
    ...(baseURL ? { baseURL } : {}),
    ...(secretKey ? { secretKey } : {}),           // ★ 빈 문자열이면 미포함 → 기존 키 유지
    ...(extraHeaders && Object.keys(extraHeaders).length ? { extraHeaders } : {}),
    ...(customModels && customModels.length ? { customModels } : {}),
    ...(typeof withDefaultModels === "boolean" ? { withDefaultModels } : {}),
  };

  return postTrpc(method, payload, { abortController });
}

/** 삭제 (Mutation → POST) */
export async function deleteLlmConnection(id, { projectId, abortController } = {}) {
  if (!projectId) throw new Error("projectId is required");
  if (!id) throw new Error("id is required");
  return postTrpc("llmApiKey.delete", { projectId, id }, { abortController });
}

/** 어댑터별 지원 모델 맵 조회 (서버의 최신 목록) */
export async function listSupportedModels({ abortController } = {}) {
  const json = await getTrpc("llmModels.supported", {}, { abortController });
  return json && typeof json === "object" ? json : {};
}
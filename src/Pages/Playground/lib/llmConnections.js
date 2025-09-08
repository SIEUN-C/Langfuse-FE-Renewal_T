// ─────────────────────────────────────────────────────────────
// tRPC: Query=GET, Mutation=POST
//   GET  /api/trpc/{path}?input=<uri-encoded JSON>
//   POST body: { json: payload }
// ─────────────────────────────────────────────────────────────

function buildGetUrl(path, payload) {
  const input = encodeURIComponent(JSON.stringify({ json: payload }));
  return `/api/trpc/${path}?input=${input}`;
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
  let res = await fetch(`/api/trpc/${path}`, body({ json: payload }));
  if (!res.ok) {
    // 호환 포맷 B
    res = await fetch(`/api/trpc/${path}`, body({ json: { method: path, params: payload } }));
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
  const payload = {
    projectId,
    adapter: data.adapter,
    provider: data.provider,
    baseURL: data.baseURL || data.baseUrl || undefined,
    secretKey: data.secretKey || data.apiKey,
    extraHeaders: data.extraHeaders || {},
    customModels: Array.isArray(data.customModels) ? data.customModels : [],
    withDefaultModels: !!(data.withDefaultModels ?? data.useDefaultModels ?? data.enableDefaultModels),
  };
  return postTrpc("llmApiKey.upsert", payload, { abortController });
}

/** 삭제 (Mutation → POST) */
export async function deleteLlmConnection(id, { projectId, abortController } = {}) {
  if (!projectId) throw new Error("projectId is required");
  if (!id) throw new Error("id is required");
  return postTrpc("llmApiKey.delete", { projectId, id }, { abortController });
}

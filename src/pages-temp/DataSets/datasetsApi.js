// src/Pages/Evaluation/DataSets/datasetsApi.js

const RAW_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && (
    import.meta.env.VITE_LANGFUSE_BASE_URL ||
    import.meta.env.VITE_LF_BASE_URL ||
    import.meta.env.VITE_API_URL
  )) ||
  (typeof process !== "undefined" && process.env && (
    process.env.VITE_LANGFUSE_BASE_URL ||
    process.env.VITE_LF_BASE_URL ||
    process.env.VITE_API_URL
  )) ||
  "";

const PK =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LANGFUSE_PUBLIC_KEY) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_LANGFUSE_PUBLIC_KEY) ||
  "";
const SK =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LANGFUSE_SECRET_KEY) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_LANGFUSE_SECRET_KEY) ||
  "";
const BEARER =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LANGFUSE_BEARER) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_LANGFUSE_BEARER) ||
  "";

try {
  const u = new URL(RAW_BASE);
  if (typeof location !== "undefined" && location.port === "5173" && u.port === "5173") {
    throw new Error(
      "[Datasets API] BASE가 프론트(dev) 서버(5173)입니다. 실제 백엔드 주소(VITE_LANGFUSE_BASE_URL 등)를 넣거나 vite proxy를 설정하세요."
    );
  }
} catch {
  // 상대경로라면 통과
}

export const BASE = String(RAW_BASE || "").replace(/\/+$/, "");
console.info("[Datasets API] BASE =", BASE);

function headers(extra) {
  let auth = {};
  if (PK && SK) {
    const token =
      typeof btoa === "function" ? btoa(`${PK}:${SK}`) : Buffer.from(`${PK}:${SK}`).toString("base64");
    auth = { Authorization: `Basic ${token}` };
  } else if (BEARER) {
    auth = { Authorization: `Bearer ${BEARER}` };
  }
  return { "Content-Type": "application/json", Accept: "application/json", ...auth, ...(extra || {}) };
}

async function readJSON(r) {
  if (r.status === 204) return undefined;
  try {
    return await r.json();
  } catch {
    return undefined;
  }
}

function toArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const arr = [payload?.data, payload?.items, payload?.results, payload?.datasets].find(Array.isArray);
  return arr || [];
}

function normalizePayload(p) {
  if (!p) return p;
  const out = { ...p };
  if (typeof out.metadata === "string") {
    const raw = out.metadata.trim();
    if (
      (raw.startsWith("{") && raw.endsWith("}")) ||
      (raw.startsWith("[") && raw.endsWith("]")) ||
      /^-?\d+(\.\d+)?$/.test(raw)
    ) {
      try { out.metadata = JSON.parse(raw); } catch { }
    }
  }
  return out;
}

// ---------- Datasets ----------
export async function getDatasets() {
  const res = await fetch(`${BASE}/api/public/v2/datasets`, { headers: headers() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(`getDatasets ${res.status}`);
  return toArray(data);
}

export async function getDataset(nameOrId) {
  const res = await fetch(`${BASE}/api/public/v2/datasets/${encodeURIComponent(nameOrId)}`, { headers: headers() });
  if (!res.ok) return null;
  const data = await readJSON(res);
  return data || null;
}

export async function createDataset(payload) {
  const res = await fetch(`${BASE}/api/public/v2/datasets`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(normalizePayload(payload)),
  });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(`createDataset ${res.status} ${JSON.stringify(data || {})}`);
  const arr = toArray(data);
  return arr[0] || data || { id: "", name: String(payload?.name || "") };
}

export async function updateDataset(idOrName, payload) {
  const body = JSON.stringify(normalizePayload(payload));
  const url = `${BASE}/api/public/v2/datasets/${encodeURIComponent(idOrName)}`;

  const tries = [
    () => fetch(url, { method: "PATCH", headers: headers(), body }),
    () => fetch(url, { method: "PUT", headers: headers(), body }),
    () => fetch(url, { method: "POST", headers: headers({ "X-HTTP-Method-Override": "PATCH" }), body }),
    () => fetch(`${url}?_method=PATCH`, { method: "POST", headers: headers(), body }),
  ];

  for (const fn of tries) {
    const r = await fn();
    if (r.ok || r.status === 204) {
      const json = await readJSON(r);
      return json || { id: idOrName, ...(payload || {}) };
    }
  }

  const last = await tries[tries.length - 1]();
  const text = await last.text().catch(() => "");
  throw new Error(`updateDataset failed: ${last.status} ${last.statusText} ${text}`);
}

export async function deleteDatasetHard(nameOrId) {
  const url = `${BASE}/api/public/v2/datasets/${encodeURIComponent(nameOrId)}`;
  const tries = [
    () => fetch(url, { method: "DELETE", headers: headers() }),
    () => fetch(url, { method: "POST", headers: headers({ "X-HTTP-Method-Override": "DELETE" }), body: "{}" }),
    () => fetch(`${url}?_method=DELETE`, { method: "POST", headers: headers(), body: "{}" }),
  ];

  for (const fn of tries) {
    const r = await fn();
    if (r.ok || r.status === 204) return "deleted";
    if (r.status === 404) return "not_found";
  }

  const last = await tries[tries.length - 1]();
  const txt = await last.text().catch(() => "");
  throw new Error(`deleteDatasetHard failed: ${last.status} ${txt}`);
}

// ---------- Dataset Items ----------
export async function listDatasetItems(datasetName) {
  const url = `${BASE}/api/public/dataset-items?datasetName=${encodeURIComponent(datasetName)}`;
  const res = await fetch(url, { headers: headers() });
  const data = await readJSON(res);
  if (!res.ok) throw new Error(`listDatasetItems ${res.status}`);
  return data?.data || [];
}

export async function upsertDatasetItem(payload) {
  const res = await fetch(`${BASE}/api/public/dataset-items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`upsertDatasetItem ${res.status} ${text}`);
  }
}

export async function createDatasetItems(datasetName, items) {
  const payloads = items.map(item => ({
    datasetName: datasetName,
    input: item.input,
    expectedOutput: item.expectedOutput,
    metadata: item.metadata,
  }));
  await Promise.all(payloads.map(payload => upsertDatasetItem(payload)));
}

export async function deleteDatasetItem(itemId) {
  const res = await fetch(`${BASE}/api/public/dataset-items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(`deleteDatasetItem ${res.status} ${text}`);
  }
}

// ---------- Dataset Runs ----------
export async function listDatasetRuns(datasetName) {
  const res = await fetch(
    `${BASE}/api/public/datasets/${encodeURIComponent(datasetName)}/runs`,
    { headers: headers() }
  );
  const data = await readJSON(res);
  if (!res.ok) throw new Error(`listDatasetRuns ${res.status}`);
  return toArray(data);
}

// ---------- 고급 유틸 ----------
export async function renameDatasetByCopy(oldName, newName, description, metadata) {
  await createDataset({ name: newName, description, metadata });
  const items = await listDatasetItems(oldName);
  if (items && items.length > 0) {
    await createDatasetItems(newName, items.map(it => ({
      input: it.input,
      expectedOutput: it.expectedOutput,
      metadata: it.metadata,
      status: it.status,
    })));
  }
  await deleteDatasetHard(oldName);
}
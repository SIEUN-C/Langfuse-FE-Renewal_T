// src/Pages/Settings/lib/trpc.js

const CANDIDATE_BASES = [
  import.meta.env.VITE_API_BASE,     // 예: http://localhost:3000
  window.__API_BASE__,
].filter(Boolean);

function pickApiBase() {
  // 설정이 없으면 same-origin(=기존 상대경로) 모드
  const base = CANDIDATE_BASES[0];
  if (!base) return { base: "", absolute: false };

  try {
    const target = new URL(base);
    const here = window.location;
    const sameOrigin =
      target.protocol === here.protocol &&
      target.hostname === here.hostname &&
      String(target.port || "") === String(here.port || "");

    return { base, absolute: !sameOrigin };
  } catch {
    return { base: "", absolute: false };
  }
}

const { base: API_BASE, absolute: USE_ABSOLUTE } = pickApiBase();

function toUrl(path) {
  return USE_ABSOLUTE ? `${API_BASE}${path}` : path; // 🔒 기본은 기존 상대경로
}

function encodeInput(input) {
  return encodeURIComponent(JSON.stringify({ json: input })); // 기존 포맷 유지
}

async function doFetch(path, init) {
  const res = await fetch(toUrl(path), {
    ...init,
    credentials: "include",
    ...(USE_ABSOLUTE ? { mode: "cors" } : {}),
    headers: {
      ...(init?.headers || {}),
      "x-csrf-token": window.__CSRF_TOKEN__ || "",
    },
  });
  return res;
}

export async function trpcQuery(procedure, input) {
  const path = input
    ? `/api/trpc/${procedure}?input=${encodeInput(input)}`
    : `/api/trpc/${procedure}`;

  const res = await doFetch(path, { method: "GET" });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `tRPC query failed: ${procedure}`;
    throw new Error(`${msg} (HTTP ${res.status} ${res.statusText})`);
  }
  return data?.result?.data?.json; // 기존 파싱 유지
}

export async function trpcMutation(procedure, input) {
  // try #1: {"json": input}
  {
    const res = await doFetch(`/api/trpc/${procedure}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: input }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.result?.data?.json !== undefined) return data.result.data.json;

    const code = data?.error?.json?.code ?? data?.error?.code ?? data?.error?.json?.data?.code;
    if (code && code !== -32600 && code !== "BAD_REQUEST") {
      throw new Error(data?.error?.message || `tRPC mutation failed: ${procedure}`);
    }
  }

  // try #2: {"input":{"json": input}}
  {
    const res = await doFetch(`/api/trpc/${procedure}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: { json: input } }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.result?.data?.json !== undefined) return data.result.data.json;

    const code = data?.error?.json?.code ?? data?.error?.code ?? data?.error?.json?.data?.code;
    if (code && code !== -32600 && code !== "BAD_REQUEST") {
      throw new Error(data?.error?.message || `tRPC mutation failed: ${procedure}`);
    }
  }

  // try #3: batch
  {
    const res = await doFetch(`/api/trpc/${procedure}?batch=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 0: { json: input } }),
    });
    const data = await res.json().catch(() => null);
    const first = Array.isArray(data) ? data[0] : data?.[0];
    const payload = first?.result?.data?.json ?? data?.result?.data?.json;
    if (res.ok && payload !== undefined) return payload;

    const msg =
      (Array.isArray(data) ? first?.error?.message : data?.error?.message) ||
      "tRPC mutation failed (all formats tried)";
    throw new Error(msg);
  }
}

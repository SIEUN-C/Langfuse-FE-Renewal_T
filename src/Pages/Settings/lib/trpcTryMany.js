// src/Pages/Settings/lib/trpcTryMany.js
// --- base URL 결정 로직을 trpc.js와 맞춤 ---
 const RAW_BASE = import.meta?.env?.VITE_API_BASE || window.__API_BASE__ || "";
 function pickBase() {
   if (!RAW_BASE) return { base: "", absolute: false };
   try {
     // '/api' 같은 상대 입력이면 그대로 사용(absolute=false)
     if (RAW_BASE.startsWith("/")) return { base: RAW_BASE.replace(/\/$/, ""), absolute: false };
     const t = new URL(RAW_BASE);
     const here = window.location;
     const sameOrigin =
       t.protocol === here.protocol &&
       t.hostname === here.hostname &&
       String(t.port || "") === String(here.port || "");
     return { base: RAW_BASE.replace(/\/$/, ""), absolute: !sameOrigin };
   } catch {
     return { base: "", absolute: false };
   }
 }
 const { base: API_BASE, absolute: USE_ABSOLUTE } = pickBase();
 const toUrl = (p) => (USE_ABSOLUTE ? `${API_BASE}${p}` : p);
 // 항상 /api/trpc 프리픽스를 사용
 const TRPC_PREFIX = "/api/trpc";

/** httpLink/BatchLink 모두 지원하는 tRPC 호출 (POST) */
export async function callTrpc(path, input, { signal } = {}) {
  const url = toUrl(`${TRPC_PREFIX}/${path}`);
  const headers = { "Content-Type": "application/json" };

  // 1) 단건 포맷 { id, json }
  let res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ id: 1, json: input }),
    signal,
  });

  // 2) 실패 시 배치 포맷 [{ id, json }] 재시도
  if (!res.ok) {
    res = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify([{ id: 1, json: input }]),
      signal,
    });
  }

  const data = await res.json().catch(() => ({}));

  // 에러 추출(단건/배치 공통)
  const err = data?.error?.json || data?.[0]?.error?.json;
  if (err) {
    const msg = err?.message || `tRPC error on ${path}`;
    throw new Error(msg);
  }

  // 결과 추출(단건/배치 공통)
  return data?.result?.data?.json ?? data?.[0]?.result?.data?.json ?? null;
}

/** 여러 후보 뮤테이션을 순차 시도(404/BAD_REQUEST는 다음 후보로) */
export async function trpcTryManyMutation(candidates, input) {
  let lastErr;
  for (const proc of candidates) {
    try {
      // 후보는 "organizations.create" 이런 문자열이라고 가정
      return await callTrpc(proc, input);
    } catch (e) {
      const msg = e?.message || "";
      const is404 = /404|Not Found/i.test(msg);
      const isBadReq = /BAD_REQUEST|-32600/i.test(msg);
      if (!is404 && !isBadReq) throw e;
      lastErr = e;
    }
  }
  throw lastErr || new Error("All candidate mutations failed");
}


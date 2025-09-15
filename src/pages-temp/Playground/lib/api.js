// src\Pages\Playground\lib\api.js
// 5173 → 3000 교차 도메인에서도 세션 쿠키가 전달되도록 fetch 래퍼
// - credentials: 'include' 필수
// - BASE는 .env 에서 VITE_BACKEND_ORIGIN=http://localhost:3000 로 주거나 기본값 사용

const BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_BACKEND_ORIGIN) ||
  "http://localhost:3000";

async function handle(res) {
  // tRPC/Next 응답은 대부분 JSON
  const ctype = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = ctype.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
    const msg = typeof text === "string" ? text : JSON.stringify(text);
    throw new Error(`[${res.status}] ${msg || "Request failed"}`);
  }
  if (ctype.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

export const api = {
  get: async (url, opts = {}) => {
    const target = url.startsWith("http") ? url : `${BASE}${url}`;
    const res = await fetch(target, {
      method: "GET",
      credentials: "include", // ← 세션 쿠키(3000번) 전달
      headers: {
        ...(opts.headers || {}),
      },
      signal: opts.signal,
    });
    return handle(res);
  },

  post: async (url, body, opts = {}) => {
    const target = url.startsWith("http") ? url : `${BASE}${url}`;
    const headers = { ...(opts.headers || {}) };
    // FormData가 아니면 JSON 헤더
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (!isFormData) headers["content-type"] = "application/json";

    const res = await fetch(target, {
      method: "POST",
      credentials: "include", // ← 세션 쿠키(3000번) 전달
      headers,
      body: isFormData ? body : JSON.stringify(body ?? {}),
      signal: opts.signal,
    });
    return handle(res);
  },
};

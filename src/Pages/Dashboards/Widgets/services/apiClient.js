// src/Pages/Widget/services/apiClient.js
function unwrapTRPC(json) {
    // tRPC 표준: result.data.json → data.json → data
    if (!json) return json;
    if (json?.result?.data?.json != null) return json.result.data.json;
    if (json?.result?.data != null) return json.result.data;
    return json;
  }
  
  export class ApiClient {
    constructor() {
      this.projectId = import.meta.env.VITE_LANGFUSE_PROJECT_ID || "";
      // dev(5173)에서는 Vite proxy 사용 → baseURL 공백
      this.baseURL = import.meta.env.DEV
        ? ""
        : import.meta.env.VITE_LANGFUSE_BASE_URL || "http://localhost:3000";
      this.publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || "";
      this.secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY || "";
    }
  
    /**
     * tRPC GET
     * - dev: 쿠키 세션 사용 (credentials: "include")
     * - prod: 동일 도메인이면 그대로, 크로스 도메인이면 서버 설정에 따라 세션 전달
     * - Authorization 헤더는 기본 비활성(NextAuth 세션 사용). 필요 시 opts.useBasic = true
     */
    async trpcGet(endpoint, params = {}, opts = { useBasic: false }) {
      const url = `${this.baseURL}/api/trpc/${endpoint}`;
      const input = { json: params.projectId ? params : { ...params, projectId: this.projectId } };
      const query = new URLSearchParams({ input: JSON.stringify(input) });
  
      const headers = { "Content-Type": "application/json" };
      if (opts.useBasic && this.publicKey && this.secretKey) {
        headers.Authorization = `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`;
      }
  
      const res = await fetch(`${url}?${query}`, {
        method: "GET",
        headers,
        credentials: "include", // 🔑 dev에서 세션 쿠키 전달
      });
  
      if (!res.ok) {
        let msg = `GET ${endpoint} failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.error?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      return unwrapTRPC(data);
    }
  
    /**
     * tRPC POST
     * - 기본적으로 세션 쿠키 사용
     * - 필요 시 opts.useBasic = true 로 Basic 인증 사용 가능
     */
    async trpcPost(endpoint, payload = {}, opts = { useBasic: false }) {
      const url = `${this.baseURL}/api/trpc/${endpoint}`;
      const headers = { "Content-Type": "application/json" };
      if (opts.useBasic && this.publicKey && this.secretKey) {
        headers.Authorization = `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`;
      }
  
      const res = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          json: { ...payload, projectId: payload.projectId || this.projectId },
        }),
      });
  
      if (!res.ok) {
        let msg = `POST ${endpoint} failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.error?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json().catch(() => ({}));
      return unwrapTRPC(data);
    }
  
    // 필요 시 직접 메서드 지정 호출 (REST 스타일) — 기본은 trpcGet/ trpcPost 사용 권장
    async callTRPCAsREST(endpoint, method, payload, opts = { useBasic: false }) {
      const url = `${this.baseURL}/api/trpc/${endpoint}`;
      const headers = { "Content-Type": "application/json" };
      if (opts.useBasic && this.publicKey && this.secretKey) {
        headers.Authorization = `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`;
      }
  
      const res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: JSON.stringify({ json: payload }),
      });
  
      if (!res.ok) throw new Error(`${method} ${endpoint} failed: ${res.statusText}`);
      const data = await res.json();
      return unwrapTRPC(data);
    }
  }
  
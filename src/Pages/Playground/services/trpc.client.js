// src/Pages/Playground/services/trpc.client.js

/**
 * tRPC v10 HTTP 클라이언트 (Playground 전용)
 * ------------------------------------------------------------
 * 서버 어댑터(Next 등)가 노출하는 tRPC 엔드포인트 규약:
 *  - Query(읽기):   GET  /api/trpc/<proc>?input={"json":{...}}
 *  - Mutation(쓰기): POST /api/trpc/<proc>  body: {"json":{...}}
 *
 * 중요:
 *  - POST 에는 절대 ?input= 을 붙이지 마세요. 일부 라우터에서 400 발생합니다.
 *  - 응답은 보통 {"result":{"data":{"json":<payload>}}} 형태라서 unwrap 필요.
 *  - fetch는 credentials: "include" 로 쿠키 세션을 유지합니다.
 *  - Vite 프록시가 /api -> 3000 으로 연결되어 있어야 합니다.
 *
 * 권장 사용 패턴:
 *  - 컴포넌트/훅에서는 trpcQuery/trpcMutation을 직접 쓰지 말고,
 *    도메인별 services (tools.service.js, schemas.service.js, llm.service.js)에서만 사용.
 *  - 전역에 다른 tRPC 클라이언트를 두지 말고, 이 파일 하나만 사용(드리프트 방지).
 */

 /**
  * 응답 언랩퍼: tRPC v10 응답에서 실제 payload만 꺼냅니다.
  * 서버/버전 차이에 따라 result.data 또는 result.data.json 까지 존재할 수 있습니다.
  */
 export function unwrapTrpcJson(j) {
    return j?.result?.data?.json ?? j?.result?.data ?? j;
  }
  
  /**
   * tRPC input 포맷을 쿼리스트링으로 변환합니다.
   * tRPC는 input을 반드시 {"json": ...} 래핑한 뒤 JSON으로 전달해야 합니다.
   */
  function qs(input) {
    return encodeURIComponent(JSON.stringify({ json: input ?? {} }));
  }
  
  /**
   * tRPC Query (GET)
   * @param {string} proc - 예: "llmTools.getAll"
   * @param {object} input - 프로시저 input 객체
   * @param {{signal?: AbortSignal}} [options]
   * @returns {Promise<any>} unwrapped payload
   * @throws {Error} 401 또는 HTTP 에러
   */
  export async function trpcQuery(proc, input, { signal } = {}) {
    const r = await fetch(`/api/trpc/${proc}?input=${qs(input)}`, {
      method: "GET",
      credentials: "include", // 쿠키 세션 유지
      signal,
    });
    if (r.status === 401) {
      throw new Error("401 Unauthorized — 로그인/쿠키 또는 프로젝트 멤버십/프록시 확인");
    }
    if (!r.ok) {
      throw new Error(`tRPC query failed: ${proc} (${r.status})`);
    }
    const j = await r.json().catch(() => ({}));
    return unwrapTrpcJson(j);
  }
  
  /**
   * tRPC Mutation (POST)
   * @param {string} proc - 예: "llmTools.create"
   * @param {object} input - 프로시저 input 객체
   * @param {{signal?: AbortSignal, csrfToken?: string}} [options]
   * @returns {Promise<any>} unwrapped payload
   * @throws {Error} 401 또는 HTTP 에러(본문의 message가 있으면 우선 사용)
   *
   * 주의:
   *  - POST는 body에 {"json": ...} 로 넣습니다. (?input= X)
   *  - 서버가 CSRF 토큰을 요구하는 경우 options.csrfToken을 헤더로 전달하세요.
   */
  export async function trpcMutation(proc, input, { signal, csrfToken } = {}) {
    const headers = { "content-type": "application/json" };
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
  
    const r = await fetch(`/api/trpc/${proc}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ json: input ?? {} }), // ✅ POST는 body로 전달
      signal,
    });
    if (r.status === 401) {
      throw new Error("401 Unauthorized — 로그인/쿠키 또는 프로젝트 멤버십/프록시 확인");
    }
    if (!r.ok) {
      let msg = `tRPC mutation failed: ${proc} (${r.status})`;
      try {
        const j = await r.json();
        msg = j?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }
    const j = await r.json().catch(() => ({}));
    return unwrapTrpcJson(j);
  }
  
  /**
   * Domain helper 예시: LLM 연결 목록 (llmApiKey.all)
   * - 서버 버전에 따라 payload가 배열 또는 { data: [] } 형태일 수 있어 안전하게 처리합니다.
   * - 필요한 도메인 헬퍼들은 별도 파일(예: llm.service.js)로 분리해도 좋습니다.
   */
  export async function llmApiKeyAll(projectId, opts = {}) {
    if (!projectId) return [];
    const ac = opts.abortController || new AbortController();
    const payload = await trpcQuery("llmApiKey.all", { projectId }, { signal: ac.signal });
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  }
  
  /**
   * 사용 예 (도메인 서비스 안에서):
   *
   * // tools.service.js
   * import { trpcQuery, trpcMutation } from "./trpc.client";
   * export const ToolsAPI = {
   *   async list(projectId) {
   *     const p = await trpcQuery("llmTools.getAll", { projectId });
   *     return Array.isArray(p) ? p : (p?.data ?? []);
   *   },
   *   create(projectId, input)  { return trpcMutation("llmTools.create", { projectId, ...input }); },
   *   update(projectId, input)  { return trpcMutation("llmTools.update", { projectId, ...input }); },
   *   delete(projectId, id)     { return trpcMutation("llmTools.delete", { projectId, id }); },
   * };
   *
   * 팁:
   *  - 네트워크 취소가 필요하면 AbortController를 만들어 options.signal로 전달하세요.
   *  - 스트리밍(SSE/서버 푸시) 엔드포인트는 이 래퍼 대신 별도 구현을 고려하세요.
   */
  
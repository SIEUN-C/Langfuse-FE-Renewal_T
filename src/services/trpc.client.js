// /src/services/trpc.client.js
/**
 * tRPC v10 HTTP Client (공용 코어 유틸)
 * ==========================================================
 * 목적:
 *  - 프로젝트 전역에서 tRPC 엔드포인트를 "fetch" 기반으로 호출할 때
 *    반복되는 보일러플레이트(쿼리스트링 포맷, 응답 언랩, 에러 처리)를 공통화.
 *
 * 전제:
 *  - Vite devServer proxy:  /api  -> http://localhost:3000  (Langfuse 백엔드)
 *  - 인증은 쿠키 세션 기반이므로 fetch 옵션에 credentials: "include" 필요
 *
 * tRPC HTTP 규약(Next.js adapter 기준):
 *  - Query(읽기):   GET  /api/trpc/<procedure>?input={"json":{...}}
 *  - Mutation(쓰기): POST /api/trpc/<procedure>  body: {"json":{...}}
 *    ※ POST에는 ?input= 를 붙이지 않는다(일부 라우터에서 400).
 *
 * 응답 포맷:
 *  - 보통 {"result":{"data":{"json":<payload>}}} 이며,
 *    서버/버전에 따라 {"result":{"data":<payload>}} 까지도 존재 → unwrapTrpcJson가 처리.
 *
 * 사용 가이드:
 *  - 컴포넌트에서는 trpcQuery/trpcMutation을 바로 쓰지 말고,
 *    각 도메인 전용 서비스(예: /pages/Playground/services/PlaygroundTrpcApi.js,
 *    /pages/Tracing/services/TracingTrpcApi.js)에서만 import/사용.
 *  - 이렇게 하면 도메인 레이어가 명확해지고, 교체·확장도 쉬움.
 */

export function unwrapTrpcJson(j) {
    // 서버/버전에 따라 result.data 또는 result.data.json
    return j?.result?.data?.json ?? j?.result?.data ?? j;
}

/** tRPC input 포맷을 쿼리스트링으로 변환(항상 {"json": ...}로 감싸야 함) */
function qs(input) {
    return encodeURIComponent(JSON.stringify({ json: input ?? {} }));
}

/**
 * tRPC Query (GET)
 * @param {string} proc  - 예: "traces.getAgentGraphData"
 * @param {object} input - procedure input object
 * @param {{signal?: AbortSignal, headers?: Record<string,string>}} [options]
 * @returns {Promise<any>} unwrapped payload
 */
export async function trpcQuery(proc, input, { signal, headers } = {}) {
    const r = await fetch(`/api/trpc/${proc}?input=${qs(input)}`, {
        method: "GET",
        credentials: "include",
        signal,
        headers, // 필요 시 확장 헤더
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
 * @param {string} proc  - 예: "llmTools.create"
 * @param {object} input - procedure input object
 * @param {{signal?: AbortSignal, csrfToken?: string, headers?: Record<string,string>}} [options]
 * @returns {Promise<any>} unwrapped payload
 */
export async function trpcMutation(proc, input, { signal, csrfToken, headers } = {}) {
    const h = { "content-type": "application/json", ...(headers || {}) };
    if (csrfToken) h["x-csrf-token"] = csrfToken;

    const r = await fetch(`/api/trpc/${proc}`, {
        method: "POST",
        credentials: "include",
        headers: h,
        body: JSON.stringify({ json: input ?? {} }), // ✅ POST는 body로
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
        } catch { }
        throw new Error(msg);
    }
    const j = await r.json().catch(() => ({}));
    return unwrapTrpcJson(j);
}

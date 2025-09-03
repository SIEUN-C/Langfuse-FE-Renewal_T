// src/Pages/Settings/lib/trpc.js

// Query는 건들지 말자: 기존에 되던 포맷 유지
function encodeInput(input) {
  return encodeURIComponent(JSON.stringify({ json: input })); // ← 기존이 이랬다면 그대로
}

export async function trpcQuery(procedure, input) {
  const url = input
    ? `/api/trpc/${procedure}?input=${encodeInput(input)}`
    : `/api/trpc/${procedure}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "x-csrf-token": window.__CSRF_TOKEN__ || "",
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `tRPC query failed: ${procedure}`;
    // 상태 코드/텍스트를 붙여서 상위 훅이 404를 감지할 수 있게 함
    throw new Error(`${msg} (HTTP ${res.status} ${res.statusText})`);
  }
  return data?.result?.data?.json;
}

/**
 * Mutation은 호환 순차 시도:
 *   1) { json: input }      // v10/v11 비배치에서 가장 흔함
 *   2) { input: { json: ... } } // 일부 커스텀 서버
 *   3) 배치 모드 ?batch=1  // Next.js tRPC 배치
 *
 * 어떤 것도 안 먹히면 마지막 에러를 그대로 던짐
 */
export async function trpcMutation(procedure, input) {
  const csrf = window.__CSRF_TOKEN__ || "";

  // try #1: {"json": input}
  {
    const res = await fetch(`/api/trpc/${procedure}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ json: input }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.result?.data?.json !== undefined) return data.result.data.json;

    // -32600(BAD_REQUEST) 류면 다음 포맷 시도, 그 외는 바로 에러
    const code = data?.error?.json?.code ?? data?.error?.code ?? data?.error?.json?.data?.code;
    if (code && code !== -32600 && code !== "BAD_REQUEST") {
      throw new Error(data?.error?.message || `tRPC mutation failed: ${procedure}`);
    }
  }

  // try #2: {"input":{"json": input}}
  {
    const res = await fetch(`/api/trpc/${procedure}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ input: { json: input } }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.result?.data?.json !== undefined) return data.result.data.json;

    const code = data?.error?.json?.code ?? data?.error?.code ?? data?.error?.json?.data?.code;
    if (code && code !== -32600 && code !== "BAD_REQUEST") {
      throw new Error(data?.error?.message || `tRPC mutation failed: ${procedure}`);
    }
  }

  // try #3: batch 모드
  {
    const res = await fetch(`/api/trpc/${procedure}?batch=1`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ 0: { json: input } }),
    });
    const data = await res.json().catch(() => null);
    // 배치 응답 형태 보정
    const first = Array.isArray(data) ? data[0] : data?.[0];
    const payload = first?.result?.data?.json ?? data?.result?.data?.json;
    if (res.ok && payload !== undefined) return payload;

    // 전부 실패 → 마지막 에러 메시지로 던짐
    const msg =
      (Array.isArray(data) ? first?.error?.message : data?.error?.message) ||
      "tRPC mutation failed (all formats tried)";
    throw new Error(msg);
  }
}

// src/services/trpc.client.js
export async function trpcQuery(path, input = {}) {
    // ① undefined/null 키 제거
    const clean = (obj) =>
        Object.fromEntries(
            Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== null)
        );

    // ② generations.all 같은 곳에서 meta는 필요 없음 → 붙이지 않음
    const payload = { json: clean(input) };

    const url = `/api/trpc/${encodeURIComponent(path)}?input=${encodeURIComponent(
        JSON.stringify(payload)
    )}`;

    const res = await fetch(url, { method: 'GET', headers: { 'content-type': 'application/json' } });
    const data = await res.json();

    if (!res.ok || data?.error) {
        const msg =
            data?.error?.json?.message ||
            data?.error?.message ||
            `tRPC ${path} failed (${res.status})`;
        throw new Error(msg);
    }
    // tRPC 응답은 { result: { data: { json: ... }}} 또는 { result: { data: ... }} 형식일 수 있음
    const json = data?.result?.data?.json ?? data?.result?.data ?? data;
    return json;
}

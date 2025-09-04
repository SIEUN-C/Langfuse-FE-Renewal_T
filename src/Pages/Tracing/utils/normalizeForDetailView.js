// src/Pages/Tracing/utils/normalizeForDetailView.js
const looksLikeMessages = (arr) =>
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.every(m => m && typeof m === 'object' && 'role' in m && 'content' in m);

// 문자열(JSON) → messages 배열 파싱 시도
const asMessages = (val) => {
    if (!val) return null;
    if (looksLikeMessages(val)) return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return looksLikeMessages(parsed) ? parsed : null;
        } catch { /* noop */ }
    }
    return null;
};

const pick = (...xs) => xs.find(v => v !== undefined && v !== null);

const toText = (c) => {
    if (c == null) return '';
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.map(toText).join('');
    if (typeof c === 'object') return c.text ?? c.content ?? JSON.stringify(c);
    return String(c);
};

/**
 * Trace/Observation 디테일 응답을 TraceDetailView가 기대하는 형태로 통일
 * - messages 배열 감지 → Preview(System/User/Assistant)로 렌더 가능
 * - input은 사람이 읽을 “프리뷰 문자열”만 남김(배열/객체 노출 방지)
 * - output/usage/cost 필드도 안전하게 보정
 */
export default function normalizeForDetailView(d) {
    if (!d || typeof d !== 'object') return d;

    // 1) messages 후보 추출(여러 위치 지원)
    const messages =
        asMessages(d.messages)
        || asMessages(d.input?.messages)
        || asMessages(d.input)
        || asMessages(d.inputText)
        || asMessages(d.prompt)
        || null;

    // 2) input 프리뷰(문자열) 생성 — messages가 있으면 사람이 읽게 합친 문자열로
    const inputPreview = messages
        ? messages.map(m => `${m.role}: ${toText(m.content)}`).join('\n')
        : pick(
            // 배열은 그대로 노출하지 않음
            asMessages(d.input) ? null : d.input,
            asMessages(d.inputText) ? null : d.inputText,
            asMessages(d.prompt) ? null : d.prompt,
            d.metadata?.input,
            d.usageDetails?.input
        );

    // 3) output 정규화
    const output = pick(
        d.output,
        d.outputText,
        d.completion,
        typeof d.response === 'string' ? d.response : d.response ? JSON.stringify(d.response) : null,
        d.metadata?.output,
        d.usageDetails?.output
    );

    // 4) usage/cost 보정
    const u = d.usageDetails || d.usage || {};
    const inTok = u.input ?? d.inputUsage ?? u.promptTokens ?? 0;
    const outTok = u.output ?? d.outputUsage ?? u.completionTokens ?? 0;
    const totTok = u.total ?? d.totalUsage ?? u.totalTokens ?? (inTok + outTok);

    const totalPrice = (d.totalPrice ?? d.totalCost ?? d.costDetails?.total ?? null) || null;

    return {
        ...d,
        input: inputPreview,
        output,
        usage: { input: inTok, output: outTok, total: totTok },
        totalPrice,
        // ✨ 핵심: TraceDetailView가 Preview로 렌더할 수 있게 보장
        messages: messages || undefined,
    };
}

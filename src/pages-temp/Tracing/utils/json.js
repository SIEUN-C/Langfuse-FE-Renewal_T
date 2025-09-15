// src/Pages/Tracing/utils/json.js

// JSON 문자열을 최대 N번까지 재귀적으로 파싱
export const parseMaybeJSONDeep = (v, maxDepth = 3) => {
    let cur = v;
    for (let i = 0; i < maxDepth; i++) {
        if (typeof cur !== 'string') break;
        const s = cur.trim();
        if (!s) break;

        const looksJSON =
            (s[0] === '{' && s[s.length - 1] === '}') ||
            (s[0] === '[' && s[s.length - 1] === ']') ||
            (s[0] === '"' && s[s.length - 1] === '"');

        if (!looksJSON) break;
        try {
            cur = JSON.parse(s);
        } catch {
            break;
        }
    }
    return cur;
};

// 문자열 안의 \uXXXX 유니코드 이스케이프를 실제 문자로 복원
export const decodeUnicodeLiterals = (str) => {
    if (typeof str !== 'string' || str.indexOf('\\u') === -1) return str;
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    );
};

// {{ name }} 공통 정규식
export const VAR_RE = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;

export function extractVarsFromText(text, set) {
    if (typeof text !== "string" || !text) return;
    let m;
    while ((m = VAR_RE.exec(text))) set.add(m[1]);
}

// 메시지 배열 전체에서(placeholder 포함) 변수 추출
export function extractVariablesFromMessages(messages) {
    const set = new Set();
    for (const m of messages || []) {
        if ((m?.kind !== "placeholder" && m?.role !== "Placeholder")) {
            extractVarsFromText(m?.content, set);
            continue;
        }
        try {
            const parsed = JSON.parse(m?.content || "{}");
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            for (const it of arr) extractVarsFromText(it?.content, set);
        } catch {
            extractVarsFromText(m?.content, set);
        }
    }
    return Array.from(set);
}

// 제출 직전 치환
export function fillVariables(messages, values = {}) {
    return messages.map((msg) => {
        if (typeof msg.content !== "string") return msg;
        const content = msg.content.replace(VAR_RE, (_, name) => values[name] ?? `{{${name}}}`);
        return { ...msg, content };
    });
}

// placeholder JSON을 수집(패널에 보여주기용)
export function extractPlaceholders(messages) {
    const list = [];
    messages.forEach((m, idx) => {
        if (m?.kind === "placeholder" || m?.role === "Placeholder") {
            let parsed = null;
            try { parsed = JSON.parse(m.content || "{}"); } catch { }
            list.push({
                index: idx,
                name: (m.name || "").trim(),
                value: parsed,
                raw: m.content || "",
            });
        }
    });
    return list;
}

// placeholder를 실제 메시지 배열로 전개
export function expandPlaceholders(msgs) {
    const out = [];
    for (const m of msgs) {
        if (m?.kind === "placeholder" || m?.role === "Placeholder") {
            try {
                const parsed = JSON.parse(m.content || "{}");
                const arr = Array.isArray(parsed) ? parsed : [parsed];
                for (const it of arr) {
                    if (it && typeof it.content === "string") {
                        out.push({
                            kind: "message",
                            role: (it.role || "user").toLowerCase(),
                            content: it.content,
                        });
                    }
                }
            } catch { /* 무시 */ }
        } else {
            out.push(m);
        }
    }
    return out;
}

// (옵션) 텍스트 병합이 필요할 때
export function mergeMessageText(messages) {
    return (messages || [])
        .filter((m) => m && typeof m.content === "string")
        .map((m) => m.content)
        .join("\n");
}

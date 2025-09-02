import { useEffect, useMemo, useState } from "react";
import { llmApiKeyAll } from "../services/PlaygroundTrpcApi";

export default function useLlmConnections(projectId) {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState(null);

    useEffect(() => {
        if (!projectId) { setConnections([]); return; }
        const ac = new AbortController();
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const rows = await llmApiKeyAll(projectId, { abortController: ac });
                setConnections(rows || []);
            } catch (e) {
                if (!ac.signal.aborted) { setErr(e?.message || "Failed to load LLM connections"); setConnections([]); }
            } finally {
                if (!ac.signal.aborted) setLoading(false);
            }
        })();
        return () => ac.abort();
    }, [projectId]);

    // 최초 기본 선택값을 계산할 때 사용 가능
    const firstDefault = useMemo(() => {
        const first = (connections || [])[0];
        if (!first) return { provider: "", adapter: "", model: "" };
        return {
            provider: first.provider || "",
            adapter: first.adapter ?? "",
            model: first.customModels?.[0] ?? "",
        };
    }, [connections]);

    return { connections, loading, error, firstDefault };
}

import { useEffect, useState } from "react";
import { ToolsAPI } from "../services/toolsService"

export default function useTools(projectId) {
    const [available, setAvailable] = useState([]);
    const [attached, setAttached] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState(null);

    useEffect(() => {
        if (!projectId) { setAvailable([]); return; }
        let alive = true;
        (async () => {
            try {
                setLoading(true); setErr(null);
                const list = await ToolsAPI.list(projectId);
                if (alive) setAvailable(Array.isArray(list) ? list : []);
            } catch (e) {
                if (alive) { setErr(e?.message || "Failed to load tools"); setAvailable([]); }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [projectId]);

    const refresh = async () => {
        const list = await ToolsAPI.list(projectId);
        setAvailable(Array.isArray(list) ? list : []);
    };

    const attach = (tool) => setAttached((prev) => prev.some((t) => t.id === tool.id) ? prev : [...prev, tool]);
    const detach = (id) => setAttached((prev) => prev.filter((t) => t.id !== id));

    const create = async (form) => { await ToolsAPI.create(projectId, form); await refresh(); };
    const update = async (form) => { await ToolsAPI.update(projectId, form); await refresh(); };
    const remove = async (tool) => { await ToolsAPI.delete(projectId, tool.id); await refresh(); detach(tool.id); };

    return { available, attached, loading, error, attach, detach, refresh, create, update, remove, setAttached };
}

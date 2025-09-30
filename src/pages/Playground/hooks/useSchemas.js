import { useEffect, useState } from "react";
import { SchemasAPI } from "../services/schemasService";

export default function useSchemas(projectId) {
    const [available, setAvailable] = useState([]);
    const [attached, setAttached] = useState(null); // 단일 첨부
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState(null);

    useEffect(() => {
        if (!projectId) { setAvailable([]); return; }
        let alive = true;
        (async () => {
            try {
                setLoading(true); setErr(null);
                const list = await SchemasAPI.list(projectId);
                if (alive) setAvailable(Array.isArray(list) ? list : []);
            } catch (e) {
                if (alive) { setErr(e?.message || "Failed to load schemas"); setAvailable([]); }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [projectId]);

    const refresh = async () => {
        const list = await SchemasAPI.list(projectId);
        setAvailable(Array.isArray(list) ? list : []);
    };

    const attach = (schema) => setAttached(schema);
    const detach = (id) => { if (attached?.id === id) setAttached(null); };

    const create = async (form) => { await SchemasAPI.create(projectId, form); await refresh(); };
    const update = async (form) => { await SchemasAPI.update(projectId, form); await refresh(); };
    const remove = async (schema) => { await SchemasAPI.delete(projectId, schema.id); await refresh(); detach(schema.id); };

    return { available, attached, loading, error, attach, detach, refresh, create, update, remove, setAttached };
}

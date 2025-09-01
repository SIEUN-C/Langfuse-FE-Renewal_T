import { useMemo, useState } from "react";
import styles from "../Playground.module.css";
import { BookText, Edit, X, Plus, Minus } from "lucide-react";
import SearchInput from "../../../components/SearchInput/SearchInput";

function filterByQuery(list, q, type) {
    const s = (q || "").toLowerCase().trim();
    if (!s) return list;
    return (list || []).filter((item) => {
        const name = (item.name || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        if (type === "Name") return name.includes(s);
        if (type === "Description") return desc.includes(s);
        return name.includes(s) || desc.includes(s);
    });
}

export default function SchemaPanel({
    attached, available, onAttach, onDetach, onCreate, onEdit, onDelete, loading, error,
}) {
    const [q, setQ] = useState("");
    const [t, setT] = useState("All");
    const filtered = useMemo(() => filterByQuery(available, q, t), [available, q, t]);

    return (
        <>
            {attached && (
                <div className={styles.toolSection}>
                    <div className={styles.toolItem}>
                        <div className={styles.toolInfo}>
                            <BookText size={14} />
                            <div className={styles.toolText}>
                                <span className={styles.toolName}>{attached.name}</span>
                                <span className={styles.toolDesc}>{attached.description}</span>
                            </div>
                        </div>
                        <div className={styles.iconCircle} onClick={() => onDetach(attached.id)} title="Detach schema">
                            <Minus size={14} />
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.toolSearch}>
                <SearchInput
                    placeholder="Search schemas…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    searchType={t}
                    setSearchType={setT}
                    searchTypes={["All", "Name", "Description"]}
                    fullWidth
                    dense
                />
            </div>

            <div className={styles.toolList}>
                {loading ? (
                    <div className={styles.muted}>Loading schemas…</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.muted}>No schemas found</div>
                ) : filtered.map((schema) => (
                    <div
                        className={styles.toolItem}
                        key={schema.id}
                        onDoubleClick={() => onAttach(schema)}
                        title="Double click to attach"
                    >
                        <div className={styles.toolInfo}>
                            <div className={styles.toolText}>
                                <span className={styles.toolName}>{schema.name}</span>
                                <span className={styles.toolDesc}>{schema.description}</span>
                            </div>
                        </div>
                        <div className={styles.rowActions}>
                            <button className={styles.editButton} title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(schema); }}>
                                <Edit size={14} />
                            </button>
                            <button className={styles.editButton} title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(schema); }}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {error && <div className={styles.errorText} style={{ marginTop: 8 }}>{error}</div>}

            <button className={styles.toolButton} onClick={onCreate} disabled={loading}>
                <Plus size={14} /> Create new schema
            </button>
        </>
    );
}

import { useMemo, useState } from "react";
import { Wrench, Edit, X, Plus, Minus, Search as SearchIcon } from "lucide-react";
import styles from "../Playground.module.css";
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

export default function ToolsPanel({
    attachedTools, availableTools, onAdd, onRemove, onCreate, onEdit, onDelete, loading, error,
}) {
    const [q, setQ] = useState("");
    const [t, setT] = useState("All");
    const filtered = useMemo(() => filterByQuery(availableTools, q, t), [availableTools, q, t]);

    return (
        <>
            {attachedTools.map((tool) => (
                <div className={styles.toolSection} key={tool.id}>
                    <div className={styles.toolItem}>
                        <div className={styles.toolInfo}>
                            <Wrench size={14} />
                            <div className={styles.toolText}>
                                <span className={styles.toolName}>{tool.name}</span>
                                <span className={styles.toolDesc}>{tool.description}</span>
                            </div>
                        </div>
                        <div className={styles.iconCircle} onClick={() => onRemove(tool.id)}>
                            <Minus size={14} />
                        </div>
                    </div>
                </div>
            ))}

            <div className={styles.toolSearch}>
                <SearchInput
                    placeholder="Search tools…"
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
                    <div className={styles.muted}>Loading tools…</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.muted}>No tools found</div>
                ) : (
                    filtered.map((tool) => (
                        <div className={styles.toolItem} key={tool.id} onDoubleClick={() => onAdd(tool)}>
                            <div className={styles.toolInfo}>
                                <Wrench size={14} />
                                <div className={styles.toolText}>
                                    <span className={styles.toolName}>{tool.name}</span>
                                    <span className={styles.toolDesc}>{tool.description}</span>
                                </div>
                            </div>
                            <div className={styles.rowActions}>
                                <button className={styles.editButton} title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(tool); }}>
                                    <Edit size={14} />
                                </button>
                                <button className={styles.editButton} title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(tool); }}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {error && <div className={styles.errorText} style={{ marginTop: 8 }}>{error}</div>}

            <button className={styles.toolButton} onClick={onCreate} disabled={loading}>
                <Plus size={14} /> Create new tool
            </button>
        </>
    );
}

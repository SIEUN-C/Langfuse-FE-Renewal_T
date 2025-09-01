import { useEffect, useRef } from "react";
import styles from "../Playground.module.css";

export default function StreamSettingsPopover({ open, streaming, onChangeStreaming, onClose }) {
    const popRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        const onClick = (e) => { if (popRef.current && !popRef.current.contains(e.target)) onClose?.(); };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div ref={popRef} className={styles.streamPopover} role="dialog" aria-modal="true" aria-label="Streaming settings">
            <div className={styles.streamPopoverHeader}>Stream responses</div>
            <div className={styles.streamPopoverSub}>Real-time response streaming</div>
            <label className={styles.switchRow}>
                <span>Enable</span>
                <label className={styles.switch}>
                    <input type="checkbox" checked={streaming} onChange={(e) => onChangeStreaming(e.target.checked)} />
                    <span className={styles.slider} />
                </label>
            </label>
        </div>
    );
}

import styles from "../Playground.module.css";

export default function VariablesPanel({ names, values, onChangeValue, onReset, placeholders = [] }) {
    const hasVars = names.length > 0;
    const hasPH = placeholders.length > 0;

    return (
        <>
            {!hasVars && !hasPH ? (
                <div className={styles.emptyNote} style={{ marginTop: 8 }}>
                    No variables detected. Use <code>{'{{name}}'}</code> in messages to create one.
                </div>
            ) : null}

            {hasVars && (
                <div className={styles.varsList}>
                    {names.map((n) => (
                        <div key={n} className={styles.varRow}>
                            <div className={styles.varName}>{n}</div>
                            <input
                                className={styles.varInput}
                                type="text"
                                placeholder={n}
                                value={values[n] ?? ""}
                                onChange={(e) => onChangeValue(n, e.target.value)}
                            />
                        </div>
                    ))}
                    <button className={styles.toolButton} style={{ marginTop: 8 }} onClick={onReset}>Reset</button>
                </div>
            )}

            {hasPH && (
                <>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#9aa4b2' }}>Message Placeholders</div>
                    <div className={styles.varsList} style={{ marginTop: 6 }}>
                        {placeholders.map((ph, i) => (
                            <div key={i} className={styles.varRow}>
                                <div className={styles.varName}>{ph.name || "Unnamed placeholder"}</div>
                                <textarea className={styles.varInput} value={ph.raw} readOnly />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

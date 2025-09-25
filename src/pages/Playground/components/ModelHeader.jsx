// src/Pages/Playground/components/ModelHeader.jsx
import { useEffect } from "react";
import styles from "../Playground.module.css";
import { ChevronDown, Copy, Save, Settings, Plus, SlidersHorizontal, X } from "lucide-react";
import ModelAdvancedSettings, { DEFAULT_SETTINGS} from "../../../components/ModelAdvancedSettings/ModelAdvancedSettings";

export default function ModelHeader({
    // 상태/값
    loadingConn,
    hasAnyConnection,
    hasAnyModel,
    selectedProvider,
    selectedAdapter,
    selectedModel,
    isModelMenuOpen,
    modelMenuItems,

    // refs
    modelBtnRef,
    modelMenuRef,
    modelAdvBtnRef,

    // 고급 설정
    isModelAdvOpen,
    modelAdvValues,
    onToggleModelAdv,
    onChangeModelAdv,
    onResetModelAdv,

    // 핸들러
    onToggleMenu,
    onPickConnection,
    onOpenLlmModal,
    onCopy,
    onToggleSavePopover,
    onRemove,
    showRemoveButton,

    // 뭘 수정했는지 주석: 설정이 변경되었는지 여부를 boolean 값으로 받음.
    isModelAdvModified,

    // 컨텍스트
    projectId,
    providerForAdv, // selectedProvider 그대로 넘겨주면 됨
}) {
    // menu가 뜬 상태에서 외부 클릭 시 닫기 (보호막)
    useEffect(() => {
        if (!isModelMenuOpen) return;
        const onDown = (e) => {
            if (!modelMenuRef.current || !modelBtnRef.current) return;
            const t = e.target;
            if (!modelMenuRef.current.contains(t) && !modelBtnRef.current.contains(t)) {
                onToggleMenu(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [isModelMenuOpen, modelMenuRef, modelBtnRef, onToggleMenu]);

    return (
        <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
                {/* 모델 선택 pill */}
                <button
                    ref={modelBtnRef}
                    type="button"
                    className={styles.modelPill}
                    onClick={() => hasAnyConnection && onToggleMenu(!isModelMenuOpen)}
                    title={hasAnyConnection ? "Change model" : "No LLM connection"}
                    disabled={!hasAnyConnection}
                >
                    <span className={styles.modelProvider}>
                        {selectedProvider || (loadingConn ? "Loading…" : "No connection")}
                    </span>
                    <span className={styles.modelSep}>:</span>
                    <strong className={styles.modelName}>
                        {selectedModel ||
                            (!hasAnyConnection
                                ? "—"
                                : loadingConn
                                    ? "Loading…"
                                    : hasAnyModel
                                        ? "select model"
                                        : "no saved models")}
                    </strong>
                    {hasAnyConnection && <ChevronDown size={14} />}
                </button>

                {/* 고급 설정 버튼 */}
                <button
                    ref={modelAdvBtnRef}
                    type="button"
                    className={styles.iconActionBtn}
                    onClick={() => onToggleModelAdv(!isModelAdvOpen)}
                    title="Model advanced settings"
                    aria-haspopup="dialog"
                    aria-expanded={isModelAdvOpen}
                    // 자식 요소(흰색 점)의 위치 기준점이 되도록 relative 속성을 추가함.
                    style={{ marginLeft: 6, position: "relative" }}
                >
                    <SlidersHorizontal size={16} />
                    {/* isModelAdvModified가 true일 때만 흰색 점을 표시함. */}
                    {isModelAdvModified && <span className={styles.modifiedIndicator}></span>}
                </button>

                {/* 고급 설정 팝오버 */}
                <ModelAdvancedSettings
                    open={isModelAdvOpen}
                    onClose={() => onToggleModelAdv(false)}
                    anchorRef={modelAdvBtnRef}
                    settings={modelAdvValues}
                    onSettingChange={onChangeModelAdv}
                    onReset={onResetModelAdv}
                    projectId={projectId}
                    provider={providerForAdv}
                    useFixedPosition={true}
                />

                {/* 연결이 없거나 모델이 0개여도 버튼 노출 */}
                {!loadingConn && (!hasAnyConnection || !hasAnyModel) && (
                    <button className={styles.addLlmBtn} onClick={onOpenLlmModal} style={{ marginLeft: 6 }}>
                        <Plus size={16} /> Add LLM Connection
                    </button>
                )}

                {/* 드롭다운: 저장된 모델 */}
                {isModelMenuOpen && hasAnyConnection && (
                    <div ref={modelMenuRef} className={styles.modelMenu}>
                        <div className={styles.menuSectionLabel}>Saved models</div>

                        {modelMenuItems.length > 0 ? (
                            modelMenuItems.map((item) => {
                                const isActive =
                                    selectedProvider === item.conn.provider &&
                                    (selectedAdapter ?? "") === (item.conn.adapter ?? "") &&
                                    selectedModel === item.model;
                                return (
                                    <button
                                        key={item.id}
                                        className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                                        onClick={() => onPickConnection(item)}
                                    >
                                        <span className={styles.menuMain}>
                                            {item.conn.provider}
                                        </span>
                                        <span className={styles.menuSep}>:</span>
                                        <span className={styles.menuModel}>{item.model}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className={styles.menuEmpty}>No saved models</div>
                        )}

                        <div className={styles.menuDivider} />
                        <button className={styles.menuItem} onClick={onOpenLlmModal}>
                            <Plus size={14} /> Add new connection…
                        </button>
                    </div>
                )}
            </div>

            {/* 우측 액션들 */}
            <div className={styles.cardActions}>
                <button className={styles.iconActionBtn} onClick={onCopy} title="Duplicate panel">
                    <Copy size={16} />
                </button>
                <button className={styles.iconActionBtn} onClick={onToggleSavePopover} title="Save prompt">
                    <Save size={16} />
                </button>
                <button className={styles.iconActionBtn} onClick={onOpenLlmModal} title="LLM Connection">
                    <Settings size={16} />
                </button>
                {showRemoveButton && (
                    <button className={styles.iconActionBtn} onClick={onRemove} title="Remove panel">
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

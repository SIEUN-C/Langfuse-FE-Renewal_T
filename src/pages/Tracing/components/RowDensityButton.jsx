// src/Pages/Tracing/RowDensityButton.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { LayoutGrid } from "lucide-react";
import styles from "./RowDensityButton.module.css";

export default function RowDensityButton({ value, onChange, className, style }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const btnRef = useRef(null);
  const density = value ?? "md";

  // 버튼 위치를 기준으로 fixed 위치 계산 → 부모 overflow 영향 안 받음
  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ x: r.right - 200, y: r.bottom + 8, w: r.width, h: r.height }); // 메뉴 폭 ~200px 가정
    setOpen(true);
  };

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      // 버튼 외부 클릭 → 닫기
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const items = useMemo(
    () => [
      { key: "sm", label: "Small" },
      { key: "md", label: "Medium" },
      { key: "lg", label: "Large" },
    ],
    []
  );

  const handlePick = (k) => {
    onChange?.(k);
    try { localStorage.setItem("tracing.rowDensity", k); } catch {}
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        className={`${styles.iconBtn} ${className || ""}`}
        style={style}
        type="button"
        title="Row height"
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <LayoutGrid size={18} />
      </button>

      {open &&
        ReactDOM.createPortal(
          <div
            className={styles.menu}
            role="menu"
            style={{ position: "fixed", left: Math.max(8, pos.x), top: pos.y }}
          >
            <div className={styles.menuTitle}>Row height</div>
            {items.map((it) => (
              <button
                key={it.key}
                className={`${styles.menuItem} ${density === it.key ? styles.active : ""}`}
                onClick={() => handlePick(it.key)}
                role="menuitem"
                type="button"
              >
                <span className={styles.radioDot} aria-hidden />
                <span>{it.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

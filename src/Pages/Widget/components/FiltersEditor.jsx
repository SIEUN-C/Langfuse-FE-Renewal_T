// src/Pages/Widget/components/FiltersEditor.jsx
import React, { useMemo } from "react";

export default function FiltersEditor({
  styles,
  filters,
  setFilters,
  getDimensionsForView,
  view,
}) {
  // 연산자 옵션
  const OPERATORS = [
    { value: "anyOf", label: "any of" },
    { value: "noneOf", label: "none of" },
  ];

  // 뷰별 컬럼 옵션
  const DIMENSIONS = useMemo(
    () =>
      typeof getDimensionsForView === "function"
        ? getDimensionsForView(view) ?? []
        : [],
    [getDimensionsForView, view]
  );

  const update = (i, patch) =>
    setFilters(filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const add = () =>
    setFilters([
      ...filters,
      { column: "", operator: "anyOf", values: [] },
    ]);

  const remove = (i) => setFilters(filters.filter((_, idx) => idx !== i));

  // 간단한 텍스트 입력으로 values 처리 (쉼표로 구분)
  const handleValuesChange = (i, valueString) => {
    const values = valueString
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    update(i, { values });
  };

  const getValuesString = (values) => {
    return Array.isArray(values) ? values.join(', ') : '';
  };

  return (
    <div className={styles["filter-container"]}>
      <div className={styles["filter-header"]}>
        <span className={styles["filter-title"]}>Filters</span>
      </div>

      {filters.map((f, i) => {
        const columnSelected = !!f.column;

        return (
          <div key={i} className={styles["simple-filter-row"]}>
            <span className={styles["filter-where"]}>Where</span>

            {/* Column Dropdown */}
            <select
              className={styles["simple-select"]}
              value={f.column ?? ""}
              onChange={(e) => {
                const col = e.target.value;
                update(i, { column: col, values: [] });
              }}
            >
              <option value="" disabled>
                Column
              </option>
              {DIMENSIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Operator Dropdown */}
            <select
              className={styles["simple-select"]}
              disabled={!columnSelected}
              value={!columnSelected ? "anyOf" : f.operator ?? "anyOf"}
              onChange={(e) => update(i, { operator: e.target.value })}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {/* Values Input */}
            <input
              type="text"
              className={styles["simple-input"]}
              disabled={!columnSelected}
              value={getValuesString(f.values || [])}
              onChange={(e) => handleValuesChange(i, e.target.value)}
              placeholder="Enter values..."
            />

            {/* Remove Button */}
            <button
              className={styles["simple-remove-btn"]}
              onClick={() => remove(i)}
              title="Remove filter"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Add Filter Button */}
      <button className={styles["simple-add-btn"]} onClick={add}>
        <span className={styles["add-icon"]}>+</span>
        Add filter
      </button>
    </div>
  );
}
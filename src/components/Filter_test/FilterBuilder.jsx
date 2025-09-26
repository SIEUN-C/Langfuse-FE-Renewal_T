// src/features/filters/components/FilterBuilder.jsx
import React from "react";
// 설정 파일에서 연산자 목록을 가져옵니다.
import { filterOperators } from "./config/filterOperators";
// MultiSelect 컴포넌트는 별도로 구현해야 합니다.
// import { MultiSelect } from "./MultiSelect"; 

export function FilterBuilder({ filters, setFilters, columns }) {
    // 새 필터 추가
    const addNewFilter = () => {
        // 새 필터 객체의 기본 구조
        const newFilter = {
            column: columns[0]?.name ?? "", // 첫 번째 컬럼을 기본값으로 설정
            type: columns[0]?.type ?? "string",
            operator: filterOperators[columns[0]?.type ?? "string"][0],
            value: undefined,
            key: undefined,
        };
        setFilters([...filters, newFilter]);
    };

    // 필터 제거
    const removeFilter = (index) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    // 필터 상태 변경 핸들러 (부분 업데이트 지원)
    const handleFilterChange = (index, newPartialFilter) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], ...newPartialFilter };
        setFilters(newFilters);
    };

    // 컬럼 선택이 변경될 때 호출
    const handleColumnChange = (index, columnId) => {
        const column = columns.find((c) => c.id === columnId);
        if (!column) return;

        // 컬럼이 바뀌면 타입, 연산자, 값을 모두 초기화
        handleFilterChange(index, {
            column: column.name, // API 페이로드에 맞게 'name'을 사용
            type: column.type,
            operator: filterOperators[column.type][0], // 해당 타입의 첫 번째 연산자를 기본값으로 설정
            value: undefined,
            key: undefined, // 키도 초기화
        });
    };

    // 필터 '값'이 변경될 때 호출 (데이터 타입 처리 핵심!)
    const handleValueChange = (index, value, type) => {
        let processedValue = value;
        // 타입에 따라 값을 올바른 데이터 형식으로 변환
        if (type === "number" || type === "numberObject") {
            processedValue = value === "" ? undefined : Number(value);
        } else if (type === "boolean") {
            processedValue = value === "true";
        }
        // datetime은 input[type=datetime-local]이 자동으로 처리

        handleFilterChange(index, { value: processedValue });
    };

    // 필터 타입에 따라 다른 입력 UI를 렌더링하는 함수
    const renderValueInput = (filter, index) => {
        const columnDef = columns.find((c) => c.name === filter.column);

        switch (filter.type) {
            case "number":
            case "numberObject":
                return (
                    <input
                        type="number"
                        value={filter.value ?? ""}
                        onChange={(e) => handleValueChange(index, e.target.value, filter.type)}
                        placeholder="숫자 값"
                        className="filter-input"
                    />
                );
            case "datetime":
                return (
                    <input
                        type="datetime-local"
                        value={filter.value ? new Date(filter.value).toISOString().slice(0, 16) : ""}
                        onChange={(e) => handleFilterChange(index, { value: e.target.valueAsDate })}
                        className="filter-input"
                    />
                );
            case "boolean":
                return (
                    <select
                        value={filter.value?.toString() ?? ""}
                        onChange={(e) => handleValueChange(index, e.target.value, filter.type)}
                        className="filter-select"
                    >
                        <option value="">선택...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                );
            case "stringOptions":
            case "arrayOptions":
            case "categoryOptions":
                // 이 부분은 직접 구현한 MultiSelect 컴포넌트를 사용해야 합니다.
                // 임시로 기본 input으로 대체합니다.
                return (
                    <input
                        type="text"
                        value={Array.isArray(filter.value) ? filter.value.join(',') : (filter.value ?? "")}
                        onChange={(e) => handleFilterChange(index, { value: e.target.value.split(',') })}
                        placeholder="콤마(,)로 구분하여 입력"
                        className="filter-input"
                    />
                );
            case "string":
            case "stringObject":
            default:
                return (
                    <input
                        type="text"
                        value={filter.value ?? ""}
                        onChange={(e) => handleFilterChange(index, { value: e.target.value })}
                        placeholder="문자열 값"
                        className="filter-input"
                    />
                );
        }
    };

    return (
        <div className="filter-builder-container">
            {filters.map((filter, index) => {
                const selectedColumn = columns.find((c) => c.name === filter.column);
                const isObjectFilter = filter.type === "stringObject" || filter.type === "numberObject";

                return (
                    <div key={index} className="filter-row">
                        <span>{index === 0 ? "Where" : "And"}</span>

                        {/* 컬럼 선택 */}
                        <select
                            value={selectedColumn?.id ?? ""}
                            onChange={(e) => handleColumnChange(index, e.target.value)}
                            className="filter-select"
                        >
                            <option value="" disabled>컬럼 선택</option>
                            {columns.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>

                        {/* 'stringObject' 또는 'numberObject' 타입일 때 Key 입력 필드 */}
                        {isObjectFilter && (
                            <input
                                type="text"
                                value={filter.key ?? ""}
                                onChange={(e) => handleFilterChange(index, { key: e.target.value })}
                                placeholder="key (예: Correctness)"
                                className="filter-input"
                            />
                        )}

                        {/* 연산자 선택 */}
                        <select
                            value={filter.operator}
                            disabled={!filter.type}
                            onChange={(e) => handleFilterChange(index, { operator: e.target.value })}
                            className="filter-select"
                        >
                            {filter.type &&
                                filterOperators[filter.type]?.map((op) => (
                                    <option key={op} value={op}>
                                        {op}
                                    </option>
                                ))}
                        </select>

                        {/* 값 입력 (동적 UI) */}
                        {renderValueInput(filter, index)}

                        <button onClick={() => removeFilter(index)} className="remove-filter-btn">
                            &times;
                        </button>
                    </div>
                );
            })}
            <button onClick={addNewFilter} className="add-filter-btn">
                + Add Filter
            </button>
        </div>
    );
}
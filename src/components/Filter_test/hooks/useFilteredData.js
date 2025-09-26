// src/hooks/useFilteredData.js
import { useMemo } from "react";
import dayjs from "dayjs";

export const useFilteredData = (
    rawData,          // 필터링할 원본 데이터 배열 (예: traces)
    filters,          // useFilterState에서 온 필터 조건 배열
    columnDefs,       // 해당 페이지의 컬럼 정의 파일 (예: tracesTableFilterDefs)
    searchQuery,      // 검색어
    searchType        // 검색 타입
) => {
    const filteredData = useMemo(() => {
        let tempData = [...rawData];

        // 1. 검색어 필터링
        if (searchQuery && searchQuery.trim()) {
            const lowercasedQuery = searchQuery.toLowerCase().trim();
            tempData = tempData.filter(item => {
                if (searchType === 'IDs / Names') {
                    return (
                        item.id?.toLowerCase().includes(lowercasedQuery) ||
                        item.name?.toLowerCase().includes(lowercasedQuery)
                    );
                }
                if (searchType === 'Full Text') {
                    // columnDefs에 정의된 컬럼의 값만 검색하도록 수정
                    return columnDefs.some(colDef => {
                        const value = item[colDef.id];
                        return String(value).toLowerCase().includes(lowercasedQuery);
                    });
                }
                return true;
            });
        }

        // 2. 필터 빌더 필터링
        const activeFilters = filters.filter(
            (f) => (f.value !== undefined && f.value !== "" && f.value !== null && (!Array.isArray(f.value) || f.value.length > 0))
                || f.operator === "is null"
                || f.operator === "is not null"
        );

        if (activeFilters.length > 0) {
            tempData = tempData.filter((item) => {
                return activeFilters.every((filter) => {
                    const columnDef = columnDefs.find((c) => c.name === filter.column);
                    if (!columnDef) return true;

                    const itemValue = item[columnDef.id];
                    const filterValue = filter.value;

                    if (filter.operator === "is null") {
                        return itemValue === null || itemValue === undefined;
                    }
                    if (filter.operator === "is not null") {
                        return itemValue !== null && itemValue !== undefined;
                    }

                    if (itemValue === null || itemValue === undefined) {
                        return false;
                    }

                    switch (filter.type) {
                        case "string":
                        case "stringObject": {
                            const itemString = String(itemValue).toLowerCase();
                            const filterString = String(filterValue).toLowerCase();
                            if (filter.operator === "=") return itemString === filterString;
                            if (filter.operator === "contains") return itemString.includes(filterString);
                            if (filter.operator === "does not contain") return !itemString.includes(filterString);
                            if (filter.operator === "starts with") return itemString.startsWith(filterString);
                            if (filter.operator === "ends with") return itemString.endsWith(filterString);
                            return true;
                        }
                        case "number":
                        case "numberObject": {
                            const numitemValue = Number(itemValue);
                            const numFilterValue = Number(filterValue);
                            if (isNaN(numitemValue) || isNaN(numFilterValue)) return false;
                            if (filter.operator === "=") return numitemValue === numFilterValue;
                            if (filter.operator === ">") return numitemValue > numFilterValue;
                            if (filter.operator === "<") return numitemValue < numFilterValue;
                            if (filter.operator === ">=") return numitemValue >= numFilterValue;
                            if (filter.operator === "<=") return numitemValue <= numFilterValue;
                            return false;
                        }
                        case "boolean": {
                            if (filter.operator === "=") return itemValue === filterValue;
                            if (filter.operator === "<>") return itemValue !== filterValue;
                            return true;
                        }
                        case "datetime": {
                            const traceDate = dayjs(itemValue);
                            if (!traceDate.isValid()) return false;
                            if (filter.operator === ">") return traceDate.isAfter(filterValue);
                            if (filter.operator === "<") return traceDate.isBefore(filterValue);
                            if (filter.operator === ">=") return traceDate.isAfter(filterValue) || traceDate.isSame(filterValue);
                            if (filter.operator === "<=") return traceDate.isBefore(filterValue) || traceDate.isSame(filterValue);
                            return true;
                        }
                        case "stringOptions": { // 보통 단일 값 필터링에 사용 (예: environment)
                            const filterValues = Array.isArray(filterValue) ? filterValue.map(v => String(v).toLowerCase()) : [];
                            const itemString = String(itemValue).toLowerCase();

                            if (filter.operator === "any of") return filterValues.includes(itemString);
                            if (filter.operator === "none of") return !filterValues.includes(itemString);
                            return true;
                        }
                        case "arrayOptions": { // 보통 배열 값 필터링에 사용 (예: tags)
                            const filterValues = Array.isArray(filterValue) ? filterValue.map(v => String(v).toLowerCase()) : [];
                            const itemValues = Array.isArray(itemValue) ? itemValue.map(v => String(v).toLowerCase()) : [];

                            if (filter.operator === "any of") return filterValues.some(v => itemValues.includes(v));
                            if (filter.operator === "none of") return !filterValues.some(v => itemValues.includes(v));
                            if (filter.operator === "all of") return filterValues.every(v => itemValues.includes(v));
                            return true;
                        }

                        default:
                            return true;
                    }
                });
            });
        }

        return tempData;
    }, [rawData, filters, columnDefs, searchQuery, searchType]);

    return filteredData;
};
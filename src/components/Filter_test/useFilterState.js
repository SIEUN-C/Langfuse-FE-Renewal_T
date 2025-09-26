import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Helper to find column definition by its 'id'
const getColumnById = (columns, id) => columns.find((c) => c.id === id);

// Helper to find column definition by its 'name'
const getColumnByName = (columns, name) => columns.find((c) => c.name === name);

/**
 * Encodes an array of filter objects into a URL-safe string.
 * Format for each filter: "columnId;type;key;operator;encodedValue"
 * Multiple filters are joined by ",".
 * Example: "bookmarked;boolean;;=;true,name;stringOptions;;any of;my-test"
 * @param {Array} filters - The array of filter objects.
 * @param {Array} columns - The column definitions array to map names to IDs.
 * @returns {string} The encoded filter string.
 */
const encodeFilters = (filters, columns) => {
  return filters
    .map((filter) => {
      const column = getColumnByName(columns, filter.column);
      if (!column) return ""; // Return empty string if column not found

      const { id: columnId, type } = column;
      const key = filter.key ?? "";
      const operator = filter.operator;

      let valueStr = "";
      if (filter.value !== undefined && filter.value !== null) {
        if (type === "datetime") {
          valueStr = new Date(filter.value).toISOString();
        } else if (Array.isArray(filter.value)) {
          valueStr = filter.value.join("|");
        } else {
          valueStr = String(filter.value);
        }
      }
      
      return `${columnId};${type};${key};${operator};${encodeURIComponent(valueStr)}`;
    })
    .filter(Boolean) // Remove any empty strings from failed lookups
    .join(",");
};

/**
 * Decodes a filter string from a URL into an array of filter objects.
 * @param {string} encodedString - The encoded filter string from the URL.
 * @param {Array} columns - The column definitions array to map IDs to names.
 * @returns {Array} The array of filter objects.
 */
const decodeFilters = (encodedString, columns) => {
  if (!encodedString) return [];
  return encodedString
    .split(",")
    .map((filterStr) => {
      const [columnId, type, key, operator, encodedValue] = filterStr.split(";");
      const column = getColumnById(columns, columnId);
      if (!column) return null; // Return null if column not found

      const value = decodeURIComponent(encodedValue);
      let parsedValue;

      if (value === "" || value === undefined) {
        parsedValue = undefined;
      } else if (type === "datetime") {
        parsedValue = new Date(value);
      } else if (type === "number" || type === "numberObject") {
        parsedValue = Number(value);
      } else if (type === "boolean") {
        parsedValue = value === "true";
      } else if (type === "stringOptions" || type === "arrayOptions" || type === "categoryOptions") {
        parsedValue = value.split("|");
      } else {
        parsedValue = value;
      }
      
      return {
        column: column.name,
        type,
        key: key || undefined,
        operator,
        value: parsedValue,
      };
    })
    .filter(Boolean); // Remove nulls from failed lookups
};

export const useFilterState = (columns, initialState = []) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => {
    const fromUrl = searchParams.get("filter");
    return fromUrl ? decodeFilters(fromUrl, columns) : initialState;
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (filters.length > 0) {
      params.set("filter", encodeFilters(filters, columns));
    } else {
      params.delete("filter");
    }
    setSearchParams(params, { replace: true });
  }, [filters, columns, searchParams, setSearchParams]);

  return [filters, setFilters];
};
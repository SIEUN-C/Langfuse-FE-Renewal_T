/**
 * @fileoverview Sort configuration types and utilities
 * Provides common sorting functionality across components
 */

/**
 * @typedef {Object|null} OrderByState
 * @property {string} column - Column name to sort by
 * @property {"ASC"|"DESC"} order - Sort order (ascending or descending)
 */

/**
 * Gets the next sort state in the cycle: DESC → ASC → unsorted
 *
 * @param {OrderByState} defaultSort - Default sort state or null for unsorted
 * @param {OrderByState} currentSort - Current sort state or null for unsorted
 * @param {string} column - Column to sort by
 * @returns {OrderByState} Next sort state in the cycle or null for unsorted
 */
export function getNextSortState(defaultSort, currentSort, column) {
    // Different column or no current sort → start with DESC
    if (!currentSort || currentSort.column !== column) {
      return { column, order: "DESC" };
    }
  
    // Same column: DESC → ASC → null (unsorted)
    if (currentSort.order === "DESC") {
      return { column, order: "ASC" };
    }
  
    // Column other than the default column, go back to default
    if (
      currentSort.order === "ASC" &&
      currentSort.column !== defaultSort?.column
    ) {
      return defaultSort || null;
    }
  
    // Default column, flip back to DESC
    if (
      currentSort.order === "ASC" &&
      currentSort.column === defaultSort?.column
    ) {
      return { column, order: "DESC" };
    }
  
    // Fallback (shouldn't happen)
    return null;
  }
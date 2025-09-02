/**
 * @fileoverview PivotTable Chart Component
 *
 * A configurable pivot table widget component that displays data in a tabular format
 * with support for multiple dimensions (currently up to 2), metrics as columns,
 * subtotals, and grand totals.
 *
 * Features:
 * - Dynamic dimension support (0-N dimensions, currently limited to 2)
 * - Proper indentation for nested dimension levels
 * - Subtotal and grand total calculations
 * - Responsive design within dashboard grid
 * - Row limiting to prevent performance issues
 * - Interactive sorting with hierarchical behavior
 */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  transformToPivotTable,
  extractDimensionValues,
  extractMetricValues,
  sortPivotTableRows,
  DEFAULT_ROW_LIMIT,
} from "../utils/pivot-table-utils.js";
import { getNextSortState } from "../utils/sort-types.js";
import { numberFormatter } from "../utils/number-utils.js";
import { formatMetricName } from "../../Dashboards/utils/widget-utils.js";
import styles from './chart-library.module.css';

/**
 * Non-sortable column header component
 * Simple header without sorting functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Header label text
 * @param {string} [props.className] - Additional CSS classes
 */
const StaticHeader = ({ label, className }) => {
  const headerClassName = [
    styles.tableHeaderCell,
    className
  ].filter(Boolean).join(' ');

  return (
    <th className={headerClassName}>
      <div className={styles.tableHeaderContent}>
        <span className={styles.tableHeaderLabel}>{label}</span>
      </div>
    </th>
  );
};

/**
 * Sortable column header component
 * Handles click events and visual indicators for sorting
 * 
 * @param {Object} props - Component props
 * @param {string} props.column - Column identifier
 * @param {string} props.label - Display label
 * @param {Object} [props.sortState] - Current sort state
 * @param {Function} props.onSort - Sort handler function
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.rightAlign] - Whether to right-align content
 */
const SortableHeader = ({ 
  column, 
  label, 
  sortState, 
  onSort, 
  className, 
  rightAlign = false 
}) => {
  const isSorted = sortState?.column === column;
  const sortDirection = isSorted ? sortState.order : null;

  const handleClick = useCallback((event) => {
    event.preventDefault();
    onSort(column);
  }, [column, onSort]);

  const headerClassName = [
    styles.tableHeaderCell,
    styles.sortableHeader,
    className
  ].filter(Boolean).join(' ');

  const contentClassName = [
    styles.tableHeaderContent,
    rightAlign ? styles.rightAlign : ''
  ].filter(Boolean).join(' ');

  return (
    <th className={headerClassName} onClick={handleClick}>
      <div className={contentClassName}>
        <span className={styles.tableHeaderLabel}>{label}</span>
        {isSorted && (
          <span
            className={styles.sortIcon}
            title={sortDirection === "ASC" ? "Sorted ascending" : "Sort by this column"}
          >
            {sortDirection === "ASC" ? "▲" : "▼"}
          </span>
        )}
        {/* Visual indicator that appears on hover */}
        <div className={styles.hoverIndicator} />
      </div>
    </th>
  );
};

/**
 * Individual row component for the pivot table
 * Handles styling, indentation, and content display for each row type
 * 
 * @param {Object} props - Component props
 * @param {Object} props.row - Pivot table row data
 * @param {string[]} props.metrics - List of metric names
 */
const PivotTableRowComponent = ({ row, metrics }) => {
  const rowClassName = [
    styles.tableRow,
    row.isSubtotal ? styles.subtotalRow : '',
    row.isTotal ? styles.totalRow : ''
  ].filter(Boolean).join(' ');

  // Calculate indentation based on level
  const getIndentationStyle = (level) => {
    if (level === 0) return {};
    return { paddingLeft: `${level * 1.5 + 0.5}rem` };
  };

  const dimensionCellClassName = [
    styles.tableCell,
    styles.dimensionCell,
    (row.isSubtotal || row.isTotal) ? styles.boldText : ''
  ].filter(Boolean).join(' ');

  const metricCellClassName = [
    styles.tableCell,
    styles.tableCellNumeric,
    (row.isSubtotal || row.isTotal) ? styles.boldText : ''
  ].filter(Boolean).join(' ');

  return (
    <tr className={rowClassName}>
      {/* Dimension column with indentation and styling */}
      <td 
        className={dimensionCellClassName}
        style={getIndentationStyle(row.level)}
      >
        {row.label}
      </td>

      {/* Metric columns */}
      {metrics.map((metric) => (
        <td key={metric} className={metricCellClassName}>
          {formatMetricValue(row.values[metric])}
        </td>
      ))}
    </tr>
  );
};

/**
 * Formats metric values for display in the table
 * Handles numbers and strings with appropriate formatting
 *
 * @param {number|string} value - The metric value to format
 * @returns {string} Formatted string for display
 */
function formatMetricValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return numberFormatter(value, 2).replace(/\.00$/, "");
}

/**
 * Formats metric names for column headers
 *
 * @param {string} metricName - The metric field name
 * @returns {string} Formatted column header
 */
function formatColumnHeader(metricName) {
  return formatMetricName(metricName);
}

/**
 * Main PivotTable Component
 *
 * Transforms flat data into a pivot table structure and renders it with
 * proper styling, indentation, and responsive behavior.
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Array of data points from the chart query
 * @param {Object} [props.config] - Pivot table configuration including dimensions and metrics
 * @param {Object} [props.chartConfig] - Chart configuration from shadcn/ui (for consistency with other charts)
 * @param {boolean} [props.accessibilityLayer] - Accessibility layer flag
 * @param {Object} [props.sortState] - Current sort state
 * @param {Function} [props.onSortChange] - Callback for sort state changes
 * @param {boolean} [props.isLoading] - Loading state for when data is being refreshed
 */
const PivotTable = ({
  data,
  config,
  chartConfig,
  accessibilityLayer,
  sortState,
  onSortChange,
  isLoading = false,
}) => {
  // Transform chart data into pivot table structure
  const pivotTableRows = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Extract configuration with defaults
    const pivotConfig = {
      dimensions: config?.dimensions ?? [],
      metrics: config?.metrics ?? ["metric"], // Default to 'metric' field from DataPoint
      rowLimit: config?.rowLimit ?? DEFAULT_ROW_LIMIT,
      defaultSort: config?.defaultSort,
    };

    // Transform DataPoint[] to DatabaseRow[] format using utility functions
    const databaseRows = data.map((point) => {
      // Cast the point to access dynamic fields from the query
      const rowData = { ...point };

      // Create a database row with all fields from the original data
      const row = { ...rowData };

      // Use utility functions to ensure proper extraction and parsing
      const dimensionValues = extractDimensionValues(row, pivotConfig.dimensions);
      const metricValues = extractMetricValues(row, pivotConfig.metrics);

      // Combine dimension and metric values into the final row
      const result = {
        ...dimensionValues,
        ...metricValues,
      };

      // Include time dimension if present
      if (point.time_dimension !== undefined) {
        result.time_dimension = point.time_dimension;
      }

      // Include legacy 'metric' field for backward compatibility
      if (point.metric !== undefined) {
        if (typeof point.metric === "number") {
          result.metric = point.metric;
        } else if (Array.isArray(point.metric)) {
          result.metric = point.metric
            .flat()
            .reduce((sum, val) => sum + val, 0);
        }
      }

      return result;
    });

    try {
      return transformToPivotTable(databaseRows, pivotConfig);
    } catch (error) {
      console.error("Error transforming data to pivot table:", error);
      return [];
    }
  }, [data, config]);

  // Apply sorting to pivot table rows
  const sortedRows = useMemo(() => {
    if (!sortState || !sortState.column) {
      return pivotTableRows;
    }

    try {
      return sortPivotTableRows(pivotTableRows, sortState);
    } catch (error) {
      console.error("Error sorting pivot table rows:", error);
      return pivotTableRows;
    }
  }, [pivotTableRows, sortState]);

  // Extract metrics from configuration or fallback to default
  const metrics = useMemo(() => {
    return config?.metrics ?? ["metric"];
  }, [config?.metrics]);

  // Handle sort click events - simple cycling
  const handleSort = useCallback((column) => {
    if (!onSortChange) return;
    const nextSort = getNextSortState(
      config?.defaultSort || null,
      sortState || null,
      column,
    );
    onSortChange(nextSort);
  }, [sortState, onSortChange, config?.defaultSort]);

  // Track the last known defaultSort to detect changes
  const [lastDefaultSort, setLastDefaultSort] = useState(config?.defaultSort);

  // Reset to defaultSort when it changes
  useEffect(() => {
    const currentDefaultSort = config?.defaultSort;

    // If defaultSort changed, reset the sorting
    if (currentDefaultSort !== lastDefaultSort) {
      setLastDefaultSort(currentDefaultSort);

      // Reset to the new default sort
      if (onSortChange) {
        onSortChange(currentDefaultSort || null);
      }
    }
  }, [config?.defaultSort, onSortChange, lastDefaultSort]);

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No data available</p>
      </div>
    );
  }

  // Handle transformation errors
  if (pivotTableRows.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Unable to process data for pivot table</p>
      </div>
    );
  }

  const containerClassName = [
    styles.pivotTableContainer,
    isLoading ? styles.loading : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <Loader2 className={styles.loadingIcon} />
            <span>Refreshing data...</span>
          </div>
        </div>
      )}
      
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            {/* Dimension column header */}
            <StaticHeader
              label={
                config?.dimensions && config.dimensions.length > 0
                  ? config.dimensions.map(formatColumnHeader).join(" / ") // Show all dimensions
                  : "Dimension"
              }
              className={styles.dimensionHeader}
            />

            {/* Metric column headers */}
            {metrics.map((metric) => (
              <SortableHeader
                key={metric}
                column={metric}
                label={formatColumnHeader(metric)}
                sortState={sortState}
                onSort={handleSort}
                className={styles.metricHeader}
                rightAlign={true}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedRows.map((row) => (
            <PivotTableRowComponent key={row.id} row={row} metrics={metrics} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PivotTable;
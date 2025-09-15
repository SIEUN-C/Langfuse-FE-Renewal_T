/**
 * @fileoverview Chart component props definitions and data structures
 * Provides common interfaces for all chart components
 */

/**
 * @typedef {Object} DataPoint
 * @property {string|undefined} time_dimension - Time-based dimension value
 * @property {string|undefined} dimension - Category dimension value  
 * @property {number|Array<Array<number>>} metric - Numeric metric value or nested array structure
 */

/**
 * @typedef {Object} ChartConfig
 * @property {Object} [colors] - Color configuration for chart elements
 * @property {Object} [axes] - Axis configuration options
 * @property {Object} [legend] - Legend display options
 * @property {Object} [tooltip] - Tooltip configuration
 * @property {Object} [responsive] - Responsive behavior settings
 * Note: For Recharts usage, this will be a simple configuration object
 */

/**
 * @typedef {Object} ChartProps
 * @property {DataPoint[]} data - Array of data points to display in the chart
 * @property {ChartConfig} [config] - Optional chart configuration object
 * @property {boolean} [accessibilityLayer] - Whether to include accessibility features
 */

// Export empty object since this file only contains type definitions
// Individual chart components will import and use the JSDoc types above
export default {};
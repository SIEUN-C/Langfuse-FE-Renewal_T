/**
 * @fileoverview Chart utility functions
 * Provides common data transformation and formatting functions for charts
 */

/**
 * Groups data by dimension to prepare it for time series breakdowns
 * @param {import('./chart-props.js').DataPoint[]} data - Array of data points
 * @returns {Array<Object>} Grouped data suitable for Recharts time series
 */
export const groupDataByTimeDimension = (data) => {
    // First, group by time_dimension
    const timeGroups = data.reduce((acc, item) => {
      const time = item.time_dimension || "Unknown";
      if (!acc[time]) {
        acc[time] = {};
      }
  
      const dimension = item.dimension || "Unknown";
      acc[time][dimension] = item.metric;
  
      return acc;
    }, {});
  
    // Convert to array format for Recharts
    return Object.entries(timeGroups).map(([time, dimensions]) => ({
      time_dimension: time,
      ...dimensions,
    }));
  };
  
  /**
   * Extracts unique dimension values from data points
   * @param {import('./chart-props.js').DataPoint[]} data - Array of data points
   * @returns {string[]} Array of unique dimension values
   */
  export const getUniqueDimensions = (data) => {
    const uniqueDimensions = new Set();
    data.forEach((item) => {
      if (item.dimension) {
        uniqueDimensions.add(item.dimension);
      }
    });
    return Array.from(uniqueDimensions);
  };
  
  /**
   * Determines if a chart type is a time series chart
   * @param {string} chartType - Dashboard widget chart type
   * @returns {boolean} True if chart type is time series based
   */
  export const isTimeSeriesChart = (chartType) => {
    switch (chartType) {
      case "LINE_TIME_SERIES":
      case "BAR_TIME_SERIES":
        return true;
      case "HORIZONTAL_BAR":
      case "VERTICAL_BAR":
      case "PIE":
      case "HISTOGRAM":
      case "NUMBER":
      case "PIVOT_TABLE":
        return false;
      default:
        return false;
    }
  };
  
  /**
   * Formats axis labels by truncating long text
   * Used for YAxis styling workarounds as discussed in 
   * https://github.com/recharts/recharts/issues/2027#issuecomment-769674096
   * @param {string} label - Label text to format
   * @returns {string} Formatted label with ellipsis if truncated
   */
  export const formatAxisLabel = (label) =>
    label.length > 13 ? label.slice(0, 13).concat("…") : label;
  
  /**
   * Maps chart types to their human-readable display names
   * @param {string} chartType - Dashboard widget chart type
   * @returns {string} Human-readable chart type name
   */
  export function getChartTypeDisplayName(chartType) {
    switch (chartType) {
      case "LINE_TIME_SERIES":
        return "Line Chart (Time Series)";
      case "BAR_TIME_SERIES":
        return "Bar Chart (Time Series)";
      case "HORIZONTAL_BAR":
        return "Horizontal Bar Chart (Total Value)";
      case "VERTICAL_BAR":
        return "Vertical Bar Chart (Total Value)";
      case "PIE":
        return "Pie Chart (Total Value)";
      case "NUMBER":
        return "Big Number (Total Value)";
      case "HISTOGRAM":
        return "Histogram (Total Value)";
      case "PIVOT_TABLE":
        return "Pivot Table (Total Value)";
      default:
        return "Unknown Chart Type";
    }
  }
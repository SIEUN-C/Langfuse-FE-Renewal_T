/**
 * @fileoverview Number formatting utility functions
 * Provides various number formatting functions for charts and displays
 */

export const compactNumberFormatter = (number, maxFractionDigits) => {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: maxFractionDigits ?? 2,
    }).format(number ?? 0);
  };
  
  /**
   * Specialized formatter for very small numbers (10^-3 to 10^-15 range)
   * Uses scientific notation for compact representation with ~3 significant digits
   */
  export const compactSmallNumberFormatter = (number, significantDigits = 3) => {
    const num = Number(number ?? 0);
  
    if (num === 0) return "0";
  
    const absNum = Math.abs(num);
  
    // For numbers >= 1e-3, use standard compact formatting
    if (absNum >= 1e-3) {
      return compactNumberFormatter(num, significantDigits);
    }
  
    // For very small numbers, use scientific notation
    return num.toExponential(significantDigits - 1);
  };
  
  export const numberFormatter = (number, fractionDigits) => {
    return Intl.NumberFormat("en-US", {
      notation: "standard",
      useGrouping: true,
      minimumFractionDigits: fractionDigits ?? 2,
      maximumFractionDigits: fractionDigits ?? 2,
    }).format(number ?? 0);
  };
  
  export const latencyFormatter = (milliseconds) => {
    return Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "second",
      unitDisplay: "narrow",
      notation: "compact",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((milliseconds ?? 0) / 1000);
  };
  
  export const usdFormatter = (
    number,
    minimumFractionDigits = 2,
    maximumFractionDigits = 6,
  ) => {
    // Handle Decimal.js objects if they exist (convert to number)
    const numberToFormat = number && typeof number.toNumber === 'function' 
      ? number.toNumber() 
      : number;
      
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numberToFormat ?? 0);
  };
  
  export const formatTokenCounts = (
    inputUsage,
    outputUsage,
    totalUsage,
    showLabels = false,
  ) => {
    if (!inputUsage && !outputUsage && !totalUsage) return "";
  
    return showLabels
      ? `${numberFormatter(inputUsage ?? 0, 0)} prompt → ${numberFormatter(outputUsage ?? 0, 0)} completion (∑ ${numberFormatter(totalUsage ?? 0, 0)})`
      : `${numberFormatter(inputUsage ?? 0, 0)} → ${numberFormatter(outputUsage ?? 0, 0)} (∑ ${numberFormatter(totalUsage ?? 0, 0)})`;
  };
  
  export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
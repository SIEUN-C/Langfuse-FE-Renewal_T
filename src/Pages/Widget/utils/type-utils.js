/**
 * @fileoverview Type checking utility functions
 * Provides common type guards and validation functions
 */

/**
 * Checks if a value is undefined or null
 * @param {any} val - Value to check
 * @returns {boolean} True if value is undefined or null
 */
export const isUndefinedOrNull = (val) => val === undefined || val === null;

/**
 * Checks if a value is not null and not undefined
 * @param {any} val - Value to check
 * @returns {boolean} True if value is neither null nor undefined
 */
export const isNotNullOrUndefined = (val) => !isUndefinedOrNull(val);

/**
 * Checks if a value is a string
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a string
 */
export function isString(value) {
  return typeof value === "string";
}
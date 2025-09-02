import React, { useEffect, useRef, useState, useMemo } from "react";
import styles from './chart-library.module.css';

// Format large numbers with appropriate units and dynamic decimal places
const formatBigNumber = (value, maxCharacters) => {
  const absValue = Math.abs(value);

  // Calculate how many decimal places we can afford based on available space
  const getOptimalDecimalPlaces = (baseNumber, unit, maxChars) => {
    if (!maxChars) return 1; // Default to 1 decimal place

    const baseStr = Math.floor(Math.abs(baseNumber)).toString();
    const signLength = value < 0 ? 1 : 0;
    const availableForDecimals =
      maxChars - baseStr.length - unit.length - signLength - 1; // -1 for decimal point

    return Math.max(0, Math.min(3, availableForDecimals)); // Max 3 decimal places, min 0
  };

  if (absValue >= 1e12) {
    const baseValue = value / 1e12;
    const decimals = getOptimalDecimalPlaces(baseValue, "T", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "T",
    };
  } else if (absValue >= 1e9) {
    const baseValue = value / 1e9;
    const decimals = getOptimalDecimalPlaces(baseValue, "B", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "B",
    };
  } else if (absValue >= 1e6) {
    const baseValue = value / 1e6;
    const decimals = getOptimalDecimalPlaces(baseValue, "M", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "M",
    };
  } else if (absValue >= 1e3) {
    const baseValue = value / 1e3;
    const decimals = getOptimalDecimalPlaces(baseValue, "K", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "K",
    };
  } else if (absValue >= 1) {
    // For numbers >= 1, show dynamic decimal places based on space
    const decimals = maxCharacters
      ? Math.min(
          3,
          Math.max(
            0,
            maxCharacters -
              Math.floor(absValue).toString().length -
              (value < 0 ? 1 : 0) -
              1,
          ),
        )
      : 2;
    return {
      formatted: value
        .toFixed(Math.max(0, Math.min(3, decimals)))
        .replace(/\.?0+$/, ""),
      unit: "",
    };
  } else if (absValue > 0) {
    // For small numbers, show as many meaningful decimal places as space allows
    // Find the first significant digit and show a few more places
    const str = absValue.toString();
    const firstSignificantIndex = str.search(/[1-9]/);

    if (firstSignificantIndex === -1) return { formatted: "0", unit: "" };

    // Calculate how many decimal places we need to show meaningful digits
    const neededDecimals = firstSignificantIndex + 2; // Show 2 significant digits
    const maxAllowedDecimals = maxCharacters ? maxCharacters - 2 : 6; // Account for "0."
    const decimals = Math.min(neededDecimals, maxAllowedDecimals, 8); // Max 8 decimal places

    return {
      formatted: value
        .toFixed(Math.max(0, Math.min(3, decimals)))
        .replace(/\.?0+$/, ""),
      unit: "",
    };
  } else {
    return { formatted: "0", unit: "" };
  }
};

/**
 * BigNumber component displays a large formatted numeric value
 * 
 * @param {Object} props - Component props
 * @param {import('./chart-props.js').DataPoint[]} props.data - Array of data points
 * @param {string} [props.className] - Additional CSS class names
 * @param {import('./chart-props.js').ChartConfig} [props.config] - Chart configuration
 * @param {boolean} [props.accessibilityLayer] - Enable accessibility features
 * @returns {React.ReactElement|null} Rendered component or null if loading
 */
const BigNumber = ({ data, className, config, accessibilityLayer }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState("size-6xl");
  const [maxCharacters, setMaxCharacters] = useState();

  // Calculate metric value from data - show loading if no data
  const isLoading = !data || data.length === 0;

  const calculatedMetric = useMemo(() => {
    if (isLoading) return 0;

    // Show the sum of all metrics, or just the first metric if only one
    if (data.length === 1) {
      return typeof data[0].metric === "number" ? data[0].metric : 0;
    }

    return data.reduce((acc, d) => {
      const metric = typeof d.metric === "number" ? d.metric : 0;
      return acc + metric;
    }, 0);
  }, [data, isLoading]);

  const displayValue = !isLoading
    ? formatBigNumber(calculatedMetric, maxCharacters)
    : { formatted: "0", unit: "" };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !textRef.current) return;

      const container = containerRef.current;

      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const availableWidth = containerWidth * 0.95; // Use more width (was 0.9)
      const availableHeight = containerHeight * 0.9; // Use more height (was 0.8)

      // Start with a large font size and scale down
      const baseFontSizes = [
        { class: "size-8xl", px: 128 },
        { class: "size-7xl", px: 96 },
        { class: "size-6xl", px: 72 },
        { class: "size-5xl", px: 60 },
        { class: "size-4xl", px: 48 },
        { class: "size-3xl", px: 36 },
        { class: "size-2xl", px: 24 },
        { class: "size-xl", px: 20 },
        { class: "size-lg", px: 18 },
        { class: "size-base", px: 16 },
        { class: "size-sm", px: 14 },
      ];

      let selectedFontSize = "size-sm";
      let calculatedMaxChars = 0;

      // Test each font size to find the largest that fits
      for (const { class: fontClass, px } of baseFontSizes) {
        // Estimate how many characters can fit - less conservative character width
        const charWidth = px * 0.55; // Less conservative (was 0.6)
        const maxChars = Math.floor(availableWidth / charWidth);

        // Quick test with current display value
        const testDisplayValue = !isLoading
          ? formatBigNumber(calculatedMetric, maxChars)
          : { formatted: "0", unit: "" };

        const textLength = (testDisplayValue.formatted + testDisplayValue.unit)
          .length;
        const estimatedWidth = textLength * charWidth;
        const estimatedHeight = px * 1.1; // Less conservative line height (was 1.2)

        if (
          estimatedWidth <= availableWidth &&
          estimatedHeight <= availableHeight
        ) {
          selectedFontSize = fontClass;
          calculatedMaxChars = maxChars;
          break;
        }
      }

      setFontSize(selectedFontSize);
      setMaxCharacters(calculatedMaxChars);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [calculatedMetric, isLoading]);

  if (isLoading) {
    return null;
  }

  // Determine unit size based on main font size
  const getUnitSizeClass = (mainSize) => {
    const sizeMap = {
      'size-8xl': 'unit-4xl',
      'size-7xl': 'unit-3xl', 
      'size-6xl': 'unit-2xl',
      'size-5xl': 'unit-xl',
      'size-4xl': 'unit-lg',
      'size-3xl': 'unit-base',
      'size-2xl': 'unit-sm',
      'size-xl': 'unit-sm',
      'size-lg': 'unit-xs',
      'size-base': 'unit-xs',
      'size-sm': 'unit-xs'
    };
    return sizeMap[mainSize] || 'unit-xs';
  };

  const combinedClassName = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  const numberClassName = [
    styles.bigNumber,
    styles[fontSize.replace('-', '')]  // size-6xl -> size6xl
  ].filter(Boolean).join(' ');

  const unitClassName = [
    styles.bigNumberUnit,
    styles[getUnitSizeClass(fontSize).replace('-', '')]  // unit-2xl -> unit2xl
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={combinedClassName}>
      <div className={styles.content}>
        <span
          ref={textRef}
          className={numberClassName}
          title={calculatedMetric.toString()}
        >
          {displayValue.formatted}
        </span>
        {displayValue.unit && (
          <span className={unitClassName}>
            {displayValue.unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default BigNumber;
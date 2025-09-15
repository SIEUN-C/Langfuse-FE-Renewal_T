// src/Pages/Widget/chart-library/BigNumber.jsx

import React, { useEffect, useRef, useState, useMemo } from "react";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * 큰 숫자를 적절한 단위와 함께 포맷
 * 컨테이너 크기에 따라 소수점 자릿수를 동적 조절
 */
const formatBigNumber = (value, maxCharacters) => {
  const absValue = Math.abs(value);

  // 컨테이너 크기에 맞는 최적 소수점 자릿수 계산
  const getOptimalDecimalPlaces = (baseNumber, unit, maxChars) => {
    if (!maxChars) return 1;

    const baseStr = Math.floor(Math.abs(baseNumber)).toString();
    const signLength = value < 0 ? 1 : 0;
    const availableForDecimals =
      maxChars - baseStr.length - unit.length - signLength - 1;

    return Math.max(0, Math.min(3, availableForDecimals));
  };

  // 1조 이상: T (Trillion)
  if (absValue >= 1e12) {
    const baseValue = value / 1e12;
    const decimals = getOptimalDecimalPlaces(baseValue, "T", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "T",
    };
  } 
  // 10억 이상: B (Billion)
  else if (absValue >= 1e9) {
    const baseValue = value / 1e9;
    const decimals = getOptimalDecimalPlaces(baseValue, "B", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "B",
    };
  } 
  // 100만 이상: M (Million)
  else if (absValue >= 1e6) {
    const baseValue = value / 1e6;
    const decimals = getOptimalDecimalPlaces(baseValue, "M", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "M",
    };
  } 
  // 1000 이상: K (Thousand)
  else if (absValue >= 1e3) {
    const baseValue = value / 1e3;
    const decimals = getOptimalDecimalPlaces(baseValue, "K", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "K",
    };
  } 
  // 1 이상: 단위 없음
  else if (absValue >= 1) {
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
  } 
  // 0과 1 사이의 작은 수
  else if (absValue > 0) {
    const str = absValue.toString();
    const firstSignificantIndex = str.search(/[1-9]/);

    if (firstSignificantIndex === -1) return { formatted: "0", unit: "" };

    const neededDecimals = firstSignificantIndex + 2;
    const maxAllowedDecimals = maxCharacters ? maxCharacters - 2 : 6;
    const decimals = Math.min(neededDecimals, maxAllowedDecimals, 8);

    return {
      formatted: value
        .toFixed(Math.max(0, Math.min(3, decimals)))
        .replace(/\.?0+$/, ""),
      unit: "",
    };
  } 
  else {
    return { formatted: "0", unit: "" };
  }
};

/**
 * BigNumber 컴포넌트
 * 큰 숫자를 컨테이너 크기에 맞게 포맷하여 표시
 * 
 * 주요 기능:
 * - 데이터 배열의 합계 또는 단일 값 계산
 * - 반응형 폰트 크기 조절 (ResizeObserver)
 * - 적절한 단위 표시 (K, M, B, T)
 * 
 * @param {Array} data - 데이터 포인트 배열
 * @param {string} className - 추가 CSS 클래스
 * @param {Object} config - 차트 설정
 * @param {boolean} accessibilityLayer - 접근성 기능 활성화
 */
const BigNumber = ({ data, className, config, accessibilityLayer }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState("size-6xl");
  const [maxCharacters, setMaxCharacters] = useState();

  const isLoading = !data || data.length === 0;

  // 메트릭 값 계산 (단일 값 또는 합계)
  const calculatedMetric = useMemo(() => {
    if (isLoading) return 0;

    if (data.length === 1) {
      return typeof data[0].metric === "number" ? data[0].metric : 0;
    }

    return data.reduce((acc, d) => {
      const metric = typeof d.metric === "number" ? d.metric : 0;
      return acc + metric;
    }, 0);
  }, [data, isLoading]);

  // 표시할 값 포맷
  const displayValue = !isLoading
    ? formatBigNumber(calculatedMetric, maxCharacters)
    : { formatted: "0", unit: "" };

  // 반응형 폰트 크기 조절
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !textRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const availableWidth = containerWidth * 0.95;
      const availableHeight = containerHeight * 0.9;

      // 폰트 크기 옵션 (큰 것부터 테스트)
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

      // 컨테이너에 맞는 최대 폰트 크기 찾기
      for (const { class: fontClass, px } of baseFontSizes) {
        const charWidth = px * 0.55;
        const maxChars = Math.floor(availableWidth / charWidth);

        const testDisplayValue = !isLoading
          ? formatBigNumber(calculatedMetric, maxChars)
          : { formatted: "0", unit: "" };

        const textLength = (testDisplayValue.formatted + testDisplayValue.unit).length;
        const estimatedWidth = textLength * charWidth;
        const estimatedHeight = px * 1.1;

        if (estimatedWidth <= availableWidth && estimatedHeight <= availableHeight) {
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

  // 메인 폰트에 따른 단위 폰트 크기 결정
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

  if (isLoading) {
    return null;
  }

  const combinedClassName = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  const numberClassName = [
    styles.bigNumber,
    styles[fontSize.replace('-', '')]
  ].filter(Boolean).join(' ');

  const unitClassName = [
    styles.bigNumberUnit,
    styles[getUnitSizeClass(fontSize).replace('-', '')]
  ].filter(Boolean).join(' ');

  return (
    <ChartContainer config={config}>
      <div ref={containerRef} className={combinedClassName}>
        <div className={styles.content}>
          {/* 메인 숫자 */}
          <span
            ref={textRef}
            className={numberClassName}
            title={calculatedMetric.toString()}
          >
            {displayValue.formatted}
          </span>
          
          {/* 단위 (있는 경우만) */}
          {displayValue.unit && (
            <span className={unitClassName}>
              {displayValue.unit}
            </span>
          )}
        </div>
      </div>
    </ChartContainer>
  );
};

export default BigNumber;
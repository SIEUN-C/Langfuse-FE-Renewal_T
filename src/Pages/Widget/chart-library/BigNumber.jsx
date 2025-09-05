import React, { useEffect, useRef, useState, useMemo } from "react";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * 큰 숫자를 적절한 단위(K, M, B, T)와 함께 포맷하는 함수
 * 컨테이너 크기에 따라 소수점 자릿수를 동적으로 조절함
 * 
 * @param {number} value - 포맷할 숫자 값
 * @param {number} [maxCharacters] - 표시 가능한 최대 문자 수 (컨테이너 크기 기반)
 * @returns {Object} { formatted: string, unit: string } - 포맷된 숫자와 단위
 */
const formatBigNumber = (value, maxCharacters) => {
  const absValue = Math.abs(value);

  /**
   * 사용 가능한 공간에 따라 최적의 소수점 자릿수를 계산
   * 
   * @param {number} baseNumber - 기본 숫자 (단위 적용 후)
   * @param {string} unit - 단위 문자열 (K, M, B, T)
   * @param {number} maxChars - 최대 문자 수
   * @returns {number} 최적의 소수점 자릿수 (0-3)
   */
  const getOptimalDecimalPlaces = (baseNumber, unit, maxChars) => {
    if (!maxChars) return 1; // 기본값: 소수점 1자리

    // 정수 부분의 길이 계산
    const baseStr = Math.floor(Math.abs(baseNumber)).toString();
    // 음수 기호 길이 (있는 경우)
    const signLength = value < 0 ? 1 : 0;
    // 소수점을 위해 사용 가능한 문자 수 계산
    const availableForDecimals =
      maxChars - baseStr.length - unit.length - signLength - 1; // -1은 소수점

    // 최대 3자리, 최소 0자리로 제한
    return Math.max(0, Math.min(3, availableForDecimals));
  };

  // 1조 이상: T (Trillion) 단위
  if (absValue >= 1e12) {
    const baseValue = value / 1e12;
    const decimals = getOptimalDecimalPlaces(baseValue, "T", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""), // 불필요한 0 제거
      unit: "T",
    };
  } 
  // 10억 이상: B (Billion) 단위
  else if (absValue >= 1e9) {
    const baseValue = value / 1e9;
    const decimals = getOptimalDecimalPlaces(baseValue, "B", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "B",
    };
  } 
  // 100만 이상: M (Million) 단위
  else if (absValue >= 1e6) {
    const baseValue = value / 1e6;
    const decimals = getOptimalDecimalPlaces(baseValue, "M", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "M",
    };
  } 
  // 1000 이상: K (Thousand) 단위
  else if (absValue >= 1e3) {
    const baseValue = value / 1e3;
    const decimals = getOptimalDecimalPlaces(baseValue, "K", maxCharacters);
    return {
      formatted: baseValue.toFixed(decimals).replace(/\.?0+$/, ""),
      unit: "K",
    };
  } 
  // 1 이상: 단위 없음, 동적 소수점
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
      : 2; // 기본값: 소수점 2자리
    return {
      formatted: value
        .toFixed(Math.max(0, Math.min(3, decimals)))
        .replace(/\.?0+$/, ""),
      unit: "",
    };
  } 
  // 0과 1 사이의 작은 수: 의미있는 자릿수 표시
  else if (absValue > 0) {
    const str = absValue.toString();
    const firstSignificantIndex = str.search(/[1-9]/); // 첫 번째 유의미한 숫자 위치

    if (firstSignificantIndex === -1) return { formatted: "0", unit: "" };

    // 유의미한 숫자 2개를 보여주기 위한 소수점 자릿수 계산
    const neededDecimals = firstSignificantIndex + 2;
    const maxAllowedDecimals = maxCharacters ? maxCharacters - 2 : 6; // "0." 고려
    const decimals = Math.min(neededDecimals, maxAllowedDecimals, 8); // 최대 8자리

    return {
      formatted: value
        .toFixed(Math.max(0, Math.min(3, decimals)))
        .replace(/\.?0+$/, ""),
      unit: "",
    };
  } 
  // 0 또는 음의 무한소
  else {
    return { formatted: "0", unit: "" };
  }
};

/**
 * BigNumber 컴포넌트 - 큰 숫자를 포맷하여 표시하는 위젯
 * 
 * 주요 기능:
 * 1. 데이터 배열의 합계 또는 단일 값을 계산
 * 2. 컨테이너 크기에 맞춰 폰트 크기 자동 조절
 * 3. 숫자 크기에 따른 적절한 단위 표시 (K, M, B, T)
 * 4. 반응형 디자인 (ResizeObserver 사용)
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {import('./chart-props.js').DataPoint[]} props.data - 데이터 포인트 배열
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {import('./chart-props.js').ChartConfig} [props.config] - 차트 설정 (원본 호환성)
 * @param {boolean} [props.accessibilityLayer] - 접근성 기능 활성화 여부
 * @returns {React.ReactElement|null} 렌더링된 컴포넌트 또는 로딩 중일 때 null
 */
const BigNumber = ({ data, className, config, accessibilityLayer }) => {
  // ===== DOM 참조 및 상태 관리 =====
  const containerRef = useRef(null); // 컨테이너 요소 참조 (크기 측정용)
  const textRef = useRef(null);      // 텍스트 요소 참조 (폰트 크기 조절용)
  const [fontSize, setFontSize] = useState("size-6xl"); // 현재 폰트 크기 클래스
  const [maxCharacters, setMaxCharacters] = useState(); // 표시 가능한 최대 문자 수

  // ===== 데이터 상태 검사 =====
  // 데이터가 없거나 빈 배열인 경우 로딩 상태로 처리
  const isLoading = !data || data.length === 0;

  /**
   * 메트릭 값 계산 (메모이제이션)
   * 단일 데이터 포인트의 경우 해당 값을, 복수인 경우 합계를 반환
   */
  const calculatedMetric = useMemo(() => {
    if (isLoading) return 0;

    // 단일 데이터 포인트: 해당 값 사용
    if (data.length === 1) {
      return typeof data[0].metric === "number" ? data[0].metric : 0;
    }

    // 복수 데이터 포인트: 모든 메트릭의 합계 계산
    return data.reduce((acc, d) => {
      const metric = typeof d.metric === "number" ? d.metric : 0;
      return acc + metric;
    }, 0);
  }, [data, isLoading]);

  /**
   * 표시할 값 포맷 (메모이제이션)
   * 로딩 중이 아닐 때만 실제 포맷 적용
   */
  const displayValue = !isLoading
    ? formatBigNumber(calculatedMetric, maxCharacters)
    : { formatted: "0", unit: "" };

  /**
   * 반응형 폰트 크기 조절 효과
   * ResizeObserver를 사용하여 컨테이너 크기 변화를 감지하고
   * 그에 맞는 최적의 폰트 크기를 계산
   */
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      // DOM 요소가 존재하지 않으면 조기 종료
      if (!containerRef.current || !textRef.current) return;

      const container = containerRef.current;

      // ===== 컨테이너 크기 측정 =====
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      // 여백을 고려한 실제 사용 가능 영역 (95% x 90%)
      const availableWidth = containerWidth * 0.95;
      const availableHeight = containerHeight * 0.9;

      // ===== 폰트 크기 옵션 정의 =====
      // 큰 크기부터 작은 크기 순서로 테스트
      const baseFontSizes = [
        { class: "size-8xl", px: 128 }, // 8rem
        { class: "size-7xl", px: 96 },  // 6rem
        { class: "size-6xl", px: 72 },  // 4.5rem
        { class: "size-5xl", px: 60 },  // 3.75rem
        { class: "size-4xl", px: 48 },  // 3rem
        { class: "size-3xl", px: 36 },  // 2.25rem
        { class: "size-2xl", px: 24 },  // 1.5rem
        { class: "size-xl", px: 20 },   // 1.25rem
        { class: "size-lg", px: 18 },   // 1.125rem
        { class: "size-base", px: 16 }, // 1rem
        { class: "size-sm", px: 14 },   // 0.875rem
      ];

      let selectedFontSize = "size-sm"; // 기본값: 가장 작은 크기
      let calculatedMaxChars = 0;

      // ===== 최적 폰트 크기 탐색 =====
      // 각 폰트 크기를 테스트하여 컨테이너에 맞는 가장 큰 크기 선택
      for (const { class: fontClass, px } of baseFontSizes) {
        // 문자 너비 추정 (폰트 크기의 55%)
        const charWidth = px * 0.55;
        // 한 줄에 들어갈 수 있는 최대 문자 수
        const maxChars = Math.floor(availableWidth / charWidth);

        // 현재 폰트 크기로 표시값 테스트
        const testDisplayValue = !isLoading
          ? formatBigNumber(calculatedMetric, maxChars)
          : { formatted: "0", unit: "" };

        // 전체 텍스트 길이 계산
        const textLength = (testDisplayValue.formatted + testDisplayValue.unit).length;
        // 예상 너비와 높이 계산
        const estimatedWidth = textLength * charWidth;
        const estimatedHeight = px * 1.1; // 라인 높이 고려

        // 컨테이너에 맞으면 이 크기 선택하고 종료
        if (estimatedWidth <= availableWidth && estimatedHeight <= availableHeight) {
          selectedFontSize = fontClass;
          calculatedMaxChars = maxChars;
          break;
        }
      }

      // ===== 상태 업데이트 =====
      setFontSize(selectedFontSize);
      setMaxCharacters(calculatedMaxChars);
    });

    // ===== ResizeObserver 등록 =====
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // ===== 클린업 함수 =====
    return () => resizeObserver.disconnect();
  }, [calculatedMetric, isLoading]); // 의존성: 계산된 메트릭과 로딩 상태

  /**
   * 메인 폰트 크기에 따른 단위 폰트 크기 결정
   * 메인 텍스트보다 작은 크기로 설정하여 시각적 계층 구조 생성
   * 
   * @param {string} mainSize - 메인 텍스트의 폰트 크기 클래스
   * @returns {string} 단위 텍스트의 폰트 크기 클래스
   */
  const getUnitSizeClass = (mainSize) => {
    const sizeMap = {
      'size-8xl': 'unit-4xl', // 128px -> 48px
      'size-7xl': 'unit-3xl', // 96px -> 36px
      'size-6xl': 'unit-2xl', // 72px -> 24px
      'size-5xl': 'unit-xl',  // 60px -> 20px
      'size-4xl': 'unit-lg',  // 48px -> 18px
      'size-3xl': 'unit-base',// 36px -> 16px
      'size-2xl': 'unit-sm',  // 24px -> 14px
      'size-xl': 'unit-sm',   // 20px -> 14px
      'size-lg': 'unit-xs',   // 18px -> 12px
      'size-base': 'unit-xs', // 16px -> 12px
      'size-sm': 'unit-xs'    // 14px -> 12px
    };
    return sizeMap[mainSize] || 'unit-xs'; // 기본값: 가장 작은 단위 크기
  };

  // ===== 로딩 상태 처리 =====
  // 데이터가 없으면 아무것도 렌더링하지 않음
  if (isLoading) {
    return null;
  }

  // ===== CSS 클래스 조합 =====
  // 컨테이너 클래스: 기본 스타일 + 사용자 정의 클래스
  const combinedClassName = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  // 숫자 텍스트 클래스: 기본 스타일 + 동적 폰트 크기
  // 'size-6xl' -> 'size6xl' (CSS 클래스명 형식 변환)
  const numberClassName = [
    styles.bigNumber,
    styles[fontSize.replace('-', '')]
  ].filter(Boolean).join(' ');

  // 단위 텍스트 클래스: 기본 스타일 + 동적 폰트 크기
  // 'unit-2xl' -> 'unit2xl' (CSS 클래스명 형식 변환)
  const unitClassName = [
    styles.bigNumberUnit,
    styles[getUnitSizeClass(fontSize).replace('-', '')]
  ].filter(Boolean).join(' ');

  // ===== 컴포넌트 렌더링 =====
  return (
    // ChartContainer로 감싸서 원본 Langfuse와 동일한 크기 제어 적용
    <ChartContainer config={config}>
      <div ref={containerRef} className={combinedClassName}>
        <div className={styles.content}>
          {/* 메인 숫자 텍스트 */}
          <span
            ref={textRef}
            className={numberClassName}
            title={calculatedMetric.toString()} // 전체 값을 툴팁으로 표시
          >
            {displayValue.formatted}
          </span>
          
          {/* 단위 텍스트 (있는 경우에만 표시) */}
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
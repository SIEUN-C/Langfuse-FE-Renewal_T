// hooks/useDebounce.js
import { useLayoutEffect, useMemo, useRef } from "react";

/**
 * 디바운스 유틸리티 함수
 * @param {Function} func - 디바운스할 함수
 * @param {number} timeout - 지연 시간 (ms)
 * @param {boolean} executeFirstCall - 첫 번째 호출 즉시 실행 여부
 */
function debounce(func, timeout, executeFirstCall = false) {
  let timer = null;
  let result = undefined;

  return (...args) => {
    const callNow = executeFirstCall && !timer;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      result = func(...args);
    }, timeout);

    if (callNow) {
      result = func(...args);
    }

    return result;
  };
}

/**
 * 함수를 디바운스하는 React 훅
 * 검색, 자동저장 등 연속 호출을 제한할 때 사용
 * 
 * @param {Function} callback - 디바운스할 콜백 함수
 * @param {number} delay - 디바운스 지연 시간 (기본: 600ms)
 * @param {boolean} executeFirstCall - 첫 번째 호출 즉시 실행 여부 (기본: true)
 * @returns {Function} 디바운스된 콜백 함수
 * 
 * @example
 * const debouncedSearch = useDebounce((query) => {
 *   searchAPI(query);
 * }, 500);
 */
export function useDebounce(callback, delay = 600, executeFirstCall = true) {
  const callbackRef = useRef(callback);
  
  // 최신 콜백 함수를 ref에 저장 (클로저 문제 해결)
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () =>
      debounce(
        (...args) => callbackRef.current(...args),
        delay,
        executeFirstCall,
      ),
    [delay, executeFirstCall],
  );
}
import { useLayoutEffect, useMemo, useRef } from "react";

/**
 * 함수 호출을 지연시키는 debounce 유틸리티
 * @param {Function} func - 디바운스할 함수
 * @param {number} timeout - 지연 시간 (ms)
 * @param {boolean} executeFirstCall - 첫 번째 호출을 즉시 실행할지 여부
 * @returns {Function} 디바운스된 함수
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
 * @param {Function} callback - 디바운스할 콜백 함수
 * @param {number} delay - 디바운스 지연 시간 (기본: 600ms)
 * @param {boolean} executeFirstCall - 첫 번째 호출을 즉시 실행할지 여부 (기본: true)
 * @returns {Function} 디바운스된 콜백 함수
 * 
 * @example
 * const debouncedSave = useDebounce((data) => {
 *   saveToAPI(data);
 * }, 500);
 * 
 * // 사용법
 * debouncedSave(newData); // 500ms 후에 실행됨
 */
export function useDebounce(callback, delay = 600, executeFirstCall = true) {
  const callbackRef = useRef(callback);
  
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
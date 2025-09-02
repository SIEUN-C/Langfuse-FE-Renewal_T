/**
 * 숫자를 컴팩트 형식으로 포맷 (1K, 1M, 1B 등)
 * @param {number|bigint} number - 포맷할 숫자
 * @param {number} maxFractionDigits - 최대 소수점 자릿수 (기본: 2)
 * @returns {string} 포맷된 숫자 문자열
 */
export const compactNumberFormatter = (
    number,
    maxFractionDigits = 2
  ) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: maxFractionDigits,
    }).format(number ?? 0);
  };
  
  /**
   * 매우 작은 숫자를 위한 특화 포맷터 (10^-3 to 10^-15 범위)
   * 과학적 표기법을 사용하여 약 3자리 유효숫자로 컴팩트하게 표현
   * @param {number|bigint} number - 포맷할 숫자
   * @param {number} significantDigits - 유효숫자 자릿수 (기본: 3)
   * @returns {string} 포맷된 숫자 문자열
   */
  export const compactSmallNumberFormatter = (
    number,
    significantDigits = 3
  ) => {
    const num = Number(number ?? 0);
  
    if (num === 0) return "0";
  
    const absNum = Math.abs(num);
  
    // 1e-3 이상의 숫자는 표준 컴팩트 포맷 사용
    if (absNum >= 1e-3) {
      return compactNumberFormatter(num, significantDigits);
    }
  
    // 매우 작은 숫자는 과학적 표기법 사용
    return num.toExponential(significantDigits - 1);
  };
  
  /**
   * 표준 숫자 포맷터
   * @param {number|bigint} number - 포맷할 숫자
   * @param {number} fractionDigits - 소수점 자릿수 (기본: 2)
   * @returns {string} 포맷된 숫자 문자열
   */
  export const numberFormatter = (
    number,
    fractionDigits = 2
  ) => {
    return new Intl.NumberFormat("en-US", {
      notation: "standard",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(number ?? 0);
  };
  
  /**
   * 지연시간 포맷터 (밀리초를 초로 변환)
   * @param {number} milliseconds - 밀리초 단위 시간
   * @returns {string} 포맷된 시간 문자열 (예: "1.23s")
   */
  export const latencyFormatter = (milliseconds) => {
    return new Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "second", 
      unitDisplay: "narrow",
      notation: "compact",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((milliseconds ?? 0) / 1000);
  };
  
  /**
   * USD 통화 포맷터
   * @param {number|bigint} number - 포맷할 숫자 (Decimal 객체도 지원)
   * @param {number} minimumFractionDigits - 최소 소수점 자릿수 (기본: 2)
   * @param {number} maximumFractionDigits - 최대 소수점 자릿수 (기본: 6)
   * @returns {string} 포맷된 통화 문자열 (예: "$1,234.56")
   */
  export const usdFormatter = (
    number,
    minimumFractionDigits = 2,
    maximumFractionDigits = 6
  ) => {
    // Decimal 객체인 경우 숫자로 변환 (일단 기본 Number 사용)
    const numberToFormat = (number && typeof number.toNumber === 'function') 
      ? number.toNumber() 
      : number;
      
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numberToFormat ?? 0);
  };
  
  /**
   * 지정된 범위에서 랜덤 정수 생성
   * @param {number} min - 최솟값 (포함)
   * @param {number} max - 최댓값 (포함)
   * @returns {number} 랜덤 정수
   */
  export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
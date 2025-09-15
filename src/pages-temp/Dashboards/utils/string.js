/**
 * 문자열의 마지막 n개 문자를 반환
 * @param {string} str - 원본 문자열
 * @param {number} n - 가져올 문자 개수
 * @returns {string} 마지막 n개 문자
 */
export function lastCharacters(str, n) {
    return str.substring(str.length - n);
  }
  
  /**
   * 문자열을 지정된 길이로 자르고 '...' 추가
   * @param {string} str - 원본 문자열
   * @param {number} n - 최대 길이 (기본값: 16)
   * @returns {string} 잘린 문자열
   */
  export function truncate(str, n = 16) {
    if (str.length > n) {
      return str.substring(0, n) + "...";
    }
    return str;
  }
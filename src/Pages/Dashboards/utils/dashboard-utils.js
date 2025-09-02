import { usdFormatter } from './numbers';

/**
 * 트레이스에는 startTime이나 endTime 컬럼이 없으므로 timestamp 컬럼으로 매핑
 * @param {Array} filters - 필터 상태 배열
 * @param {string} columnName - 매핑할 컬럼명 (기본: "timestamp")
 * @returns {Array} 변환된 필터 배열
 */
export const createTracesTimeFilter = (
  filters,
  columnName = "timestamp",
) => {
  return filters.map((f) => {
    if (f.column === "startTime" || f.column === "endTime") {
      return {
        ...f,
        column: columnName,
      };
    } else {
      return f;
    }
  });
};

/**
 * 총 비용을 대시보드용으로 포맷팅하는 함수
 * @param {number} totalCost - 총 비용
 * @returns {string} 포맷된 비용 문자열
 */
export const totalCostDashboardFormatted = (totalCost) => {
  return totalCost
    ? totalCost < 5
      ? usdFormatter(totalCost, 2, 6)  // $5 미만: 최대 6자리 소수점
      : usdFormatter(totalCost, 2, 2)  // $5 이상: 최대 2자리 소수점
    : usdFormatter(0);
};
// 기본 설정값들
export const DEFAULT_DASHBOARD_AGGREGATION_SELECTION = "24 hours";
export const DASHBOARD_AGGREGATION_PLACEHOLDER = "Custom";

// 대시보드 집계 옵션들
export const DASHBOARD_AGGREGATION_OPTIONS = [
  "5 min",
  "30 min", 
  "1 hour",
  "3 hours",
  "24 hours",
  "7 days",
  "1 month",
  "3 months",
  "1 year",
];

// 테이블 집계 옵션들
export const TABLE_AGGREGATION_OPTIONS = [
  "30 min",
  "1 hour",
  "6 hours", 
  "24 hours",
  "3 days",
  "7 days",
  "14 days",
  "1 month",
  "3 months",
  "All time",
];

// 모든 날짜/시간 집계 옵션들
export const dateTimeAggregationOptions = [
  ...TABLE_AGGREGATION_OPTIONS,
  ...DASHBOARD_AGGREGATION_OPTIONS,
];

/**
 * 대시보드 날짜 범위 집계 설정
 * 각 옵션별로 date_trunc와 분 단위 시간을 정의
 */
export const dashboardDateRangeAggregationSettings = {
  "1 year": {
    date_trunc: "month",
    minutes: 365 * 24 * 60,
  },
  "3 months": {
    date_trunc: "week", 
    minutes: 3 * 30 * 24 * 60,
  },
  "1 month": {
    date_trunc: "day",
    minutes: 30 * 24 * 60,
  },
  "7 days": {
    date_trunc: "hour",
    minutes: 7 * 24 * 60,
  },
  "24 hours": {
    date_trunc: "hour",
    minutes: 24 * 60,
  },
  "3 hours": {
    date_trunc: "minute",
    minutes: 3 * 60,
  },
  "1 hour": {
    date_trunc: "minute", 
    minutes: 60,
  },
  "30 min": {
    date_trunc: "minute",
    minutes: 30,
  },
  "5 min": {
    date_trunc: "minute",
    minutes: 5,
  },
};

// 테이블 날짜 범위 집계 설정 (Map 형태)
const TABLE_DATE_RANGE_AGGREGATION_SETTINGS = new Map([
  ["3 months", 3 * 30 * 24 * 60],
  ["1 month", 30 * 24 * 60],
  ["14 days", 14 * 24 * 60],
  ["7 days", 7 * 24 * 60],
  ["3 days", 3 * 24 * 60],
  ["24 hours", 24 * 60],
  ["6 hours", 6 * 60],
  ["1 hour", 60],
  ["30 min", 30],
  ["All time", null],
]);

/**
 * 대시보드 날짜 범위 옵션이 사용 가능한지 확인
 * @param {Object} params
 * @param {string} params.option - 날짜 범위 옵션
 * @param {number|false} params.limitDays - 제한 일수
 * @returns {boolean} 사용 가능 여부
 */
export const isDashboardDateRangeOptionAvailable = ({
  option,
  limitDays,
}) => {
  if (limitDays === false) return true;

  const settings = dashboardDateRangeAggregationSettings[option];
  if (!settings) return false;
  
  const { minutes } = settings;
  return limitDays >= minutes / (24 * 60);
};

/**
 * 테이블 데이터 범위 옵션이 사용 가능한지 확인
 * @param {Object} params
 * @param {string} params.option - 날짜 범위 옵션  
 * @param {number|false} params.limitDays - 제한 일수
 * @returns {boolean} 사용 가능 여부
 */
export const isTableDataRangeOptionAvailable = ({
  option,
  limitDays,
}) => {
  if (limitDays === false) return true;

  const durationMinutes = TABLE_DATE_RANGE_AGGREGATION_SETTINGS.get(option);
  if (!durationMinutes) return false;

  return limitDays >= durationMinutes / (24 * 60);
};

/**
 * 분 단위를 Date 객체에 더하는 헬퍼 함수
 * @param {Date} date - 기준 날짜
 * @param {number} minutes - 더할 분 수
 * @returns {Date} 새로운 Date 객체
 */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * 선택된 시간 옵션으로부터 Date 객체 생성
 * @param {Object} selectedTimeOption - 선택된 시간 옵션
 * @param {string} selectedTimeOption.filterSource - 필터 소스 ("TABLE" | "DASHBOARD")
 * @param {string} selectedTimeOption.option - 옵션명
 * @returns {Date|undefined} 계산된 날짜
 */
export const getDateFromOption = (selectedTimeOption) => {
  if (!selectedTimeOption) return undefined;

  const { filterSource, option } = selectedTimeOption;
  
  if (filterSource === "TABLE") {
    const setting = TABLE_DATE_RANGE_AGGREGATION_SETTINGS.get(option);
    if (!setting) return undefined;

    return addMinutes(new Date(), -setting);
  } else if (filterSource === "DASHBOARD") {
    const setting = dashboardDateRangeAggregationSettings[option];
    if (!setting) return undefined;

    return addMinutes(new Date(), -setting.minutes);
  }
  
  return undefined;
};

/**
 * 유효한 대시보드 날짜 범위 집계 옵션인지 확인
 * @param {string} value - 확인할 값
 * @returns {boolean} 유효 여부
 */
export function isValidDashboardDateRangeAggregationOption(value) {
  if (!value) return false;
  return DASHBOARD_AGGREGATION_OPTIONS.includes(value);
}

/**
 * 유효한 테이블 날짜 범위 집계 옵션인지 확인
 * @param {string} value - 확인할 값
 * @returns {boolean} 유효 여부
 */
export function isValidTableDateRangeAggregationOption(value) {
  if (!value) return false;
  return TABLE_AGGREGATION_OPTIONS.includes(value);
}

/**
 * 주어진 날짜 범위에 가장 가까운 대시보드 간격 찾기
 * @param {Object} dateRange - 날짜 범위 객체
 * @param {Date} dateRange.from - 시작 날짜
 * @param {Date} dateRange.to - 종료 날짜
 * @returns {string|undefined} 가장 가까운 간격 옵션
 */
export const findClosestDashboardInterval = (dateRange) => {
  if (!dateRange.from || !dateRange.to) return undefined;
  
  const duration = dateRange.to.getTime() - dateRange.from.getTime();

  const diffs = DASHBOARD_AGGREGATION_OPTIONS.map((interval) => {
    const { minutes } = dashboardDateRangeAggregationSettings[interval];
    return {
      interval,
      diff: Math.abs(duration - minutes * 60 * 1000),
    };
  });

  diffs.sort((a, b) => a.diff - b.diff);

  return diffs[0]?.interval;
};
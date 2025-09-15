// src/Pages/Dashboards/utils/date-range-utils.js

// 🆕 기본 설정값들
export const DEFAULT_DASHBOARD_AGGREGATION_SELECTION = "24 hours";
export const DASHBOARD_AGGREGATION_PLACEHOLDER = "Custom";

// 🆕 대시보드 집계 옵션들
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

// 🆕 테이블 집계 옵션들
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

// 🆕 모든 날짜/시간 집계 옵션들
export const dateTimeAggregationOptions = [
  ...TABLE_AGGREGATION_OPTIONS,
  ...DASHBOARD_AGGREGATION_OPTIONS,
];

/**
 * 대시보드 날짜 범위 집계 설정
 * 시간 단위별로 적절한 date_trunc 값과 분 단위 시간을 매핑
 */
export const dashboardDateRangeAggregationSettings = {
  // 분 단위
  '1 minute': {
    date_trunc: 'minute',
    display: '1분',
    shortDisplay: '1m',
    minutes: 1
  },
  '5 minutes': {
    date_trunc: 'minute',
    display: '5분',
    shortDisplay: '5m',
    minutes: 5
  },
  '15 minutes': {
    date_trunc: 'minute',
    display: '15분',
    shortDisplay: '15m',
    minutes: 15
  },
  '30 minutes': {
    date_trunc: 'minute',
    display: '30분',
    shortDisplay: '30m',
    minutes: 30
  },

  // 시간 단위
  '1 hour': {
    date_trunc: 'hour',
    display: '1시간',
    shortDisplay: '1h',
    minutes: 60
  },
  '3 hours': {
    date_trunc: 'hour',
    display: '3시간',
    shortDisplay: '3h',
    minutes: 3 * 60
  },
  '6 hours': {
    date_trunc: 'hour',
    display: '6시간',
    shortDisplay: '6h',
    minutes: 6 * 60
  },
  '12 hours': {
    date_trunc: 'hour',
    display: '12시간',
    shortDisplay: '12h',
    minutes: 12 * 60
  },

  // 일 단위
  '1 day': {
    date_trunc: 'day',
    display: '1일',
    shortDisplay: '1d',
    minutes: 24 * 60
  },
  '3 days': {
    date_trunc: 'day',
    display: '3일',
    shortDisplay: '3d',
    minutes: 3 * 24 * 60
  },
  '7 days': {
    date_trunc: 'day',
    display: '7일',
    shortDisplay: '7d',
    minutes: 7 * 24 * 60
  },

  // 주 단위
  '1 week': {
    date_trunc: 'week',
    display: '1주',
    shortDisplay: '1w',
    minutes: 7 * 24 * 60
  },
  '2 weeks': {
    date_trunc: 'week',
    display: '2주',
    shortDisplay: '2w',
    minutes: 14 * 24 * 60
  },

  // 월 단위
  '1 month': {
    date_trunc: 'month',
    display: '1개월',
    shortDisplay: '1M',
    minutes: 30 * 24 * 60
  },
  '3 months': {
    date_trunc: 'month',
    display: '3개월',
    shortDisplay: '3M',
    minutes: 3 * 30 * 24 * 60
  },
  '6 months': {
    date_trunc: 'month',
    display: '6개월',
    shortDisplay: '6M',
    minutes: 6 * 30 * 24 * 60
  },

  // 년 단위
  '1 year': {
    date_trunc: 'year',
    display: '1년',
    shortDisplay: '1Y',
    minutes: 365 * 24 * 60
  },

  // 🆕 새로운 옵션들 (minutes 포함)
  "5 min": {
    date_trunc: "minute",
    minutes: 5,
  },
  "30 min": {
    date_trunc: "minute",
    minutes: 30,
  },
  "24 hours": {
    date_trunc: "hour",
    minutes: 24 * 60,
  }
};

// 🆕 테이블 날짜 범위 집계 설정 (Map 형태)
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
 * 집계 옵션에서 date_trunc 값을 가져오는 헬퍼 함수
 * @param {string} aggregation - 집계 옵션 (예: "1 hour", "1 day")
 * @returns {string} date_trunc 값 (예: "hour", "day")
 */
export const getDateTruncForAggregation = (aggregation) => {
  const setting = dashboardDateRangeAggregationSettings[aggregation];
  return setting?.date_trunc || 'hour';
};

/**
 * 집계 옵션의 표시명을 가져오는 헬퍼 함수
 * @param {string} aggregation - 집계 옵션
 * @param {boolean} short - 짧은 표시명 사용 여부
 * @returns {string} 표시명
 */
export const getDisplayNameForAggregation = (aggregation, short = false) => {
  const setting = dashboardDateRangeAggregationSettings[aggregation];
  return short ? (setting?.shortDisplay || aggregation) : (setting?.display || aggregation);
};

/**
 * 날짜 범위에 따라 적절한 집계 옵션을 추천하는 함수
 * @param {Date} fromDate - 시작 날짜
 * @param {Date} toDate - 종료 날짜
 * @returns {string} 추천 집계 옵션
 */
export const getRecommendedAggregation = (fromDate, toDate) => {
  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours <= 2) return '5 min';
  if (diffHours <= 6) return '30 min';
  if (diffHours <= 24) return '1 hour';
  if (diffHours <= 48) return '3 hours';
  if (diffDays <= 7) return '24 hours';
  if (diffDays <= 30) return '7 days';
  if (diffDays <= 90) return '1 month';
  if (diffDays <= 365) return '3 months';
  
  return '1 year';
};

/**
 * 🆕 대시보드 날짜 범위 옵션이 사용 가능한지 확인
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
 * 🆕 테이블 데이터 범위 옵션이 사용 가능한지 확인
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
 * 🆕 분 단위를 Date 객체에 더하는 헬퍼 함수
 * @param {Date} date - 기준 날짜
 * @param {number} minutes - 더할 분 수
 * @returns {Date} 새로운 Date 객체
 */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * 🆕 선택된 시간 옵션으로부터 Date 객체 생성
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
 * 🆕 유효한 대시보드 날짜 범위 집계 옵션인지 확인
 * @param {string} value - 확인할 값
 * @returns {boolean} 유효 여부
 */
export function isValidDashboardDateRangeAggregationOption(value) {
  if (!value) return false;
  return DASHBOARD_AGGREGATION_OPTIONS.includes(value);
}

/**
 * 🆕 유효한 테이블 날짜 범위 집계 옵션인지 확인
 * @param {string} value - 확인할 값
 * @returns {boolean} 유효 여부
 */
export function isValidTableDateRangeAggregationOption(value) {
  if (!value) return false;
  return TABLE_AGGREGATION_OPTIONS.includes(value);
}

/**
 * 🆕 주어진 날짜 범위에 가장 가까운 대시보드 간격 찾기
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
// hooks/useDashboardDateRange.js
import { useState } from "react";

// 날짜 범위 옵션 정의
const DATE_RANGE_OPTIONS = {
  "24 hours": { minutes: 24 * 60 },
  "7 days": { minutes: 7 * 24 * 60 },
  "30 days": { minutes: 30 * 24 * 60 },
  "90 days": { minutes: 90 * 24 * 60 },
};

// 분을 빼는 헬퍼 함수 (date-fns 대체)
const subtractMinutes = (date, minutes) => {
  return new Date(date.getTime() - minutes * 60 * 1000);
};

export const useDashboardDateRange = ({ 
  defaultRelativeAggregation = "7 days" 
} = {}) => {
  const [selectedOption, setSelectedOption] = useState(defaultRelativeAggregation);
  
  // 선택된 옵션에 따라 날짜 범위 계산
  const calculateDateRange = (option) => {
    if (option === "Select a date range" || !DATE_RANGE_OPTIONS[option]) {
      return undefined;
    }
    
    const now = new Date();
    const minutes = DATE_RANGE_OPTIONS[option].minutes;
    
    return {
      from: subtractMinutes(now, minutes),
      to: now,
    };
  };

  const [dateRange, setDateRange] = useState(() => 
    calculateDateRange(defaultRelativeAggregation)
  );

  const setDateRangeAndOption = (option, customRange) => {
    setSelectedOption(option);
    
    if (customRange) {
      // 커스텀 날짜 범위가 제공된 경우
      setDateRange(customRange);
    } else {
      // 프리셋 옵션인 경우 자동 계산
      const calculatedRange = calculateDateRange(option);
      setDateRange(calculatedRange);
    }
  };

  return {
    selectedOption,
    dateRange,
    setDateRangeAndOption,
  };
};
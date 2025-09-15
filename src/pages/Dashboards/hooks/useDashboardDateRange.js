// hooks/useDashboardDateRange.js
import { useState } from "react";

const DATE_RANGE_OPTIONS = {
  "24 hours": { minutes: 24 * 60 },
  "7 days": { minutes: 7 * 24 * 60 },
  "30 days": { minutes: 30 * 24 * 60 },
  "90 days": { minutes: 90 * 24 * 60 },
};

// date-fns 라이브러리 대신 사용하는 헬퍼 함수
const subtractMinutes = (date, minutes) => {
  return new Date(date.getTime() - minutes * 60 * 1000);
};

/**
 * 대시보드 날짜 범위 관리 훅
 * 프리셋 옵션(24h, 7d 등)과 커스텀 날짜 범위를 모두 지원
 * 
 * @param {string} defaultRelativeAggregation - 기본 선택 옵션 (기본값: "7 days")
 * @returns {Object} { selectedOption, dateRange, setDateRangeAndOption }
 */
export const useDashboardDateRange = ({ 
  defaultRelativeAggregation = "7 days" 
} = {}) => {
  const [selectedOption, setSelectedOption] = useState(defaultRelativeAggregation);
  
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
      // 커스텀 날짜 범위 (DatePicker에서 직접 선택한 경우)
      setDateRange(customRange);
    } else {
      // 프리셋 옵션 (드롭다운에서 선택한 경우)
      const calculatedRange = calculateDateRange(option);
      setDateRange(calculatedRange);
    }
  };

  return {
    selectedOption,     // 현재 선택된 옵션 ("7 days", "30 days" 등)
    dateRange,          // 실제 날짜 범위 { from: Date, to: Date }
    setDateRangeAndOption, // 옵션과 날짜 범위를 동시에 업데이트
  };
};
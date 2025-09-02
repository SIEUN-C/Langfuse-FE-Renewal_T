// src/components/DateRange/DateRangePopup.jsx

import React, {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import styles from "./DateRangePopup.module.css";
import { ChevronLeft, ChevronRight, Clock, ChevronDown } from "lucide-react";
import dayjs from "dayjs";

// 단일 월 달력을 렌더링하는 내부 컴포넌트
const CalendarMonth = React.memo(
  ({ monthDate, startDate, endDate, onDateClick }) => {
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const startOfMonth = monthDate.startOf("month");
    const daysInMonth = monthDate.daysInMonth();
    const startDayOfWeek = startOfMonth.day();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(startOfMonth.date(i));
    }

    const isDayInRange = (day) => {
      if (!day) return false;
      const dayStart = day.startOf('day');
      const rangeStart = startDate.startOf('day');
      const rangeEnd = endDate.startOf('day');
      return dayStart.isAfter(rangeStart.subtract(1, 'day')) && dayStart.isBefore(rangeEnd.add(1, 'day'));
    };
    const isRangeStart = (day) => day && day.isSame(startDate, "day");
    const isRangeEnd = (day) => day && day.isSame(endDate, "day");

    return (
      <div className={styles.monthContainer}>
        <h3 className={styles.monthTitle}>{monthDate.format("MMMM YYYY")}</h3>
        <div className={styles.calendarGrid}>
          {daysOfWeek.map((day) => (
            <div
              key={`${monthDate.format("YYYY-MM")}-${day}`}
              className={styles.dayHeader}
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <button
              key={index}
              className={`
              ${styles.dayCell}
              ${isDayInRange(day) ? styles.selectedRange : ""}
              ${isRangeStart(day) ? styles.rangeStart : ""}
              ${isRangeEnd(day) ? styles.rangeEnd : ""}
            `}
              disabled={!day}
              onClick={() => day && onDateClick && onDateClick(day)}
            >
              {day ? day.date() : ""}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

// 메인 팝업 컴포넌트
const DateRangePopup = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  setBothDates,
  onClose,
  triggerRef,
}) => {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [opacity, setOpacity] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // 날짜 클릭 핸들러
  const handleDateClick = (clickedDate) => {
    const clickedDay = dayjs(clickedDate);
    const currentStart = dayjs(startDate).startOf('day');
    const currentEnd = dayjs(endDate).startOf('day');
    const clickedDayStart = clickedDay.startOf('day');
    
    // 시작일과 종료일이 같은 날인지 확인 (단일 날짜 범위)
    const isSingleDay = currentStart.isSame(currentEnd);
    
    if (isSingleDay && clickedDayStart.isSame(currentStart)) {
      // 이미 단일 날짜로 선택된 상태에서 같은 날 클릭 → 아무것도 안함
      return;
    }
    
    if (clickedDayStart.isSame(currentStart) || clickedDayStart.isSame(currentEnd)) {
      // 시작일 또는 종료일 클릭 → 단일 날짜로 설정
      const startWithTime = clickedDay.hour(0).minute(0).second(0);
      const endWithTime = clickedDay.hour(23).minute(59).second(59);
   
      if (setBothDates) {
        setBothDates(startWithTime.toDate(), endWithTime.toDate());
      } else {
        setStartDate(startWithTime.toDate());
        setEndDate(endWithTime.toDate());
      }
      
      setStartTime({ hh: "12", mm: "00", ss: "00", ampm: "AM" });
      setEndTime({ hh: "11", mm: "59", ss: "59", ampm: "PM" });
    } else if (clickedDayStart.isBefore(currentStart)) {
      // 시작일보다 이전
      const startWithTime = clickedDay.hour(0).minute(0).second(0);
      setStartDate(startWithTime.toDate());
      setStartTime({ hh: "12", mm: "00", ss: "00", ampm: "AM" });
    } else {
      // 시작일 이후 → 종료일 설정  
      const endWithTime = clickedDay.hour(23).minute(59).second(59);
      setEndDate(endWithTime.toDate());
      setEndTime({ hh: "11", mm: "59", ss: "59", ampm: "PM" });
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  };

  useLayoutEffect(() => {
    if (!triggerRef.current || !popupRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const margin = 8;

    const topPositionBelow = triggerRect.bottom + margin;

    if (topPositionBelow + popupRect.height > window.innerHeight) {
      const topPositionAbove = triggerRect.top - popupRect.height - margin;
      setPosition({
        top: topPositionAbove,
        left: triggerRect.left,
      });
    } else {
      setPosition({
        top: topPositionBelow,
        left: triggerRect.left,
      });
    }

    setOpacity(1);
  }, [triggerRef]);

  const [startTime, setStartTime] = useState({
    hh: "",
    mm: "",
    ss: "",
    ampm: "AM",
  });
  const [endTime, setEndTime] = useState({
    hh: "",
    mm: "",
    ss: "",
    ampm: "AM",
  });

  useEffect(() => {
    const startMoment = dayjs(startDate);
    const endMoment = dayjs(endDate);

    setStartTime({
      hh: startMoment.format("hh"),
      mm: startMoment.format("mm"),
      ss: startMoment.format("ss"),
      ampm: startMoment.format("A"),
    });

    setEndTime({
      hh: endMoment.format("hh"),
      mm: endMoment.format("mm"),
      ss: endMoment.format("ss"),
      ampm: endMoment.format("A"),
    });

    setCurrentMonth(dayjs(endDate));
  }, []);

  const handleTimeChange = (type, part, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    const setter = type === "start" ? setStartTime : setEndTime;
    setter((prev) => ({ ...prev, [part]: sanitizedValue }));
  };

  const handleAmPmChange = (type, value) => {
    const setter = type === "start" ? setStartTime : setEndTime;
    setter((prev) => {
      const newTime = { ...prev, ampm: value };
      
      // AM/PM 변경 시에도 날짜 업데이트
      const updateDate = (originalDate, time) => {
        let hour = parseInt(time.hh, 10) || 0;
        if (time.ampm === "PM" && hour < 12) hour += 12;
        if (time.ampm === "AM" && hour === 12) hour = 0;
        return dayjs(originalDate)
          .hour(hour)
          .minute(parseInt(time.mm, 10) || 0)
          .second(parseInt(time.ss, 10) || 0)
          .toDate();
      };
      
      if (type === "start") {
        setStartDate(updateDate(startDate, newTime));
      } else {
        setEndDate(updateDate(endDate, newTime));
      }
      
      return newTime;
    });
  };

  const handleTimeBlur = (type, part, value) => {
    const numericValue = parseInt(value, 10);
    let finalValue = isNaN(numericValue) ? "00" : value;
  
    if (numericValue < 10 && value.length < 2) {
      finalValue = `0${numericValue}`;
    }
    if (value === "") {
      finalValue = "00";
    }
  
    const setter = type === "start" ? setStartTime : setEndTime;
    setter((prev) => {
      const newTime = { ...prev, [part]: finalValue };
      
      // 시간 변경 시 날짜도 함께 업데이트
      const updateDate = (originalDate, time) => {
        let hour = parseInt(time.hh, 10) || 0;
        if (time.ampm === "PM" && hour < 12) hour += 12;
        if (time.ampm === "AM" && hour === 12) hour = 0;
        return dayjs(originalDate)
          .hour(hour)
          .minute(parseInt(time.mm, 10) || 0)
          .second(parseInt(time.ss, 10) || 0)
          .toDate();
      };
      
      if (type === "start") {
        setStartDate(updateDate(startDate, newTime));
      } else {
        setEndDate(updateDate(endDate, newTime));
      }
      
      return newTime;
    });
  };

  const timezone = useMemo(() => {
    const offset = dayjs().format("Z");
    return `GMT${offset}`;
  }, []);

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  const firstMonth = currentMonth;
  const secondMonth = currentMonth.add(1, "month");

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={popupRef}
        className={styles.popupContainer}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: opacity,
          transition: "opacity 0.1s ease-in-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.calendarsWrapper}>
          <button
            className={`${styles.navButton} ${styles.navLeft}`}
            onClick={handlePreviousMonth}
          >
            <ChevronLeft size={18} />
          </button>
          <CalendarMonth
            monthDate={firstMonth}
            startDate={start}
            endDate={end}
            onDateClick={handleDateClick}
          />
          <CalendarMonth
            monthDate={secondMonth}
            startDate={start}
            endDate={end}
            onDateClick={handleDateClick}
          />
          <button
            className={`${styles.navButton} ${styles.navRight}`}
            onClick={handleNextMonth}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className={styles.timeControls}>
          <div className={styles.timeGroup}>
            <label>Start time</label>
            <div className={styles.timeInput}>
              <Clock size={16} className={styles.timeIcon} />
              <input
                type="text"
                value={startTime.hh}
                onChange={(e) =>
                  handleTimeChange("start", "hh", e.target.value)
                }
                onBlur={(e) => handleTimeBlur("start", "hh", e.target.value)}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={startTime.mm}
                onChange={(e) =>
                  handleTimeChange("start", "mm", e.target.value)
                }
                onBlur={(e) => handleTimeBlur("start", "mm", e.target.value)}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={startTime.ss}
                onChange={(e) =>
                  handleTimeChange("start", "ss", e.target.value)
                }
                onBlur={(e) => handleTimeBlur("start", "ss", e.target.value)}
                maxLength={2}
              />
              <div className={styles.selectWrapper}>
                <select
                  value={startTime.ampm}
                  onChange={(e) => handleAmPmChange("start", e.target.value)}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
              <span className={styles.timezone}>{timezone}</span>
            </div>
          </div>
          <div className={styles.timeGroup}>
            <label>End time</label>
            <div className={styles.timeInput}>
              <Clock size={16} className={styles.timeIcon} />
              <input
                type="text"
                value={endTime.hh}
                onChange={(e) => handleTimeChange("end", "hh", e.target.value)}
                onBlur={(e) => handleTimeBlur("end", "hh", e.target.value)}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={endTime.mm}
                onChange={(e) => handleTimeChange("end", "mm", e.target.value)}
                onBlur={(e) => handleTimeBlur("end", "mm", e.target.value)}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={endTime.ss}
                onChange={(e) => handleTimeChange("end", "ss", e.target.value)}
                onBlur={(e) => handleTimeBlur("end", "ss", e.target.value)}
                maxLength={2}
              />
              <div className={styles.selectWrapper}>
                <select
                  value={endTime.ampm}
                  onChange={(e) => handleAmPmChange("end", e.target.value)}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
              <span className={styles.timezone}>{timezone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DateRangePopup;
// src/Pages/Widget/components/DateRangePicker.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import { Calendar, ChevronDown } from 'lucide-react';
import styles from './DateRangePicker.module.css';

// 기존 DateRangePopup 컴포넌트를 가져옵니다
import DateRangePopup from '../../../components/DateRange/DateRangePopup';

const dateRangeOptions = [
  { value: '5m', label: 'Past 5 minutes' },
  { value: '30m', label: 'Past 30 minutes' },
  { value: '1h', label: 'Past 1 hour' },
  { value: '3h', label: 'Past 3 hours' },
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '1M', label: 'Past 1 month' },
  { value: '3M', label: 'Past 3 months' },
  { value: '1y', label: 'Past 1 year' },
  { value: 'custom', label: 'Custom' },
];

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  setStartDate, 
  setEndDate
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState('7d');
  const calendarButtonRef = useRef(null);

  // 프리셋 선택 시 날짜 계산
  useEffect(() => {
    if (!dateRangePreset || dateRangePreset === 'custom') return;

    const newEndDate = new Date();
    let newStartDate;
    const valueStr = dateRangePreset.slice(0, -1);
    const unit = dateRangePreset.slice(-1);
    const value = parseInt(valueStr) || 1;

    switch (unit) {
      case 'm': 
        newStartDate = dayjs(newEndDate).subtract(value, 'minute').toDate(); 
        break;
      case 'h': 
        newStartDate = dayjs(newEndDate).subtract(value, 'hour').toDate(); 
        break;
      case 'd': 
        newStartDate = dayjs(newEndDate).subtract(value, 'day').toDate(); 
        break;
      case 'M': 
        newStartDate = dayjs(newEndDate).subtract(value, 'month').toDate(); 
        break;
      case 'y': 
        newStartDate = dayjs(newEndDate).subtract(value, 'year').toDate(); 
        break;
      default: 
        newStartDate = new Date();
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [dateRangePreset, setStartDate, setEndDate]);

  const formattedDateRange = useMemo(() => {
    const start = dayjs(startDate).format('MMM D, YY : HH:mm');
    const end = dayjs(endDate).format('MMM D, YY : HH:mm');
    return `${start} - ${end}`;
  }, [startDate, endDate]);

  const activePresetLabel = useMemo(() => {
    return dateRangeOptions.find(o => o.value === dateRangePreset)?.label || 'Custom';
  }, [dateRangePreset]);

  const handleCustomDateChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setDateRangePreset('custom');
  };

  return (
    <>
      <div className={styles.container}>
        {/* 날짜 범위 표시 버튼 */}
        <button
          ref={calendarButtonRef}
          className={styles.filterButton}
          onClick={() => setIsPickerOpen(true)}
        >
          <Calendar size={16} />
          <span>{formattedDateRange}</span>
        </button>

        {/* 프리셋 선택 드롭다운 */}
        <div className={styles.presetContainer}>
          <span className={styles.presetDisplay}>{activePresetLabel}</span>
          <ChevronDown size={16} className={styles.presetArrow} />
          <select
            className={styles.presetSelect}
            value={dateRangePreset || 'custom'}
            onChange={(e) => setDateRangePreset(e.target.value)}
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 달력 팝업 - Langfuse 스타일 */}
      {isPickerOpen &&
        ReactDOM.createPortal(
          <DateRangePopup
            startDate={startDate}
            endDate={endDate}
            setStartDate={(date) => {
              setStartDate(date);
              setDateRangePreset('custom');
            }}
            setEndDate={(date) => {
              setEndDate(date);
              setDateRangePreset('custom');
            }}
            setBothDates={(startDate, endDate) => {
              handleCustomDateChange(startDate, endDate);
            }}
            onClose={() => setIsPickerOpen(false)}
            triggerRef={calendarButtonRef}
          />,
          document.body
        )}
    </>
  );
};

export default DateRangePicker;
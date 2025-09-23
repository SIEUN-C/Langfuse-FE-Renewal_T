// src/components/RowHeightDropdown/RowHeightDropdown.jsx

import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Check } from 'lucide-react';
import styles from './RowHeightDropdown.module.css';

/**
 * 행 높이를 선택하는 재사용 가능한 드롭다운 메뉴 컴포넌트
 * @param {object} props
 * @param {string} props.value - 현재 선택된 행 높이 ('small', 'medium', 'large')
 * @param {function(string): void} props.onChange - 행 높이가 변경될 때 호출될 콜백 함수
 */
const RowHeightDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 메뉴 외부를 클릭하면 닫히도록 하는 로직
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (height) => {
    onChange(height);
    setIsOpen(false);
  };

  const options = [
    { key: 'small', label: 'Small' },
    { key: 'medium', label: 'Medium' },
    { key: 'large', label: 'Large' },
  ];

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button className={styles.iconButton} onClick={() => setIsOpen(!isOpen)}>
        <LayoutGrid size={18} />
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownHeader}>Row height</div>
          {options.map((option) => (
            <div
              key={option.key}
              className={styles.dropdownItem}
              onClick={() => handleSelect(option.key)}
            >
              <span>{option.label}</span>
              {value === option.key && <Check size={16} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RowHeightDropdown;
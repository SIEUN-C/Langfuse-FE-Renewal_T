import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, X, Plus, Calendar } from 'lucide-react';
import FilterButton from '../FilterButton/FilterButton';
import styles from './FilterBuilder.module.css';
import DateRangePopup from '../DateRange/DateRangePopup';
import dayjs from 'dayjs';
import MultiSelectDropdown from './MultiSelectDropdown';

/**
 * FilterBuilder 컴포넌트
 * 
 * 주요 기능:
 * 1. 필터 조건 추가/삭제/수정
 * 2. 반응형 드롭다운 위치 자동 조정 (화면 경계 감지)
 * 3. 다양한 데이터 타입별 입력 컴포넌트 제공
 * 4. 날짜 선택 팝업 관리
 * 
 * Props:
 * - filters: 현재 필터 배열
 * - onFilterChange: 필터 변경 콜백
 * - filterConfig: 필터 설정 정보
 */
const FilterBuilder = ({ filters, onFilterChange, filterConfig }) => {
    // ==================== STATE 관리 ====================
    const [isOpen, setIsOpen] = useState(false); // 드롭다운 열림/닫힘 상태
    const [dropdownPosition, setDropdownPosition] = useState({}); // 동적 드롭다운 위치

    // REF 관리
    const containerRef = useRef(null); // 전체 컨테이너 참조
    const menuRef = useRef(null); // 드롭다운 메뉴 참조

    // 날짜 선택 팝업 상태
    const [datePickerState, setDatePickerState] = useState({
        isOpen: false,
        filterId: null,
        triggerRef: null
    });

    // ==================== 유틸리티 함수 ====================

    /**
     * 컬럼 키로 설정 정보 조회
     * @param {string} columnKey - 컬럼 키
     * @returns {object} 컬럼 설정 객체
     */
    const getColumnConfig = (columnKey) => filterConfig.find(c => c.key === columnKey);

    // ==================== 필터 관리 함수 ====================

    /**
     * 새 필터 추가
     * 기본값으로 첫 번째 컬럼과 첫 번째 연산자 사용
     */
    const addFilter = () => {
        const defaultColumn = filterConfig[0];
        const newFilter = {
            id: Date.now(),
            column: defaultColumn.key,
            operator: defaultColumn.operators[0],
            value: '',
            metaKey: ''
        };
        onFilterChange([...filters, newFilter]);
    };

    /**
     * 필터 제거
     * @param {number} id - 제거할 필터 ID
     * 최소 1개 필터는 유지
     */
    const removeFilter = (id) => {
        const newFilters = filters.filter(f => f.id !== id);
        onFilterChange(newFilters);
    };

    /**
     * 필터 업데이트
     * @param {number} id - 업데이트할 필터 ID
     * @param {string} field - 업데이트할 필드명
     * @param {any} value - 새로운 값
     */
    const updateFilter = (id, field, value) => {
        onFilterChange(prev => prev.map(f => {
            if (f.id !== id) return f;

            // 컬럼 변경 시 연산자와 값 초기화
            if (field === 'column') {
                const newColumnConfig = getColumnConfig(value);
                return {
                    ...f,
                    column: value,
                    operator: newColumnConfig.operators[0],
                    value: '',
                    metaKey: '',
                    type: newColumnConfig.type
                };
            }
            return { ...f, [field]: value };
        }));
    };

    // ==================== 드롭다운 위치 계산 ====================

    /**
     * 화면 경계를 고려한 드롭다운 위치 계산
     * 화면을 벗어나면 자동으로 위치 조정
     */
    const calculateDropdownPosition = () => {
        if (!containerRef.current || !menuRef.current) return;

        const container = containerRef.current.getBoundingClientRect();
        const menu = menuRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let position = {
            top: 'calc(100% + 4px)', // 기본: 컨테이너 아래 4px (축소)
            zIndex: 1000
        };

        // ========== 가로 위치 계산 ==========

        // 기본 위치: 중앙 정렬 (right: 50%, transform: translateX(50%))
        let rightOffset = '50%';
        let transformX = '50%';

        // 오른쪽으로 넘치는 경우 체크
        const menuWidth = 380; // CSS에서 설정한 min-width (축소됨)
        const centerPosition = container.left + (container.width / 2);
        const menuLeftEdge = centerPosition - (menuWidth / 2);
        const menuRightEdge = centerPosition + (menuWidth / 2);

        if (menuLeftEdge < 0) {
            // 왼쪽으로 넘치는 경우: 왼쪽 정렬
            position.left = '0px';
            position.right = 'auto';
            position.transform = 'translateX(0)';
        } else if (menuRightEdge > viewport.width) {
            // 오른쪽으로 넘치는 경우: 오른쪽 정렬
            position.right = '0px';
            position.left = 'auto';
            position.transform = 'translateX(0)';
        } else {
            // 정상 범위: 중앙 정렬 (기본값 유지)
            position.right = rightOffset;
            position.transform = `translateX(${transformX})`;
        }

        // ========== 세로 위치 계산 ==========

        // 아래쪽으로 넘치는 경우 위쪽에 표시
        if (container.bottom + menu.height + 4 > viewport.height) {
            position.top = 'auto';
            position.bottom = 'calc(100% + 4px)'; // 컨테이너 위쪽 4px (축소)
        }

        setDropdownPosition(position);
    };

    // ==================== 입력 컴포넌트 렌더링 ====================

    /**
     * 데이터 타입별 값 입력 컴포넌트 렌더링
     * @param {object} filter - 필터 객체
     * @returns {JSX.Element} 입력 컴포넌트
     */
    const renderValueInput = (filter) => {
        const config = getColumnConfig(filter.column);
        if (!config) return null;

        if (filter.operator === 'is null' || filter.operator === 'is not null') {
            return <div className={styles.valueInput} />;
        }

        switch (config.type) {
            case 'datetime':
                // 날짜 선택 버튼
                return (
                    <button
                        className={styles.dateButton}
                        onClick={(e) => handleOpenDatePicker(e, filter.id)}
                    >
                        <Calendar size={14} />
                        <span>
                            {filter.value ? dayjs(filter.value).format('YYYY-MM-DD') : 'Pick a date'}
                        </span>
                    </button>
                );

            case 'boolean':
                return (
                    <select
                        className={`${styles.select} ${styles.valueInput}`}
                        value={filter.value}
                        onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                    >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                );

            case 'stringOptions':
            case 'arrayOptions':
            case 'categoryOptions':
                const formattedOptions = (config.options && config.options.length > 0 && typeof config.options[0] === 'object' && config.options[0] !== null)
                    ? config.options.map(opt => opt.value)
                    : config.options || [];
                return (
                    <div className={styles.valueInput}>
                        <MultiSelectDropdown
                            options={formattedOptions}
                            // 값은 쉼표로 구분된 문자열이므로, 이를 배열로 변환하여 전달
                            value={Array.isArray(filter.value) ? filter.value : (filter.value ? String(filter.value).split(',') : [])}
                            // 변경된 값(배열)을 다시 쉼표로 구분된 문자열로 변환하여 저장
                            onChange={value => updateFilter(filter.id, 'value', value.join(','))}
                            placeholder="Select options..."
                        />
                    </div>
                );

            case 'number':
                // 숫자 입력창
                return (
                    <input
                        type="number"
                        className={`${styles.input} ${styles.valueInput}`}
                        value={filter.value}
                        placeholder="0"
                        onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                    />
                );

            case 'categorical':
                // 다중 선택 드롭다운
                return (
                    <div className={styles.valueInput}>
                        <MultiSelectDropdown
                            options={config.options || []}
                            value={Array.isArray(filter.value) ? filter.value : (filter.value ? filter.value.split(',') : [])}
                            onChange={value => updateFilter(filter.id, 'value', value.join(','))}
                            placeholder="Select options..."
                        />
                    </div>
                );

            case 'string':
            default:
                // 텍스트 입력창 (기본값)
                return (
                    <input
                        type="text"
                        className={`${styles.input} ${styles.valueInput}`}
                        value={filter.value}
                        placeholder="value"
                        onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                    />
                );
        }
    };

    // ==================== 날짜 선택 관리 ====================

    /**
     * 날짜 선택 팝업 열기
     * @param {Event} event - 클릭 이벤트
     * @param {number} filterId - 필터 ID
     */
    const handleOpenDatePicker = (event, filterId) => {
        setDatePickerState({
            isOpen: true,
            filterId,
            triggerRef: { current: event.currentTarget }
        });
    };

    /**
     * 날짜 선택 처리
     * @param {Date} date - 선택된 날짜
     */
    const handleDateSelect = (date) => {
        if (datePickerState.filterId) {
            updateFilter(datePickerState.filterId, 'value', dayjs(date).format('YYYY-MM-DD HH:mm:ss'));
            closeDatePicker();
        }
    };

    /**
     * 날짜 선택 팝업 닫기
     */
    const closeDatePicker = () => {
        setDatePickerState({ isOpen: false, filterId: null, triggerRef: null });
    };

    // ==================== COMPUTED VALUES ====================

    /**
     * 현재 선택된 필터의 날짜값 (날짜 선택 팝업용)
     */
    const currentFilterDate = useMemo(() => {
        const filter = filters.find(f => f.id === datePickerState.filterId);
        return filter?.value ? new Date(filter.value) : new Date();
    }, [filters, datePickerState.filterId]);

    /**
     * 활성 필터 개수 계산 (값이 입력된 필터만)
     */
    const activeFilterCount = useMemo(() =>
        filters.filter(f => String(f.value || '').trim() !== '').length,
        [filters]
    );

    // ==================== EFFECTS ====================

    /**
     * 드롭다운 외부 클릭 감지 및 위치 계산
     */
    useEffect(() => {
        /**
         * 외부 클릭 시 드롭다운 닫기
         */
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        /**
         * 윈도우 리사이즈 시 드롭다운 위치 재계산
         */
        const handleResize = () => {
            if (isOpen) {
                calculateDropdownPosition();
            }
        };

        // 이벤트 리스너 등록
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);

        // 드롭다운이 열릴 때 위치 계산
        if (isOpen) {
            // DOM 업데이트 후 위치 계산을 위해 setTimeout 사용
            setTimeout(calculateDropdownPosition, 0);
        }

        // 클린업
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]); // isOpen 변경 시에만 실행

    // ==================== RENDER ====================

    return (
        <div className={styles.container} ref={containerRef}>
            {/* 필터 버튼 - 클릭 시 드롭다운 토글 */}
            <FilterButton onClick={() => setIsOpen(!isOpen)}>
                <Filter size={14} />
                Filters
                {/* 활성 필터 개수 표시 배지 */}
                {activeFilterCount > 0 && (
                    <span className={styles.badge}>{activeFilterCount}</span>
                )}
            </FilterButton>

            {/* 드롭다운 메뉴 - 동적 위치 적용 */}
            {isOpen && (
                <div
                    className={styles.dropdownMenu}
                    ref={menuRef}
                    style={dropdownPosition} // 동적으로 계산된 위치 적용
                >
                    {/* 필터 목록 렌더링 */}
                    {filters.map((filter, index) => {
                        const columnConfig = getColumnConfig(filter.column);
                        return (
                            <div key={filter.id} className={styles.filterRow}>
                                {/* 조건 연결어 (Where/And) */}
                                <span className={styles.conjunction}>
                                    {index === 0 ? 'Where' : 'And'}
                                </span>

                                {/* 컬럼 선택 드롭다운 */}
                                <select
                                    className={styles.select}
                                    value={filter.column}
                                    onChange={e => updateFilter(filter.id, 'column', e.target.value)}
                                >
                                    {filterConfig.map(opt => (
                                        <option key={opt.key} value={opt.key}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* 메타키 입력창 (hasMetaKey가 true인 컬럼만) */}
                                {columnConfig?.hasMetaKey && (
                                    <input
                                        type="text"
                                        className={`${styles.input} ${styles.metaKeyInput}`}
                                        placeholder="key"
                                        value={filter.metaKey}
                                        onChange={e => updateFilter(filter.id, 'metaKey', e.target.value)}
                                    />
                                )}

                                {/* 연산자 선택 드롭다운 */}
                                <select
                                    className={styles.select}
                                    value={filter.operator}
                                    onChange={e => updateFilter(filter.id, 'operator', e.target.value)}
                                >
                                    {(columnConfig?.operators || []).map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>

                                {/* 값 입력 컴포넌트 (타입별로 다름) */}
                                {renderValueInput(filter)}

                                {/* 필터 제거 버튼 */}
                                <button
                                    className={styles.removeButton}
                                    onClick={() => removeFilter(filter.id)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}

                    {/* 필터 추가 버튼 */}
                    <button className={styles.addButton} onClick={addFilter}>
                        <Plus size={14} /> Add filter
                    </button>
                </div>
            )}

            {/* 날짜 선택 팝업 */}
            {datePickerState.isOpen && (
                <DateRangePopup
                    startDate={currentFilterDate}
                    endDate={currentFilterDate}
                    setStartDate={handleDateSelect}
                    setEndDate={handleDateSelect}
                    onClose={closeDatePicker}
                    triggerRef={datePickerState.triggerRef}
                />
            )}
        </div>
    );
};

export default FilterBuilder;
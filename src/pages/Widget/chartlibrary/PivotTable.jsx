/**
 * @fileoverview PivotTable Chart Component
 *
 * 설정 가능한 피벗 테이블 위젯 컴포넌트로 테이블 형식으로 데이터를 표시
 * 다중 차원(현재 최대 2개), 메트릭을 컬럼으로, 소계 및 총계 지원
 *
 * 주요 기능:
 * - 동적 차원 지원 (0-N 차원, 현재 2개로 제한)
 * - 중첩된 차원 레벨에 대한 적절한 들여쓰기
 * - 소계 및 총계 계산
 * - 대시보드 그리드 내 반응형 디자인
 * - 성능 문제 방지를 위한 행 제한
 * - 계층적 동작을 가진 인터랙티브 정렬
 * - ChartContainer를 통한 크기 제어
 */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  transformToPivotTable,
  extractDimensionValues,
  extractMetricValues,
  sortPivotTableRows,
  DEFAULT_ROW_LIMIT,
} from "../utils/pivotTableUtils.js";
import { getNextSortState } from "../utils/sortTypes.js";
import { numberFormatter } from "../utils/numberUtils.js";
import { formatMetricName } from "../../Dashboards/utils/widgetUtils.js";
import ChartContainer from "./ChartContainer.jsx";
import styles from './chart-library.module.css';

/**
 * 정적 컬럼 헤더 컴포넌트
 * 정렬 기능이 없는 단순한 헤더
 * 
 * 사용처: 차원(Dimension) 컬럼 헤더
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.label - 헤더 라벨 텍스트
 * @param {string} [props.className] - 추가 CSS 클래스
 * @returns {React.ReactElement} 정적 테이블 헤더
 */
const StaticHeader = ({ label, className }) => {
  const headerClassName = [
    styles.tableHeaderCell,    // 기본 헤더 셀 스타일
    className                  // 사용자 정의 클래스
  ].filter(Boolean).join(' ');

  return (
    <th className={headerClassName}>
      <div className={styles.tableHeaderContent}>
        <span className={styles.tableHeaderLabel}>{label}</span>
      </div>
    </th>
  );
};

/**
 * 정렬 가능한 컬럼 헤더 컴포넌트
 * 클릭 이벤트와 정렬 시각적 표시기를 처리
 * 
 * 사용처: 메트릭(Metric) 컬럼 헤더들
 * 
 * 정렬 동작:
 * 1. 첫 클릭: DESC (내림차순)
 * 2. 두 번째 클릭: ASC (오름차순)  
 * 3. 세 번째 클릭: 기본 정렬로 복귀
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.column - 컬럼 식별자 (메트릭 필드명)
 * @param {string} props.label - 표시할 라벨
 * @param {Object} [props.sortState] - 현재 정렬 상태
 * @param {Function} props.onSort - 정렬 핸들러 함수
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.rightAlign=false] - 우측 정렬 여부
 * @returns {React.ReactElement} 정렬 가능한 테이블 헤더
 */
const SortableHeader = ({ 
  column, 
  label, 
  sortState, 
  onSort, 
  className, 
  rightAlign = false 
}) => {
  // ===== 정렬 상태 계산 =====
  const isSorted = sortState?.column === column;
  const sortDirection = isSorted ? sortState.order : null;

  /**
   * 헤더 클릭 핸들러
   * 정렬 상태를 순환시키는 역할
   */
  const handleClick = useCallback((event) => {
    event.preventDefault();
    onSort(column);
  }, [column, onSort]);

  // ===== CSS 클래스 조합 =====
  const headerClassName = [
    styles.tableHeaderCell,    // 기본 헤더 셀 스타일
    styles.sortableHeader,     // 정렬 가능한 헤더 스타일 (커서, 호버 등)
    className                  // 사용자 정의 클래스
  ].filter(Boolean).join(' ');

  const contentClassName = [
    styles.tableHeaderContent, // 헤더 내용 컨테이너 스타일
    rightAlign ? styles.rightAlign : '' // 우측 정렬 (숫자 데이터용)
  ].filter(Boolean).join(' ');

  return (
    <th className={headerClassName} onClick={handleClick}>
      <div className={contentClassName}>
        {/* 헤더 라벨 */}
        <span className={styles.tableHeaderLabel}>{label}</span>
        
        {/* 정렬 방향 표시기 (정렬 중일 때만 표시) */}
        {isSorted && (
          <span
            className={styles.sortIcon}
            title={
              sortDirection === "ASC" 
                ? "오름차순 정렬됨" 
                : "내림차순 정렬됨"
            }
          >
            {sortDirection === "ASC" ? "▲" : "▼"}
          </span>
        )}
        
        {/* 호버 시 나타나는 시각적 표시기 */}
        <div className={styles.hoverIndicator} />
      </div>
    </th>
  );
};

/**
 * 피벗 테이블의 개별 행 컴포넌트
 * 각 행 유형별 스타일링, 들여쓰기, 콘텐츠 표시를 처리
 * 
 * 행 유형:
 * - data: 일반 데이터 행
 * - subtotal: 소계 행 (각 차원 그룹별)
 * - total: 총계 행 (전체 데이터)
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.row - 피벗 테이블 행 데이터
 * @param {string} props.row.label - 행 라벨 (차원값 또는 "소계", "총계")
 * @param {number} props.row.level - 들여쓰기 레벨 (0부터 시작)
 * @param {boolean} props.row.isSubtotal - 소계 행 여부
 * @param {boolean} props.row.isTotal - 총계 행 여부
 * @param {Object} props.row.values - 메트릭 값들 (키: 메트릭명, 값: 수치)
 * @param {string[]} props.metrics - 메트릭 이름 목록
 * @returns {React.ReactElement} 피벗 테이블 행
 */
const PivotTableRowComponent = ({ row, metrics }) => {
  // ===== 행 CSS 클래스 조합 =====
  const rowClassName = [
    styles.tableRow,                        // 기본 테이블 행 스타일
    row.isSubtotal ? styles.subtotalRow : '',  // 소계 행 배경색
    row.isTotal ? styles.totalRow : ''         // 총계 행 배경색 (더 진함)
  ].filter(Boolean).join(' ');

  /**
   * 레벨에 따른 들여쓰기 스타일 계산
   * 각 차원 레벨마다 1.5rem씩 들여쓰기 적용
   * 
   * @param {number} level - 들여쓰기 레벨 (0: 총계, 1: 1차 차원, 2: 2차 차원)
   * @returns {Object} 인라인 스타일 객체
   */
  const getIndentationStyle = (level) => {
    if (level === 0) return {}; // 총계는 들여쓰기 없음
    return { paddingLeft: `${level * 1.5 + 0.5}rem` };
  };

  // ===== 셀 CSS 클래스 조합 =====
  const dimensionCellClassName = [
    styles.tableCell,                                    // 기본 셀 스타일
    styles.dimensionCell,                               // 차원 셀 스타일 (좌측 정렬)
    (row.isSubtotal || row.isTotal) ? styles.boldText : '' // 소계/총계는 굵게
  ].filter(Boolean).join(' ');

  const metricCellClassName = [
    styles.tableCell,                                    // 기본 셀 스타일
    styles.tableCellNumeric,                            // 숫자 셀 스타일 (우측 정렬, 고정폭 폰트)
    (row.isSubtotal || row.isTotal) ? styles.boldText : '' // 소계/총계는 굵게
  ].filter(Boolean).join(' ');

  return (
    <tr className={rowClassName}>
      {/* ===== 차원 컬럼 (들여쓰기와 스타일링 적용) ===== */}
      <td 
        className={dimensionCellClassName}
        style={getIndentationStyle(row.level)} // 동적 들여쓰기
      >
        {row.label}
      </td>

      {/* ===== 메트릭 컬럼들 ===== */}
      {metrics.map((metric) => (
        <td key={metric} className={metricCellClassName}>
          {formatMetricValue(row.values[metric])}
        </td>
      ))}
    </tr>
  );
};

/**
 * 테이블 표시용 메트릭 값 포맷팅
 * 숫자와 문자열을 적절한 형식으로 처리
 *
 * 포맷팅 규칙:
 * - 숫자: 소수점 2자리까지 표시, 불필요한 .00 제거
 * - 문자열: 그대로 표시
 * - null/undefined: 빈 문자열
 * 
 * @param {number|string|null|undefined} value - 포맷할 메트릭 값
 * @returns {string} 표시용으로 포맷된 문자열
 */
function formatMetricValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return numberFormatter(value, 2).replace(/\.00$/, "");
  }

  // 기타 타입은 문자열로 변환
  return String(value);
}

/**
 * 컬럼 헤더용 메트릭 이름 포맷팅
 * 메트릭 필드명을 사용자 친화적인 헤더로 변환
 * 
 * 예시:
 * - "count_count" → "Count"
 * - "avg_latency" → "Avg Latency"
 * - "sum_tokens" → "Sum Tokens"
 *
 * @param {string} metricName - 메트릭 필드명
 * @returns {string} 포맷된 컬럼 헤더
 */
function formatColumnHeader(metricName) {
  return formatMetricName(metricName);
}

/**
 * 메인 PivotTable 컴포넌트
 *
 * 플랫 데이터를 피벗 테이블 구조로 변환하고 적절한 스타일링,
 * 들여쓰기, 반응형 동작으로 렌더링합니다.
 * 
 * 데이터 변환 과정:
 * 1. DataPoint[] → DatabaseRow[] 변환
 * 2. 차원별 그룹핑 및 메트릭 집계
 * 3. 소계 및 총계 계산
 * 4. 정렬 적용
 * 5. 테이블 렌더링
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {import('./chartProps.js').DataPoint[]} props.data - 차트 쿼리의 데이터 포인트 배열
 * @param {Object} [props.config] - 차원과 메트릭을 포함한 피벗 테이블 설정
 * @param {string[]} [props.config.dimensions] - 차원 필드명 배열 (최대 2개)
 * @param {string[]} [props.config.metrics] - 메트릭 필드명 배열
 * @param {number} [props.config.rowLimit] - 최대 표시 행 수
 * @param {Object} [props.config.defaultSort] - 기본 정렬 설정
 * @param {Object} [props.chartConfig] - shadcn/ui의 차트 설정 (다른 차트와의 일관성용)
 * @param {boolean} [props.accessibilityLayer] - 접근성 레이어 플래그
 * @param {Object} [props.sortState] - 현재 정렬 상태
 * @param {Function} [props.onSortChange] - 정렬 상태 변경 콜백
 * @param {boolean} [props.isLoading=false] - 데이터 새로고침 시 로딩 상태
 * @returns {React.ReactElement} 렌더링된 피벗 테이블
 */
const PivotTable = ({
  data,
  config,
  chartConfig,
  accessibilityLayer,
  sortState,
  onSortChange,
  isLoading = false,
}) => {
  
  /**
   * 차트 데이터를 피벗 테이블 구조로 변환 (메모이제이션)
   * 
   * 변환 단계:
   * 1. 설정 추출 및 기본값 적용
   * 2. DataPoint[] → DatabaseRow[] 변환
   * 3. 차원값과 메트릭값 추출
   * 4. 피벗 테이블 변환 유틸 함수 호출
   * 5. 에러 처리
   */
  const pivotTableRows = useMemo(() => {
    // ===== 빈 데이터 처리 =====
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("PivotTable: 데이터가 비어있음", data);
      return [];
    }

    // ===== 설정 추출 및 기본값 적용 =====
    const pivotConfig = {
      dimensions: config?.dimensions ?? [],              // 차원 필드들
      metrics: config?.metrics ?? ["metric"],           // 메트릭 필드들 (기본: "metric")
      rowLimit: config?.rowLimit ?? DEFAULT_ROW_LIMIT,  // 행 제한 (기본: 20)
      defaultSort: config?.defaultSort,                 // 기본 정렬
    };

    console.log("PivotTable 설정:", pivotConfig);

    // ===== DataPoint[] → DatabaseRow[] 변환 =====
    const databaseRows = data.map((point, index) => {
      try {
        // 원본 데이터 복사
        const rowData = { ...point };

        // 차원값과 메트릭값을 유틸 함수로 추출
        const dimensionValues = extractDimensionValues(rowData, pivotConfig.dimensions);
        const metricValues = extractMetricValues(rowData, pivotConfig.metrics);

        // 최종 행 데이터 조합
        const result = {
          ...dimensionValues,
          ...metricValues,
        };

        // ===== 추가 필드 처리 =====
        // 시간 차원 보존 (시계열 데이터인 경우)
        if (point.time_dimension !== undefined) {
          result.time_dimension = point.time_dimension;
        }

        // 레거시 'metric' 필드 처리 (하위 호환성)
        if (point.metric !== undefined) {
          if (typeof point.metric === "number") {
            result.metric = point.metric;
          } else if (Array.isArray(point.metric)) {
            // 히스토그램 데이터인 경우 평탄화하여 합계 계산
            result.metric = point.metric
              .flat()
              .reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
          }
        }

        return result;
      } catch (error) {
        console.error(`PivotTable: 행 ${index} 변환 오류:`, error, point);
        return {}; // 빈 객체 반환하여 변환 계속 진행
      }
    });

    console.log("PivotTable 데이터 변환:", {
      inputLength: data.length,
      outputLength: databaseRows.length,
      sampleInput: data.slice(0, 2),
      sampleOutput: databaseRows.slice(0, 2)
    });

    // ===== 피벗 테이블 변환 =====
    try {
      return transformToPivotTable(databaseRows, pivotConfig);
    } catch (error) {
      console.error("PivotTable: 피벗 테이블 변환 오류:", error);
      return [];
    }
  }, [data, config]);

  /**
   * 피벗 테이블 행에 정렬 적용 (메모이제이션)
   * 
   * 정렬 동작:
   * - 정렬 상태가 없으면 원본 순서 유지
   * - 정렬 상태가 있으면 해당 컬럼으로 정렬
   * - 계층적 정렬 (그룹 > 개별 항목)
   */
  const sortedRows = useMemo(() => {
    // 정렬 상태가 없으면 원본 순서 유지
    if (!sortState || !sortState.column) {
      return pivotTableRows;
    }

    try {
      console.log("PivotTable 정렬 적용:", sortState);
      return sortPivotTableRows(pivotTableRows, sortState);
    } catch (error) {
      console.error("PivotTable: 정렬 오류:", error);
      return pivotTableRows; // 정렬 실패 시 원본 반환
    }
  }, [pivotTableRows, sortState]);

  /**
   * 설정에서 메트릭 목록 추출 (메모이제이션)
   * 피벗 테이블 컬럼 헤더와 행 렌더링에 사용
   */
  const metrics = useMemo(() => {
    const result = config?.metrics ?? ["metric"];
    console.log("PivotTable 메트릭:", result);
    return result;
  }, [config?.metrics]);

  /**
   * 정렬 클릭 이벤트 핸들러
   * 단순 순환 방식: DESC → ASC → 기본정렬
   * 
   * @param {string} column - 정렬할 컬럼명 (메트릭 필드명)
   */
  const handleSort = useCallback((column) => {
    if (!onSortChange) {
      console.warn("PivotTable: onSortChange 핸들러가 없음");
      return;
    }
    
    const nextSort = getNextSortState(
      config?.defaultSort || null,
      sortState || null,
      column,
    );
    
    console.log("PivotTable 정렬 변경:", {
      currentSort: sortState,
      clickedColumn: column,
      nextSort
    });
    
    onSortChange(nextSort);
  }, [sortState, onSortChange, config?.defaultSort]);

  // ===== 기본 정렬 변경 감지 및 리셋 =====
  const [lastDefaultSort, setLastDefaultSort] = useState(config?.defaultSort);

  useEffect(() => {
    const currentDefaultSort = config?.defaultSort;

    // 기본 정렬이 변경된 경우 정렬 리셋
    if (currentDefaultSort !== lastDefaultSort) {
      console.log("PivotTable: 기본 정렬 변경 감지", {
        old: lastDefaultSort,
        new: currentDefaultSort
      });
      
      setLastDefaultSort(currentDefaultSort);

      // 새로운 기본 정렬로 리셋
      if (onSortChange) {
        onSortChange(currentDefaultSort || null);
      }
    }
  }, [config?.defaultSort, onSortChange, lastDefaultSort]);

  // ===== 빈 데이터 상태 처리 =====
  if (!data || data.length === 0) {
    return (
      <ChartContainer config={chartConfig}>
        <div className={styles.empty}>
          <p>피벗 테이블에 표시할 데이터가 없습니다</p>
        </div>
      </ChartContainer>
    );
  }

  // ===== 변환 오류 처리 =====
  if (pivotTableRows.length === 0) {
    return (
      <ChartContainer config={chartConfig}>
        <div className={styles.empty}>
          <p>피벗 테이블 데이터 처리 중 오류가 발생했습니다</p>
        </div>
      </ChartContainer>
    );
  }

  // ===== 컨테이너 CSS 클래스 조합 =====
  const containerClassName = [
    styles.pivotTableContainer,  // 기본 피벗 테이블 컨테이너 스타일
    isLoading ? styles.loading : ''  // 로딩 상태 스타일
  ].filter(Boolean).join(' ');

  // ===== 성능 및 디버깅 정보 로깅 =====
  console.log("PivotTable 렌더링:", {
    originalDataLength: data?.length || 0,
    pivotRowsLength: pivotTableRows.length,
    sortedRowsLength: sortedRows.length,
    metricsCount: metrics.length,
    dimensionsCount: config?.dimensions?.length || 0,
    isLoading,
    sortState
  });

  // ===== 메인 피벗 테이블 렌더링 =====
  return (
    <ChartContainer config={chartConfig}>
      <div className={containerClassName}>
        {/* ===== 로딩 오버레이 ===== */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <Loader2 className={styles.loadingIcon} />
              <span>데이터를 새로고침하는 중...</span>
            </div>
          </div>
        )}
        
        {/* ===== 메인 테이블 ===== */}
        <table className={styles.table}>
          {/* ===== 테이블 헤더 ===== */}
          <thead className={styles.tableHeader}>
            <tr>
              {/* 차원 컬럼 헤더 (정렬 불가) */}
              <StaticHeader
                label={
                  config?.dimensions && config.dimensions.length > 0
                    ? config.dimensions.map(formatColumnHeader).join(" / ") // 모든 차원 표시
                    : "Dimension" // 기본 라벨
                }
                className={styles.dimensionHeader}
              />

              {/* 메트릭 컬럼 헤더들 (정렬 가능) */}
              {metrics.map((metric) => (
                <SortableHeader
                  key={metric}
                  column={metric}
                  label={formatColumnHeader(metric)}
                  sortState={sortState}
                  onSort={handleSort}
                  className={styles.metricHeader}
                  rightAlign={true} // 숫자 데이터이므로 우측 정렬
                />
              ))}
            </tr>
          </thead>

          {/* ===== 테이블 바디 ===== */}
          <tbody>
            {sortedRows.map((row) => (
              <PivotTableRowComponent 
                key={row.id} 
                row={row} 
                metrics={metrics} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </ChartContainer>
  );
};

export default PivotTable;
// src/Pages/Evaluation/Judge/EvaluationView.jsx
// ========================[수정 시작 (1/7)]========================
// 주석: react-router-dom에서 페이지 이동을 위한 useNavigate를 import합니다.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigate 추가
// ========================[수정 끝 (1/7)]========================
// --- ✨ 추가: 새로운 아이콘들을 import 합니다 ---
import { ChevronUp, ChevronDown, ChevronRight, Columns, LayoutGrid, Check } from 'lucide-react';// Check 아이콘 추가
// --- 수정: 다시 기존 DataTable을 import합니다 ---
import { DataTable } from '../../../components/DataTable/DataTable';
import {
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';
//-------------------------------------------------------
import { getEvaluationViewColumns } from './components/EvaluationViewColumns';
import useProjectId from '../../../hooks/useProjectId';
// ========================[수정: 중복 import 제거]========================
// 주석: 이전에 두 줄로 나뉘어 중복 선언되었던 import 구문을
//       아래와 같이 한 줄로 정리하여 오류를 해결했습니다.
import { getEvaluationJobs, getEvaluatorConfigById, getAllEvaluatorConfigs } from './services/judgeApi';
// ====================================================================
import styles from './EvaluationView.module.css';

// --- 추가: 방금 새로 만든 사이드 패널 컴포넌트를 import 합니다 ---
import { ColumnVisibilityPanel } from './components/ColumnVisibilityPanel';
//---------------------------------------------------------------
import { computeFinalStatus } from '../Judge/components/evalstatus'; //To update Evaluator status_finished 


const EvaluationView = () => {
  const { evaluationId } = useParams();
  const { projectId } = useProjectId();

  // ========================[수정 시작 (3/7)]========================
  // 주석: useNavigate hook을 초기화합니다.
  const navigate = useNavigate();
  // ========================[수정 끝 (3/7)]========================

  const [jobs, setJobs] = useState([]);
  // --- ✨ 추가: Evaluator 설정 정보를 저장할 state ---
  const [evaluatorConfig, setEvaluatorConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ========================[수정 시작 (4/7)]========================
  // 주석: 전체 Evaluator ID 목록과 현재 보고 있는 Evaluator의 인덱스를 저장할 state를 추가합니다.
  const [evaluatorIds, setEvaluatorIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  // ========================[수정 끝 (4/7)]========================



  // --- 추가 (1/3): 컬럼 보이기/숨기기(visibility) 상태와 사이드 패널 열림 상태를 관리할 state를 추가합니다 ---
  const [columnVisibility, setColumnVisibility] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // ------------------------------------------------------------------------------------------------

  // ========================[수정 시작 (1/4)]========================
  // 주석: Row height 상태와 드롭다운 메뉴의 열림 상태를 관리할 state를 추가합니다.
  const [rowHeight, setRowHeight] = useState('small'); // 'small', 'medium', 'large'
  const [isRowHeightMenuOpen, setIsRowHeightMenuOpen] = useState(false);
  const rowHeightMenuRef = useRef(null); // 드롭다운 메뉴 외부 클릭 감지를 위한 ref
  // ========================[수정 끝 (1/4)]========================

  // ========================[수정 시작 (2/4)]========================
  // 주석: getEvaluationViewColumns 함수에 rowHeight 상태를 전달하여
  // Score Comment 컬럼이 동적으로 스타일을 변경할 수 있도록 합니다.
  const columns = useMemo(() => getEvaluationViewColumns(projectId, rowHeight), [projectId, rowHeight]);
  // ========================[수정 끝 (2/4)]========================


  useEffect(() => {
    const fetchJobs = async () => {
      if (!projectId || !evaluationId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // ========================[수정 시작 (5/7)]========================
        // 주석: Promise.all에 getAllEvaluatorConfigs API 호출을 추가하여
        //       현재 페이지의 데이터와 전체 목록을 한 번에 가져옵니다.
        const [jobsResponse, configResponse, allEvaluatorsResponse] = await Promise.all([
          getEvaluationJobs({ projectId, evalConfigId: evaluationId }),
          getEvaluatorConfigById({ projectId, id: evaluationId }),
          getAllEvaluatorConfigs({ projectId }) // 전체 목록 가져오기
        ]);
        // ========================[수정 끝 (5/7)]========================

        setJobs(jobsResponse.data || []);
        //        setEvaluatorConfig(configResponse); // 주석: 가져온 Evaluator 설정 정보를 state에 저장합니다. _ eunju20250912 아래처럼 소스 수정
        const finalStatus = configResponse?.finalStatus || computeFinalStatus(configResponse);
        setEvaluatorConfig({ ...configResponse, finalStatus });


        // ========================[수정 시작 (6/7)]========================
        // 주석: 가져온 전체 목록에서 ID만 추출하여 배열로 만들고,
        //       현재 페이지의 evaluationId가 이 배열에서 몇 번째인지 인덱스를 찾아 저장합니다.
        const ids = allEvaluatorsResponse.configs.map(config => config.id);
        setEvaluatorIds(ids);
        setCurrentIndex(ids.findIndex(id => id === evaluationId));
        // ========================[수정 끝 (6/7)]========================

      } catch (error) {
        console.error("Failed to fetch evaluation data:", error);
        setJobs([]);
        setEvaluatorConfig(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [projectId, evaluationId]);

  // ========================[수정 시작 (3/4)]========================
  // 주석: 드롭다운 메뉴 외부를 클릭하면 메뉴가 닫히도록 하는 useEffect를 추가합니다.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rowHeightMenuRef.current && !rowHeightMenuRef.current.contains(event.target)) {
        setIsRowHeightMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // ========================[수정 끝 (3/4)]========================


  // 주석: useReactTable은 이제 렌더링이 아닌 '상태 관리' 용도로만 사용합니다.
  const table = useReactTable({
    data: jobs,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  // ========================[수정 시작 (1/2)]========================
  // 주석: columnVisibility 상태를 기반으로 실제로 DataTable에 보여줄 컬럼 목록을 필터링합니다.
  // 이것이 다시 <DataTable>을 사용하면서도 컬럼 숨기기가 가능한 핵심 로직입니다.
  const visibleColumns = useMemo(
    () => columns.filter(col => table.getColumn(col.id)?.getIsVisible()),
    [columns, columnVisibility, table]
  );
  // ========================[수정 끝 (1/2)]========================


  // ========================[수정 시작 (7/7)]========================
  // 주석: 이전/다음 페이지로 이동하는 핸들러 함수를 정의합니다.
  const handleNavigatePrev = () => {
    // 현재 인덱스가 0보다 클 때만 (첫 페이지가 아닐 때)
    if (currentIndex > 0) {
      const prevId = evaluatorIds[currentIndex - 1];
      navigate(`/llm-as-a-judge/${prevId}`);
    }
  };

  const handleNavigateNext = () => {
    // 현재 인덱스가 마지막 인덱스보다 작을 때만
    if (currentIndex < evaluatorIds.length - 1) {
      const nextId = evaluatorIds[currentIndex + 1];
      navigate(`/llm-as-a-judge/${nextId}`);
    }
  };
  // ========================[수정 끝 (7/7)]========================

  return (
    <div className={styles.container}>
      {/* --- ✨ 수정: 기존 h1 태그를 새로운 헤더 UI 구조로 변경합니다 --- */}
      <div className={styles.headerContainer}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <span className={styles.evaluatorBadge}>🪄 Evaluator</span>
            <h1 className={styles.headerTitle}>
              {/* 주석: API로 가져온 Evaluator 이름(scoreName)을 표시하고, 없다면 ID를 보여줍니다. */}
              {evaluatorConfig?.scoreName ?? evaluationId}: {evaluationId}
            </h1>
          </div>
          {/* --- ✨ 수정: headerRight 부분에 UI 요소들을 추가합니다 --- */}
          <div className={styles.headerRight}>
            <span className={styles.resultCount}>✅ {jobs.length} results</span>
            {/* ========================[수정 시작]======================== */}
            {/*
              * 수정 내용:
              * 1. 표시할 상태 값 변경:
              * - 기존: evaluatorConfig.status (기본 상태)
              * - 변경: evaluatorConfig.finalStatus (모든 상태를 포함하는 최종 계산된 상태)
              * 2. CSS 클래스 적용 로직 변경:
              * - 기존: 'ACTIVE'일 때만 active 스타일 적용
              * - 변경: 'INACTIVE'가 아닐 경우 모두 active 스타일을 적용하여
              * 'ACTIVE', 'FINISHED' 등 다른 모든 상태가 동일한 UI를 갖도록 함.
              */}
            {evaluatorConfig?.finalStatus && (
              <span
                className={
                  evaluatorConfig.finalStatus === "INACTIVE"
                    ? styles.inactiveStatusBadge
                    : styles.activeStatusBadge
                }
              >
                <span className={styles.statusDot}></span>
                {evaluatorConfig.finalStatus.toLowerCase()}
              </span>
            )}
            {/* ========================[수정 끝]======================== */}
            {/* --- ✨ 수정: 버튼에 onClick 핸들러와 disabled 속성을 추가합니다 --- */}
            <div className={styles.navButtonGroup}>
              <button
                className={styles.navButton}
                onClick={handleNavigatePrev}
                disabled={currentIndex <= 0} // 첫 번째 항목이면 비활성화
              >
                <ChevronUp size={16} /> K
              </button>
              <button
                className={styles.navButton}
                onClick={handleNavigateNext}
                disabled={currentIndex >= evaluatorIds.length - 1} // 마지막 항목이면 비활성화
              >
                <ChevronDown size={16} /> J
              </button>
            </div>
          </div>
          {/* ----------------------------------------------------------- */}
        </div>
        {/* --- ✨ 수정: 두 번째 headerRow 부분에 UI 요소들을 추가합니다 --- */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <button className={styles.filterButton}>
              Filters <ChevronDown size={16} />
            </button>
          </div>
          <div className={styles.headerRight}>
            {/* --- 수정: Columns 버튼에 onClick 이벤트와 동적 텍스트를 추가합니다 --- */}
            <button className={styles.columnButton} onClick={() => setIsPanelOpen(true)}>
              <Columns size={16} />
              {/* --- 수정: 버튼 텍스트도 table 인스턴스를 사용합니다. --- */}
              Columns {table.getVisibleLeafColumns().length}/{columns.length}
            </button>
            {/* ========================[수정 시작 (4/4)]======================== */}
            {/* 주석: LayoutGrid 버튼을 드롭다운 컨테이너로 감싸고, 클릭 이벤트를 연결합니다. */}
            <div className={styles.dropdownContainer} ref={rowHeightMenuRef}>
              <button className={styles.iconButton} onClick={() => setIsRowHeightMenuOpen(!isRowHeightMenuOpen)}>
                <LayoutGrid size={16} />
              </button>
              {isRowHeightMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>Row height</div>
                  <div className={styles.dropdownItem} onClick={() => { setRowHeight('small'); setIsRowHeightMenuOpen(false); }}>
                    <span>Small</span>
                    {rowHeight === 'small' && <Check size={16} />}
                  </div>
                  <div className={styles.dropdownItem} onClick={() => { setRowHeight('medium'); setIsRowHeightMenuOpen(false); }}>
                    <span>Medium</span>
                    {rowHeight === 'medium' && <Check size={16} />}
                  </div>
                  <div className={styles.dropdownItem} onClick={() => { setRowHeight('large'); setIsRowHeightMenuOpen(false); }}>
                    <span>Large</span>
                    {rowHeight === 'large' && <Check size={16} />}
                  </div>
                </div>
              )}
            </div>
            {/* ========================[수정 끝 (4/4)]======================== */}
          </div>
        </div>
      </div>

      {/* ========================[수정 시작]======================== */}
      {/* 주석: 바로 이 부분이 너비 고정 문제 해결의 핵심입니다.
        <DataTable> 컴포넌트를 <div className={styles.tableWrapper}>로 감싸줍니다.
        이렇게 해야 .module.css 파일에 있는 '.tableWrapper table' 스타일이 적용되어
        'table-layout: fixed;' 속성이 테이블에 반영되고, 너비가 고정됩니다.
      */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={visibleColumns}
          data={jobs}
          keyField="jobOutputScoreId"
          showCheckbox={false}
          showFavorite={false}
          isLoading={isLoading}
          renderEmptyState={() => "No results."}
          pagination={{
            enabled: true,
            pageSize: 50,
            pageSizeOptions: [10, 20, 30, 50],
            position: "fixed-bottom"
          }}
        />
      </div>
      {/* ========================[수정 끝]======================== */}

      <ColumnVisibilityPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        table={table}
      />
    </div>
  );
};

export default EvaluationView;
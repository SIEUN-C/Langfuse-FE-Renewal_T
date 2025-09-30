import { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import styles from './Tracing.module.css';
import { DataTable } from 'components/DataTable/DataTable';
import { getTraceTableColumns } from './config/TraceColumns.jsx';
import SearchInput from 'components/SearchInput/SearchInput';
import FilterControls from 'components/FilterControls/FilterControls';
import TraceDetailPanel from './components/TraceDetailPanel.jsx';
import { useEnvironmentFilter } from '../../hooks/useEnvironmentFilter.js';
import { useTimeRangeFilter } from '../../hooks/useTimeRangeFilter.js';
import ColumnVisibilityModal from '../../components/ColumnVisibilityModal/ColumnVisibilityModal.jsx';
import { useColumnVisibility } from 'hooks/useColumnVisibility.js';
import FilterButton from 'components/FilterButton/FilterButton';
import { Columns, Plus, Edit, AlertCircle, LayoutGrid, Download } from 'lucide-react';
import { langfuse } from '../../lib/langfuse.js';
import { fetchTraces, deleteTrace, fetchTraceMetrics } from './services/tracingApi.js';
import { fetchTraceDetails } from './services/traceDetailApi.js';
import { getProjects } from '../../api/settings/projectApi.js';

import { useFilteredData } from 'hooks/useFilteredData.js';
import { getTracesFilterConfig, getObservationsFilterConfig } from 'components/FilterControls/config/configBuilder.js';
import { tracesFilterDefs } from 'components/FilterControls/config/definitions/traceDefinitions.js';
import { observationsFilterDefs } from 'components/FilterControls/config/definitions/observationsDefinitions.js';

import RowHeightDropdown from 'components/RowHeightDropdown/RowHeightDropdown.jsx'

// Observation 추가
import ObservationsTab from './Observations/ObservationTab.jsx';
import { makeObservationColumns } from './config/ObservationColumns.jsx';

// 에러 메시지를 표시하는 별도의 컴포넌트
const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className={styles.errorBanner}>
      <AlertCircle size={18} style={{ marginRight: '10px' }} />
      <span>{message}</span>
      <button onClick={onDismiss} className={styles.errorCloseButton}>×</button>
    </div>
  );
};

const Tracing = () => {
  const [activeTab, setActiveTab] = useState('Traces');
  const [traces, setTraces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('IDs / Names');
  const [isTraceColumnModalOpen, setIsTraceColumnModalOpen] = useState(false);
  const [isObsColumnModalOpen, setIsObsColumnModalOpen] = useState(false);
  const [favoriteState, setFavoriteState] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [pendingTraceId, setPendingTraceId] = useState(null);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [rowHeight, setRowHeight] = useState('small')

  const baseTraceFilterColumns = useMemo(() => getTracesFilterConfig(), []);
  const observationsFilterColumns = useMemo(() => getObservationsFilterConfig(), []);

  const [builderFiltersTraces, setBuilderFiltersTraces] = useState([]);
  const [builderFiltersObs, setBuilderFiltersObs] = useState([]);

  const dynamicTraceFilterColumns = useMemo(() => {
    // Name
    const nameOptions = [
        // traces 배열에서 모든 name 값을 수집한 후, 중복을 제거
        ...new Set(traces.map(trace => trace.name).filter(Boolean))
    ];
    const nameFilterDef = baseTraceFilterColumns.find(def => def.key === 'name');
    if (nameFilterDef) {
        nameFilterDef.options = nameOptions; // 찾은 항목에 동적 옵션을 주입
    }

    // Tags
    const tagsOptions = [
      // traces 배열의 모든 tags를 하나의 배열로 합친 후, 중복을 제거
      ...new Set(traces.flatMap(trace => trace.tags || []).filter(Boolean))
    ];

    // 기본 필터 설정에서 'tags' 항목을 찾음
    const tagsFilterDef = baseTraceFilterColumns.find(def => def.key === 'tags');
    if (tagsFilterDef) {
      tagsFilterDef.options = tagsOptions; // 찾은 항목에 동적 옵션을 주입
    }

    return baseTraceFilterColumns;

  }, [traces, baseTraceFilterColumns]); // traces 데이터가 바뀔 때마다 재계산

  useEffect(() => {
    // Traces 필터 초기화
    if (baseTraceFilterColumns.length > 0 && builderFiltersTraces.length === 0) {
      const firstColumn = baseTraceFilterColumns[0];
      setBuilderFiltersTraces([{
        id: 1,
        column: firstColumn.key,
        type: firstColumn.type,
        operator: firstColumn.operators[0],
        value: '',
      }]);
    }
    // Observations 필터 초기화
    if (observationsFilterColumns.length > 0 && builderFiltersObs.length === 0) {
      const typeColumn = observationsFilterColumns.find(c => c.key === 'type') || observationsFilterColumns[0];
      setBuilderFiltersObs([{
        id: 1,
        column: typeColumn.key,
        type: typeColumn.type,
        operator: 'any of',
        value: ['GENERATION', 'AGENT', 'TOOL', 'CHAIN', 'RETRIEVER', 'EVALUATOR', 'EMBEDDING', 'GUARDRAIL'],
      }]);
    }
  }, [baseTraceFilterColumns, observationsFilterColumns, builderFiltersTraces, builderFiltersObs]);

  const [projectId, setProjectId] = useState(null);

  const normalizeRow = (t = {}) => {
    // metrics API 응답의 costDetails 객체에서 비용 정보를 가져옵니다.
    const inputCost = t.costDetails?.input ?? t.inputCost;
    const outputCost = t.costDetails?.output ?? t.outputCost;
    const totalCost = t.costDetails?.total ?? t.calculatedTotalCost ?? t.totalCost;

    // 토큰 정보도 새로운 필드에서 가져옵니다.
    const inputTokens = t.usageDetails?.input ?? t.promptTokens;
    const outputTokens = t.usageDetails?.output ?? t.completionTokens;
    const totalTokens = t.usageDetails?.total ?? t.totalTokens;

    const result = {
      ...t,
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost,
      // TracingApi.js에서 'cost'필드에 totalCost를 넣었으므로 일관성을 위해 추가
      cost: totalCost,
    };

    return result;
  };

  useEffect(() => {
    const fetchProjectId = async () => {
      try {
        const projects = await getProjects();
        if (projects && projects.length > 0) {
          setProjectId(projects[0].id);
        } else {
          setError("프로젝트를 찾을 수 없습니다. Langfuse에서 프로젝트를 먼저 생성해주세요.");
        }
      } catch (err) {
        console.error("Project ID를 가져오는 데 실패했습니다:", err);
        setError(err.clientMessage || "Project ID를 가져오는 데 실패했습니다.");
      }
    };
    fetchProjectId();
  }, []);

  const allEnvironments = useMemo(() => {
    if (!traces || traces.length === 0) return [];
    const uniqueEnvNames = [...new Set(traces.map(trace => trace.environment || 'default'))];
    return uniqueEnvNames.map((name, index) => ({ id: `env-${index}`, name }));
  }, [traces]);

  const timeRangeFilter = useTimeRangeFilter();
  const { selectedEnvs, ...envFilterProps } = useEnvironmentFilter(allEnvironments);

  const isObsTab = activeTab === 'Observations';
  const currentFilterColumns = isObsTab ? observationsFilterColumns : dynamicTraceFilterColumns;
  const builderFilters = isObsTab ? builderFiltersObs : builderFiltersTraces;
  const setBuilderFilters = isObsTab ? setBuilderFiltersObs : setBuilderFiltersTraces;

  const builderFilterProps = {
    filters: builderFilters,
    onFilterChange: setBuilderFilters,
    filterConfig: currentFilterColumns, // Pass 'columns' prop instead of 'filterConfig'
  };

  const filteredTraces = useFilteredData(
    traces,
    builderFiltersTraces,
    tracesFilterDefs,
    searchQuery,
    searchType,
    selectedEnvs,
    timeRangeFilter
  );

  const toggleFavorite = useCallback((traceId) => {
    setFavoriteState(prev => ({ ...prev, [traceId]: !prev[traceId] }));
  }, []);

  const toggleAllFavorites = () => {
    const allFavorited = traces.length > 0 && traces.every(trace => favoriteState[trace.id]);
    const newFavoriteState = {};
    traces.forEach(trace => { newFavoriteState[trace.id] = !allFavorited; });
    setFavoriteState(newFavoriteState);
  };

  const traceColumnDefinitions = useMemo(() => getTraceTableColumns(null, rowHeight), [rowHeight]);
  const {
    columns: traceColumnVisibilities,
    visibleColumns: traceVisibleColumns,
    toggleColumnVisibility: toggleTraceColumnVisibility,
    setAllColumnsVisible: setAllTraceColumnsVisible,
    restoreDefaults: restoreTraceDefaults,
  } = useColumnVisibility(traceColumnDefinitions);

  const obsColumnDefinitions = useMemo(() => makeObservationColumns(projectId, rowHeight), [projectId, rowHeight]);
  const {
    columns: obsColumnVisibilities,
    visibleColumns: obsVisibleColumns,
    toggleColumnVisibility: toggleObsColumnVisibility,
    setAllColumnsVisible: setAllObsColumnsVisible,
    restoreDefaults: restoreObsDefaults,
  } = useColumnVisibility(obsColumnDefinitions);

  const loadTraces = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const fetchedTraces = await fetchTraces();
      if (!fetchedTraces || fetchedTraces.length === 0) {
        setTraces([]);
        return;
      }

      const traceIds = fetchedTraces.map(trace => trace.id);

      const metrics = await fetchTraceMetrics(traceIds, projectId);

      const metricsMap = new Map(metrics.map(metric => [metric.id, metric]));

      const combinedData = fetchedTraces.map(trace => ({
        ...trace,
        ...metricsMap.get(trace.id),
      }));

      const normalized = combinedData.map(normalizeRow);
      setTraces(normalized);

      const initialFavorites = {};
      normalized.forEach(trace => { initialFavorites[trace.id] = trace.isFavorited || false; });
      setFavoriteState(initialFavorites);

    } catch (err) {
      setError(err.clientMessage || err.message || "알 수 없는 오류가 발생했습니다.");
      console.error("Trace 로딩 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadTraces(); }, [loadTraces]);

  const handleDeleteTrace = useCallback(async (traceId) => {
    if (window.confirm(`정말로 이 트레이스를 삭제하시겠습니까? ID: ${traceId}`)) {
      try {
        setError(null);
        await deleteTrace(traceId);
        setTraces(prevTraces => prevTraces.filter(trace => trace.id !== traceId));
      } catch (err) {
        setError(err.clientMessage || 'Trace 삭제 중 예상치 못한 오류가 발생했습니다.');
        console.error(`Trace (ID: ${traceId}) 삭제 실패:`, err);
      }
    }
  }, []);

  const handleRowClick = (trace) => setSelectedTraceId(prevId => (prevId === trace.id ? null : trace.id));
  const handlePanelClose = () => { setSelectedTraceId(null); }

  useEffect(() => {
    if (!pendingTraceId) return;
    setTraces(prevTraces => [{ id: pendingTraceId, name: `Creating trace ${pendingTraceId.substring(0, 7)}...`, timestamp: new Date().toISOString(), input: 'Pending...', output: 'Pending...', userId: '...', cost: null, latency: 0, observations: '...' }, ...prevTraces,]);
    const interval = setInterval(async () => {
      try {
        const traceDetails = await fetchTraceDetails(pendingTraceId);
        if (traceDetails) {
          clearInterval(interval);
          setPendingTraceId(null);
          await loadTraces();
        }
      } catch (error) {
        clearInterval(interval);
        setPendingTraceId(null);
        console.error("Polling 중 에러 발생:", error);
        setError("Trace를 확인하는 중 예상치 못한 오류가 발생했습니다.");
        loadTraces();
      }
    }, 2000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (pendingTraceId) {
        setPendingTraceId(null);
        setError(`Trace ${pendingTraceId} 생성 확인에 실패했습니다. 목록을 수동으로 새로고침 해주세요.`);
        loadTraces();
      }
    }, 30000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [pendingTraceId, loadTraces]);

  return (
    <div className={styles.container}>
      <div className={styles.listSection}>

        <div className={styles.tabs}>
          <button className={`${styles.tabButton} ${activeTab === 'Traces' ? styles.active : ''}`} onClick={() => setActiveTab('Traces')}>Traces</button>
          <button className={`${styles.tabButton} ${activeTab === 'Observations' ? styles.active : ''}`} onClick={() => setActiveTab('Observations')}>Observations</button>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <SearchInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              searchType={searchType}
              setSearchType={setSearchType}
              searchTypes={['IDs / Names', 'Full Text']}
            />
          </div>
          <div className={styles.filtersBox}>
            <FilterControls
              envFilterProps={envFilterProps}
              timeRangeFilterProps={timeRangeFilter}
              builderFilterProps={builderFilterProps}
            />
          </div>
          <div className={styles.filterRightGroup}>
            <button className={styles.tableViewButton}>
              Table View
            </button>
            {activeTab === 'Traces' && (
              <FilterButton onClick={() => setIsTraceColumnModalOpen(true)} style={{ marginLeft: '8px' }}>
                <Columns size={16} /> Columns ({traceVisibleColumns.length}/{traceColumnDefinitions.length})
              </FilterButton>
            )}
            {activeTab === 'Observations' && (
              <FilterButton onClick={() => setIsObsColumnModalOpen(true)} style={{ marginLeft: '8px' }}>
                <Columns size={16} /> Columns ({obsVisibleColumns.length}/{obsColumnDefinitions.length})
              </FilterButton>
            )}
            {/* 행 높이 아이콘 버튼 */}
            <RowHeightDropdown
              value={rowHeight}
              onChange={setRowHeight}
            />
            <button className={styles.exportButton}>
              <Download />
            </button>
          </div>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className={styles.contentArea} data-density={rowHeight}>
          {activeTab === 'Traces' && (
            isLoading ? <div>Loading traces...</div> :
              !error && (
                <DataTable
                  columns={traceVisibleColumns}
                  data={filteredTraces}
                  keyField="id"
                  renderEmptyState={() => <div>No traces found.</div>}
                  onRowClick={handleRowClick}
                  selectedRowKey={selectedTraceId}
                  showCheckbox={true}
                  selectedRows={selectedRows}
                  onCheckboxChange={setSelectedRows}
                  onFavoriteClick={toggleFavorite}
                  showFavorite={true}
                  favoriteState={favoriteState}
                  onToggleAllFavorites={toggleAllFavorites}
                  showDelete={true}
                  onDeleteClick={handleDeleteTrace}
                  pagination={{
                    enabled: true,
                    pageSize: 50,
                    pageSizeOptions: [10, 20, 30, 50],
                    position: "fixed-bottom"
                  }}
                />
              )
          )}

          {activeTab === 'Observations' && (
            projectId ? (
              <ObservationsTab
                projectId={projectId}
                searchQuery={searchQuery}
                searchMode={searchType}
                selectedEnvs={selectedEnvs}
                timeRangeFilter={timeRangeFilter}
                builderFilters={builderFilters}
                visibleColumns={obsVisibleColumns || []}
              />
            ) : (
              <div style={{ opacity: .7, marginTop: 8 }}>Loading project…</div>
            )
          )}
        </div>
      </div>

      {selectedTraceId && ReactDOM.createPortal(
        <TraceDetailPanel
          traces={filteredTraces}
          selectedTraceId={selectedTraceId}
          setSelectedTraceId={setSelectedTraceId}
          onClose={handlePanelClose}
        />,
        document.body
      )}

      {activeTab === 'Traces' && (
        <ColumnVisibilityModal
          isOpen={isTraceColumnModalOpen}
          onClose={() => setIsTraceColumnModalOpen(false)}
          columns={traceColumnVisibilities}
          toggleColumnVisibility={toggleTraceColumnVisibility}
          setAllColumnsVisible={setAllTraceColumnsVisible}
          onRestoreDefaults={restoreTraceDefaults}
        />
      )}
      {activeTab === 'Observations' && (
        <ColumnVisibilityModal
          isOpen={isObsColumnModalOpen}
          onClose={() => setIsObsColumnModalOpen(false)}
          columns={obsColumnVisibilities}
          toggleColumnVisibility={toggleObsColumnVisibility}
          setAllColumnsVisible={setAllObsColumnsVisible}
          onRestoreDefaults={restoreObsDefaults}
        />
      )}
    </div>
  );
};

export default Tracing;
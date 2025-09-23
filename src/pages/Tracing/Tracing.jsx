import { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import styles from './Tracing.module.css';
import { DataTable } from 'components/DataTable/DataTable';
import { traceTableColumns as rawColumns } from './config/TraceColumns.jsx';
import SearchInput from 'components/SearchInput/SearchInput';
import FilterControls from 'components/FilterControls/FilterControls';
import TraceDetailPanel from './components/TraceDetailPanel.jsx';
import { useEnvironmentFilter } from '../../hooks/useEnvironmentFilter.js';
import { useTimeRangeFilter } from '../../hooks/useTimeRangeFilter.js';
import ColumnVisibilityModal from '../../components/ColumnVisibilityModal/ColumnVisibilityModal.jsx';
import { useColumnVisibility } from 'hooks/useColumnVisibility.js';
import FilterButton from 'components/FilterButton/FilterButton';
import { Columns, Plus, Edit, AlertCircle, LayoutGrid, Download } from 'lucide-react';
import { createTrace, updateTrace } from './CreateTrace.jsx';
import { langfuse } from '../../lib/langfuse.js';
import { fetchTraces, deleteTrace, fetchTraceMetrics } from './services/TracingApi.js';
import { fetchTraceDetails } from './services/TraceDetailApi.js';
import { getProjects } from '../../api/settings/ProjectApi.js';
// --- ▼▼▼ [추가] filter ▼▼▼ ---
import { tracingFilterConfig } from 'components/FilterControls/filterConfig';
import { observationsFilterConfig } from './config/ObservationFilterConfig.js';
// --- ▲▲▲ [추가] filter ▲▲▲ ---

import RowDensityButton from "./components/RowDensityButton.jsx";

// Observation 추가
import ObservationsTab from './Observations/ObservationTab.jsx';

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
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [favoriteState, setFavoriteState] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [pendingTraceId, setPendingTraceId] = useState(null);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  // Traces 탭 필터 상태
  const [builderFiltersTraces, setBuilderFiltersTraces] = useState(() => {
    const c = tracingFilterConfig[0];
    return [{ id: 1, column: c.key, operator: c.operators[0], value: '', metaKey: '' }];
  });

  // 행 밀도(기본 medium). 초기값은 로컬스토리지에서 복원
  const [rowDensity, setRowDensity] = useState(() => {
    try { return localStorage.getItem("tracing.rowDensity") || "md"; }
    catch { return "md"; }
  });

  // Observations 탭 필터 상태 (기본 8개 선택)
  const [builderFiltersObs, setBuilderFiltersObs] = useState(() => ([
    {
      id: 1,
      column: 'Type',
      operator: 'any of',
      value: ['GENERATION', 'SPAN', 'EVENT', 'AGENT', 'TOOL', 'CHAIN', 'RETRIEVER', 'EVALUATOR'],
      metaKey: ''
    },
  ]));

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
  const currentFilterConfig = isObsTab ? observationsFilterConfig : tracingFilterConfig;
  const builderFilters = isObsTab ? builderFiltersObs : builderFiltersTraces;
  const setBuilderFilters = isObsTab ? setBuilderFiltersObs : setBuilderFiltersTraces;


  const builderFilterProps = {
    filters: builderFilters,
    onFilterChange: setBuilderFilters,
    filterConfig: currentFilterConfig
  };

  const columnMapping = {
    "ID": "id", "Name": "name", "Timestamp": "timestamp", "User ID": "userId", "Session ID": "sessionId", "Version": "version", "Release": "release", "Tags": "tags", "Input Tokens": "inputTokens", "Output Tokens": "outputTokens", "Total Tokens": "totalTokens", "Latency (s)": "latency", "Input Cost ($)": "inputCost", "Output Cost ($)": "outputCost", "Total Cost ($)": "totalCost", "Environment": "environment"
  };

  const filteredTraces = useMemo(() => {
    let tempTraces = traces;

    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      tempTraces = tempTraces.filter(trace => {
        if (searchType === 'IDs / Names') {
          return (
            trace.id?.toLowerCase().includes(lowercasedQuery) ||
            trace.name?.toLowerCase().includes(lowercasedQuery)
          );
        }
        if (searchType === 'Full Text') {
          return Object.values(trace).some(val =>
            String(val).toLowerCase().includes(lowercasedQuery)
          );
        }
        return true;
      });
    }

    const selectedEnvNames = new Set(selectedEnvs.map(e => e.name));
    if (selectedEnvNames.size > 0) {
      tempTraces = tempTraces.filter(trace => selectedEnvNames.has(trace.environment));
    }

    const { startDate, endDate } = timeRangeFilter;
    if (startDate && endDate) {
      tempTraces = tempTraces.filter(trace => {
        // [수정됨] 이제 trace.timestamp는 신뢰할 수 있는 ISO 형식이므로 dayjs가 안정적으로 파싱합니다.
        const traceTimestamp = dayjs(trace.timestamp);
        return traceTimestamp.isAfter(startDate) && traceTimestamp.isBefore(endDate);
      });
    }

    const activeFilters = builderFilters.filter(f => String(f.value).trim() !== '');
    if (activeFilters.length > 0) {
      tempTraces = tempTraces.filter(trace => {
        return activeFilters.every(filter => {
          const traceKey = columnMapping[filter.column];
          if (!traceKey) return true;
          const traceValue = trace[traceKey];
          const filterValue = filter.value;
          if (traceValue === null || traceValue === undefined) return false;
          const traceString = String(traceValue).toLowerCase();
          const filterString = String(filterValue).toLowerCase();
          switch (filter.operator) {
            case '=': return traceString === filterString;
            case 'contains': return traceString.includes(filterString);
            case 'does not contain': return !traceString.includes(filterString);
            case 'starts with': return traceString.startsWith(filterString);
            case 'ends with': return traceString.endsWith(filterString);
            case '>': return Number(traceValue) > Number(filterValue);
            case '<': return Number(traceValue) < Number(filterValue);
            case '>=': return Number(traceValue) >= Number(filterValue);
            case '<=': return Number(traceValue) <= Number(filterValue);
            case 'any of': return filterString.split(',').some(val => traceString.includes(val.trim()));
            case 'none of': return !filterString.split(',').some(val => traceString.includes(val.trim()));
            default: return true;
          }
        });
      });
    }
    return tempTraces;
  }, [traces, searchQuery, searchType, selectedEnvs, timeRangeFilter, builderFilters]);

  const toggleFavorite = useCallback((traceId) => {
    setFavoriteState(prev => ({ ...prev, [traceId]: !prev[traceId] }));
  }, []);

  const toggleAllFavorites = () => {
    const allFavorited = traces.length > 0 && traces.every(trace => favoriteState[trace.id]);
    const newFavoriteState = {};
    traces.forEach(trace => { newFavoriteState[trace.id] = !allFavorited; });
    setFavoriteState(newFavoriteState);
  };

  const {
    columns,
    visibleColumns,
    toggleColumnVisibility,
    setAllColumnsVisible,
    restoreDefaults,
  } = useColumnVisibility(rawColumns);

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

  const handleCreateClick = async () => {
    if (!projectId) {
      setError("Project ID가 설정되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    const newTraceId = await createTrace(projectId);
    if (newTraceId) {
      setPendingTraceId(newTraceId);
    }
  };

  const handleUpdateClick = async () => {
    const traceIdToUpdate = window.prompt("업데이트할 Trace의 ID를 입력하세요:");
    if (!traceIdToUpdate) return;
    const traceToUpdate = traces.find(t => t.id === traceIdToUpdate.trim());
    if (!traceToUpdate) {
      setError(`ID '${traceIdToUpdate}'에 해당하는 Trace를 찾을 수 없습니다.`);
      return;
    }
    const langfuseTraceObject = langfuse.trace({ id: traceToUpdate.id, _dangerouslyIgnoreCorruptData: true });
    await updateTrace(langfuseTraceObject, loadTraces);
  };

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
            <FilterButton onClick={() => setIsColumnModalOpen(true)} style={{ marginLeft: '8px' }}>
              <Columns size={16} /> Columns ({visibleColumns.length}/{columns.length})
            </FilterButton>
            {/* 행 높이 아이콘 버튼 */}
            <RowDensityButton
              value={rowDensity}
              onChange={setRowDensity}
              style={{ marginLeft: 8 }}
            />
            <button className={styles.exportButton}>
              <Download />
            </button>
          </div>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className={`${styles.contentArea} ${styles.densityRoot}`} data-density={rowDensity}>
          {activeTab === 'Traces' && (
            isLoading ? <div>Loading traces...</div> :
              !error && (
                <DataTable
                  columns={visibleColumns}
                  data={filteredTraces}
                  keyField="id"
                  renderEmptyState={() => <div>No traces found.</div>}
                  onRowClick={handleRowClick}
                  selectedRowKey={selectedTraceId}
                  showCheckbox={true}
                  selectedRows={selectedRows}
                  onCheckboxChange={setSelectedRows}
                  onFavoriteClick={toggleFavorite}
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

      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columns={columns}
        toggleColumnVisibility={toggleColumnVisibility}
        setAllColumnsVisible={setAllColumnsVisible}
        onRestoreDefaults={restoreDefaults}
      />
    </div>
  );
};

export default Tracing;
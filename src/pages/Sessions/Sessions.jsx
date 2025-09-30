// src/pages/Tracing/Sessions/Sessions.jsx
import React, { useState, useMemo, useEffect } from 'react';
import styles from './Sessions.module.css';
import { Columns } from 'lucide-react';
import ColumnVisibilityModal from '../../components/ColumnVisibilityModal/ColumnVisibilityModal.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { sessionTableColumns } from './SessionColumns.jsx';
import FilterButton from '../../components/FilterButton/FilterButton.jsx';
import FilterControls from '../../components/FilterControls/FilterControls.jsx';

import { useEnvironmentFilter } from '../../hooks/useEnvironmentFilter.js'; // 추가
import { useTimeRangeFilter } from '../../hooks/useTimeRangeFilter.js'; // 추가
import dayjs from 'dayjs'; // 추가
import { fetchSessions } from './sessionApi.js';
import { sessionsFilterConfig } from '../../components/FilterControls/filterConfig.js'; // [수정] sessionsFilterConfig를 import 합니다.

const Sessions = () => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [isColumnVisibleModalOpen, setIsColumnVisibleModalOpen] = useState(false);
    const [columns, setColumns] = useState(
        sessionTableColumns.map(c => ({ ...c, visible: c.visible }))
    );
    const [startDate, setStartDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [favoriteState, setFavoriteState] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());

    // [수정] FilterBuilder 상태를 sessionsFilterConfig 기준으로 초기화합니다.
    const [builderFilters, setBuilderFilters] = useState(() => {
        const initialColumn = sessionsFilterConfig[0];
        return [{ id: 1, column: initialColumn.key, operator: initialColumn.operators[0], value: '', metaKey: '' }];
    });

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedSessions = await fetchSessions();
            setSessions(fetchedSessions);
            const initialFavorites = {};
            fetchedSessions.forEach(s => {
                initialFavorites[s.id] = s.isFavorited || false;
            });
            setFavoriteState(initialFavorites);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    // ▼▼▼ filter + UI  ▼▼▼
    const timeRangeFilter = useTimeRangeFilter();

    const allEnvironments = useMemo(() => {
        if (!sessions || sessions.length === 0) return [];
        const uniqueEnvNames = [...new Set(sessions.map(s => s.environment || 'default'))];
        return uniqueEnvNames.map((name, index) => ({ id: `env-${index}`, name }));
    }, [sessions]);

    const { selectedEnvs, ...envFilterProps } = useEnvironmentFilter(allEnvironments);

    const filteredSessions = useMemo(() => {
        let tempSessions = sessions;

        // Environment 필터 적용
        const selectedEnvNames = new Set(selectedEnvs.map(e => e.name));
        if (selectedEnvNames.size > 0) {
            tempSessions = tempSessions.filter(session => selectedEnvNames.has(session.environment));
        }

        // Time Range 필터 적용
        const { startDate, endDate } = timeRangeFilter;
        if (startDate && endDate) {
            tempSessions = tempSessions.filter(session => {
                const sessionTimestamp = dayjs(session.createdAt);
                return sessionTimestamp.isAfter(startDate) && sessionTimestamp.isBefore(endDate);
            });
        }

        // 여기에 다른 필터 로직(Search, FilterBuilder)을 추가할 수 있습니다.

        return tempSessions;
    }, [sessions, selectedEnvs, timeRangeFilter]);
    // ▲▲▲ filter + UI ▲▲▲


    // [수정] builderFilterProps 객체에 sessionsFilterConfig를 전달합니다.
    const builderFilterProps = {
        filters: builderFilters,
        onFilterChange: setBuilderFilters,
        filterConfig: sessionsFilterConfig
    };

    const toggleFavorite = (sessionId) => {
        setFavoriteState(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
    };

    const toggleColumnVisibility = (key) => {
        setColumns(prev =>
            prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col))
        );
    };

    const setAllColumnsVisible = (visible) => {
        setColumns(prev => prev.map(col => ({ ...col, visible })));
    };

    const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

    const renderTableContent = () => {
        if (isLoading) return <div>Loading sessions...</div>;
        if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
        return (
            <DataTable
                columns={visibleColumns}
                data={sessions}
                keyField="id"
                renderEmptyState={() => <>No sessions found.</>}
                selectedRowKey={selectedSessionId}
                onRowClick={(row) => setSelectedSessionId(row.id)}
                showCheckbox={true}
                selectedRows={selectedRows}
                onCheckboxChange={setSelectedRows}
                showFavorite={true}
                favoriteState={favoriteState}
                onFavoriteClick={toggleFavorite}
                pagination={{
                    enabled: true,
                    pageSize: 50,
                    pageSizeOptions: [10, 20, 30, 50],
                    position: "fixed-bottom"
                  }}
            />
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.filterBar}>
                <div className={styles.filterLeft}>
                    {/* DateRangePicker 대신 FilterControls를 사용합니다. */}
                    <FilterControls 
                        envFilterProps={envFilterProps}
                        timeRangeFilterProps={timeRangeFilter}
                        builderFilterProps={builderFilterProps} 
                    />
                </div>
                <div className={styles.filterRight}>
                    <FilterButton onClick={() => setIsColumnVisibleModalOpen(true)}>
                        <Columns size={16} /> Columns ({visibleColumns.length}/{columns.length})
                    </FilterButton>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {renderTableContent()}
            </div>

            <ColumnVisibilityModal
                isOpen={isColumnVisibleModalOpen}
                onClose={() => setIsColumnVisibleModalOpen(false)}
                columns={columns}
                toggleColumnVisibility={toggleColumnVisibility}
                setAllColumnsVisible={setAllColumnsVisible}
            />
        </div>
    );
};

export default Sessions;
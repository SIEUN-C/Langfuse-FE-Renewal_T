// src/Pages/Tracing/TraceTimeline.jsx
import React, { useState, useEffect, useMemo } from 'react'; // useRef 제거
import styles from './TraceTimeline.module.css';
import {
  MessageSquare,
  Loader,
  AlertTriangle,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Download,
  GitBranch,
  ListTree
} from 'lucide-react';
import { fetchObservationsForTrace } from '../services/TraceTimelineApi';


// 안전한 key 생성기: id/scoreId 우선, 없으면 name+ownerId+index
const scoreKey = (s, ownerId, i) =>
  s?.id ??
  s?.scoreId ??
  `${s?.name ?? 'score'}-${ownerId ?? 'root'}-${i}`;

// <Input → Output (∑ Total)> 형식으로 토큰 사용량을 변환하는 헬퍼 함수
const formatUsageString = (usage) => {
  if (!usage || (usage.input == null && usage.output == null)) return null;
  const input = usage.input ?? 0;
  const output = usage.output ?? 0;
  const total = usage.total ?? (input + output);
  if (input === 0 && output === 0) return null;
  return `<${input} → ${output} (∑ ${total})>`;
};


// 전체 트레이스 데이터(tree)에서 ID로 특정 Observation을 찾는 헬퍼 함수
const findObservationInTrace = (trace, observationId) => {
    if (!trace || !observationId) return null;
    const findRecursively = (observations) => {
        if (!Array.isArray(observations)) return null;
        for (const obs of observations) {
            if (obs.id === observationId) return obs;
            if (obs.observations) {
                const found = findRecursively(obs.observations);
                if (found) return found;
            }
        }
        return null;
    };
    return findRecursively(trace.observations);
};

/*
 * 수정: level prop과 관련된 로직을 모두 제거합니다.
 * 내용: 들여쓰기(indentation)를 CSS에서 관리하도록 변경하여,
 * 자바스크립트를 통한 동적 스타일링을 제거하고 구조를 단순화합니다.
*/
const ObservationNode = ({ node, allNodes, onSelect, selectedId, fullTraceDetails }) => {
  const [isOpen, setIsOpen] = useState(true);
  const children = useMemo(() => allNodes.filter(n => n.parentObservationId === node.id), [allNodes, node.id]);

  const getIcon = (type) => {
    switch (type) {
      case 'SPAN': return <ArrowRightLeft size={16} className={styles.spanIcon} />;
      case 'GENERATION': return <GitBranch size={16} className={styles.generationIcon} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const hasChildren = children.length > 0;
  const detailedNode = useMemo(() => findObservationInTrace(fullTraceDetails, node.id) ?? node, [fullTraceDetails, node]);
  const usageText = formatUsageString(detailedNode.usage);

  return (
    <li className={styles.nodeContainer}>
      <div
        className={`${styles.timelineItem} ${selectedId === node.id ? styles.selected : ''}`}
        data-observation-id={node.id}
        onClick={() => onSelect(node.id)}
      >
        <div className={styles.itemIcon}>
          {hasChildren ? (
            <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className={styles.chevron}>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : <div className={styles.chevronPlaceholder}></div>}
          {getIcon(node.type)}
        </div>

        <div className={styles.itemContent}>
          <div className={styles.itemHeader}>
            <span className={styles.itemName}>{node.name}</span>
            {detailedNode.latency != null && <span className={styles.latency}>{(detailedNode.latency).toFixed(2)}s</span>}
          </div>
          {detailedNode.scores && detailedNode.scores.length > 0 && (
            <div className={styles.scoreTags}>
              {detailedNode.scores.map((score, i) => (
                <span key={scoreKey(score, node.id, i)} className={styles.scoreTag}>
                  {score.name}: {Number(score.value ?? 0).toFixed(2)} <MessageCircle size={12} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {detailedNode.type === 'GENERATION' && usageText && (
        <div className={styles.usageText}>
          {usageText}
        </div>
      )}

      {isOpen && hasChildren && (
        <ul className={styles.nodeChildren}>
          {children.map(child => (
            <ObservationNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              selectedId={selectedId}
              onSelect={onSelect}
              fullTraceDetails={fullTraceDetails}
            />
          ))}
        </ul>
      )}
    </li>
  );
};


// 메인 컴포넌트
const TraceTimeline = ({ details, onObservationSelect }) => {
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedObservationId, setSelectedObservationId] = useState(null);
  const [isTimelineVisible, setIsTimelineVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태만 유지

  // 검색 로직: 모든 텍스트 필드를 대상으로 검색
  const filteredObservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return observations;
    }
    return observations.filter(obs =>
      JSON.stringify(obs).toLowerCase().includes(query)
    );
  }, [searchQuery, observations]);


  const processObservations = (fetchedObservations) => {
    return fetchedObservations.map(obs => ({
      ...obs,
      scores: obs.scores || [],
      latency: obs.endTime && obs.startTime ? (new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime()) / 1000 : null,
    }));
  };

  const rootObservations = useMemo(() =>
    filteredObservations.filter(obs => !obs.parentObservationId), // 필터링된 데이터 사용
    [filteredObservations]
  );

  useEffect(() => {
    if (!details?.id) {
      setIsLoading(false);
      return;
    }

    const loadObservations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedObservations = await fetchObservationsForTrace(details.id);
        const processedData = processObservations(fetchedObservations);

        processedData.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setObservations(processedData);
        setSelectedObservationId(null);
        if (typeof onObservationSelect === 'function') {
          onObservationSelect(null); // ← trace가 바뀔 때에만 초기화
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    loadObservations();
  }, [details?.id]);

  const handleSelect = (id) => {
    setSelectedObservationId(id);
    const node = observations.find(o => o.id === id);
    // id만이 아니라 traceId / projectId까지 함께 전달
    onObservationSelect(
      node ? { id: node.id, traceId: node.traceId, projectId: node.projectId } : id
    );
  };

  const renderContent = () => {
    // isLoading 상태이거나 details 데이터가 아직 없을 때 로딩 화면을 표시합니다.
    if (isLoading || !details) {
      return (
        <div className={styles.status}>
          <Loader size={16} className={styles.loaderIcon} />
          <span>Loading timeline...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className={`${styles.status} ${styles.error}`}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      );
    }

    // ✨ 전체 Trace에 대한 사용량 텍스트 계산
    const traceUsageText = formatUsageString(details.usage);


    return (
      <ul className={styles.timelineList}>
        {/* Trace 자체를 루트 노드로 렌더링 */}
        <li className={styles.nodeContainer}>
          <div
            className={`${styles.timelineItem} ${selectedObservationId === null ? styles.selected : ''}`}
            onClick={() => handleSelect(null)}
          >
            <div className={styles.itemIcon}>
              <div className={styles.chevronPlaceholder}></div>
              <ListTree size={16} />
            </div>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{details?.name ?? 'Trace'}</span>
                {/* ▼▼▼ 이 부분 수정 ▼▼▼ */}
                {details?.latency != null && <span className={styles.latency}>{details.latency.toFixed(2)}s</span>}
              </div>
              {/* --- ✨ 수정 시작 (전체 Trace에 scores 복원) --- */}
              {details?.scores?.length > 0 && (
                <div className={styles.scoreTags}>
                  {details.scores.map((score, i) => (
                    <span key={scoreKey(score, details.id, i)} className={styles.scoreTag}>
                      {score.name}: {Number(score.value ?? 0).toFixed(2)} <MessageCircle size={12} />
                    </span>
                  ))}
                </div>
              )}
              {/* --- ✨ 수정 끝 --- */}

            </div>
          </div>
          <ul className={styles.nodeChildren}>
            {rootObservations.map((obs) => (
              <ObservationNode
                key={obs.id}
                node={obs}
                allNodes={filteredObservations} // 필터링된 데이터 사용
                level={1}
                selectedId={selectedObservationId}
                onSelect={handleSelect}
                fullTraceDetails={details} // ✨ prop 전달
                
              />
            ))}
          </ul>
        </li>
      </ul>
    );
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.headerControls}>
          <button className={styles.controlButton}><SlidersHorizontal size={14} /></button>
          <button className={styles.controlButton}><Download size={14} /></button>
        </div>
        <div className={styles.headerToggle}>
          <input
            type="checkbox"
            id="timelineToggle"
            className={styles.toggleSwitch}
            checked={isTimelineVisible}
            onChange={() => setIsTimelineVisible(!isTimelineVisible)}
          />
          <label htmlFor="timelineToggle" className={styles.toggleLabel}></label>
          <span>Timeline</span>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default TraceTimeline;
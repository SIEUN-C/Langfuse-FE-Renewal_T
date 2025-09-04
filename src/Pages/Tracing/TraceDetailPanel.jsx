// src/Pages/Tracing/TraceDetailPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize, Minimize, HardDrive } from 'lucide-react';
import { fetchTraceDetails } from './TraceDetailApi';
import { fetchObservationDetails } from './Observations/ObservationDetailApi';
import styles from './TraceDetailPanel.module.css';
import TraceDetailView from './TraceDetailView';
import TraceTimeline from './TraceTimeline';



// ---------- 공통 정규화 유틸 ----------
const looksLikeMessages = (arr) =>
  Array.isArray(arr) &&
  arr.length > 0 &&
  arr.every(m => m && typeof m === 'object' && 'role' in m && 'content' in m);

const pick = (...xs) => xs.find(v => v !== undefined && v !== null);

const parseMaybeJSON = (v) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { }
  }
  return v;
};

const toText = (c) => {
  if (c == null) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(toText).join('');
  if (typeof c === 'object') return c.text ?? c.content ?? JSON.stringify(c);
  return String(c);
};

// ✅ 숫자 안전 변환
const n = (v) => (typeof v === 'number' ? v : Number(v) || 0);

// ✅ 한 노드에서 usage/cost 후보 읽기
const readUsageFromNode = (o = {}) => {
  const u = o.usageDetails || o.usage || {};
  const t = o.tokens || {};
  const input = n(pick(u.input, o.inputUsage, u.promptTokens, o.promptTokens, t.input, t.prompt));
  const output = n(pick(u.output, o.outputUsage, u.completionTokens, o.completionTokens, t.output, t.completion));
  const total = n(pick(u.total, o.totalUsage, o.totalTokens, t.total, input + output));
  const cost = n(pick(o.totalPrice, o.totalCost, o.costDetails?.total, o.cost));
  return { input, output, total, cost };
};

// ✅ 트리 전체(children/observations/tree 등)를 합산
const sumUsageDeep = (root) => {
  const acc = { input: 0, output: 0, total: 0, cost: 0 };
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    const u = readUsageFromNode(node);
    acc.input += u.input;
    acc.output += u.output;
    acc.total += u.total;
    acc.cost += u.cost;

    const kids =
      node.children ||
      node.observations ||
      node.nodes ||
      node.tree ||
      [];

    if (Array.isArray(kids)) kids.forEach(visit);
    else if (kids && typeof kids === 'object') Object.values(kids).forEach(visit);
  };
  visit(root);
  return acc;
};

// Trace/Observation 공통 정규화
function normalizeForDetailView(d) {
  if (!d || typeof d !== 'object') return d;


  // 문자열일 수도 있는 후보들을 미리 파싱
  const inputParsed = parseMaybeJSON(d.input);
  const inputTextParsed = parseMaybeJSON(d.inputText);
  const promptParsed = parseMaybeJSON(d.prompt);


  // 1) messages 후보 추출 (여러 위치 중 첫 번째)
  const messages =
    (looksLikeMessages(d.messages) && d.messages)
    || (looksLikeMessages(d.input?.messages) && d.input.messages)
    || (looksLikeMessages(inputParsed) && inputParsed)
    || (looksLikeMessages(inputTextParsed) && inputTextParsed)
    || (looksLikeMessages(promptParsed) && promptParsed)
    || null;

  // 2) 사람이 읽기 쉬운 input 프리뷰 (messages가 있으면 프리뷰 문자열만)
  const inputPreview = messages
    ? messages.map(m => `${m.role}: ${toText(m.content)}`).join('\n')
    : pick(
      looksLikeMessages(inputParsed) ? null : d.input,
      looksLikeMessages(inputTextParsed) ? null : d.inputText,
      looksLikeMessages(promptParsed) ? null : d.prompt,
      d.metadata?.input,
      d.usageDetails?.input
    );

  // 3) output 가공
  const output = pick(
    d.output,
    d.outputText,
    d.completion,
    typeof d.response === 'string' ? d.response : d.response ? JSON.stringify(d.response) : null,
    d.metadata?.output,
    d.usageDetails?.output
  );


  // 4) usage/cost 가공
  const { input: inTok0, output: outTok0, total: totTok0, cost: cost0 } = readUsageFromNode(d);

  // 루트에 값이 없으면 트리 합산으로 보강
  const needSum = (inTok0 + outTok0 + totTok0) === 0;
  const summed = needSum ? sumUsageDeep(d) : { input: 0, output: 0, total: 0, cost: 0 };

  const inTok = needSum ? summed.input : inTok0;
  const outTok = needSum ? summed.output : outTok0;
  const totTok = needSum ? summed.total : (totTok0 || (inTok0 + outTok0));
  const totalPrice = pick(cost0, needSum ? summed.cost : null, d.totalPrice, d.totalCost, d.costDetails?.total) ?? null;


  return {
    ...d,
    input: inputPreview,
    output,
    usage: { input: inTok, output: outTok, total: totTok },
    totalPrice,
    // ✨ 이게 핵심: TraceDetailView가 Preview( System/User/Assistant )로 렌더
    messages: messages || undefined,
  };
}



const TraceDetailPanel = ({ trace, onClose }) => {
  const [traceDetails, setTraceDetails] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [selectedObservation, setSelectedObservation] = useState(null); // {id, traceId, projectId}
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const panelRef = useRef(null);

  // Trace 기본 정보 로드 (변경 없음)
  useEffect(() => {
    if (!trace.id) return;
    const loadTrace = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const raw = await fetchTraceDetails(trace.id);
        const norm = normalizeForDetailView(raw);
        setTraceDetails(norm);
        setViewData(norm);
      } catch (err) {
        setError("Trace 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTrace();
  }, [trace.id]);

  // Observation 상세 정보 로드 (변경 없음)
  useEffect(() => {
    const loadObservation = async () => {
      if (!selectedObservation) {
        setViewData(traceDetails);
        return;
      }
      setIsLoading(true);
      try {
        const raw = await fetchObservationDetails({
          observationId: selectedObservation.id,
          traceId: selectedObservation.traceId,
          projectId: selectedObservation.projectId,
          truncated: false,
        });
        setViewData(normalizeForDetailView(raw));
      } catch (err) {
        setError("Observation 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadObservation();
  }, [selectedObservation, traceDetails]);

  const handleObservationSelect = useCallback((obs) => {
    // obs가 문자열(id)만 올 수도, 객체로 올 수도 있다고 보고 안전하게 처리
    if (!obs) return setSelectedObservation(null);
    if (typeof obs === 'string') {
      // traceId, projectId는 상위에서 보유한 값으로 보완
      setSelectedObservation({
        id: obs,
        traceId: trace.id,                       // 상위 prop의 trace.id
        projectId: (traceDetails && traceDetails.projectId) || trace.projectId,
      });
    } else {
      setSelectedObservation({
        id: obs.id,
        traceId: obs.traceId ?? trace.id,
        projectId: obs.projectId ?? (traceDetails && traceDetails.projectId) ?? trace.projectId,
      });
    }
  }, [trace.id, trace.projectId, traceDetails]);


  // ✅ 외부 클릭 감지 로직 수정
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 1. 패널 DOM 요소가 존재하고,
      // 2. 클릭된 지점이 패널 내부에 있지 않으며,
      // 3. 클릭된 지점이 다른 모달이나 패널의 일부가 아닌 경우에만 닫기
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !event.target.closest('[data-is-portal]') // data-is-portal 속성을 가진 부모가 없는 경우
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className={`${styles.panel} ${isMaximized ? styles.maximized : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.tracePill}>
            <HardDrive size={14} />
            <span>Trace</span>
          </div>
          <span className={styles.traceId}>{trace.id}</span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.iconButton}
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button className={styles.iconButton} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.timelineSection}>
          <TraceTimeline details={traceDetails} onObservationSelect={handleObservationSelect} />
        </div>
        <div className={styles.detailSection}>
          <TraceDetailView details={viewData} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
};

export default TraceDetailPanel;
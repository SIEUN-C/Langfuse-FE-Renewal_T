/*
  수정: 파일 전체를 아래 코드로 교체합니다.
  - 주석: Trace 에 포함된 모든 하위 단계(Observation)의 토큰 사용량을
    재귀적으로 합산하는 로직을 추가하여, 총 사용량이 0으로 표시되던 문제를 해결합니다.
    (기존 TraceDetailPanel.jsx의 정규화 로직을 그대로 가져와 적용)
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { fetchTraceDetails } from './services/TraceDetailApi';
import { fetchObservationDetails } from './services/ObservationDetailApi';
import TraceDetailView from './components/TraceDetailView';
import TraceTimeline from './components/TraceTimeline';
import styles from './components/TraceDetailPanel.module.css';

// --- ✨ 추가: 토큰 사용량(usage) 계산을 위한 헬퍼 함수들 ---
const pick = (...xs) => xs.find(v => v !== undefined && v !== null);
const n = (v) => (typeof v === 'number' ? v : Number(v) || 0);

const readUsageFromNode = (o = {}) => {
  const u = o.usageDetails || o.usage || {};
  const t = o.tokens || {};
  const input = n(pick(u.input, o.inputUsage, u.promptTokens, o.promptTokens, t.input, t.prompt));
  const output = n(pick(u.output, o.outputUsage, u.completionTokens, o.completionTokens, t.output, t.completion));
  const total = n(pick(u.total, o.totalUsage, o.totalTokens, t.total, input + output));
  const cost = n(pick(o.totalPrice, o.totalCost, o.costDetails?.total, o.cost));
  return { input, output, total, cost };
};

const sumUsageDeep = (root) => {
  const acc = { input: 0, output: 0, total: 0, cost: 0 };
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    const u = readUsageFromNode(node);
    acc.input += u.input;
    acc.output += u.output;
    acc.total += u.total;
    acc.cost += u.cost;
    const kids = node.children || node.observations || node.nodes || node.tree || [];
    if (Array.isArray(kids)) kids.forEach(visit);
    else if (kids && typeof kids === 'object') Object.values(kids).forEach(visit);
  };
  visit(root);
  return acc;
};

const looksLikeMessages = (arr) => Array.isArray(arr) && arr.length > 0 && arr.every(m => m && typeof m === 'object' && 'role' in m && 'content' in m);
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
// -------------------------------------------------------------------

// --- ✨ 수정: 토큰 사용량 계산 로직이 포함된 버전으로 교체 ---
function normalizeForDetailView(d) {
  if (!d || typeof d !== 'object') return d;

  const inputParsed = parseMaybeJSON(d.input);
  const messages = (looksLikeMessages(d.messages) && d.messages) || (looksLikeMessages(d.input?.messages) && d.input.messages) || (looksLikeMessages(inputParsed) && inputParsed) || null;
  const inputPreview = messages ? messages.map(m => `${m.role}: ${toText(m.content)}`).join('\n') : pick(looksLikeMessages(inputParsed) ? null : d.input, d.prompt);
  const output = pick(d.output, d.completion);
  
  const { input: inTok0, output: outTok0, total: totTok0, cost: cost0 } = readUsageFromNode(d);
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
    messages: messages || undefined,
  };
}
// -------------------------------------------------------------

const TraceDetailPage = () => {
  const { projectId, traceId } = useParams();

  const [traceDetails, setTraceDetails] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!traceId) return;
    const loadTrace = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const raw = await fetchTraceDetails(traceId);
        const norm = normalizeForDetailView(raw); // ✨ 이제 이 함수가 올바르게 사용량을 계산합니다.
        setTraceDetails(norm);
        setViewData(norm);
      } catch (err) {
        setError("Trace 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTrace();
  }, [traceId]);

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
          projectId: projectId, 
        });
        setViewData(normalizeForDetailView(raw));
      } catch (err) {
        setError("Observation 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadObservation();
  }, [selectedObservation, traceDetails, projectId, traceId]);

  const handleObservationSelect = useCallback((obs) => {
    if (!obs) {
      setSelectedObservation(null);
      return;
    }
    setSelectedObservation({
      id: obs.id,
      traceId: obs.traceId ?? traceId,
    });
  }, [traceId]);

  return (
    <div className={styles.panelBody} style={{ height: 'calc(100vh - 60px)' }}>
      <div className={styles.timelineSection}>
        <TraceTimeline details={traceDetails} onObservationSelect={handleObservationSelect} />
      </div>
      <div className={styles.detailSection}>
        <TraceDetailView details={viewData} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
};

export default TraceDetailPage;
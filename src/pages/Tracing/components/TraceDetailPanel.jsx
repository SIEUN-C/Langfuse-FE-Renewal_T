// src/Pages/Tracing/TraceDetailPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize, Minimize, HardDrive } from 'lucide-react';
import { fetchTraceDetails } from '../services/TraceDetailApi.js';
import { fetchObservationDetails } from '../services/ObservationDetailApi.js';
import styles from './TraceDetailPanel.module.css';
import TraceDetailView from './TraceDetailView.jsx';
import TraceTimeline from './TraceTimeline.jsx';
import { ChatMlArraySchema } from '../utils/chatml.schema.js';
import { parseMaybeJSONDeep, decodeUnicodeLiterals } from '../utils/json.js'


// ---------- 공통 정규화 유틸 ----------
const looksLikeMessages = (arr) =>
  Array.isArray(arr) &&
  arr.length > 0 &&
  arr.every(m => m && typeof m === 'object' && 'role' in m && 'content' in m);

const pick = (...xs) => xs.find(v => v !== undefined && v !== null);

const parseMaybeJSON = (v) => {
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { } }
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


function coerceMessages({ input, inputText, prompt, metadata, output, type, model, name }) {
  const inParsed = parseMaybeJSONDeep(input);
  const inTextParsed = parseMaybeJSONDeep(inputText);
  const promptParsed = parseMaybeJSONDeep(prompt);
  const metaParsed = parseMaybeJSONDeep(metadata);
  const outParsed = parseMaybeJSONDeep(output);


  // 어떤 스텝이 LLM 생성 단계인지, 아니면 도구/파서 단계인지 대략 판단
  const stepType = String(type || '').toUpperCase();
  const isGeneration = stepType === 'GENERATION';
  const isToolish =
    stepType === 'SPAN' ||
    /(parser|retriever|tool|workflow|chain|http|sql|db|cache|search|stroutput|jsonoutput)/i.test(
      String(name || '')
    );
  const looksLLMByModel = /gpt|openai|anthropic|mistral|llama|gemini|claude|cohere|vertex|azure/i.test(
    `${model || ''} ${name || ''}`
  );
  const isLikelyLLM = isGeneration || (looksLLMByModel && !isToolish);


  const tryAsArray = (x) => ChatMlArraySchema.safeParse(x).success ? x : null;
  const tryObjMsgs = (x) => (x && Array.isArray(x.messages) && ChatMlArraySchema.safeParse(x.messages).success) ? x.messages : null;

  let inMsgs =
    tryAsArray(inParsed) || tryObjMsgs(inParsed)
    || tryAsArray(inTextParsed) || tryObjMsgs(inTextParsed)
    || tryAsArray(promptParsed) || tryObjMsgs(promptParsed)
    || tryAsArray(metaParsed) || tryObjMsgs(metaParsed)
    || null;

  // 입력에서 messages가 하나도 없을 때,
  // - LLM 단계가 아니면(messages 모드로 강제 X) → 그대로 Input/Output로 보이게 return undefined
  if (!inMsgs || inMsgs.length === 0) {
    if (!isLikelyLLM) return undefined;
  }

  // LLM 단계로 판단된 경우에만 assistant 메시지를 붙여준다
  let assistantMsg = null;
  if (isLikelyLLM) {

    const pickContent = (o) =>
      (o && typeof o === 'object')
        ? (o.content ?? o.message ?? o.text ?? o.completion ?? o.output ?? null)
        : null;


    if (outParsed && typeof outParsed === 'object') {
      const c = pickContent(outParsed);
      assistantMsg = { role: 'assistant', content: (c != null ? c : JSON.stringify(outParsed)) };
    } else if (typeof outParsed === 'string') {
      assistantMsg = { role: 'assistant', content: outParsed };
    } else if (typeof output === 'string') {
      const maybe = parseMaybeJSONDeep(output);
      const c = pickContent(maybe);
      assistantMsg = { role: 'assistant', content: (typeof maybe === 'string' ? maybe : (c ?? JSON.stringify(maybe))) };
    }


  }

  const base = inMsgs || [];
  const messages = assistantMsg ? [...base, assistantMsg] : base;

  const ok = ChatMlArraySchema.safeParse(messages);

  return ok.success && messages.length ? ok.data : undefined;
}

function normalizeForDetailView(d) {
  if (!d || typeof d !== 'object') return d;

  // 메타/태그/플레이스홀더 후보 미리 파싱
  const metaObj = parseMaybeJSONDeep(d.metadata);
  const tagsNormalized =
    (Array.isArray(d.tags) ? d.tags
      : parseMaybeJSONDeep(d.tags))      // 문자열로 온 tags도 허용
    ?? metaObj?.tags                 // metadata.tags에도 있을 수 있음
    ?? null;

  // 프롬프트 템플릿 치환 변수/플레이스홀더 후보 (이름이 프로젝트마다 다를 수 있음)
  const placeholders =
    metaObj?.placeholders
    ?? metaObj?.vars
    ?? metaObj?.variables
    ?? metaObj?.inputVariables
    ?? metaObj?.inputs
    ?? null;

  const messages = coerceMessages({
    input: d.input,
    inputText: d.inputText,
    prompt: d.prompt,
    metadata: d.metadata,
    output: d.output,
    type: d.type,
    model: d.model,
    name: d.name,
  });

  // 사람이 읽기 쉬운 input 프리뷰
  const inputPreview = messages
    ? messages.map(m => `${m.role}: ${toText(m.content)}`).join('\n')
    : pick(d.input, d.inputText, d.prompt, d.metadata?.input, d.usageDetails?.input);

  // output 후보 (필요시 유지)
  const output = pick(
    d.output,
    d.outputText,
    d.completion,
    typeof d.response === 'string' ? d.response : d.response ? JSON.stringify(d.response) : null,
    d.metadata?.output,
    d.usageDetails?.output
  );

  // usage/cost 합산(네 로직 그대로)
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
    messages, // ← TraceDetailView가 이걸로 System/User/Assistant 렌더
    tags: tagsNormalized,       // ← TraceDetailView에서 "Path" 카드로 사용
    placeholders,               // ← TraceDetailView에서 "Placeholders" 카드로 사용
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
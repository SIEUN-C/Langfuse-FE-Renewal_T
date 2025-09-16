// src/Pages/Tracing/TraceDetailView.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom'; // ReactDOM을 import 합니다.
import styles from './TraceDetailView.module.css';
import { Copy, List, Clipboard, Plus, SquarePen, ChevronDown, MessageCircle, Info } from 'lucide-react';
import Toast from '../../../components/Toast/Toast.jsx';
import SidePanel from '../../../components/SidePanel/SidePanel.jsx';
import Comments from '../../../components/Comments/Comments.jsx';
import AddToDatasetModal from '../../../components/AddToDatasetModal/AddToDatasetModal.jsx';
import { useComments } from '../../../hooks/useComments.js';
import UsageBreakdown from './UsageBreakdown.jsx';
import { parseMaybeJSONDeep, decodeUnicodeLiterals } from '../utils/json.js'



// 메시지 content를 텍스트로 안전하게 변환
const toText = (content) => {
  if (content == null) return '';
  if (typeof content === 'string') return decodeUnicodeLiterals(content);
  if (Array.isArray(content)) return content.map(toText).join('');
  if (typeof content === 'object') {
    const raw = content.text ?? content.content ?? JSON.stringify(content);
    return typeof raw === 'string' ? decodeUnicodeLiterals(raw) : String(raw);
  }
  return String(content);
};

// 특정 role의 메시지들을 합쳐 한 덩어리 텍스트로
const extractRoleText = (messages, role) => {
  if (!Array.isArray(messages)) return '';
  return messages
    .filter(m => (m?.role || '').toLowerCase() === role)
    .map(m => toText(m.content))
    .filter(Boolean)
    .join('\n\n');
};

// 값이 있는지 판단
const hasContent = (v) => {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
};

// 객체를 "path -> value" 로 평탄화
const flatten = (obj, prefix = '') => {
  const rows = [];
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      const p = prefix ? `${prefix}.${i}` : `${i}`;
      if (v && typeof v === 'object') rows.push(...flatten(v, p));
      else rows.push([p, v]);
    });
    return rows;
  }
  if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') rows.push(...flatten(v, p));
      else rows.push([p, v]);
    });
    return rows;
  }
  return [[prefix || '', obj]];
};

const FormattedTable = ({ data }) => {
  if (!data || typeof data !== 'object') return <pre>{String(data ?? 'null')}</pre>;
  const rows = flatten(data);
  if (rows.length === 0) return <p className={styles.noDataText}>Empty object</p>;
  return (
    <table className={styles.formattedTable}>
      <thead>
        <tr><th>Path</th><th>Value</th></tr>
      </thead>
      <tbody>
        {rows.map(([path, value], idx) => (
          <tr key={idx}>
            <td className={styles.pathCell}>{path}</td>
            <td className={styles.valueCell}>
              {typeof value === 'string' ? value : String(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// 문자열(예: "{\"tags\":[...]}" )이면 JSON 파싱, 실패하면 원본을 반환
const parseMaybeJSON = (v) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { /* noop */ }
  }
  return v;
};

// 3000처럼 계층형 Path/Value 테이블 렌더
const MetaTable = ({ data }) => {
  const obj = parseMaybeJSONDeep(data);
  if (!obj || typeof obj !== 'object') return <pre>{String(obj ?? 'null')}</pre>;

  // 계층적으로 펼쳐서 테이블 행을 만든다
  const rows = [];
  const walk = (value, key, level = 0) => {
    const isObj = value && typeof value === 'object';
    const display =
      isObj
        ? (Array.isArray(value) ? JSON.stringify(value) : '') // 부모 행엔 요약만
        : (typeof value === 'string' ? value : String(value));

    // 현재 키를 한 줄로 넣고
    rows.push({ key, value: display, level });

    // 자식들을 들여쓰기 한 줄씩 추가
    if (isObj) {
      if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, String(i), level + 1));
      } else {
        Object.entries(value).forEach(([k, v]) => walk(v, k, level + 1));
      }
    }
  };

  Object.entries(obj).forEach(([k, v]) => walk(v, k, 0));
  if (rows.length === 0) return <p className={styles.noDataText}>Empty object</p>;

  return (
    <table className={styles.formattedTable}>
      <thead>
        <tr><th>Path</th><th>Value</th></tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td className={styles.pathCell} style={{ paddingLeft: `${r.level * 16}px` }}>{r.key}</td>
            <td className={styles.valueCell}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};


// 메인 TraceDetailView 컴포넌트
const TraceDetailView = ({ details, isLoading, error }) => {
  const [viewFormat, setViewFormat] = useState('Formatted');
  const [toastInfo, setToastInfo] = useState({ isVisible: false, message: '' });
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // 툴팁 관련 상태는 그대로 유지
  const [usageTooltip, setUsageTooltip] = useState({ visible: false, style: {}, data: null });
  // usagePillRef는 더 이상 필요 없으므로 삭제합니다.

  const isObservation = details && 'type' in details && 'traceId' in details;
  const objectType = isObservation ? 'OBSERVATION' : 'TRACE';
  const projectId = details?.projectId;

  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    addComment,
    removeComment,
  } = useComments(projectId, objectType, details?.id);

  // 버튼에 표시할 댓글 수 (최대 99+ 표기)
  const commentCount = Array.isArray(comments) ? comments.length : 0;
  const commentCountLabel = commentCount > 99 ? '99+' : String(commentCount);

  const handleAddComment = async (content) => {
    const result = await addComment(content);
    if (result.success) {
      setToastInfo({ isVisible: true, message: '댓글이 추가되었습니다.' });
    } else {
      alert(`오류: ${result.error}`);
    }
    return result;
  };

  const handleDeleteComment = async (commentId) => {
    const result = await removeComment(commentId);
    if (result.success) {
      setToastInfo({ isVisible: true, message: '댓글이 삭제되었습니다.' });
    } else {
      alert(`오류: ${result.error}`);
    }
    return result;
  };

  const handleCopy = (text, type) => {
    const textToCopy = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setToastInfo({ isVisible: true, message: `${type}이(가) 클립보드에 복사되었습니다.` });
      })
      .catch(err => {
        console.error("복사에 실패했습니다.", err);
        setToastInfo({ isVisible: true, message: '복사에 실패했습니다.' });
      });
  };

  // --- 툴팁 표시 핸들러 수정 ---
  const handleUsageMouseEnter = (event, usageData) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setUsageTooltip({
      visible: true,
      style: {
        // 버튼의 아래쪽(bottom)을 기준으로 top 위치 설정 + 약간의 여백(8px)
        top: `${rect.bottom + 8}px`,
        // 버튼의 가로 중앙에 위치하도록 left와 transform 설정
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        opacity: 1,
      },
      data: usageData,
    });
  };


  // --- 툴팁 숨김 핸들러 수정 ---
  const handleUsageMouseLeave = () => {
    setUsageTooltip(prev => ({ ...prev, visible: false, style: { ...prev.style, opacity: 0 } }));
  };

  const renderFormattedContent = (data) => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return <FormattedTable data={data} />;
    }
    return <pre>{String(data ?? 'null')}</pre>;
  };

  const renderContent = (title, data, type = 'default') => {
    const cardStyle = type === 'output' ? styles.outputCard : '';
    return (
      <div className={`${styles.contentCard} ${cardStyle}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <button className={styles.copyButton} onClick={() => handleCopy(data, title)} title="Copy content">
            <Copy size={14} />
          </button>
        </div>
        <div className={styles.cardBody}>
          {viewFormat === 'JSON'
            ? (typeof data === 'string' ? <pre>{data}</pre> : <pre>{JSON.stringify(data, null, 2)}</pre>)
            : renderFormattedContent(data)}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className={styles.body}>Loading details...</div>;
  if (error) return <div className={styles.body} style={{ color: 'red' }}>{error}</div>;
  if (!details) return <div className={styles.body}>No details available.</div>;

  const metadataRaw = details.metadata ?? null;
  const metadata = parseMaybeJSONDeep(metadataRaw);
  const hasMetadata = metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0;

  // Path 카드에 쓸 데이터(tags를 “path”처럼 보여줌)
  const pathData = (() => {
    if (!details?.tags) return null;
    if (Array.isArray(details.tags)) return { tags: details.tags };
    const t = parseMaybeJSONDeep(details.tags);
    if (Array.isArray(t)) return { tags: t };
    if (t && typeof t === 'object') return t; // 이미 객체면 그대로
    return null;
  })();

  // Placeholder 카드에 쓸 데이터
  const placeholdersData = details?.placeholders ?? null;


  const name = details.name ?? 'N/A';
  const id = details.id;

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toISOString().replace('T', ' ').substring(0, 23);
  };

  const formatUsage = (usage) => {
    if (!usage || (usage.input == null && usage.output == null)) return null;
    const input = usage.input ?? 0;
    const output = usage.output ?? 0;
    const total = usage.total ?? (input + output);
    return `${input} → ${output} (∑ ${total})`;
  };

  return (
    <div className={styles.body}>
      <Toast
        message={toastInfo.message}
        isVisible={toastInfo.isVisible}
        onClose={() => setToastInfo({ isVisible: false, message: '' })}
      />

      {/* ▼▼▼ 툴팁을 Portal을 사용해 렌더링하도록 수정 ▼▼▼ */}
      {usageTooltip.visible && ReactDOM.createPortal(
        <UsageBreakdown usage={usageTooltip.data} style={usageTooltip.style} />,
        document.body
      )}

      <div className={styles.infoBar}>
        <div className={styles.infoBarTop}>
          <div className={styles.infoBarTitle}>
            <List size={20} />
            <h2 className={styles.traceName}>{name}</h2>
            <button
              className={styles.idButton}
              title="Copy ID"
              onClick={() => handleCopy(id, 'ID')}
            >
              <Clipboard size={12} /> ID
            </button>
          </div>
          <div className={styles.infoBarActions}>
            {isObservation ? (
              <div className={styles.annotateButton}>
                <button>Playground</button>
                <div className={styles.annotateButtonChevron}>
                  <ChevronDown size={16} />
                </div>
              </div>
            ) : (
              <button
                className={styles.actionButton}
                onClick={() => setIsDatasetModalOpen(true)}
              >
                <Plus size={14} /> Add to datasets
              </button>
            )}

            <button
              className={`${styles.iconButton} ${styles.actionButtonSecondary} ${styles.commentButton}`}
              onClick={() => setIsCommentsOpen(true)}
              aria-label={`Open comments${commentCount ? `, ${commentCount} items` : ''}`}
              title={`Comments${commentCount ? ` (${commentCountLabel})` : ''}`}
            >
              <MessageCircle size={16} />
              {commentCount > 0 && (
                <span className={styles.commentBadge}>{commentCountLabel}</span>
              )}
            </button>

          </div>
        </div>
        <div className={styles.infoBarBottom}>
          <span className={styles.timestamp}>
            {formatTimestamp(isObservation ? details.startTime : details.timestamp)}
          </span>
          {isObservation ? (
            <>
              <div className={styles.pills}>
                {details.latency != null && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>
                    Latency: {details.latency.toFixed(2)}s
                  </div>
                )}
                <div className={`${styles.pill} ${styles.pillDark}`}>
                  Env: {details.environment ?? 'default'}
                </div>
              </div>

              <div className={styles.costBar}>
                {details.totalPrice != null && (
                  <div className={styles.costPill}>
                    ${details.totalPrice.toFixed(6)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
                {/* ▼▼▼ onMouseEnter 핸들러에 event 객체(e) 전달 ▼▼▼ */}
                {details.usage && formatUsage(details.usage) && (
                  <div
                    className={styles.costPill}
                    onMouseEnter={(e) => handleUsageMouseEnter(e, details.usage)}
                    onMouseLeave={handleUsageMouseLeave}
                  >
                    {formatUsage(details.usage)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
              </div>

              <div className={styles.pills}>
                {details.model && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>{details.model}</div>
                )}
                {details.modelParameters && Object.entries(details.modelParameters).map(([key, value]) => (
                  <div key={key} className={`${styles.pill} ${styles.pillDark}`}>
                    {key}: {String(value)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.pills}>
                {details.sessionId && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>
                    Session: {details.sessionId}
                  </div>
                )}
                {details.userId && (
                  <div className={`${styles.pill} ${styles.pillUser}`}>
                    User ID: {details.userId}
                  </div>
                )}
                <div className={`${styles.pill} ${styles.pillDark}`}>
                  Env: {details.environment ?? 'default'}
                </div>
                {details.latency != null && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>
                    Latency: {details.latency.toFixed(2)}s
                  </div>
                )}
              </div>
              <div className={styles.costBar}>
                {details.cost != null && (
                  <div className={styles.costPill}>
                    Total Cost: ${details.cost.toFixed(6)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
                {/* ▼▼▼ onMouseEnter 핸들러에 event 객체(e) 전달 ▼▼▼ */}
                {details.usage && formatUsage(details.usage) && (
                  <div
                    className={styles.costPill}
                    onMouseEnter={(e) => handleUsageMouseEnter(e, details.usage)}
                    onMouseLeave={handleUsageMouseLeave}
                  >
                    {formatUsage(details.usage)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.formatToggle}>
        <button
          className={`${styles.toggleButton} ${viewFormat === 'Formatted' ? styles.active : ''}`}
          onClick={() => setViewFormat('Formatted')}
        >
          Formatted
        </button>
        <button
          className={`${styles.toggleButton} ${viewFormat === 'JSON' ? styles.active : ''}`}
          onClick={() => setViewFormat('JSON')}
        >
          JSON
        </button>
      </div>

      {Array.isArray(details.messages) ? (
        viewFormat === 'JSON' ? (
          <>
            <h3 className={styles.previewTitle}>Preview</h3>
            {/* JSON 모드: messages/출력의 “원본 구조” 그대로 */}
            {renderContent("Input", details.messages)}
            {renderContent(
              "Output",
              (() => {
                // 1) details.output이 JSON-string/object면 파싱해서 사용
                const out = parseMaybeJSONDeep(details.output);
                if (out != null) {
                  return typeof out === 'string' ? { content: out } : out;
                }
                // 2) 없으면 messages 안의 마지막 assistant 객체를 그대로
                const lastAssistant = [...details.messages].reverse()
                  .find(m => (m?.role || '').toLowerCase() === 'assistant');
                // 그래도 없으면 빈 문자열 방지
                return lastAssistant ?? { content: '', role: 'assistant' };
              })(),
              'output'
            )}
          </>
        ) : (
          <>
            <h3 className={styles.previewTitle}>Preview</h3>
            {/* Formatted 모드: 역할별로 사람이 읽기 좋게 */}
            {(() => {
              const sysText = extractRoleText(details.messages, 'system');
              const userText = extractRoleText(details.messages, 'user');
              const asstText = (() => {
                const fromMsgs = extractRoleText(details.messages, 'assistant');
                if (hasContent(fromMsgs)) return fromMsgs;
                if (typeof details.output === 'string') {
                  try {
                    const o = JSON.parse(details.output);
                    if (o && typeof o === 'object') return toText(o.content ?? o);
                  } catch { }
                  return details.output;
                }
                return toText(details.output);
              })();

              return (
                <>
                  {hasContent(sysText) && renderContent("System", sysText)}
                  {hasContent(userText) && renderContent("User", userText)}
                  {hasContent(asstText) && renderContent("Assistant", asstText, 'output')}
                </>
              );
            })()}
          </>
        )
      ) : (
        <>
          {/* messages가 없으면 기존 방식 유지 */}
          {renderContent("Input", details.input, 'input')}
          {renderContent("Output", details.output, 'output')}
        </>
      )}


      {/* 3000처럼 Path / Placeholders 카드 추가 (값이 있을 때만) */}
      {hasContent(pathData) && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Path</h3>
          </div>
          <div className={styles.cardBody}>
            {viewFormat === 'JSON'
              ? <pre>{JSON.stringify(pathData, null, 2)}</pre>
              : <MetaTable data={pathData} />}
          </div>
        </div>
      )}

      {hasContent(placeholdersData) && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Placeholders</h3>
          </div>
          <div className={styles.cardBody}>
            {viewFormat === 'JSON'
              ? <pre>{JSON.stringify(placeholdersData, null, 2)}</pre>
              : (typeof placeholdersData === 'object'
                ? <FormattedTable data={placeholdersData} />
                : <pre>{String(placeholdersData)}</pre>)}
          </div>
        </div>
      )}



      {isObservation &&
        details.modelParameters &&
        Object.keys(details.modelParameters || {}).length > 0 &&
        renderContent("Model Parameters", details.modelParameters)}
      <div className={styles.contentCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Metadata</h3>
        </div>
        <div className={styles.cardBody}>
          {hasMetadata
            ? (viewFormat === 'JSON'
              ? <pre>{JSON.stringify(metadata, null, 2)}</pre>
              : <MetaTable data={metadata} />)
            : (typeof metadataRaw === 'string' && metadataRaw.trim()
              ? <pre>{metadataRaw}</pre> // 파싱 실패한 ‘문자열 메타’는 원문 노출
              : <p className={styles.noDataText}>No metadata available.</p>)}
        </div>
      </div>

      <SidePanel
        title="Comments"
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      >
        <Comments
          comments={comments}
          isLoading={isCommentsLoading}
          error={commentsError}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      </SidePanel>

      <AddToDatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        input={details?.input}
        output={details?.output}
        metadata={details?.metadata}
      />
    </div>
  );
};

export default TraceDetailView;
// /src/Pages/Tracing/services/TracingTrpcApi.js
/**
 * Tracing 전용 tRPC 도메인 API
 * ----------------------------------------------------------
 * Tracing 화면에서 "원본이 tRPC"인 엔드포인트만 이 파일로 모은다.
 * (목록/상세/관측치는 Langfuse SDK(REST)로 처리하고,
 *  그래프/복합조회 등 tRPC만 존재하는 것들을 여기서 호출)
 */

import { trpcQuery } from '../../../services/trpc.client';

/**
 * Agent Graph 데이터 (원본: traces.getAgentGraphData)
 * @param {string} traceId
 * @returns {Promise<any>} 그래프 JSON(노드/엣지 등)
 */
export async function fetchAgentGraph(traceId, opts = {}) {
    if (!traceId) return null;
    return trpcQuery('traces.getAgentGraphData', { traceId }, opts);
}

/**
 * Trace + Observations + Scores 번들 (원본: traces.byIdWithObservationsAndScores)
 *  - SDK로 trace/observations를 각각 불러와 합칠 수도 있으나,
 *    원본과 동일 동작을 원하면 이 tRPC 호출을 사용.
 */
export async function fetchTraceBundle(traceId, opts = {}) {
    if (!traceId) return null;
    return trpcQuery('traces.byIdWithObservationsAndScores', { traceId }, opts);
}

/**
 * (선택) 댓글/미디어 등 부가 데이터가 tRPC로만 제공된다면 여기에 추가
 * 예시:
 * export function getCommentCountByObjectType({ objectType, objectId }, opts) {
 *   return trpcQuery('comments.getCountByObjectType', { objectType, objectId }, opts);
 * }
 *
 * export function getMediaByTraceOrObservationId({ traceId, observationId }, opts) {
 *   return trpcQuery('media.getByTraceOrObservationId', { traceId, observationId }, opts);
 * }
 */

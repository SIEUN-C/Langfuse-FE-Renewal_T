// src/pages/Tracing/TracingApi.js
import { langfuse } from 'lib/langfuse';
import axios from 'axios';

/**
 * API 응답 값을 UI에 표시하기 안전한 문자열로 변환합니다.
 * @param {*} value 변환할 값
 * @returns {string}
 */
const formatTraceValue = (value) => {
  if (value === null || typeof value === 'undefined') {
    return 'N/A';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Langfuse API에서 트레이스 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>}
 */
export const fetchTraces = async () => {
  try {
    const response = await langfuse.api.traceList({});
    const apiResponse = response;

    return apiResponse.data.map(trace => ({
      id: trace.id,
      // [수정됨] toLocaleString()을 제거하고, 파싱하기 쉬운 원본 ISO 형식의 timestamp를 그대로 전달합니다.
      // 이것이 "내 컴퓨터에선 되는데" 문제의 핵심 원인이었습니다.
      timestamp: trace.timestamp,
      name: trace.name ?? 'N/A',
      input: formatTraceValue(trace.input),
      output: formatTraceValue(trace.output),
      sessionId: trace.sessionId ?? 'N/A',
      userId: trace.userId ?? 'N/A',
      release: trace.release ?? 'N/A',
      version: trace.version ?? 'N/A',
      tags: trace.tags ?? [],
      isFavorited: false,
      observations: Array.isArray(trace.observations) ? trace.observations.length : 0,
      env: trace.environment ?? 'default',
      latency: trace.latency ?? 0,
      cost: trace.totalCost ?? 0,
      public: trace.public,
      metadata: trace.metadata,
      environment: trace.environment
    }));
  } catch (error) {
    console.error("API Error in fetchTraces:", error);
    error.clientMessage = '트레이스 목록을 불러오는 데 실패했습니다. API 서버 연결 상태를 확인해주세요.';
    throw error;
  }
};

/**
 * ID를 기반으로 트레이스를 삭제합니다.
 * @param {string} traceId - 삭제할 트레이스의 ID
 */
export const deleteTrace = async (traceId) => {
  try {
    await langfuse.api.traceDelete(traceId);
  } catch (error) {
    console.error(`API Error in deleteTrace for ID ${traceId}:`, error);
    error.clientMessage = `Trace (ID: ${traceId}) 삭제에 실패했습니다. 권한이나 네트워크를 확인해주세요.`;
    throw error;
  }
};

/**
 * 여러 트레이스의 비용, 토큰 등 메트릭 정보를 한 번에 가져옵니다.
 * @param {Array<string>} traceIds - 메트릭을 조회할 트레이스 ID 목록
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Array<Object>>} 메트릭 정보 객체 목록
 */
export const fetchTraceMetrics = async (traceIds, projectId) => {
  // traceIds가 비어있으면 불필요한 호출을 막기 위해 빈 배열을 반환합니다.
  if (!traceIds || traceIds.length === 0) {
    return [];
  }

  try {
    const params = {
      json : {
        projectId: projectId,
        traceIds: traceIds,
        filter: [],
      }
    }

    // tRPC 엔드포인트에 POST 요청을 보냅니다.
    const url = `/api/trpc/traces.metrics?input=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await axios.get(url);
    
    return response.data?.result?.data?.json;

  } catch (error) {
    console.error("API Error in fetchTraceMetrics:", error);
    error.clientMessage = '트레이스 메트릭 정보를 불러오는 데 실패했습니다.';
    throw error;
  }
};
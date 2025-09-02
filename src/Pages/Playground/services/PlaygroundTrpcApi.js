// /src/Pages/Playground/services/PlaygroundTrpcApi.js
/**
 * Playground 전용 tRPC 도메인 API
 * ----------------------------------------------------------
 * 이 파일은 "공용 코어 유틸"(/src/services/trpc.client.js)을 사용하여
 * Playground 영역에서 필요한 tRPC 프로시저만 함수형으로 노출한다.
 *
 * 장점:
 *  - 컴포넌트는 구체적인 tRPC 경로를 몰라도 되고,
 *  - 나중에 서버 프로시저명이 바뀌면 이 파일만 수정하면 됨.
 */

import { trpcQuery, trpcMutation } from '../../../services/trpc.client';

// LLM API Keys
export async function listLlmApiKeys(projectId, opts = {}) {
  if (!projectId) return [];
  const payload = await trpcQuery('llmApiKey.all', { projectId }, opts);
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

// Tools
export const ToolsAPI = {
  async list(projectId, opts = {}) {
    const p = await trpcQuery('llmTools.getAll', { projectId }, opts);
    return Array.isArray(p) ? p : (p?.data ?? []);
  },
  create(projectId, input, opts = {}) {
    return trpcMutation('llmTools.create', { projectId, ...input }, opts);
  },
  update(projectId, input, opts = {}) {
    return trpcMutation('llmTools.update', { projectId, ...input }, opts);
  },
  delete(projectId, id, opts = {}) {
    return trpcMutation('llmTools.delete', { projectId, id }, opts);
  },
};

// Schemas
export const SchemasAPI = {
  async list(projectId, opts = {}) {
    const p = await trpcQuery('llmSchemas.getAll', { projectId }, opts);
    return Array.isArray(p) ? p : (p?.data ?? []);
  },
  create(projectId, input, opts = {}) {
    return trpcMutation('llmSchemas.create', { projectId, ...input }, opts);
  },
  update(projectId, input, opts = {}) {
    return trpcMutation('llmSchemas.update', { projectId, ...input }, opts);
  },
  delete(projectId, id, opts = {}) {
    return trpcMutation('llmSchemas.delete', { projectId, id }, opts);
  },
};

// (선택) Prompts / 기타 Playground 전용 프로시저가 있다면 동일 패턴으로 추가.

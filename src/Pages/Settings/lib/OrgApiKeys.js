// src/Pages/Settings/lib/OrgApiKeys.js
import { trpcQuery, trpcMutation } from "./trpc";

/** 목록 */
export async function listOrgApiKeys(orgId) {
  return trpcQuery("organizationApiKeys.byOrganizationId", { orgId });
}

/** 생성 */
export async function createOrgApiKey(orgId, note, projectId) {
  const input = projectId ? { orgId, note, projectId } : { orgId, note };
  return trpcMutation("organizationApiKeys.create", input);
}

/** 노트 : 이름 정규화 + 방어코드 */
export async function updateOrgApiKeyNote(params) {
  // 사용자가 어떤 이름으로 넘겨도 안전하게!
  const {
    orgId,
    organizationId,
    keyId,
    apiKeyId,
    id,
    note,
  } = params || {};

  const finalOrgId = orgId ?? organizationId;
  const finalKeyId = keyId ?? apiKeyId ?? id;

  if (!finalOrgId) throw new Error("orgId is required");
  if (!finalKeyId) throw new Error("keyId is required");

  // ⚠️ 서버가 기대하는 정확한 필드명으로 보냄
  return trpcMutation("organizationApiKeys.updateNote", {
    orgId: finalOrgId,
    keyId: finalKeyId,
    note: note ?? "",
  });
}

/** 삭제 */
export async function deleteOrgApiKey(orgId, id) {
  return trpcMutation("organizationApiKeys.delete", { orgId, id });
}

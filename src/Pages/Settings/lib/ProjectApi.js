// src/Pages/Settings/lib/ProjectApi.js
import { trpcMutation } from "./trpc";           //  tRPC 유틸 사용
import { resolveOrgId } from "./sessionOrg";     //  orgId 자동 추론

// 프로젝트 이름 변경: /api/trpc/projects.update  { json: { projectId, newName } }
export async function updateProjectName(projectId, newName) {
  return trpcMutation("projects.update", { projectId, newName });
}

// 프로젝트 삭제: 실제 서버 메서드명에 맞춰 여기를 한 줄만 바꾸면 됩니다.
export async function deleteProjectHard(projectId) {
  // 예) "projects.delete" / "project.delete" 등 서버 구현에 맞게만 수정
  return trpcMutation("projects.delete", { projectId });
}

// 프로젝트 소유권 이전
export async function transferProject(projectId, targetOrganizationId) {
  const orgId = targetOrganizationId || (await resolveOrgId(projectId));
  // 예) "projects.transfer" / "project.transferOwnership" 등 서버 구현에 맞게만 수정
  return trpcMutation("projects.transfer", { projectId, targetOrganizationId: orgId });
}

// 프로젝트 멤버 API - tRPC 클라이언트
import { trpcQuery, trpcMutation } from "./trpc";
import { resolveOrgId } from "./sessionOrg";

/**
 * 목록 조회 (페이지네이션)
 * - page: 1-based
 * - limit: 페이지 크기
 * - search: 선택(이메일/이름 필터)
 * 서버는 result.data.json = { items, page, limit, totalItems, totalPages } 형태를 가정
 */
export async function listProjectMembers(projectId, { page = 1, limit = 10, search = "" } = {}) {
  const orgId = await resolveOrgId(projectId);
  const input = { orgId, projectId, page: Math.max(0, page - 1), limit, search };
  const res = await trpcQuery("members.allFromProject", input);
  const memberships = res?.memberships ?? [];
  const total = res?.totalCount ?? memberships.length;
  return {
    items: memberships.map((m) => ({
      id: m.id,
      name: m.user?.name ?? "",
      email: m.user?.email ?? "",
      organizationRole: m.role ?? "Member",
      projectRole: m.projectRole ?? null,
      memberSince: m.createdAt,
    })),
    page,
    limit,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * 초대(추가)
 * - email: 추가할 사용자 이메일
 * - role: 'Owner' | 'Admin' | 'Member' | 'Viewer'
 * 성공 시 생성된 멤버(또는 초대 엔티티) 반환 가정
 */
export async function inviteProjectMember(projectId, { email, role }) {
  return trpcMutation("projectMembers.invite", { projectId, email, role });
}

/** 역할 변경 */
export async function updateProjectMemberRole(projectId, memberId, role) {
  return trpcMutation("projectMembers.updateRole", { projectId, memberId, role });
}

/** 멤버 제거 */
export async function removeProjectMember(projectId, memberId) {
  return trpcMutation("projectMembers.remove", { projectId, memberId });
}

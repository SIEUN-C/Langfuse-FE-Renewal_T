// 프로젝트 멤버 API - tRPC 클라이언트
import { trpcQuery } from "./trpc";
import { resolveOrgId } from "./sessionOrg";
import { trpcTryManyMutation } from "./trpcTryMany";

/**
 * 목록 조회 (페이지네이션)
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

/** 초대(프로젝트 스코프) */
export async function inviteProjectMember(projectId, { email, role }) {
  return trpcTryManyMutation(
    [
      "projectMembers.invite",
      "members.inviteToProject",
      "projectMembers.create",
    ],
    { projectId, email, role }
  );
}

/** 역할 변경 */
export async function updateProjectMemberRole(projectId, memberId, role) {
  return trpcTryManyMutation(
    [
      "projectMembers.updateRole",
      "members.updateProjectRole",
      "projectMembers.patchRole",
    ],
    { projectId, memberId, role }
  );
}

/** 멤버 제거 */
export async function removeProjectMember(projectId, memberId) {
  return trpcTryManyMutation(
    [
      "projectMembers.remove",
      "members.removeFromProject",
      "projectMembers.delete",
    ],
    { projectId, memberId }
  );
}

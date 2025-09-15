// src/Pages/Settings/lib/ProjectMembers.js
// 프로젝트 멤버 API - tRPC 클라이언트
import { trpcQuery, trpcMutation } from "./trpc";
import { resolveOrgId } from "./sessionOrg";
import { trpcTryManyMutation } from "./trpcTryMany";

/**
 * 목록 조회 (페이지네이션)
 * page: UI는 1-based → 서버는 0-based
 */
export async function listProjectMembers(
  projectId,
  { page = 1, limit = 10, search = "" } = {}
) {
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
      // ✅ 코드값으로 정규화(OWNER/ADMIN/MEMBER/VIEWER/NONE)
      organizationRole: String(m.role ?? "MEMBER").toUpperCase(),
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
  const orgId = await resolveOrgId(projectId);
  const payload = { projectId, orgId, email, role };

  return trpcTryManyMutation(
    [
      "projectMembers.invite",      // 보편
      "members.inviteToProject",    // 일부 구현
      "projectMembers.create",      // 일부 구현
    ],
    payload
  );
}

/** ✅ 역할 변경 (orgMembershipId 우선 → 폴백) */
export async function updateProjectMemberRole(projectId, memberId, role) {
  const orgId = await resolveOrgId(projectId);

  // 1) 너가 올린 성공 경로: members.updateOrgMembership({ orgMembershipId, orgId, role })
  try {
    return await trpcMutation("members.updateOrgMembership", {
      orgMembershipId: memberId,
      orgId,
      role,
    });
  } catch (e) {
    const msg = e?.message || "";
    const retryable = /BAD_REQUEST|NOT_FOUND|404|-32600|invalid/i.test(msg);
    if (!retryable) throw e;
  }

  // 2) 대체 경로들
  const payload = { projectId, orgId, memberId, role };
  return trpcTryManyMutation(
    [
      "members.updateOrganizationRole",
      "organizationMembers.updateRole",
      "projectMembers.updateRole",
      "projectMembers.patchRole",
    ],
    payload
  );
}

/** ✅ 멤버 제거 (5173 환경: orgId 요구) */
export async function removeProjectMember(projectId, memberId) {
  const orgId = await resolveOrgId(projectId);

  // #1: deleteMembership (orgId 요구 환경 대응)
  try {
    return await trpcTryManyMutation(
      [
        "members.deleteMembership", // { membershipId, orgId, projectId }
      ],
      { membershipId: memberId, orgId, projectId }
    );
  } catch (e) {
    const msg = e?.message || "";
    const retryable = /BAD_REQUEST|NOT_FOUND|404|-32600|Invalid input/i.test(msg);
    if (!retryable) throw e;
  }

  // #2: 프로젝트/멤버 경로 폴백
  return trpcTryManyMutation(
    [
      "projectMembers.remove",
      "members.removeFromProject",
      "projectMembers.delete",
    ],
    { projectId, memberId, orgId }
  );
}

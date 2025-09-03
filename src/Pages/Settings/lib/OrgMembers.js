import { trpcQuery, trpcMutation } from "./trpc";

/**
 * 조직 멤버 목록 (페이지네이션을 서버가 지원하면 그대로, 아니면 FE에서 자르기)
 * 기대 엔드포인트(필요시 상단 상수 변경):
 * - organizationMembers.byOrganizationId
 * - organizationMembers.invite
 * - organizationMembers.updateRole
 * - organizationMembers.remove
 */
export async function listOrgMembers(orgId, { page = 1, limit = 10, search = "" } = {}) {
  const input = { orgId, page: Math.max(0, page - 1), limit, search };
  const res = await trpcQuery("members.allFromOrg", input);
  const memberships = res?.memberships ?? res ?? [];
  const total = res?.totalCount ?? memberships.length;
  return {
    items: memberships.map((m) => ({
      id: m.id,
      name: m.user?.name ?? "",
      email: m.user?.email ?? "",
      organizationRole: m.role ?? m.organizationRole ?? "Member",
      projectRole: m.projectRole ?? null,
      memberSince: m.createdAt,
    })),
    page,
    limit,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function inviteOrgMember(orgId, { email, role }) {
  return trpcMutation("organizationMembers.invite", { orgId, email, role });
}

export async function updateOrgMemberRole(orgId, memberId, role) {
  return trpcMutation("organizationMembers.updateRole", { orgId, memberId, role });
}

export async function removeOrgMember(orgId, memberId) {
  return trpcMutation("organizationMembers.remove", { orgId, memberId });
}

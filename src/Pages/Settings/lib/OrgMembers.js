import { trpcQuery } from "./trpc";
import { trpcTryManyMutation } from "./trpcTryMany";

/** 조직 멤버 목록 */
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
  return trpcTryManyMutation(
    [
      "organizationMembers.invite",
      "members.inviteToOrganization",
      "organizationMembers.create",
    ],
    { orgId, email, role }
  );
}

export async function updateOrgMemberRole(orgId, memberId, role) {
  return trpcTryManyMutation(
    [
      "organizationMembers.updateRole",
      "members.updateOrganizationRole",
      "organizationMembers.patchRole",
    ],
    { orgId, memberId, role }
  );
}

export async function removeOrgMember(orgId, memberId) {
  return trpcTryManyMutation(
    [
      "organizationMembers.remove",
      "members.removeFromOrganization",
      "organizationMembers.delete",
    ],
    { orgId, memberId }
  );
}

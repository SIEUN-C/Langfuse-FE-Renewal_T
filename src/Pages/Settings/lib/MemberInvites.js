// src/Pages/Settings/lib/MemberInvites.js
import { trpcQuery, trpcMutation } from "./trpc";
import { resolveOrgId } from "./sessionOrg";

/** 목록: Project 기준 (page: 1-based → 서버 0-based로 변환) */
export async function listInvitesFromProject(projectId, { page = 1, limit = 10 } = {}) {
  const orgId = await resolveOrgId(projectId);
  const res = await trpcQuery("members.allInvitesFromProject", {
    orgId,
    projectId,
    page: Math.max(0, page - 1),
    limit,
  });
  const invitations = res?.invitations ?? [];
  const total = res?.totalCount ?? invitations.length;
  return {
    items: invitations.map((it) => ({
      id: it.id,
      email: it.email,
      organizationRole: it.orgRole ?? "MEMBER",
      projectRole: it.projectRole ?? null,
      invitedOn: it.createdAt,
      invitedByName: it.invitedByUser?.name ?? "",
    })),
    page,
    limit,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** 목록: Org 기준 */
export async function listInvitesFromOrg(projectId, { page = 1, limit = 10 } = {}) {
  const orgId = await resolveOrgId(projectId);
  const res = await trpcQuery("members.allInvitesFromOrg", {
    orgId,
    page: Math.max(0, page - 1),
    limit,
  });
  const invitations = res?.invitations ?? [];
  const total = res?.totalCount ?? invitations.length;
  return {
    items: invitations.map((it) => ({
      id: it.id,
      email: it.email,
      organizationRole: it.orgRole ?? "MEMBER",
      projectRole: it.projectRole ?? null,
      invitedOn: it.createdAt,
      invitedByName: it.invitedByUser?.name ?? "",
    })),
    page,
    limit,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** 초대 생성 (org만/또는 project 포함) */
export async function createInvite(projectId, { email, orgRole = "MEMBER", projectRole = null }) {
  const orgId = await resolveOrgId(projectId);
  const payload = { email, orgId };
  if (projectId) payload.projectId = projectId;
  if (orgRole) payload.orgRole = orgRole;
  if (projectRole) payload.projectRole = projectRole;
  return trpcMutation("members.create", payload);
}

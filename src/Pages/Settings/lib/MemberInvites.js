import { trpcQuery /*, trpcMutation*/ } from "./trpc";
import { resolveOrgId } from "./sessionOrg";
import { trpcTryManyMutation } from "./trpcTryMany"; // ✅ 추가

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
  // 기존처럼 단일 절차명일 경우:
  // return trpcMutation("members.create", payload);

  // ✅ 서버 환경마다 절차명이 다를 수 있어 안전하게 시도
  return trpcTryManyMutation(
    [
      "members.create",
      "organizationMembers.invite",
      "projectMembers.invite",
    ],
    payload
  );
}

/** ✅ 초대 취소 */
export async function cancelInvite(projectId, inviteId) {
  const orgId = await resolveOrgId(projectId);
  const payload = { inviteId, orgId };
  if (projectId) payload.projectId = projectId;

  // 환경에 따라 가능한 절차명 후보를 순차 시도
  return trpcTryManyMutation(
    [
      "members.cancelInvite",               // 공통(커스텀)
      "organizationMembers.cancelInvite",   // 조직 스코프
      "projectMembers.cancelInvite",        // 프로젝트 스코프
      "organizationInvites.cancel",         // 일부 구현
      "projectInvites.cancel",              // 일부 구현
    ],
    payload
  );
}

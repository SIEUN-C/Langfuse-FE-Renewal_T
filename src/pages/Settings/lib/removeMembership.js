import { trpcMutation } from "./trpc";

/**
 * 멤버십 삭제 (환경별 경로/스키마 호환)
 * 1) members.deleteMembership     { orgMembershipId, orgId?, projectId? }  // 5173 요구
 * 2) organizationMembers.remove   { orgId, memberId }
 * 3) projectMembers.remove        { projectId, memberId }
 */
export async function removeMembershipUniversal({ membershipId, orgId, projectId }) {
  const msgOf = (e) => e?.message || "";

  // #1: 5173 호환 — orgMembershipId + orgId(+ projectId)
  try {
    return await trpcMutation("members.deleteMembership", {
      orgMembershipId: String(membershipId),   // 🔑 필드명 교정
      ...(orgId ? { orgId: String(orgId) } : {}),
      ...(projectId ? { projectId: String(projectId) } : {}),
    });
  } catch (e) {
    const m = msgOf(e);
    const retry = /404|Not Found|BAD_REQUEST|-32600|Invalid input/i.test(m);
    if (!retry) throw e;
  }

  // #2: 조직 스코프 폴백
  if (orgId) {
    try {
      return await trpcMutation("organizationMembers.remove", {
        orgId: String(orgId),
        memberId: String(membershipId),
      });
    } catch (e) {
      const m = msgOf(e);
      const retry = /404|Not Found|BAD_REQUEST|-32600/i.test(m);
      if (!retry) throw e;
    }
  }

  // #3: 프로젝트 스코프 폴백
  if (projectId) {
    return await trpcMutation("projectMembers.remove", {
      projectId: String(projectId),
      memberId: String(membershipId),
    });
  }

  throw new Error("No valid deletion route available");
}

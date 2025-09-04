import { trpcMutation } from "./trpc";

/**
 * 멤버십 삭제를 서버 구현별로 유연하게 시도
 * 1) members.deleteMembership     { membershipId }
 * 2) organizationMembers.remove   { orgId, memberId }
 * 3) projectMembers.remove        { projectId, memberId }
 */
export async function removeMembershipUniversal({ membershipId, orgId, projectId }) {
  const csrfMsg = (e) => e?.message || "";

  // #1 권장/표준: membershipId 단독
  try {
    return await trpcMutation("members.deleteMembership", { membershipId });
  } catch (e) {
    const m = csrfMsg(e);
    const isRetry = /404|Not Found|BAD_REQUEST|-32600/i.test(m);
    if (!isRetry) throw e;
  }

  // #2 조직 스코프
  if (orgId) {
    try {
      return await trpcMutation("organizationMembers.remove", {
        orgId,
        memberId: membershipId, // 일부 서버는 멤버십 id를 memberId로 받기도 함
      });
    } catch (e) {
      const m = csrfMsg(e);
      const isRetry = /404|Not Found|BAD_REQUEST|-32600/i.test(m);
      if (!isRetry) throw e;
    }
  }

  // #3 프로젝트 스코프
  if (projectId) {
    try {
      return await trpcMutation("projectMembers.remove", {
        projectId,
        memberId: membershipId,
      });
    } catch (e) {
      // 마지막 실패는 그대로 throw
      throw e;
    }
  }

  throw new Error("No valid deletion route available");
}

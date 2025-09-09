import { trpcTryManyQuery } from "./trpcTryManyQuery";
import { trpcTryManyMutation } from "./trpcTryMany";

/** 목록 조회 (0-based page 사용) */
export async function listScoreConfigs(projectId, page0 = 0, limit = 50) {
  // 서버 응답은 { configs, totalCount }
  const res = await trpcTryManyQuery(["scoreConfigs.all"], {
    projectId,
    page: page0,
    limit,
  });

  const configs = res?.configs ?? res?.data ?? [];
  const totalCount = res?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / (limit || 1)));

  // UI는 1-based로 쓰기 편하니 meta를 정규화해서 반환
  return {
    data: configs,
    meta: {
      page: (page0 ?? 0) + 1, // 1-based
      totalPages,
      totalItems: totalCount,
      pageSize: limit,
    },
  };
}

/** 생성 */
export async function createScoreConfig(projectId, payload) {
  return trpcTryManyMutation(["scoreConfigs.create"], {
    projectId,
    ...payload,
  });
}

/** 상태 토글(Archive/Restore) */
export async function updateScoreConfigStatus(projectId, id, isArchived) {
  // update 우선 → 없으면 archive/restore 시도
  try {
    return await trpcTryManyMutation(["scoreConfigs.update"], {
      projectId,
      id,
      isArchived,
    });
  } catch {
    return trpcTryManyMutation(
      isArchived ? ["scoreConfigs.archive"] : ["scoreConfigs.restore"],
      { projectId, id }
    );
  }
}

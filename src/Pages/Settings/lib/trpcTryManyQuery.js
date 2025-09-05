import { trpcQuery } from "./trpc";

/**
 * candidates(절차명 배열)를 순서대로 시도, 첫 성공 결과 반환
 * - 404 / BAD_REQUEST / -32600 류는 다음 후보로 넘어감
 * - 그 외 에러는 즉시 throw
 */
export async function trpcTryManyQuery(candidates, input) {
  let lastErr;
  for (const proc of candidates) {
    try {
      return await trpcQuery(proc, input);
    } catch (e) {
      const msg = e?.message || "";
      const is404 = /404|Not Found/i.test(msg);
      const isBad = /BAD_REQUEST|-32600/i.test(msg);
      if (!is404 && !isBad) throw e;
      lastErr = e;
    }
  }
  throw lastErr || new Error("All candidate queries failed");
}

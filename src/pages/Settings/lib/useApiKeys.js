// src/Pages/Settings/lib/useApiKeys.js
import { useCallback, useEffect, useState } from "react";
import {
  listProjectApiKeys,
  createProjectApiKey,
  deleteProjectApiKey,
  updateProjectApiKeyNote,
} from "./projectApiKeys";
// (필요시) org 라우터 폴백용
import { listOrgApiKeys, updateOrgApiKeyNote as updateOrgNote } from "./orgApiKeys";
import { resolveOrgId } from "./sessionOrg"; // 폴백 시 orgId 구할 때만 사용

/**
 * API Keys 상태 훅
 * - 목록: project 라우터 우선, 실패 시 org 라우터로 폴백
 * - 노트 저장: "해당 key의 projectId 존재 여부"로 라우터 자동 선택
 * - 낙관적 업데이트(optimistic update) + 실패 시 롤백
 */

export default function useApiKeys(projectId) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

    // 로컬만 즉시 패치(낙관적 반영용)
  const patchLocal = useCallback((id, note) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, note } : k)));
  }, []);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErr(null);
    try {
      // 1순위: 프로젝트 전용 라우터
      const data = await listProjectApiKeys(projectId);
      setKeys(Array.isArray(data) ? data : []);
    } catch (e1) {
      // (선택) 구버전 서버 호환: org 라우터로 폴백
      try {
        const orgId = await resolveOrgId(projectId);
        const orgData = await listOrgApiKeys(orgId);
        const filtered = Array.isArray(orgData)
          ? orgData.filter((k) => k.projectId === projectId || k.projectId == null)
          : [];
        setKeys(filtered);
      } catch (e2) {
        setErr(e1?.message || e2?.message || "Failed to load API keys");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const create = useCallback(
    async (note) => {
      if (!projectId) throw new Error("projectId not provided");
      const k = await createProjectApiKey(projectId, note);
      setKeys((prev) => [k, ...prev]);
      return k;
    },
    [projectId]
  );

  
  /**
   * 노트 업데이트
   * - 현재 keys에서 해당 key를 찾아 projectId 유무로 라우터 자동 결정
   * - 낙관적 업데이트 적용 → 실패 시 롤백
   */
  const updateNote = useCallback(
    async (id, note) => {
      if (!projectId) throw new Error("projectId not provided");

      // 현재 키 찾기(행 기준 라우팅)
      const current = keys.find((k) => k.id === id);
      const isProjectKey = !!current?.projectId; // org 키는 보통 null/undefined

      // 낙관적 업데이트(스냅샷 보관)
      const snapshot = keys;
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, note } : k)));

      try {
        if (isProjectKey) {
          // 프로젝트 라우터
          await updateProjectApiKeyNote(projectId, id, note);
        } else {
          // 조직 라우터 폴백
          const orgId = await resolveOrgId(projectId);
          await updateOrgNote({ orgId, keyId: id, note });
        }
      } catch (e) {
        // 실패 → 롤백
        setKeys(snapshot);
        throw e;
      }
    },
    [projectId, keys]
  );

  const remove = useCallback(
    async (id) => {
      if (!projectId) throw new Error("projectId not provided");
      await deleteProjectApiKey(projectId, id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    },
    [projectId]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { keys, loading, error: err, reload, create, updateNote, remove, patchLocal };
}
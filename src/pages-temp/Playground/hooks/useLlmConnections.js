// src/Pages/Playground/hooks/useLlmConnections.js
import { useEffect, useMemo, useState } from "react";
import {
  listLlmConnections,
  listSupportedModels, // ← 서버의 지원 모델 맵
} from "../lib/llmConnections";

/** 서버와 맞춘 표준 어댑터 키로만 처리 (별칭 매핑 제거)
 *  서버가 내려주는 키 예시:
 *   - openai, anthropic, google-vertex-ai, google-ai-studio, azure, bedrock, ollama, kobold ...
 *  서버 키를 그대로 쓰면 불일치 이슈가 사라짐
 */
const canonical = (a) => String(a || "").toLowerCase();

const toArray = (v) =>
  Array.isArray(v) ? v : typeof v === "string" ? v.split(/[, \n]+/).filter(Boolean) : [];

/** row + supportedMap → 모델 병합 (기본모델은 서버에서만 수신)
 *  - withDefaultModels === true면: 서버 기본모델 + customModels 병합
 *  - false면: customModels만
 */
function normalize(row, supportedMap) {
  const adapter = canonical(row?.adapter);
  const wantsDefaults =
    !!(row?.withDefaultModels ?? row?.useDefaultModels ?? row?.enableDefaultModels);

  const custom = toArray(row?.customModels ?? row?.models);
  const serverDefaults = Array.isArray(supportedMap?.[adapter]) ? supportedMap[adapter] : [];
  const defaults = wantsDefaults ? serverDefaults : [];

  const merged = [...new Set([...custom, ...defaults])];

  return {
    ...row,
    adapter,          // 표준화
    customModels: merged, // 드롭다운은 이 배열만 사용
  };
}

export default function useLlmConnections(projectId) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setConnections([]);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) 서버의 최신 지원모델 맵 (없으면 빈 객체)
        const supportedMap = await listSupportedModels({ abortController: ac }).catch(() => ({}));

        // 2) 연결 목록
        const rows = await listLlmConnections(projectId, { abortController: ac });

        // 3) 병합 정규화
        const normalized = (rows || []).map((r) => normalize(r, supportedMap));
        setConnections(normalized);
      } catch (e) {
        if (!ac.signal.aborted) {
          setErr(e?.message || "Failed to load LLM connections");
          setConnections([]);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [projectId]);

  // 최초 기본 선택값
  const firstDefault = useMemo(() => {
    const first = (connections || [])[0];
    if (!first) return { provider: "", adapter: "", model: "" };
    return {
      provider: first.provider || "",
      adapter: first.adapter ?? "",
      model: first.customModels?.[0] ?? "",
    };
  }, [connections]);

  return { connections, loading, error, firstDefault };
}

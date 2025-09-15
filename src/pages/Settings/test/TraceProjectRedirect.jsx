import React, { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProject } from "../../../state/currentProject.slice";

export default function TraceProjectRedirect() {
  const nav = useNavigate();
  const { projectId } = useParams();
  const { state } = useLocation(); // { projectName?, orgId?, orgName? } 기대
  const dispatch = useDispatch();

  useEffect(() => {
    if (!projectId) {
      nav("/trace", { replace: true });
      return;
    }

    const projectName = state?.projectName || null;
    const orgId = state?.orgId || null;
    const orgName = state?.orgName || null;

    // 컨텍스트 저장: Tracing 코드는 건드리지 않고 현재 프로젝트만 바꿔줌
    try {
      localStorage.setItem("projectId", projectId);
      if (projectName) localStorage.setItem("projectName", projectName);
      if (orgId) localStorage.setItem("orgId", orgId);
      if (orgName) localStorage.setItem("orgName", orgName);
    } catch {}

    // 헤더/스위처 등 전역 라벨 즉시 반영 (Optimistic)
    dispatch(setProject({ id: projectId, name: projectName || null }));

    // 곧바로 /trace로 진입
    nav("/trace", { replace: true });
  }, [projectId, nav, state, dispatch]);

  return <div style={{ padding: 16 }}>Opening project…</div>;
}

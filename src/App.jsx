
// src/App.jsx
import React, { useState, useEffect } from "react"; // useState와 useEffect를 import 해야 합니다.
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";

import Login from "./Pages/Login/LoginPage";

import Home from "./Pages/Home/Home";

import Tracing from "./Pages/Tracing/Tracing";
import Sessions from "./Pages/Sessions/Sessions";
import SessionDetail from "./Pages/Sessions/SessionDetail";

import Prompts from "./Pages/Prompts/Prompts";
import PromptsDetail from "./Pages/Prompts/PromptsDetail";
import PromptsNew from "./Pages/Prompts/PromptsNew";

import Playground from "./Pages/Playground/Playground";

// ⭐ 추가: 게이트 컴포넌트 임포트
import ProjectGate from "./components/ProjectId/ProjectGate";

import Dataset from "./Pages/Evaluation/DataSets/DatasetsPage";
import JudgePage from "./Pages/Evaluation/Judge/JudgePage";
import EvaluationDetail from './Pages/Evaluation/Judge/EvaluationDetail';
import SetupEvaluator from './Pages/Evaluation/Judge/SetupEvaluator';

// 대시보드
import Dashboards from "./Pages/Dashboards/Dashboards";
import DashboardNew from "./Pages/Dashboards/DashboardNew";
import DashboardDetail from "./Pages/Dashboards/DashboardDetail";

// 위젯 관련 컴포넌트 임포트 추가
import { WidgetsView } from "./Pages/Widget/pages/WidgetsView";
import NewWidget from "./Pages/Widget/pages/NewWidget";

// Settings
import SettingsPage from "./Pages/Settings/SettingsPage";
import General from "./Pages/Settings/General";
import ApiKeys from "./Pages/Settings/ApiKeys";
import LLMConnections from "./Pages/Settings/LLMConnections";
import Models from "./Pages/Settings/Models";
import Members from "./Pages/Settings/Members";
import Scores from "./Pages/Settings/Scores";

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  // 앱이 처음 실행될 때 딱 한 번만 실행됨
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        // 응답 데이터에 내용이 있으면(로그인 상태이면) session 상태에 저장
        if (data && Object.keys(data).length > 0) {
          setSession(data);
        }
      } catch (error) {
        console.error("세션 확인 실패:", error);
      } finally {
        // 확인이 끝나면 로딩 상태를 false로 변경
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // 로딩 중일 때는 아무것도 안 보여주거나 로딩 스피너를 보여줌
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* 로그인 */}
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/" />}
      />

      {/* // <<< START: setting 깨짐 값을 위해 수정된 부분 >>></START: 수정된> */}
      {/* <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />} > */}

      {/* 셋팅 부분 깨짐 현상 수정을 위한 추가 _ 20250901 */}
      <Route
        path="/"
        element={
          session ? <Layout session={session} /> : <Navigate to="/login" />
        }
      >
        {/* // <<< END: setting 깨짐 값을 위해 수정된 부분 >>>   */}

        {/* 홈 -> /trace 경로로 리디렉션 */}
        <Route index element={<Navigate to="/trace" replace />} />

        {/* Tracing */}
        <Route path="trace" element={<Tracing />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:sessionId" element={<SessionDetail />} />

        {/* Prompts */}
        <Route path="prompts" element={<Prompts />} />
        <Route path="prompts/:id" element={<PromptsDetail />} />
        <Route path="prompts/new" element={<PromptsNew />} />

        {/* Playground */}
        {/* ✅ 표준 경로: URL에서 projectId를 직접 읽어 사용 */}
        <Route path="project/:projectId/playground" element={<Playground />} />

        {/* ✅ 짧은 경로: 게이트가 projectId를 찾아 표준 경로로 리다이렉트 또는 배너 표시 */}
        {/* 👇 기존: <Route path="playground" element={<Playground />} /> 를 교체 */}
        <Route path="playground" element={<ProjectGate />} />

        <Route path="llm-as-a-judge" element={<JudgePage />} />
        <Route path="datasets" element={<Dataset />} />

        {/* <Route path="/evaluations" element={<JudgePage />}> */}
        {/* 기본적으로 /running으로 리다이렉트합니다. */}
        {/* <Route index element={<Navigate to="running" replace />} />
          <Route path="running" element={<RunningEvaluators />} />
          <Route path="archived" element={<ArchivedEvaluators />} />
        </Route> */}
        {/* <Route path="evaluation/new" element={<Navigate to="/scores/new" replace />} /> */}
        {/* <Route path="evaluation/:id" element={<Navigate to="/scores/:id" replace />} /> */}
        {/* <Route path="evaluation/:id/edit" element={<Navigate to="/scores/:id/edit" replace />} /> */}
        <Route path="/project/:projectId/evaluations" element={<JudgePage />} />
        <Route path="/project/:projectId/evaluations/setup" element={<SetupEvaluator />} />
        <Route path="/project/:projectId/evaluations/:evaluationId" element={<EvaluationDetail />} />
        
        {/* Dashboard & Widget Routes */}
        <Route path="project/:projectId/dashboards" element={<Dashboards />} />
        <Route
          path="project/:projectId/dashboards/new"
          element={<DashboardNew />}
        />
        <Route
          path="project/:projectId/dashboards/:dashboardId"
          element={<DashboardDetail />}
        />

        {/* 위젯 전용 라우트들 */}
        <Route path="project/:projectId/widgets" element={<WidgetsView />} />
        <Route path="project/:projectId/widgets/new" element={<NewWidget />} />
        <Route
          path="project/:projectId/widgets/:widgetId"
          element={<div>Widget Detail Page (구현 필요)</div>}
        />
        <Route
          path="project/:projectId/widgets/:widgetId/edit"
          element={<div>Widget Edit Page (구현 필요)</div>}
        />

        {/* 대시보드 내에서 위젯 생성 (기존 경로 유지) */}
        <Route
          path="project/:projectId/dashboards/widgets/new"
          element={<NewWidget />}
        />

        {/* 짧은 경로는 ProjectGate 사용*/}
        <Route path="dashboards" element={<ProjectGate />} />
        <Route path="widgets" element={<ProjectGate />} />

        {/* ✅ Settings: 표준 & 짧은 경로 모두 지원 */}
        <Route path="project/:projectId/settings" element={<SettingsPage />}>
          <Route index element={<General />} />
          <Route path="general" element={<General />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="llm-connections" element={<LLMConnections />} />
          <Route path="models" element={<Models />} />
          <Route path="scores" element={<Scores />} />
          <Route path="members" element={<Members />} />
        </Route>

        {/* 짧은 경로는 Gate가 projectId 찾아 리다이렉트 */}
        <Route path="settings" element={<ProjectGate to="settings" />} />
      </Route>
    </Routes>
  );
}

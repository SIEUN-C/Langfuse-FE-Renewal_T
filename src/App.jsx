// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Layout from "./layouts/Layout";

import Login from "./Pages/Login/LoginPage";
import SignUpPage from "./Pages/Login/SignUpPage";
import SelectProjectPage from "./Pages/Settings/SelectProjectPage";

import Home from "./Pages/Home/Home";

import Tracing from "./Pages/Tracing/Tracing";
// ✨ 1. 새로 만든 페이지 import 하기
import TraceDetailPage from "./Pages/Tracing/TraceDetailPage";
import Sessions from "./Pages/Sessions/Sessions";
import SessionDetail from "./Pages/Sessions/SessionDetail";

import Prompts from "./Pages/Prompts/Prompts";
import PromptsDetail from "./Pages/Prompts/PromptsDetail";
import PromptsNew from "./Pages/Prompts/PromptsNew";

import Playground from "./Pages/Playground/Playground";

// ⭐ 추가: 게이트 컴포넌트
import ProjectGate from "./components/ProjectId/ProjectGate";

import Dataset from "./Pages/Evaluation/DataSets/DatasetsPage";
import JudgePage from "./Pages/Evaluation/Judge/JudgePage";
import EvaluationDetail from "./Pages/Evaluation/Judge/EvaluationDetail";
import SetupEvaluator from "./Pages/Evaluation/Judge/SetupEvaluator";
import DefaultEvaluationModel from "Pages/Evaluation/Judge/DefaultEvaluationModel";
import EvaluationView from "Pages/Evaluation/Judge/EvaluationView";
import Templates from "Pages/Evaluation/Judge/Templates";
import CustomEvaluator from "Pages/Evaluation/Judge/CustomEvaluator";
import EvaluationForm from "Pages/Evaluation/Judge/components/EvaluationForm";
// import EvaluatorLibrary from "./Pages/Evaluation/Judge/components/EvaluatorLibrary";

// 대시보드
import Dashboards from "./Pages/Dashboards/Dashboards";
import DashboardNew from "./Pages/Dashboards/DashboardNew";
import DashboardDetail from "./Pages/Dashboards/DashboardDetail";

// 위젯
import { WidgetsView } from "./Pages/Widget/pages/WidgetsView";
import NewWidget from "./Pages/Widget/pages/NewWidget";
import EditWidget from "./Pages/Widget/pages/EditWidget";

// Settings
import SettingsPage from "./Pages/Settings/SettingsPage";
import General from "./Pages/Settings/General";
import ApiKeys from "./Pages/Settings/ApiKeys";
import LLMConnections from "./Pages/Settings/LLMConnections";
import Models from "./Pages/Settings/Models";
import ModelDetail from "./Pages/Settings/ModelDetail";
import Members from "./Pages/Settings/Members";
import Scores from "./Pages/Settings/Scores";
import TraceProjectRedirect from "./Pages/Settings/test/TraceProjectRedirect";
import UseEvaluator from "Pages/Evaluation/Judge/UseEvaluator";
import SetupOrganizationPage from "./Pages/Settings/SetupOrganizationPage";

/** 🔑 projectId 변경 시 컴포넌트를 강제 리마운트하는 래퍼 */
function keyByProjectId(Component) {
  return function KeyedByProjectId(props) {
    const { projectId } = useParams();
    return <Component key={projectId} {...props} />;
  };
}

/** 필요한 페이지들에 키 래퍼 적용 (설정/대시보드/위젯/플레이그라운드 등) */
const SettingsPageKeyed = keyByProjectId(SettingsPage);
const DashboardsKeyed = keyByProjectId(Dashboards);
const DashboardNewKeyed = keyByProjectId(DashboardNew);
const DashboardDetailKeyed = keyByProjectId(DashboardDetail);
const WidgetsViewKeyed = keyByProjectId(WidgetsView);
const NewWidgetKeyed = keyByProjectId(NewWidget);
const PlaygroundKeyed = keyByProjectId(Playground);

/** ✅ 조직 존재 가드: App.jsx 내부에서만 사용 (별도 파일 없이) */
function RequireOrg({ children }) {
  let hasOrg = false;
  try {
    hasOrg = !!localStorage.getItem("orgId");
  } catch {
    hasOrg = false;
  }
  if (!hasOrg) {
    return <Navigate to="/setup" replace />;
  }
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 첫 실행 시 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data && Object.keys(data).length > 0) setSession(data);
      } catch (error) {
        console.error("세션 확인 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* 로그인 */}
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/" />}
      />

      {/* 회원가입 */}
      <Route
        path="/auth/sign-up"
        element={!session ? <SignUpPage /> : <Navigate to="/" />}
      />
      {/* 별칭 (선택) */}
      <Route path="/signup" element={<Navigate to="/auth/sign-up" replace />} />

      {/* 루트 */}
      <Route
        path="/"
        element={
          session ? <Layout session={session} /> : <Navigate to="/login" />
        }
      >
        {/* 홈: 조직 없으면 /setup, 있으면 /trace */}
        <Route
          index
          element={
            localStorage.getItem("orgId") ? (
              <Navigate to="/trace" replace />
            ) : (
              <Navigate to="/setup" replace />
            )
          }
        />

        {/* Tracing */}
        <Route
          path="trace"
          element={
            <RequireOrg>
              <Tracing />
            </RequireOrg>
          }
        />
        {/* ✨ 2. 새로운 경로 규칙 추가하기 */}
        <Route
          path="project/:projectId/traces/:traceId"
          element={
            <RequireOrg>
              <TraceDetailPage />
            </RequireOrg>
          }
        />

        {/* Sessions */}
        <Route
          path="sessions"
          element={
            <RequireOrg>
              <Sessions />
            </RequireOrg>
          }
        />
        <Route
          path="sessions/:sessionId"
          element={
            <RequireOrg>
              <SessionDetail />
            </RequireOrg>
          }
        />

        {/* Prompts */}
        <Route
          path="prompts"
          element={
            <RequireOrg>
              <Prompts />
            </RequireOrg>
          }
        />
        <Route
          path="prompts/:id"
          element={
            <RequireOrg>
              <PromptsDetail />
            </RequireOrg>
          }
        />
        <Route
          path="prompts/new"
          element={
            <RequireOrg>
              <PromptsNew />
            </RequireOrg>
          }
        />

        {/* Playground */}
        <Route
          path="project/:projectId/playground"
          element={
            <RequireOrg>
              <PlaygroundKeyed />
            </RequireOrg>
          }
        />
        {/* 짧은 경로 → Gate (프로젝트 자동 선택) */}
        <Route path="playground" element={<ProjectGate />} />

        {/* Judge / Datasets */}
        <Route
          path="llm-as-a-judge"
          element={
            <RequireOrg>
              <JudgePage />
            </RequireOrg>
          }
        />
        {/* <Route path="library" element={<EvaluatorLibrary />} /> */}
        <Route
          path="datasets"
          element={
            <RequireOrg>
              <Dataset />
            </RequireOrg>
          }
        />
        <Route
          path="llm-as-a-judge/setup"
          element={
            <RequireOrg>
              <SetupEvaluator />
            </RequireOrg>
          }
        />
        {/* llm-as-a-judge 경로 추가 가능성 */}
        {/* <Route path="llm-as-a-judge" element={<EvaluationDetail />} /> */}
        <Route
          path="llm-as-a-judge/default-model"
          element={
            <RequireOrg>
              <DefaultEvaluationModel />
            </RequireOrg>
          }
        />
        <Route
          path="llm-as-a-judge/:evaluationId"
          element={
            <RequireOrg>
              <EvaluationView />
            </RequireOrg>
          }
        />
        <Route
          path="llm-as-a-judge/templates/:templateId"
          element={
            <RequireOrg>
              <Templates />
            </RequireOrg>
          }
        />
        <Route
          path="llm-as-a-judge/evals/new/:templateId"
          element={
            <RequireOrg>
              <UseEvaluator />
            </RequireOrg>
          }
        />
        <Route
          path="llm-as-a-judge/custom"
          element={
            <RequireOrg>
              <CustomEvaluator />
            </RequireOrg>
          }
        />

        {/* Dashboards */}
        <Route
          path="project/:projectId/dashboards"
          element={
            <RequireOrg>
              <DashboardsKeyed />
            </RequireOrg>
          }
        />
        <Route
          path="project/:projectId/dashboards/new"
          element={
            <RequireOrg>
              <DashboardNewKeyed />
            </RequireOrg>
          }
        />
        <Route
          path="project/:projectId/dashboards/:dashboardId"
          element={
            <RequireOrg>
              <DashboardDetailKeyed />
            </RequireOrg>
          }
        />

        {/* Widgets */}
        <Route
          path="project/:projectId/widgets"
          element={
            <RequireOrg>
              <WidgetsViewKeyed />
            </RequireOrg>
          }
        />
        <Route
          path="project/:projectId/widgets/new"
          element={
            <RequireOrg>
              <NewWidgetKeyed />
            </RequireOrg>
          }
        />
        <Route
          path="project/:projectId/widgets/:widgetId/edit"
          element={
            <RequireOrg>
              <EditWidget />
            </RequireOrg>
          }
        />
        <Route
          path="project/:projectId/widgets/:widgetId"
          element={
            <RequireOrg>
              <EditWidget />
            </RequireOrg>
          }
        />
        {/* 대시보드 내 위젯 생성 (기존 경로 유지) */}
        <Route
          path="project/:projectId/dashboards/widgets/new"
          element={
            <RequireOrg>
              <NewWidgetKeyed />
            </RequireOrg>
          }
        />

        {/* 짧은 경로는 Gate 사용 */}
        <Route path="dashboards" element={<ProjectGate />} />
        <Route path="widgets" element={<ProjectGate />} />

        {/* Home 페이지 - projectId 기반 */}
        <Route
          path="project/:projectId"
          element={
            <RequireOrg>
              <Home />
            </RequireOrg>
          }
        />

        {/* 짧은 경로용 Gate */}
        <Route path="home" element={<ProjectGate />} />

        {/* Settings 옆(같은 계층)에 둡니다 */}
        <Route
          path="project/:projectId/trace"
          element={
            <RequireOrg>
              <TraceProjectRedirect />
            </RequireOrg>
          }
        />

        {/* Settings: 표준 & 짧은 경로 */}
        <Route
          path="project/:projectId/settings"
          element={
            <RequireOrg>
              <SettingsPageKeyed />
            </RequireOrg>
          }
        >
          <Route index element={<General />} />
          <Route path="general" element={<General />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="llm-connections" element={<LLMConnections />} />
          <Route path="models">
            <Route index element={<Models />} />
            <Route path=":id" element={<ModelDetail />} />
          </Route>
          <Route path="scores" element={<Scores />} />
          <Route path="members" element={<Members />} />
        </Route>

        {/* Organization만 보이는 생성/셋업 페이지 → 가드 제외 (접근 가능) */}
        <Route path="/setup" element={<SetupOrganizationPage />} />

        {/* 프로젝트 선택/생성 */}
        <Route path="settings/select-project" element={<SelectProjectPage />} />
        <Route
          path="projects/select"
          element={<Navigate to="/settings/select-project" replace />}
        />

        {/* 조직 설정(임시) */}
        <Route path="org/:orgId/settings" element={<SelectProjectPage />} />

        {/* 짧은 경로는 Gate가 projectId 찾아 리다이렉트 */}
        <Route path="settings" element={<ProjectGate to="settings" />} />
      </Route>
    </Routes>
  );
}

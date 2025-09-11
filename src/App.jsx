import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import Layout from "./layouts/Layout";

import Login from "./Pages/Login/LoginPage";
import SignUpPage from "./Pages/Login/SignUpPage";
import SelectProjectPage from "./Pages/Settings/SelectProjectPage";
import SetupOrganizationPage from "./Pages/Settings/SetupOrganizationPage";
import SetupInviteMembers from "./Pages/Settings/SetupInviteMembers";
import SetupTracingPage from "./Pages/Settings/SetupTracingPage";

import Home from "./Pages/Home/Home";

import Tracing from "./Pages/Tracing/Tracing";
import TraceDetailPage from "./Pages/Tracing/TraceDetailPage";
import Sessions from "./Pages/Sessions/Sessions";
import SessionDetail from "./Pages/Sessions/SessionDetail";

import Prompts from "./Pages/Prompts/Prompts";
import PromptsDetail from "./Pages/Prompts/PromptsDetail";
import PromptsNew from "./Pages/Prompts/PromptsNew";

import Playground from "./Pages/Playground/Playground";

import ProjectGate from "./components/ProjectId/ProjectGate";

import Dataset from "./Pages/Evaluation/DataSets/DatasetsPage";
import JudgePage from "./Pages/Evaluation/Judge/JudgePage";
import SetupEvaluator from "./Pages/Evaluation/Judge/SetupEvaluator";
import DefaultEvaluationModel from "Pages/Evaluation/Judge/DefaultEvaluationModel";
import EvaluationView from "Pages/Evaluation/Judge/EvaluationView";
import Templates from "Pages/Evaluation/Judge/Templates";
import CustomEvaluator from "Pages/Evaluation/Judge/CustomEvaluator";
import UseEvaluator from "Pages/Evaluation/Judge/UseEvaluator";

import Dashboards from "./Pages/Dashboards/Dashboards";
import DashboardNew from "./Pages/Dashboards/DashboardNew";
import DashboardDetail from "./Pages/Dashboards/DashboardDetail";

import { WidgetsView } from "./Pages/Widget/pages/WidgetsView";
import NewWidget from "./Pages/Widget/pages/NewWidget";
import EditWidget from "./Pages/Widget/pages/EditWidget";

import SettingsPage from "./Pages/Settings/SettingsPage";
import General from "./Pages/Settings/General";
import ApiKeys from "./Pages/Settings/ApiKeys";
import LLMConnections from "./Pages/Settings/LLMConnections";
import Models from "./Pages/Settings/Models";
import ModelDetail from "./Pages/Settings/ModelDetail";
import Members from "./Pages/Settings/Members";
import Scores from "./Pages/Settings/Scores";
import TraceProjectRedirect from "./Pages/Settings/test/TraceProjectRedirect";

function SetupStepRouter() {
  // 3000 패턴: /organization/:orgId/setup?orgstep=invite-members
  const { orgId } = useParams(); // 필요하면 내부 로직에서 사용
  const search = new URLSearchParams(useLocation().search);
  const step = (search.get("orgstep") || "").toLowerCase();

  // 초대 스텝이면 멤버 초대 화면, 그 외엔 조직 생성/개요 화면
  if (step === "invite-members") {
    return <SetupInviteMembers />;
  }
  return <SetupOrganizationPage />;
}

function LegacyKeysRedirect() {
  const { projectId } = useParams();
  const [params] = useSearchParams();
  const open = params.get("openKeyModal");
  const q = open ? `?openKeyModal=${open}` : "";
  return <Navigate to={`/project/${projectId}/setup${q}`} replace />;
}


/** 🔑 projectId 변경 시 강제 리마운트 */
function keyByProjectId(Component) {
  return function KeyedByProjectId(props) {
    const { projectId } = useParams();
    return <Component key={projectId} {...props} />;
  };
}

const SettingsPageKeyed = keyByProjectId(SettingsPage);
const DashboardsKeyed = keyByProjectId(Dashboards);
const DashboardNewKeyed = keyByProjectId(DashboardNew);
const DashboardDetailKeyed = keyByProjectId(DashboardDetail);
const WidgetsViewKeyed = keyByProjectId(WidgetsView);
const NewWidgetKeyed = keyByProjectId(NewWidget);
const PlaygroundKeyed = keyByProjectId(Playground);

/** 조직 존재 가드 */
function RequireOrg({ children }) {
  let hasOrg = false;
  try {
    hasOrg = !!localStorage.getItem("orgId");
  } catch {
    hasOrg = false;
  }
  if (!hasOrg) return <Navigate to="/setup" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data && Object.keys(data).length > 0) setSession(data);
      } catch {
        // noop
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  /** 홈(index) 분기 */
  function HomeIndex() {
  const loc = useLocation();
  const hasOrg = !!localStorage.getItem("orgId");
  const hasSearch = new URLSearchParams(loc.search).has("search");

  if (hasOrg) return <Navigate to="/home" replace />;  // Home으로
  if (hasSearch) return <SelectProjectPage />;         // /?search면 프로젝트 선택
  return <Navigate to="/?search" replace />;           // 그 외엔 ?search 붙여서 이동
}

  return (
    <Routes>
      {/* 로그인/회원가입 - Layout 외부 */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/auth/sign-up" element={!session ? <SignUpPage /> : <Navigate to="/" />} />
      <Route path="/signup" element={<Navigate to="/auth/sign-up" replace />} />

      {/* 루트 */}
      <Route
        path="/"
        element={session ? <Layout session={session} /> : <Navigate to="/login" />}
      >
        {/* 홈: 조직 없으면 /setup, 있으면 /HomeIndex */}
        <Route index element={<HomeIndex />} />

        {/* Tracing */}
        <Route path="trace" element={<RequireOrg><Tracing /></RequireOrg>} />
        <Route path="project/:projectId/traces/:traceId" element={<RequireOrg><TraceDetailPage /></RequireOrg>} />

        {/* Sessions */}
        <Route path="sessions" element={<RequireOrg><Sessions /></RequireOrg>} />
        <Route path="sessions/:sessionId" element={<RequireOrg><SessionDetail /></RequireOrg>} />

        {/* Prompts */}
        <Route path="prompts" element={<RequireOrg><Prompts /></RequireOrg>} />
        <Route path="prompts/:id" element={<RequireOrg><PromptsDetail /></RequireOrg>} />
        <Route path="prompts/new" element={<RequireOrg><PromptsNew /></RequireOrg>} />

        {/* Playground */}
        <Route path="project/:projectId/playground" element={<RequireOrg><PlaygroundKeyed /></RequireOrg>} />
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
        <Route path="project/:projectId/dashboards" element={<RequireOrg><DashboardsKeyed /></RequireOrg>} />
        <Route path="project/:projectId/dashboards/new" element={<RequireOrg><DashboardNewKeyed /></RequireOrg>} />
        <Route path="project/:projectId/dashboards/:dashboardId" element={<RequireOrg><DashboardDetailKeyed /></RequireOrg>} />

        {/* Widgets */}
        <Route path="project/:projectId/widgets" element={<RequireOrg><WidgetsViewKeyed /></RequireOrg>} />
        <Route path="project/:projectId/widgets/new" element={<RequireOrg><NewWidgetKeyed /></RequireOrg>} />
        <Route path="project/:projectId/widgets/:widgetId/edit" element={<RequireOrg><EditWidget /></RequireOrg>} />
        <Route path="project/:projectId/widgets/:widgetId" element={<RequireOrg><EditWidget /></RequireOrg>} />
        <Route path="project/:projectId/dashboards/widgets/new" element={<RequireOrg><NewWidgetKeyed /></RequireOrg>} />

        {/* 짧은 경로 Gate */}
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

        {/* Settings */}
        <Route path="project/:projectId/trace" element={<RequireOrg><TraceProjectRedirect /></RequireOrg>} />
        <Route path="project/:projectId/settings" element={<RequireOrg><SettingsPageKeyed /></RequireOrg>}>
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

        {/* Setup Tracing (Step 4) */}
        <Route path="project/:projectId/setup" element={<RequireOrg><SetupTracingPage /></RequireOrg>} />
        
        {/* 레거시 키 경로 리다이렉트 */}
        <Route path="project/:projectId/keys" element={<RequireOrg><LegacyKeysRedirect /></RequireOrg>} />

        {/* 프로젝트 선택/생성 */}
        <Route path="settings/select-project" element={<SelectProjectPage />} />
        <Route path="projects/select" element={<Navigate to="/settings/select-project" replace />} />

        {/* 조직 설정 (임시) */}
        <Route path="org/:orgId/settings" element={<SelectProjectPage />} />

        {/* 짧은 경로 */}
        <Route path="settings" element={<ProjectGate to="settings" />} />
      </Route>
    </Routes>
  );
}
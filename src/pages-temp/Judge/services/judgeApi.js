// src/Pages/Evaluation/Judge/services/judgeApi.js

// 1. 'trpc' 대신 'trpcQuery' 함수를 직접 import 하는 부분 (이전 단계에서 완료)
// 주석: 기존 trpcQuery 옆에 trpcMutation을 추가로 import하여
//       'trpcMutation is not defined' 오류를 해결합니다.
import { trpcQuery, trpcMutation } from "../../Playground/services/trpc.client";



// --- 추가: 데이터셋 ID와 이름을 가져오는 API 함수 ---
/**
 * 프로젝트의 모든 데이터셋 메타 정보(ID, 이름)를 조회합니다.
 * @param {string} projectId - 현재 프로젝트 ID
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export const getAllDatasetMeta = ({ projectId }) => {
  return trpcQuery("datasets.allDatasetMeta", { projectId });
};
// ----------------------------------------------------

/**
 * Evaluator 설정 목록을 조회하는 API 함수
 */
export const getAllEvaluatorConfigs = ({ projectId, page = 0, limit = 50 }) => {
  // 2. ✨ 여기가 핵심: 'trpc.evals...' 가 아니라 'trpcQuery(...)' 함수를 사용하도록 수정합니다.
  return trpcQuery("evals.allConfigs", {
    projectId,
    page,
    limit,
    filter: [],
    orderBy: { column: "createdAt", order: "DESC" },
    searchQuery: null,
  });
};


// --- ✨ 수정: 각 행에 맞는 데이터를 불러오도록 파라미터 이름을 최종 수정했습니다 ---
/**
 * 특정 Evaluator의 실행 로그 목록을 조회합니다. (View 페이지용)
 */
export const getEvaluationJobs = ({ projectId, evalConfigId }) => {
  // 주석: 서버 백엔드 코드(evalRouter)를 확인한 결과, 'jobConfigurationId'가
  //      특정 Evaluator를 필터링하는 정확한 파라미터 이름입니다.
  return trpcQuery("evals.getLogs", {
    projectId,
    jobConfigurationId: evalConfigId, 
    filter: [], 
    page: 0,
    limit: 50,
  });
};
// --------------------------------------------------------------------

// --- ✨ 추가: ID로 특정 Evaluator의 상세 설정을 가져오는 API 함수 ---
/**
 * ID를 사용하여 단일 Evaluator 설정의 상세 정보를 조회합니다.
 * View 페이지의 헤더에 Evaluator 이름을 표시하기 위해 사용됩니다.
 * @param {object} params
 * @param {string} params.projectId - 프로젝트 ID
 * @param {string} params.id - Evaluator 설정 ID
 * @returns {Promise<any>}
 */
export const getEvaluatorConfigById = ({ projectId, id }) => {
  // 주석: API 목록 13번 'evals.configById'를 호출합니다.
  return trpcQuery("evals.configById", {
    projectId,
    id,
  });
};
// --------------------------------------------------------------------

// ... (기존의 다른 API 함수들은 그대로 둡니다)

/**
 * 특정 Evaluator 설정을 삭제합니다.
 */
export const deleteEvalJob = ({ projectId, evalConfigId }) => {
  // 주석: 이제 trpcMutation 함수를 정상적으로 사용할 수 있습니다.
  return trpcMutation("evals.deleteEvalJob", {
    projectId,
    evalConfigId,
  });
};
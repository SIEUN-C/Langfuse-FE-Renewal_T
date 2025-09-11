import axios from 'axios';
import { langfuse } from 'lib/langfuse';

/**
 * Evaluator Library 목록을 가져오는 API 함수
 * @param {string} projectId
 */
export const getTemplateEvaluators = async (projectId) => {
  if (!projectId) return [];

  try {
    const params = {
      json: {
        projectId: projectId,
        page: 0,
        limit: 50,
        searchQuery: null
      }
    }

    const url = `/api/trpc/evals.templateNames?input=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await axios.get(url);
    const templatesFromServer = response.data.result.data.json.templates;

    return templatesFromServer.map((template) => ({
      id: template.latestId,
      name: template.name,
      partner: template.partner || 'N/A', // 파트너 정보가 없는 경우 'N/A'로 표시
      version: template.version,
      usageCount: template.usageCount,
      latestCreatedAt: new Date(template.latestCreatedAt).toLocaleString(), // 날짜 형식을 보기 좋게 변경
    }));

  } catch (error) {
    // 에러 발생 시 콘솔에 로그를 남기고, 에러를 던져 상위 컴포넌트에서 처리할 수 있도록 합니다.
    console.error("Failed to fetch template evaluators via tRPC:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to fetch template evaluators.");
  }
};

/**
 * templateID를 이용해 특정 템플릿의 상세 정보를 가져옵니다.
 * @param {string} projectId
 * @param {string} templateId
 */
export const getTemplateById = async (projectId, templateId) => {
  if (!projectId || !templateId) {
    // 필수 파라미터가 없으면 에러를 반환하거나 null을 반환
    console.error("projectId and templateId are required.");
    return null;
  }

  try {
    const params = {
      json: {
        projectId: projectId,
        id: templateId,
      },
    };

    const url = `/api/trpc/evals.templateById?input=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await axios.get(url);

    return response.data.result.data.json;

  } catch (error) {
    console.error("Failed to fetch template by ID via tRPC:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to fetch template details.");
  }
};

/**
 * 특정 이름을 가진 모든 버전의 템플릿 목록을 가져옵니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} name - 조회할 템플릿의 이름
 */
export const getAllTemplateVersionsByName = async (projectId, name) => {
  if (!projectId || !name) {
    console.error("projectId and name are required.");
    return [];
  }

  try {
    const params = {
      json: {
        projectId: projectId,
        name: name,
        isUserManaged: true,
      },
    };

    const url = `/api/trpc/evals.allTemplatesForName?input=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await axios.get(url);

    const templates = response.data.result.data.json.templates;

    if (!templates) {
      return [];
    }

    return templates.map(template => ({
      ...template, // 기존 템플릿의 모든 속성을 그대로 유지하고
      // 날짜 관련 필드만 포맷팅하여 덮어씁니다.
      createdAt: new Date(template.createdAt).toLocaleString(),
      updatedAt: new Date(template.updatedAt).toLocaleString(),
    }));

  } catch (error) {
    console.error("Failed to fetch all template versions by name via tRPC:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to fetch template versions.");
  }
};


/**
 * Default Model
 * @param {string} projectId - 프로젝트 ID
 */
export const getDefaultModel = async (projectId) => {
  if (!projectId) {
    console.error("projectId is required.");
    return null;
  }

  try {
    const params = {
      json: {
        projectId: projectId,
      },
    };

    const url = `/api/trpc/defaultLlmModel.fetchDefaultModel?input=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await axios.get(url);

    return response.data.result.data.json;

  } catch (error) {
    console.error("Failed to fetch default model via tRPC:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to fetch default model.");
  }
};

/**
 * 새로운 Custom Evaluator 템플릿을 생성합니다.
 * @param {object} templateData - 생성할 템플릿 데이터
 */
export const createTemplate = async (templateData) => {
  // 필수 파라미터 확인
  if (!templateData.projectId || !templateData.name || !templateData.prompt) {
    throw new Error("projectId, name, and prompt are required.");
  }

  try {
    // 서버가 요구하는 payload 형식에 맞춰 데이터를 구성합니다.
    const payload = {
      json: {
        name: templateData.name,
        projectId: templateData.projectId,
        prompt: templateData.prompt,
        provider: null,
        model: null,
        modelParams: null,
        vars: templateData.variables,
        outputSchema: {
          score: templateData.scoreRange,
          reasoning: templateData.scoreReasoning,
        },
        referencedEvaluators: "persist",
        sourceTemplateId: null,
      },
      meta: {
        values: {
          provider: ["undefined"],
          model: ["undefined"],
          modelParams: ["undefined"],
          sourceTemplateId: ["undefined"],
        },
      },
    };

    const url = `/api/trpc/evals.createTemplate`;
    const response = await axios.post(url, payload);

    return response.data.result.data.json;

  } catch (error) {
    console.error("Failed to create template via tRPC:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to create template.");
  }
};

/**
 * 특정 프로젝트의 LLM API Key들을 조회합니다.
 * @param {string} projectId
 */
export const fetchLlmApiKeys = async (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required.");
  }

  try {
    const params = {
      json: {
        projectId: projectId,
      },
    };

    const url = `/api/trpc/llmApiKey.all?input=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await axios.get(url);
    const data = response.data.result.data.json;

    return data.data || [];

  } catch (error) {
    console.error("Failed to fetch LLM API keys via tRPC:", error);
    throw new Error(error?.response?.data?.error?.message || "Failed to fetch LLM API keys.");
  }
};


// /**
//  * 모든 페이지의 모델 목록 전체를 가져옵니다.
//  * @returns {Promise<Array<Object>>} 전체 모델 정보 배열
//  */
// export const getAllModels = async () => {
//   try {
//     const limit = 50; // 한 페이지당 아이템 수

//     // 1. 먼저 첫 번째 페이지만 요청해서 전체 페이지 수를 파악합니다.
//     const firstPageResponse = await langfuse.api.modelsList({ page: 1, limit: 50 });
//     const secondPageResponse = await langfuse.api.modelsList({ page: 2, limit: 50 });
//     const thirdPageResponse = await langfuse.api.modelsList({ page: 3, limit: 50 });
    
//     // 5. 첫 번째 페이지 결과와 나머지 페이지 결과를 합쳐서 최종 목록을 반환합니다.
//     return [...firstPageResponse, ...secondPageResponse, ...thirdPageResponse];

//   } catch (error) {
//     console.error("모든 모델 목록을 가져오는 중 오류 발생:", error);
//     throw error; // 에러를 다시 던져서 호출한 쪽에서 처리할 수 있게 함
//   }
// };
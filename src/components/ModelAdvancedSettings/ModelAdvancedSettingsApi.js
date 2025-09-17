import axios from 'axios';

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
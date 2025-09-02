// PromptsNewApi.js
import axios from 'axios';

/**
 * [tRPC] 새로운 프롬프트를 생성하거나 새 버전을 만듭니다.
 * @param {object} params - 프롬프트 생성에 필요한 파라미터 객체
 * @param {string} projectId - API를 호출할 프로젝트의 ID
 */
export const createPromptOrVersion = async (params, projectId) => { 
  if (!projectId) {
    throw new Error("Project ID is missing. Cannot create prompt.");
  }

  const {
    promptName,
    promptType,
    chatContent,
    textContent,
    config,
    labels,
    commitMessage,
  } = params;

  const activeLabels = Object.entries(labels)
    .filter(([, isActive]) => isActive)
    .map(([label]) => label);

  const payload = {
    json: {
      projectId: projectId, 
      name: promptName,
      type: promptType.toLowerCase(),
      prompt: promptType === 'Text'
        ? textContent
        // [수정] 아래 .filter(...) 부분을 제거하여 placeholder가 포함되도록 합니다.
        : chatContent
            .map(({ role, content }) => ({ role: role.toLowerCase(), content: content || '' })),
      config: JSON.parse(config),
      labels: activeLabels,
      commitMessage: commitMessage ? commitMessage : null,
    },
    meta: {
      values: {
        commitMessage: ["undefined"]
      }
    }
  };

  try {
    await axios.post('/api/trpc/prompts.create', payload);
  } catch (error) {
    console.error("Failed to create prompt via tRPC:", error);
    const errorMessage = error.response?.data?.error?.json?.message || "An unknown error occurred while creating the prompt.";
    throw new Error(errorMessage);
  }
};
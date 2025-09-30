import axios from 'axios';

/**
 * [tRPC] 새로운 프롬프트를 생성하거나 새 버전을 만듭니다.
 * @param {object} params - 프롬프 생성에 필요한 파라미터 객체
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

  const typeLowerCase = promptType.toLowerCase();
  const trimmedCommitMessage = (commitMessage || "").trim();

  const formattedChatContent = (chatContent || []).map(msg => {
    const roleLowerCase = msg.role.toLowerCase();
    const messageType = roleLowerCase === 'assistant' ? 'assistant-text' : roleLowerCase;

    if (roleLowerCase === 'placeholder') {
      return {
        id: msg.id,
        type: 'placeholder',
        name: msg.content || '',
      };
    }
    return {
      id: msg.id,
      type: messageType,
      role: roleLowerCase,
      content: msg.content || '',
    };
  });

  const payload = {
    json: {
      name: promptName,
      isActive: activeLabels.length > 0,
      config: JSON.parse(config),
      commitMessage: trimmedCommitMessage || null,

      // --- START: 수정된 부분 ---
      type: typeLowerCase, // 항상 소문자로 보냄

      // 'prompt' 필드를 타입에 따라 다르게 할당
      prompt: typeLowerCase === 'chat'
        ? formattedChatContent
        : textContent,

      // 기존 형식 유지를 위한 chatPrompt/textPrompt 필드
      chatPrompt: typeLowerCase === 'chat' ? formattedChatContent : [],
      textPrompt: typeLowerCase === 'text' ? textContent : "",
      // --- END: 수정된 부분 ---

      projectId: projectId,
      labels: activeLabels,
    }
  };

  // 'prompt' 키가 중복되므로 기존 로직에서 제거합니다.
  // 이전에 payload.json.prompt = ... 하던 부분을 위 로직에 통합했습니다.

  try {
    console.log("Sending payload:", JSON.stringify(payload, null, 2));
    await axios.post('/api/trpc/prompts.create', payload);
  } catch (error) {
    console.error("Failed to create prompt via tRPC:", error);
    // 서버에서 온 자세한 오류 메시지를 그대로 throw
    const serverErrorMessage = error.response?.data?.error?.json?.[0]?.message || "An unknown error occurred.";
    const detailedError = error.response?.data?.error?.message || serverErrorMessage;
    throw new Error(detailedError);
  }
};
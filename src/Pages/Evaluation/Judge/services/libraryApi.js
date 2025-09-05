import axios from 'axios';

/**
 * Evaluator Library 목록을 가져오는 API 함수
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

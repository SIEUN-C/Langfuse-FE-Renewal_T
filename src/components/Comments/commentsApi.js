// src/api/components/commentsApi.js
import { langfuse } from 'lib/langfuse';

export const fetchComments = async ({ objectType, objectId }) => {
  try {
    const response = await langfuse.api.commentsGet({ objectType, objectId });

    return response.data.map(comment => ({
      id: comment.id,
      author: comment.authorUserId || 'Unknown User',
      timestamp: new Date(comment.createdAt).toLocaleString(),
      createdAt: comment.createdAt,
      content: comment.content,
    }));
  } catch (error)    {
    console.error("Failed to fetch comments:", error);
    throw new Error('댓글을 불러오는 데 실패했습니다.');
  }
};

export const createComment = async ({ projectId, objectType, objectId, content }) => {
    try {
        const response = await langfuse.api.commentsCreate({
            projectId,
            objectType,
            objectId,
            content,
        });
        return response;
    } catch (error) {
        console.error("Failed to create comment:", error);
        throw new Error('댓글을 작성하는 데 실패했습니다.');
    }
};

export const deleteComment = async ({ commentId, projectId, objectId, objectType }) => {
    try {
        const payload = {
            json: {
                commentId,
                projectId,
                objectId,
                objectType,
            },
        };

        // axios 대신 fetch API를 사용하고 credentials 옵션을 'include'로 설정합니다.
        const response = await fetch('/api/trpc/comments.delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include', // 세션 쿠키를 함께 보내는 핵심 옵션
        });

        if (!response.ok) {
            // fetch는 404와 같은 HTTP 에러를 throw하지 않으므로, 직접 확인해야 합니다.
            const errorData = await response.json().catch(() => ({})); // 에러 응답이 JSON이 아닐 수도 있음
            const errorMessage = errorData?.error?.json?.message || `Request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error("Failed to delete comment:", error);
        // 이미 throw된 Error 객체를 다시 throw 하거나, 새로운 Error 객체를 throw 할 수 있습니다.
        throw error;
    }
};
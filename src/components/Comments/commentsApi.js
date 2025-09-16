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
    const payload = {
      json: {
        projectId,
        objectType,
        objectId,
        content,
      },
    };

    // Langfuse SDK 대신 fetch API를 사용하여 직접 tRPC 엔드포인트를 호출합니다.
    const response = await fetch('/api/trpc/comments.create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include', // ✨ 세션 쿠키를 함께 보내 사용자 인증을 처리하는 핵심 옵션
    });

    // fetch는 HTTP 에러를 throw하지 않으므로, 직접 상태를 확인해야 합니다.
    if (!response.ok) {
      // 에러 응답이 JSON 형태일 경우, 상세 메시지를 추출합니다.
      const errorData = await response.json().catch(() => ({})); 
      const errorMessage = errorData?.error?.json?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // 성공적인 응답 데이터를 JSON으로 파싱하여 반환합니다.
    const result = await response.json();
    // 실제 댓글 데이터는 result.data.json 경로에 있을 수 있으므로, 호출한 쪽에서 필요에 맞게 사용합니다.
    return result; 

  } catch (error) {
    console.error("Failed to create comment:", error);
    // 이미 Error 객체이므로 그대로 다시 throw 합니다.
    throw error;
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
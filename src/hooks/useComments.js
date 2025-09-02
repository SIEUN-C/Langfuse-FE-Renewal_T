// src/hooks/useComments.js
import { useState, useEffect, useCallback } from 'react';
import { fetchComments, createComment, deleteComment } from '../components/Comments/commentsApi';

export const useComments = (projectId, objectType, objectId) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!objectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedComments = await fetchComments({ objectType, objectId });
      setComments(fetchedComments);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [objectType, objectId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = async (content) => {
    if (!objectId || !projectId) return { success: false, error: 'ID is missing.' };
    try {
      await createComment({ projectId, objectType, objectId, content });
      await loadComments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 세션 조회 로직을 제거하고, deleteComment 호출 시 userId를 전달하지 않습니다.
  const removeComment = async (commentId) => {
    if (!objectId) return { success: false, error: 'Object ID is missing.' };
    
    try {
      await deleteComment({ commentId, projectId, objectId, objectType });
      await loadComments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { comments, isLoading, error, addComment, removeComment };
};
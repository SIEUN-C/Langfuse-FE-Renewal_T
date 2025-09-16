// src/components/Comments/Comments.jsx
import React, { useState } from 'react';
import styles from './Comments.module.css';
import { Trash2 } from 'lucide-react';

const Comment = ({ comment, onDelete }) => (
  <div className={styles.comment}>
    <div className={styles.commentHeader}>
      <div className={styles.headerLeft}>
        <div className={styles.authorInitial}>
          {comment.author?.[0]?.toUpperCase() || '?'}
        </div>
        <span className={styles.commentId}>#{comment.id}</span>
      </div>
      <div className={styles.headerRight}>
        <span className={styles.commentTimestamp}>{comment.timestamp}</span>
        <button className={styles.deleteButton} onClick={() => onDelete(comment.id)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    <div className={styles.commentBody}>
      <p>{comment.content}</p>
    </div>
  </div>
);

const Comments = ({
  currentUser,
  comments,
  isLoading,
  error,
  onAddComment,
  onDeleteComment
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const result = await onAddComment(newComment);
      if (result.success) {
        setNewComment('');
      } else {
        alert(`댓글 추가 실패: ${result.error}`);
      }
    }
  };

  const handleDelete = async (commentId) => {
    
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      const result = await onDeleteComment(commentId);
      if (!result.success) {
        alert(`댓글 삭제 실패: ${result.error}`);
      }
    }
  }
  
  // createdAt 기준으로 내림차순 정렬 (최신 댓글이 위로)
  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className={styles.commentsContainer}>
      <div className={styles.commentsList}>
        {isLoading && <p>Loading comments...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && sortedComments.map((comment) => (
          <Comment key={comment.id} comment={comment} onDelete={handleDelete} currentUser={currentUser} />
        ))}
      </div>

      <div className={styles.newCommentSection}>
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.commentTextarea}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add comment..."
          />
          <div className={styles.formActions}>
            <span className={styles.markdownSupport}></span>
            <button type="submit" className={styles.submitButton} disabled={!newComment.trim()}>
              Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Comments;
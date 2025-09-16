import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Tag } from 'lucide-react';
import styles from '../Prompts.module.css'; // 스타일 파일 경로가 맞는지 확인해주세요.

// 숫자 포맷팅 유틸리티 함수 (별도의 파일로 분리하거나 Prompts.jsx에서 가져와도 됩니다)
const formatObservations = (num) => {
  if (num > 999) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num;
};

// handleTagClick 함수를 파라미터로 받는 함수를 export 합니다.
export const getPromptsColumns = ({ onTagClick }) => [
  {
    header: 'Name',
    accessor: (prompt) => (
      <div className={styles.nameCell}>
        <FileText size={18} />
        <Link to={`/prompts/${prompt.id}`} className={styles.promptLink} onClick={(e) => e.stopPropagation()}>
          {prompt.name}
        </Link>
      </div>
    ),
  },
  {
    header: 'Versions',
    accessor: (prompt) => prompt.versions,
  },
  {
    header: 'Type',
    accessor: (prompt) => prompt.type,
  },
  {
    header: 'Latest Version Created At',
    accessor: (prompt) => prompt.latestVersionCreatedAt,
  },
  {
    header: 'Number of Observations',
    accessor: (prompt) => (
      <div className={styles.observationCell}>
        {formatObservations(prompt.observations)}
      </div>
    ),
  },
  {
    header: 'Tags',
    accessor: (prompt) => (
      <div className={styles.tagsCell}>
        {/* 파라미터로 받은 onTagClick 함수를 사용합니다. */}
        <button className={styles.iconButton} onClick={(e) => onTagClick(e, prompt)}>
          {prompt.tags && prompt.tags.length > 0 ? (
            prompt.tags.map(tag => (
              <span key={tag} className={styles.tagPill}>{tag}</span>
            ))
          ) : (
            <Tag size={16} />
          )}
        </button>
      </div>
    ),
  },
];
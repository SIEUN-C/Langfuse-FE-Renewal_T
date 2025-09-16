// Prompts.jsx 최상단 또는 컴포넌트 외부에 정의
const promptTableColumns = [
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
        <button className={styles.iconButton} onClick={(e) => { e.stopPropagation(); handleTagClick(e, prompt); }}>
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
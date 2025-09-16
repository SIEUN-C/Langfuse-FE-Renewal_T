// src/Pages/Prompts/Prompts.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Prompts.module.css';
import useProjectId from 'hooks/useProjectId.js';
import {
  Info,
  Plus,
  ChevronDown,
  FileText,
  Trash2,
  Tag,
} from 'lucide-react';
import { fetchPrompts, deletePrompt, updatePromptTags } from '../services/promptsApi.js';
import SearchInput from '../../../components/SearchInput/SearchInput.jsx';
import FilterControls from '../../../components/FilterControls/FilterControls.jsx';
import { promptsFilterConfig } from '../../../components/FilterControls/filterConfig.js';
import PromptsPagination from '../components/PromptsPagination.jsx';
import TagEditor from '../components/TagEditor.jsx'

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [tagEditorAnchor, setTagEditorAnchor] = useState(null);

  const { projectId } = useProjectId();

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Names, Tags');
  const [builderFilters, setBuilderFilters] = useState(() => {
    const initialColumn = promptsFilterConfig[0];
    return [{ id: Date.now(), column: initialColumn.key, operator: initialColumn.operators[0], value: '', metaKey: '' }];
  });

  // 페이지네이션 상태 
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const pageSizes = [10, 20, 30, 50];

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    const loadPrompts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const formattedPrompts = await fetchPrompts(projectId);
        setPrompts(formattedPrompts);
      } catch (err) {
        console.error("Failed to fetch prompts:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, [projectId]);

  // 필터링된 프롬프트 계산
  const filteredPrompts = useMemo(() => {
    let tempPrompts = [...prompts];

    // 1. FilterBuilder의 고급 필터 적용
    const activeBuilderFilters = builderFilters.filter(f => String(f.value || '').trim() !== '');
    if (activeBuilderFilters.length > 0) {
      tempPrompts = tempPrompts.filter(prompt => {
        return activeBuilderFilters.every(filter => {
          const keyMap = { Name: 'name', Version: 'versions', Type: 'type', Labels: 'tags', Tags: 'tags' };
          const promptKey = keyMap[filter.column];
          if (!promptKey) return true;

          const promptValue = prompt[promptKey];
          const filterValue = filter.value;
          if (promptValue === null || promptValue === undefined) return false;

          const config = promptsFilterConfig.find(c => c.key === filter.column);
          if (!config) return true;

          const pvString = String(promptValue).toLowerCase();
          const fvString = String(filterValue).toLowerCase();

          switch (config.type) {
            case 'string':
              if (filter.operator === '=') return pvString === fvString;
              if (filter.operator === 'contains') return pvString.includes(fvString);
              if (filter.operator === 'does not contain') return !pvString.includes(fvString);
              if (filter.operator === 'starts with') return pvString.startsWith(fvString);
              if (filter.operator === 'ends with') return pvString.endsWith(fvString);
              return true;
            case 'number':
              const pvNum = Number(promptValue);
              const fvNum = Number(filterValue);
              if (isNaN(pvNum) || isNaN(fvNum)) return false;
              if (filter.operator === '=') return pvNum === fvNum;
              if (filter.operator === '>') return pvNum > fvNum;
              if (filter.operator === '<') return pvNum < fvNum;
              if (filter.operator === '>=') return pvNum >= fvNum;
              if (filter.operator === '<=') return pvNum <= fvNum;
              return true;
            case 'categorical':
              const fvArray = Array.isArray(filterValue) ? filterValue.map(v => v.toLowerCase()) : fvString.split(',');
              const pvArray = Array.isArray(promptValue) ? promptValue.map(v => String(v).toLowerCase()) : [pvString];
              if (filter.operator === 'any of') return fvArray.some(val => pvArray.includes(val));
              if (filter.operator === 'none of') return !fvArray.some(val => pvArray.includes(val));
              if (filter.operator === 'all of') return fvArray.every(val => pvArray.includes(val));
              return true;
            default:
              return true;
          }
        });
      });
    }

    // 2. 검색창(SearchInput) 필터 적용
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      tempPrompts = tempPrompts.filter(prompt => {
        if (searchType === 'Names, Tags') {
          const nameMatch = prompt.name ? prompt.name.toLowerCase().includes(query) : false;
          const tagMatch = Array.isArray(prompt.tags) && prompt.tags.some(tag => tag.toLowerCase().includes(query));
          return nameMatch || tagMatch;
        }
        if (searchType === 'Full Text') {
          return JSON.stringify(prompt).toLowerCase().includes(query);
        }
        return true;
      });
    }

    return tempPrompts;
  }, [prompts, builderFilters, searchQuery, searchType]);

  // 페이지네이션된 데이터 계산 
  const paginatedPrompts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPrompts.slice(startIndex, endIndex);
  }, [filteredPrompts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPrompts.length / pageSize);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 페이지 크기 변경 핸들러 
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  };

  const navigateToNewPrompts = () => {
    navigate("/prompts/new");
  };

  const formatObservations = (num) => {
    if (num > 999) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num;
  };

  const handleDeleteClick = (prompt) => {
    setPromptToDelete(prev => (prev?.id === prompt.id ? null : prompt));
  };

  const handleTagClick = (e, prompt) => {
    e.stopPropagation();
    if (editingPrompt && editingPrompt.id === prompt.id) {
      setEditingPrompt(null);
      setTagEditorAnchor(null);
    } else {
      setTagEditorAnchor(e.currentTarget);
      setEditingPrompt(prompt);
    }
  };

  const handleSaveTags = (newTags) => {
    if (!editingPrompt) return;
    setPrompts(prompts.map(p =>
      p.id === editingPrompt.id ? { ...p, tags: newTags } : p
    ));
  };

  const confirmDelete = async () => {
    if (!promptToDelete) return;

    try {
      await deletePrompt(promptToDelete.name, projectId);
      setPrompts(currentPrompts => currentPrompts.filter(p => p.id !== promptToDelete.id));
      console.log(`프롬프트 "${promptToDelete.name}"가 성공적으로 삭제되었습니다.`);
      setPromptToDelete(null);
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>Prompts</h1>
          <Info size={16} className={styles.infoIcon} />
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={navigateToNewPrompts}>
            <Plus size={16} /> New prompt
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <SearchInput
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            searchType={searchType}
            setSearchType={setSearchType}
            searchTypes={['Names, Tags', 'Full Text']}
          />
        </div>
        <FilterControls
          builderFilterProps={{
            filters: builderFilters,
            onFilterChange: setBuilderFilters,
            filterConfig: promptsFilterConfig
          }}
        />
      </div>

      <div className={styles.contentArea}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Versions</th>
                <th>Type</th>
                <th>Latest Version Created At <ChevronDown size={14} /></th>
                <th>Number of Observations</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading prompts...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
              ) : paginatedPrompts.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No prompts found</td></tr>
              ) : (
                paginatedPrompts.map((prompt) => (
                  <React.Fragment key={prompt.id}>
                    <tr>
                      <td>
                        <div className={styles.nameCell}>
                          <FileText size={18} />
                          <Link to={`/prompts/${prompt.id}`} className={styles.promptLink}>
                            {prompt.name}
                          </Link>
                        </div>
                      </td>
                      <td>{prompt.versions}</td>
                      <td>{prompt.type}</td>
                      <td>{prompt.latestVersionCreatedAt}</td>
                      <td><div className={styles.observationCell}>{formatObservations(prompt.observations)}</div></td>
                      <td>
                        <div className={styles.tagsCell}>
                          <button className={styles.iconButton} onClick={(e) => handleTagClick(e, prompt)}>
                            {prompt.tags && prompt.tags.length > 0 ? (
                              prompt.tags.map(tag => (
                                <span key={tag} className={styles.tagPill}>
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <Tag size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button className={styles.iconButton} onClick={() => handleDeleteClick(prompt)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {promptToDelete && promptToDelete.id === prompt.id && (
                      <tr className={styles.confirmationRow}>
                        <td colSpan={7}>
                          <div className={styles.confirmationContainer}>
                            <div className={styles.confirmationContent}>
                              <h4 className={styles.confirmationTitle}>Please confirm</h4>
                              <p className={styles.confirmationText}>
                                This action permanently deletes this prompt. All requests to fetch prompt
                                <strong> {prompt.name} </strong> will error.
                              </p>
                            </div>
                            <button className={styles.deleteConfirmButton} onClick={confirmDelete}>
                              Delete Prompt
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션을 화면 하단에 고정 */}
      {totalPages > 0 && (
        <PromptsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizes={pageSizes}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          mode="fixed-bottom"
          sidebarCollapsed={false} // 실제 사이드바 상태에 따라 조정
        />
      )}

      {/* TagEditor 렌더링 로직 */}
      {editingPrompt && (
        <TagEditor
          promptName={editingPrompt.name}
          tags={editingPrompt.tags}
          onSave={handleSaveTags}
          onClose={() => {
            setEditingPrompt(null);
            setTagEditorAnchor(null);
          }}
          anchorEl={tagEditorAnchor}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default Prompts;
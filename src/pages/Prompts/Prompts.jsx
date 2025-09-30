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
import { fetchPrompts, deletePrompt, updatePromptTags } from './services/promptsApi.js';
import SearchInput from '../../components/SearchInput/SearchInput.jsx';
import FilterControls from '../../components/FilterControls/FilterControls.jsx';
import { promptsFilterConfig } from '../../components/FilterControls/filterConfig.js';
import TagEditor from './components/TagEditor.jsx'
import { useFilteredPrompts } from './hooks/useFilteredPrompts.js'
import { DataTable } from '../../components/DataTable/DataTable.jsx'
import { getPromptsColumns } from './components/PromptsColumns.jsx'

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [tagEditorAnchor, setTagEditorAnchor] = useState(null);

  const { projectId } = useProjectId();

  const { filteredPrompts, searchInputProps, filterControlsProps } = useFilteredPrompts(prompts);

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

  const navigateToNewPrompts = () => {
    navigate("/prompts/new");
  };

  const formatObservations = (num) => {
    if (num > 999) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num;
  };

  const handleDeleteClick = (promptId) => {
    const promptToSet = prompts.find(p => String(p.id) === promptId);

    if (promptToSet) {
      setPromptToDelete(prev => (prev?.id === promptToSet.id ? null : promptToSet));
    }
  };

  const handleRowClick = (prompt) => {
    navigate(`/prompts/${prompt.id}`);
  }

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
      setPromptToDelete(null);
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  const columns = useMemo(() => getPromptsColumns({
    onTagClick: handleTagClick,
  }), [handleTagClick]);

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
          <SearchInput {...searchInputProps}
          />
        </div>
        <FilterControls {...filterControlsProps} />
      </div>

      <div className={styles.contentArea}>
        <DataTable
          columns={columns}
          data={filteredPrompts}
          keyField="id"
          onRowClick={handleRowClick}
          showDelete={true}
          onDeleteClick={handleDeleteClick}
          pagination={{
            enabled: true,
            pageSize: 50,
            pageSizeOptions: [10, 20, 30, 50],
            position: 'fixed-bottom',
          }}
          renderEmptyState={() => {
            if (isLoading) return "Loading prompts...";
            if (error) return <span style={{ color: 'red' }}>{error}</span>;
            return "No prompts found";
          }}
        />
      </div>

      {promptToDelete && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationContainer}>
            <div className={styles.confirmationContent}>
              <h4 className={styles.confirmationTitle}>Please confirm</h4>
              <p className={styles.confirmationText}>
                This action permanently deletes this prompt. All requests to fetch prompt
                <strong> {promptToDelete.name} </strong> will error.
              </p>
            </div>
            <div className={styles.confirmationActions}>
              <button className={styles.cancelButton} onClick={() => setPromptToDelete(null)}>
                Cancel
              </button>
              <button className={styles.deleteConfirmButton} onClick={confirmDelete}>
                Delete Prompt
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div >
  );
};

export default Prompts;
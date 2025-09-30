
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './TagEditor.module.css';
import { updatePromptTags } from '../services/promptsApi';

//--- TagEditor 컴포넌트를 Prompts.jsx 파일 내부에 직접 정의 ---
const TagEditor = ({ promptName, tags, onSave, onClose, anchorEl, projectId }) => {
  const [currentTags, setCurrentTags] = useState(tags || []);
  const [inputValue, setInputValue] = useState('');
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 125 + (rect.width / 2),
      });
    }
  }, [anchorEl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) && !anchorEl.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorEl]);

  const saveTagsToApi = useCallback(async (tagsToSave) => {
    try {
      await updatePromptTags(promptName, tagsToSave, projectId);
      onSave(tagsToSave);
    } catch (error) {
      alert(`Failed to save tags: ${error.message}`);
      console.error(error);
    }
  }, [promptName, projectId, onSave]);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!currentTags.includes(newTag)) {
        const updatedTags = [...currentTags, newTag];
        setCurrentTags(updatedTags);
        setInputValue('');
        await saveTagsToApi(updatedTags);
      } else {
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && currentTags.length > 0) {
      e.preventDefault();
      const updatedTags = currentTags.slice(0, -1);
      setCurrentTags(updatedTags);
      await saveTagsToApi(updatedTags);
    }
  };

  const removeTag = async (tagToRemove) => {
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(updatedTags);
    await saveTagsToApi(updatedTags);
  };

  if (!anchorEl) return null;

  return (
    <div ref={popoverRef} className={styles.tagEditorPopover} style={position}>
      <div className={styles.tagEditorHeader}>
        <span className={styles.tagEditorTitle}>Prompt Tags</span>
      </div>
      <div className={styles.tagInputContainer}>
        {currentTags.map(tag => (
          <span key={tag} className={styles.tagEditorTag}>
            {tag}
            <button onClick={() => removeTag(tag)} className={styles.removeTagBtn}>×</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentTags.length === 0 ? "Add tags..." : ""}
          className={styles.tagEditorInput}
          autoFocus
        />
      </div>
    </div>
  );
};

export default TagEditor;
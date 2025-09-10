// PromptsDetail.jsx - 정리된 버전
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './PromptsDetail.module.css';
import SearchInput from '../../components/SearchInput/SearchInput.jsx';
import useProjectId from '../../hooks/useProjectId';
import {
  Book,
  Clipboard,
  Play,
  MoreVertical,
  Search,
  Plus,
  GitCommitHorizontal,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Tag,
  FileText,
} from 'lucide-react';
import DuplicatePromptModal from './DuplicatePromptModal.jsx';
import { duplicatePrompt } from './DuplicatePromptModalApi.js';
import { fetchPromptVersions } from './PromptsDetailApi.js';
import { deletePromptVersion, fetchPrompts } from './promptsApi.js';
import NewExperimentModal from './NewExperimentModal';
import SidePanel from '../../components/SidePanel/SidePanel.jsx';
import Comments from '../../components/Comments/Comments.jsx';
import { useComments } from '../../hooks/useComments.js';

// Reference 멘션 기능 컴포넌트
const PromptContentViewer = ({ content }) => {
  const navigate = useNavigate();
  const handleMentionClick = (promptName) => {
    navigate(`/prompts/${promptName}`);
  };

  const parsedContent = useMemo(() => {
    if (!content) return [];

    const regex = /@@@langfusePrompt:name=([^|]+)\|(version|label)=([^@]+)@@@/g;
    const parts = content.split(regex);
    const elements = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 4 === 0) {
        if (parts[i]) {
          elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
        }
      } else if (i % 4 === 1) {
        const name = parts[i];
        const key = parts[i + 1];
        const value = parts[i + 2];
        const badgeText = key === 'version' ? `v${value}` : value;

        elements.push(
          <span
            key={`mention-${i}`}
            className={styles.promptReference}
            onClick={() => handleMentionClick(name)}
            title={`Go to prompt: ${name}`}
          >
            <FileText size={14} />
            {name}
            <span className={styles.versionBadge}>{badgeText}</span>
          </span>
        );
      }
    }
    return elements;
  }, [content, navigate]);

  return <pre>{parsedContent.length > 0 ? parsedContent : content}</pre>;
};

// 메인 컴포넌트
export default function PromptsDetail() {
  // State 초기화
  const { id } = useParams();
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const playgroundMenuRef = useRef(null);
  const versionMenuRef = useRef(null);

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('Prompt');
  const [allPrompts, setAllPrompts] = useState([]);
  const [isDuplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [isPlaygroundMenuOpen, setPlaygroundMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExperimentModalOpen, setExperimentModalOpen] = useState(false);
  const [isVersionMenuOpen, setVersionMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Comments 훅
  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    addComment,
    removeComment,
  } = useComments(projectId, 'PROMPT', selectedVersion?.dbId);

  // Memoized Values
  const filteredVersions = useMemo(() => {
    const searchId = parseInt(searchQuery);
    if (searchQuery && !isNaN(searchId)) {
      return versions.filter(version => version.id === searchId);
    }
    if (!searchQuery) return versions;
    const query = searchQuery.toLowerCase();
    return versions.filter(version =>
      version.labels.some(label => label.toLowerCase().includes(query)) ||
      version.tags.some(tag => tag.toLowerCase().includes(query)) ||
      version.details.toLowerCase().includes(query) ||
      version.author.toLowerCase().includes(query)
    );
  }, [versions, searchQuery]);

  const { currentIndex, prevPromptName, nextPromptName } = useMemo(() => {
    if (!id || allPrompts.length === 0) {
      return { currentIndex: -1, prevPromptName: null, nextPromptName: null };
    }
    const idx = allPrompts.findIndex(name => name === id);
    return {
      currentIndex: idx,
      prevPromptName: idx > 0 ? allPrompts[idx - 1] : null,
      nextPromptName: idx < allPrompts.length - 1 ? allPrompts[idx + 1] : null,
    };
  }, [id, allPrompts]);

  const variables = useMemo(() => {
    if (!selectedVersion) return [];
    const promptData = selectedVersion.prompt;
    let textToScan = '';

    if (Array.isArray(promptData)) {
      textToScan = promptData.map(m => m.content || '').join(' ');
    } else if (typeof promptData === 'string') {
      textToScan = promptData;
    } else if (promptData && typeof promptData === 'object') {
      textToScan = `${promptData.system || ''} ${promptData.user || ''}`;
    }

    const regex = /{{\s*([\w\d_]+)\s*}}/g;
    const matches = textToScan.match(regex) || [];
    const uniqueVars = new Set(matches.map(v => v.replace(/[{}]/g, '').trim()));
    return Array.from(uniqueVars);
  }, [selectedVersion]);

  // 데이터 로딩 함수
  const loadPromptData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedVersions = await fetchPromptVersions(id, projectId);
      setVersions(fetchedVersions);
      if (fetchedVersions.length > 0) {
        setSelectedVersion(fetchedVersions[0]);
      }
    } catch (err) {
      console.error("Failed to fetch prompt details:", err);
      setError(`"${id}" 프롬프트를 불러오는 데 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  }, [id, projectId]);

  // Effects
  useEffect(() => {
    loadPromptData();
  }, [loadPromptData]);

  useEffect(() => {
    if (projectId) {
      const loadAllPrompts = async () => {
        try {
          const prompts = await fetchPrompts(projectId);
          setAllPrompts(prompts.map(p => p.name));
        } catch (error) {
          console.error("Failed to load all prompt names:", error);
        }
      };
      loadAllPrompts();
    }
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playgroundMenuRef.current && !playgroundMenuRef.current.contains(event.target)) {
        setPlaygroundMenuOpen(false);
      }
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target)) {
        setVersionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Event Handlers
  const handleNavigate = (promptName) => {
    if (promptName) {
      navigate(`/prompts/${promptName}`);
    }
  };

  const handleNewVersion = () => {
    if (!id || !selectedVersion) return;

    const isChatType = Array.isArray(selectedVersion.prompt);
    const chatContentValue = isChatType ? (selectedVersion.prompt || []) : [];
    const textContentValue = !isChatType ? (selectedVersion.prompt || '') : '';
    const configValue = selectedVersion.config ? JSON.stringify(selectedVersion.config, null, 2) : '{}';

    navigate(`/prompts/new`, {
      state: {
        projectId: projectId,
        promptName: id,
        promptType: isChatType ? 'Chat' : 'Text',
        chatContent: chatContentValue,
        textContent: textContentValue,
        config: configValue,
        isNewVersion: true,
        version: selectedVersion.id
      },
    });
  };

  const handleGoToPlayground = () => {
    if (!selectedVersion) return;
    const messages = [];
    if (selectedVersion.prompt.system) {
      messages.push({ id: Date.now() + 1, role: 'System', content: selectedVersion.prompt.system });
    }
    if (selectedVersion.prompt.user) {
      messages.push({ id: Date.now() + 2, role: 'User', content: selectedVersion.prompt.user });
    }
    navigate('/playground', {
      state: {
        promptName: id,
        promptVersion: selectedVersion.id,
        messages: messages,
        config: selectedVersion.config,
      }
    });
  };

  const handleDuplicateSubmit = async (newName, copyAll) => {
    if (!selectedVersion?.promptId) {
      alert("복사할 버전의 ID를 찾을 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      return;
    }
    try {
      const newPrompt = await duplicatePrompt(selectedVersion.promptId, newName, copyAll, projectId);
      alert(`프롬프트가 "${newName}"으로 복제되었습니다.`);
      setDuplicateModalOpen(false);
      if (newPrompt && newPrompt.name) {
        navigate(`/prompts/${newPrompt.name}`);
      }
    } catch (error) {
      console.error("프롬프트 복제 실패:", error);
      alert(`프롬프트 복제 중 오류 발생: ${error.message}`);
    }
  };

  const handleRunExperiment = () => {
    console.log("Create Experiment button clicked. Form data is in the modal.");
    alert('실험 생성 요청이 콘솔에 기록되었습니다.');
    setExperimentModalOpen(false);
  };

  const handleDeleteVersion = async () => {
    if (!selectedVersion || !selectedVersion.dbId) {
      alert("삭제할 버전을 선택해주세요.");
      return;
    }

    const confirmDelete = window.confirm(
      `정말로 버전 #${selectedVersion.id} 을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    );

    if (confirmDelete) {
      try {
        await deletePromptVersion(selectedVersion.dbId, projectId);
        alert(`버전 #${selectedVersion.id} 이(가) 성공적으로 삭제되었습니다.`);
        loadPromptData();
      } catch (error) {
        console.error("버전 삭제 실패:", error);
        alert(`버전 삭제 중 오류 발생: ${error.message}`);
      }
    }
    setVersionMenuOpen(false);
  };

  // 로딩 상태
  if (isLoading) {
    return <div className={styles.container}><div className={styles.placeholder}>프롬프트를 불러오는 중...</div></div>;
  }

  // 에러 상태
  if (error || !selectedVersion) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breadcrumbs}>
            <Book size={16} />
            <Link to="/prompts" style={{ color: '#94a3b8', textDecoration: 'none' }}>Prompts</Link>
            <span>/</span>
            <span className={styles.promptName}>{id}</span>
          </div>
        </div>
        <div className={styles.placeholder}>⚠️ {error || "프롬프트 데이터를 찾을 수 없습니다."}</div>
      </div>
    );
  }

  // 메인 렌더링
  return (
    <div className={styles.container}>
      {/* 상단 탭 */}
      <div className={styles.tabs}>
        <button className={`${styles.tabButton} ${styles.active}`}>Versions</button>
      </div>

      <div className={styles.mainGrid}>
        {/* 좌측 패널 - 버전 리스트 */}
        <div className={styles.leftPanel}>
          <div className={styles.versionToolbar}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search versions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className={styles.newButton} onClick={handleNewVersion}>
              <Plus size={16} /> New Version
            </button>
          </div>
          <ul className={styles.versionList}>
            {filteredVersions.map(version => (
              <li
                key={version.id}
                className={`${styles.versionItem} ${selectedVersion?.id === version.id ? styles.selected : ''}`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className={styles.versionTitle}>
                  <span className={styles.versionLabel}>#{version.id}</span>
                </div>
                <div className={styles.tagsContainer}>
                  {version.labels.map(label => (
                    <span key={label} className={label.toLowerCase() === 'production' ? styles.statusTagProd : styles.statusTagLatest}>
                      <GitCommitHorizontal size={12} />{label}
                    </span>
                  ))}
                </div>
                <div className={styles.versionMeta}>
                  {version.commitMessage && <p>{version.commitMessage}</p>}
                  <p>{version.details} by {version.author}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 우측 패널 */}
        <div className={styles.rightPanel}>
          {/* 우측 패널 헤더 - 버전 정보 */}
          <div className={styles.rightPanelHeader}>
            <div className={styles.versionInfo}>
              <span className={styles.versionNumber}># {selectedVersion.id}</span>
              {selectedVersion?.commitMessage && (
                <span className={styles.commitMessage}>{selectedVersion.commitMessage}</span>
              )}
              <div className={styles.labelsContainer}>
                {selectedVersion.labels.map(label => (
                  <span key={label} className={label.toLowerCase() === 'production' ? styles.statusTagProd : styles.statusTagLatest}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.actionButton} onClick={() => setDuplicateModalOpen(true)}>
                <Clipboard size={14} /> Duplicate
              </button>
              <div className={styles.navButtons}>
                <button
                  className={styles.navButton}
                  onClick={() => handleNavigate(prevPromptName)}
                  disabled={!prevPromptName}
                  title={prevPromptName ? `Go to ${prevPromptName}` : "First prompt"}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className={styles.navButton}
                  onClick={() => handleNavigate(nextPromptName)}
                  disabled={!nextPromptName}
                  title={nextPromptName ? `Go to ${nextPromptName}` : "Last prompt"}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* 탭 영역 */}
          <div className={styles.detailTabs}>
            <div className={styles.detailTabButtons}>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Prompt' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Prompt')}>Prompt</button>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Config' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Config')}>Config</button>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Generations' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Generations')}>Linked Generations</button>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Use' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Use')}>Use Prompt</button>
            </div>
            <div className={styles.detailActions}>
              <div className={styles.playgroundDropdownContainer} ref={playgroundMenuRef}>
                <button
                  className={styles.playgroundButton}
                  onClick={() => setPlaygroundMenuOpen(prev => !prev)}
                >
                  <Play size={14} /> Playground
                </button>
                {isPlaygroundMenuOpen && (
                  <div className={styles.playgroundDropdownMenu}>
                    <div className={styles.playgroundDropdownItem} onClick={handleGoToPlayground}>
                      Fresh playground
                    </div>
                    <div className={styles.playgroundDropdownItem} onClick={() => alert('Add to existing 기능은 아직 구현되지 않았습니다.')}>
                      Add to existing
                    </div>
                  </div>
                )}
              </div>
              <button
                className={styles.playgroundButton}
                onClick={() => setExperimentModalOpen(true)}
              >
                Dataset run
              </button>
              <button className={styles.iconButton} onClick={() => setIsCommentsOpen(true)}>
                <MessageCircle size={16} />
              </button>
              <div className={styles.versionMenuContainer} ref={versionMenuRef}>
                <button
                  className={styles.iconButton}
                  onClick={() => setVersionMenuOpen(prev => !prev)}
                >
                  <MoreVertical size={18} />
                </button>
                {isVersionMenuOpen && (
                  <div className={styles.versionDropdownMenu}>
                    <button className={styles.versionMenuItem} onClick={handleDeleteVersion}>
                      Delete version
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div className={styles.promptArea}>
            {activeDetailTab === 'Prompt' && (
              <>
                {Array.isArray(selectedVersion.prompt) ? (
                  selectedVersion.prompt.map((message, index) => (
                    <div className={styles.promptCard} key={index}>
                      <div className={styles.promptHeader}>
                        {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
                      </div>
                      <div className={styles.promptBody}>
                        <PromptContentViewer content={message.content} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.promptCard}>
                    <div className={styles.promptHeader}>Text Prompt</div>
                    <div className={styles.promptBody}>
                      <PromptContentViewer content={selectedVersion.prompt} />
                    </div>
                  </div>
                )}
                {variables.length > 0 && (
                  <div className={styles.variablesInfo}>
                    The following variables are available:
                    <div className={styles.variablesContainer}>
                      {variables.map(v => <span key={v} className={styles.variableTag}>{v}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}
            {activeDetailTab === 'Config' && (
              <div className={styles.promptCard}>
                <div className={styles.promptHeader}>Config</div>
                <div className={styles.promptBody}><pre>{JSON.stringify(selectedVersion.config ?? {}, null, 2)}</pre></div>
              </div>
            )}
            {activeDetailTab === 'Use' && (
              <>
                <div className={styles.promptCard}>
                  <div className={styles.promptHeader}>Python</div>
                  <div className={styles.promptBody}><pre>{selectedVersion.useprompts.python}</pre></div>
                </div>
                <div className={styles.promptCard}>
                  <div className={styles.promptHeader}>JS/TS</div>
                  <div className={styles.promptBody}><pre>{selectedVersion.useprompts.jsTs}</pre></div>
                </div>
              </>
            )}
            {activeDetailTab === 'Generations' && <div className={styles.placeholder}>No generations linked yet.</div>}
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {isDuplicateModalOpen && (
        <DuplicatePromptModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          onSubmit={handleDuplicateSubmit}
          currentName={id || ''}
          currentVersion={selectedVersion?.id || 0}
        />
      )}
      {isExperimentModalOpen && (
        <NewExperimentModal
          isOpen={isExperimentModalOpen}
          onClose={() => setExperimentModalOpen(false)}
          onSubmit={handleRunExperiment}
          promptName={id}
          promptVersion={selectedVersion?.id}
        />
      )}

      <SidePanel
        title="Comments"
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      >
        <Comments
          comments={comments}
          isLoading={isCommentsLoading}
          error={commentsError}
          onAddComment={addComment}
          onDeleteComment={removeComment}
        />
      </SidePanel>
    </div>
  );
}
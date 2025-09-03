// PromptsDetail.jsx
// 수정 코드
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
  // --- ▼▼▼ [수정] 프롬프트 이동 화살표 구현 ▼▼▼ ---
  ChevronUp,
  ChevronDown,
  // --- ▲▲▲ [수정] 프롬프트 이동 화살표 구현 ▲▲▲ ---
  MessageCircle,
  Tag,
  // --- ▼▼▼ [추가] Reference 멘션 기능 구현 ▼▼▼ ---
  FileText,
  // --- ▲▲▲ [추가] Reference 멘션 기능 구현 ▲▲▲ ---
} from 'lucide-react';
import DuplicatePromptModal from './DuplicatePromptModal.jsx';
import { duplicatePrompt } from './DuplicatePromptModalApi.js';
import { fetchPromptVersions } from './PromptsDetailApi.js';
// --- ▼▼▼ [추가]  프롬프트 이동 화살표 구현 + 버전 삭제 ▼▼▼ ---
import { deletePromptVersion, fetchPrompts } from './promptsApi.js';
// --- ▲▲▲ [추가]  프롬프트 이동 화살표 구현 + 버전 삭제 ▲▲▲ ---
import NewExperimentModal from './NewExperimentModal';
// --- ▼▼▼ [추가] Comments ▼▼▼ ---
import SidePanel from '../../components/SidePanel/SidePanel.jsx';
import Comments from '../../components/Comments/Comments.jsx';
import { useComments } from '../../hooks/useComments.js';
// --- ▲▲▲ [추가] Comments ▲▲▲ ---

// --- ▼▼▼ [추가] Reference 멘션 기능 구현 ▼▼▼ ---
// 이 컴포넌트는 텍스트를 분석하여 참조 태그를 클릭 가능한 멘션으로 렌더링합니다.
const PromptContentViewer = ({ content }) => {
  const navigate = useNavigate();
  const handleMentionClick = (promptName) => {
    navigate(`/prompts/${promptName}`);
  };

  const parsedContent = useMemo(() => {
    if (!content) return [];

    // 정규식을 수정하여 'version' 또는 'label'을 키로 인식하도록 변경
    const regex = /@@@langfusePrompt:name=([^|]+)\|(version|label)=([^@]+)@@@/g;
    const parts = content.split(regex);
    const elements = [];

    // 루프 구조를 수정하여 [텍스트, name, key, value] 그룹을 처리
    for (let i = 0; i < parts.length; i++) {
      if (i % 4 === 0) {
        if (parts[i]) {
          elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
        }
      } else if (i % 4 === 1) {
        const name = parts[i];
        const key = parts[i + 1]; // 'version' 또는 'label'
        const value = parts[i + 2];

        // key 값에 따라 배지 텍스트를 다르게 표시
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
// --- ▲▲▲ [추가] Reference 멘션 기능 구현 ▲▲▲ ---

// --- 메인 컴포넌트 ---
export default function PromptsDetail() {
  // 1. Hooks and State Initialization
  const { id } = useParams();
  const navigate = useNavigate();
  const { projectId } = useProjectId();
  const playgroundMenuRef = useRef(null);

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('Prompt');
  // --- ▼▼▼ [수정] 프롬프트 이동 화살표 구현 ▼▼▼ ---
  const [allPrompts, setAllPrompts] = useState([]);
  // --- ▲▲▲ [추가] 프롬프트 이동 화살표 구현 ▲▲▲ ---
  const [isDuplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [isPlaygroundMenuOpen, setPlaygroundMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExperimentModalOpen, setExperimentModalOpen] = useState(false);
  // --- ▼▼▼ [추가] 버전 삭제 ▼▼▼ ---
  const [isVersionMenuOpen, setVersionMenuOpen] = useState(false);
  const versionMenuRef = useRef(null);
  // --- ▲▲▲ [추가] 버전 삭제 ▲▲▲ ---
  // --- ▼▼▼ [추가] Comments ▼▼▼ ---
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // useComments 훅을 사용하여 댓글 데이터 및 함수를 가져옵니다.
  // selectedVersion이 있을 때만 objectId를 전달합니다.
  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    addComment,
    removeComment,
  } = useComments(projectId, 'PROMPT', selectedVersion?.dbId);
  // --- ▲▲▲ [추가] Comments ▲▲▲ ---

  // 2. Memoized Values
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

  // --- ▼▼▼ [추가] 프롬프트 이동 화살표 구현 ▼▼▼ ---
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
  // --- ▲▲▲ [추가] 프롬프트 이동 화살표 구현 ▲▲▲ ---

  const variables = useMemo(() => {
    if (!selectedVersion) return [];
    const promptData = selectedVersion.prompt;
    let textToScan = '';

    if (Array.isArray(promptData)) {
      textToScan = promptData.map(m => m.content || '').join(' ');
    } else if (typeof promptData === 'string') {
      textToScan = promptData;
    } else if (promptData && typeof promptData === 'object') {
      // 이전 구조 호환성 유지
      textToScan = `${promptData.system || ''} ${promptData.user || ''}`;
    }

    const regex = /{{\s*([\w\d_]+)\s*}}/g;
    const matches = textToScan.match(regex) || [];
    const uniqueVars = new Set(matches.map(v => v.replace(/[{}]/g, '').trim()));
    return Array.from(uniqueVars);
  }, [selectedVersion]);

  // 3. Data Fetching and Side Effects
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

  useEffect(() => {
    loadPromptData();
  }, [loadPromptData]);

  // --- ▼▼▼ [추가] 프롬프트 이동 화살표 구현 ▼▼▼ ---
  useEffect(() => {
    if (projectId) {
      const loadAllPrompts = async () => {
        try {
          const prompts = await fetchPrompts(projectId);
          setAllPrompts(prompts.map(p => p.name)); // 이름 배열만 저장
        } catch (error) {
          console.error("Failed to load all prompt names:", error);
        }
      };
      loadAllPrompts();
    }
  }, [projectId]);
  // --- ▲▲▲ [추가] 프롬프트 이동 화살표 구현 ▲▲▲ ---

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playgroundMenuRef.current && !playgroundMenuRef.current.contains(event.target)) {
        setPlaygroundMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- ▼▼▼ [추가] 버전 삭제 ▼▼▼ ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target)) {
        setVersionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // --- ▲▲▲ [추가] 버전 삭제 ▲▲▲ ---

  // 4. Event Handlers
  // --- ▼▼▼ [추가] 프롬프트 이동 화살표 구현 ▼▼▼ ---
  const handleNavigate = (promptName) => {
    if (promptName) {
      navigate(`/prompts/${promptName}`);
    }
  };
  // --- ▲▲▲ [추가] 프롬프트 이동 화살표 구현 ▲▲▲ ---

  // src/Pages/Prompts/PromptsDetail.jsx

// (다른 코드는 그대로)

// 🔎 파일에서 handleNewVersion 함수를 찾아서, 함수 전체를 아래 코드로 교체해주세요.

  const handleNewVersion = () => {
    if (!id || !selectedVersion) return;

    // [핵심 수정] 타입을 UI 렌더링 로직과 동일하게 'prompt'가 배열인지 여부로 판단합니다.
    const isChatType = Array.isArray(selectedVersion.prompt);

    // [안정성 강화] 타입에 따라 content를 명확히 구분하고, 값이 없을 경우 기본값을 설정합니다.
    const chatContentValue = isChatType ? (selectedVersion.prompt || []) : [];
    const textContentValue = !isChatType ? (selectedVersion.prompt || '') : '';
    
    const configValue = selectedVersion.config ? JSON.stringify(selectedVersion.config, null, 2) : '{}';

    navigate(`/prompts/new`, {
        state: {
            projectId: projectId,
            promptName: id,
            promptType: isChatType ? 'Chat' : 'Text', // 이제 이 값이 정확해집니다.
            chatContent: chatContentValue,
            textContent: textContentValue,
            config: configValue,
            isNewVersion: true,
            version: selectedVersion.id
        },
    });
  };
// (이하 코드는 그대로)

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

  // --- ▼▼▼ [추가] 버전 삭제 ▼▼▼ ---
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
        // 삭제 후 데이터 다시 로드
        loadPromptData();
      } catch (error) {
        console.error("버전 삭제 실패:", error);
        alert(`버전 삭제 중 오류 발생: ${error.message}`);
      }
    }
    setVersionMenuOpen(false); // 메뉴 닫기
  };
  // --- ▲▲▲ [추가] 버전 삭제 ▲▲▲ ---

  // 5. Conditional Renders for Loading/Error States
  if (isLoading) {
    return <div className={styles.container}><div className={styles.placeholder}>프롬프트를 불러오는 중...</div></div>;
  }

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

  // 6. Main Render
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <h1 className={styles.promptNameH1}>{id}</h1>
          <div className={styles.versionDropdown}>
            {selectedVersion.tags.map(tag => (
              <span key={tag} className={styles.tagItem}><Tag size={12} /> {tag}</span>
            ))}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => setDuplicateModalOpen(true)}>
            <Clipboard size={14} /> Duplicate
          </button>
          {/* --- ▼▼▼ [수정] 프롬프트 이동 화살표 구현 ▼▼▼ --- */}
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
          {/* --- ▲▲▲ [수정] 프롬프트 이동 화살표 구현 ▲▲▲ --- */}
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabButton} ${styles.active}`}>Versions</button>
      </div>

      <div className={styles.mainGrid}>
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
                  <p>{version.details}</p>
                  <p>by {version.author}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.rightPanel}>
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
              {/* --- ▼▼▼ [수정] Comments ▼▼▼ --- */}
              <button className={styles.iconButton} onClick={() => setIsCommentsOpen(true)}>
                <MessageCircle size={16} />
              </button>
              {/* --- ▲▲▲ [수정] Comments ▲▲▲ --- */}
              {/* --- ▼▼▼ [수정] 버전 삭제 ▼▼▼ --- */}
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
              {/* --- ▲▲▲ [수정] 버전 삭제 ▲▲▲ --- */}
            </div>
          </div>
          <div className={styles.promptArea}>
            {activeDetailTab === 'Prompt' && (
              <>
                {Array.isArray(selectedVersion.prompt) ? (
                  // Chat 타입 렌더링
                  selectedVersion.prompt.map((message, index) => (
                    <div className={styles.promptCard} key={index}>
                      <div className={styles.promptHeader}>
                        {/* 'placeholder' 역할의 첫 글자를 대문자로 변경하여 표시 */}
                        {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
                      </div>
                      <div className={styles.promptBody}>
                        <PromptContentViewer content={message.content} />
                      </div>
                    </div>
                  ))
                ) : (
                  // Text 타입 렌더링
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
            {/* --- ▼▼▼ [수정] Config 및 Use Prompts 탭 컨텐츠 렌더링 로직 추가 ▼▼▼ --- */}
            {/* 원인: 기존 코드에서 Config와 Use Prompts 탭을 눌렀을 때 표시될 컨텐츠가 누락되어 있었습니다. */}
            {/* 해결: 아래에 각 탭에 맞는 컨텐츠(config json, API 사용법 코드 블록)를 표시하는 JSX 코드를 추가하여 문제를 해결합니다. */}
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

      {/* --- ▼▼▼ [추가] Comments ▼▼▼ --- */}
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
      {/* --- ▲▲▲ [추가] Comments ▲▲▲ --- */}
    </div>
  );
}
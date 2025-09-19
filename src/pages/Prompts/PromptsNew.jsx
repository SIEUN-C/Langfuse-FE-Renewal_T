import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './PromptsNew.module.css';
import { Book } from 'lucide-react';
import PromptsReference from './components/modals/PromptsReference.jsx';
import ChatBox from '../../components/ChatBox/ChatBox.jsx';
import LineNumberedTextarea from '../../components/LineNumberedTextarea/LineNumberedTextarea.jsx';
import CodeBlock from '../../components/CodeBlock/CodeBlock.jsx';
import FormPageLayout from '../../components/Layouts/FormPageLayout.jsx';
import FormGroup from '../../components/Form/FormGroup.jsx';
import { createPromptOrVersion } from './services/PromptsNewApi.js';
import useProjectId from 'hooks/useProjectId';

const PromptsNew = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = useProjectId();

    const initialState = location.state || {};
    const [promptName, setPromptName] = useState(initialState.promptName || '');
    const [promptType, setPromptType] = useState(
        (initialState.promptType && initialState.promptType.toLowerCase() === 'text')
            ? 'Text'
            : 'Chat'
    );
    
    // --- START: chatContent 초기화 로직 수정 ---
    // 각 메시지에 고유 ID를 부여하고 role 형식을 맞춥니다.
    const [chatContent, setChatContent] = useState(
        (initialState.chatContent || []).map(message => {
            const formattedRole = message.role
                ? message.role.charAt(0).toUpperCase() + message.role.slice(1).toLowerCase()
                : 'System'; // role이 없는 경우 기본값
            return {
                ...message,
                id: message.id || crypto.randomUUID(), // ID가 없으면 새로 생성
                role: formattedRole
            };
        })
    );
    // --- END: chatContent 초기화 로직 수정 ---
    
    const [textContent, setTextContent] = useState(
        typeof initialState.textContent === 'string' ? initialState.textContent : ''
    );
    const [config, setConfig] = useState(initialState.config || '{ }');
    const [labels, setLabels] = useState(initialState.labels || { production: true });
    const [commitMessage, setCommitMessage] = useState('');
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
    const [variables, setVariables] = useState([]);
    const isNewVersionMode = initialState.isNewVersion || false;
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        const extractVariables = (text) => {
            if (typeof text !== 'string') return [];
            const regex = /{{\s*(\w+)\s*}}/g;
            const matches = text.match(regex) || [];
            return matches.map(match => match.replace(/[{}]/g, '').trim());
        };

        let allVars = [];
        if (promptType === 'Text') {
            allVars = extractVariables(textContent);
        } else {
            const chatVars = chatContent.flatMap(msg => extractVariables(msg.content));
            allVars = [...chatVars];
        }
        setVariables([...new Set(allVars)]);
    }, [textContent, chatContent, promptType]);

    // --- START: ChatBox 변경 핸들러 추가 ---
    // ChatBox에서 메시지가 변경될 때마다 ID가 있는지 확인하고 없으면 부여합니다.
    const handleChatContentChange = (newChatContent) => {
        const contentWithIds = newChatContent.map(msg => ({
            ...msg,
            id: msg.id || crypto.randomUUID()
        }));
        setChatContent(contentWithIds);
    };
    // --- END: ChatBox 변경 핸들러 추가 ---

    const handleLabelChange = (e) => {
        const { name, checked } = e.target;
        setLabels((prev) => ({ ...prev, [name]: checked }));
    };

    const handleInsertReference = (referenceTag) => {
        if (promptType === 'Text') {
            setTextContent((prev) => prev + referenceTag);
        } else {
            navigator.clipboard.writeText(referenceTag).then(() => {
                alert(`참조 태그가 클립보드에 복사되었습니다: ${referenceTag}`);
            });
        }
    };

    const handleSave = async () => {
        setSaveError('');
        if (!projectId) {
            setSaveError("오류: 프로젝트가 선택되지 않았습니다.");
            return;
        }

        try {
            await createPromptOrVersion({
                promptName, promptType, chatContent, textContent,
                config, labels, commitMessage
            }, projectId);
            alert(`'${promptName}' 프롬프트가 성공적으로 저장되었습니다.`);
            navigate(`/prompts/${promptName}`);
        } catch (err) {
            console.error("Failed to save prompt:", err);
            const errorMessage = err.message || "알 수 없는 오류가 발생했습니다.";
            setSaveError(`저장 실패: ${errorMessage}`);
        }
    };

    const breadcrumbs = (
        <>
            <Book size={16} />
            <Link to="/prompts">Prompts</Link>
            <span>/</span>
            {isNewVersionMode ? (
                <>
                    <Link to={`/prompts/${promptName}`}>{promptName}</Link>
                    <span>/</span>
                    <span className="active">New Version</span>
                </>
            ) : (
                <span className="active">New prompt</span>
            )}
        </>
    );

    return (
        <FormPageLayout
            breadcrumbs={breadcrumbs}
            onSave={handleSave}
            onCancel={() => navigate(isNewVersionMode ? `/prompts/${promptName}` : '/prompts')}
            isSaveDisabled={!promptName.trim()}
            saveError={saveError}
        >
            <FormGroup
                htmlFor="prompt-name"
                label="Name"
                subLabel="Unique identifier for this prompt."
            >
                <input
                    id="prompt-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. summarize-short-text"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    disabled={isNewVersionMode}
                />
            </FormGroup>

            <FormGroup
                htmlFor="prompt-content"
                label="Prompt"
                subLabel="Define your prompt template."
            >
                <div className={styles.promptHeader}>
                    <div className={styles.typeSelector}>
                        <button className={`${styles.typeButton} ${promptType === 'Chat' ? styles.active : ''}`} onClick={() => setPromptType('Chat')} disabled={isNewVersionMode}>Chat</button>
                        <button className={`${styles.typeButton} ${promptType === 'Text' ? styles.active : ''}`} onClick={() => setPromptType('Text')} disabled={isNewVersionMode}>Text</button>
                    </div>
                    <button className={styles.addReferenceButton} onClick={() => setIsReferenceModalOpen(true)}>
                        + Add prompt reference
                    </button>
                </div>
                {promptType === 'Text' ? (
                    <LineNumberedTextarea
                        id="prompt-content"
                        value={textContent || ''}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder='Enter your text prompt here, e.g. "Summarize this: {{text}}"'
                        minHeight={200}
                    />
                ) : (
                    <ChatBox
                        value={chatContent}
                        onChange={handleChatContentChange} // 직접 setChatContent 대신 핸들러 사용
                        schema="rolePlaceholder"
                        autoInit={true}
                    />
                )}
                {variables.length > 0 && (
                    <div className={styles.variablesContainer}>
                        <span className={styles.variablesLabel}>VARIABLES:</span>
                        {variables.map((variable, index) => (
                            <span key={index} className={styles.variableTag}>{variable}</span>
                        ))}
                    </div>
                )}
            </FormGroup>

            {/* ... 나머지 FormGroup 컴포넌트들은 그대로 유지 ... */}
            <FormGroup
                htmlFor="prompt-config"
                label="Config"
                subLabel="Arbitrary JSON configuration that is available on the prompt."
            >
                <CodeBlock
                    code={config}
                    onChange={setConfig}
                />
            </FormGroup>

            <FormGroup
                htmlFor="labels"
                label="Labels"
                subLabel="Apply labels to the new version to organize your prompts."
            >
                <div className={styles.labelsContainer}>
                    <label className={styles.checkboxWrapper}>
                        <input type="checkbox" name="production" checked={labels.production || false} onChange={handleLabelChange} />
                        <span>Set the "Production" label</span>
                    </label>
                </div>
            </FormGroup>

            <FormGroup
                htmlFor="prompt-commit-message"
                label="Commit Message"
                subLabel="Optional message to describe the changes in this version."
            >
                <input id="prompt-commit-message" type="text" className="form-input" placeholder="e.g. fix typo in system prompt" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} />
            </FormGroup>

            {isReferenceModalOpen && (
                <PromptsReference
                    onClose={() => setIsReferenceModalOpen(false)}
                    onInsert={handleInsertReference}
                />
            )}
        </FormPageLayout>
    );
};

export default PromptsNew;
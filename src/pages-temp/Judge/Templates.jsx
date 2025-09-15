import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useProjectId from 'hooks/useProjectId';
import { getTemplateById, getDefaultModel, getAllTemplateVersionsByName } from "./services/libraryApi.js";
import styles from "./Templates.module.css";
import FormPageLayout from "../../components/Layouts/FormPageLayout.jsx";
import FormGroup from "../../components/Form/FormGroup.jsx";
import CodeBlock from "../../components/CodeBlock/CodeBlock.jsx";
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

const Templates = ({ templateId: propTemplateId, mode = 'full' }) => {
  const { templateId: paramTemplateId } = useParams();
  const [activeTemplateId, setActiveTemplateId] = useState(propTemplateId || paramTemplateId);
  const { projectId } = useProjectId();
  const navigate = useNavigate();

  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [variables, setVariables] = useState([]);
  const [defaultModel, setDefaultModel] = useState(null);
  const [useDefaultModel, setUseDefaultModel] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !activeTemplateId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [templateResponse, modelResponse] = await Promise.all([
          getTemplateById(projectId, activeTemplateId),
          getDefaultModel(projectId)
        ]);

        // 각 API의 결과를 state에 저장합니다.
        setTemplateData(templateResponse);
        setDefaultModel(modelResponse);

        // 기존의 변수 추출 로직은 그대로 유지합니다.
        if (templateResponse && templateResponse.prompt) {
          const extractVariables = (text) => {
            const regex = /{{\s*(\w+)\s*}}/g;
            const matches = text.match(regex) || [];
            return [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))];
          };
          setVariables(extractVariables(templateResponse.prompt));
        }

      } catch (err) {
        setError("Failed to load template details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, activeTemplateId]);

  useEffect(() => {
    if (!templateData?.name || !projectId) {
      return;
    }

    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const versions = await getAllTemplateVersionsByName(projectId, templateData.name);
        setHistory(versions);
      } catch (err) {
        console.error('Failed to fetch template history', err);
        setHistory([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [templateData, projectId]);

  if (loading) {
    return <div className={styles.message}>Loading template...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!templateData) {
    return <div className={styles.message}>Template not found.</div>;
  }

  const handleDefaultModel = () => {
    navigate(`/llm-as-a-judge/default-model`)
  };

  const maxVersion = history.length > 0
    ? Math.max(...history.map(item => item.version))
    : 0;

  return (
    <div className={styles.templatePageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.evaluatorFormContainer}>
          <header className={styles.evaluatorFormHeader}>
            <h2>{templateData.name}</h2>
            {mode != 'panel' && (
              <button onClick={toggleSidebar} className={styles.toggleButton}>
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
          </header>

          <form className={styles.evaluatorFormBody} onSubmit={(e) => e.preventDefault()}>
            {/* --- Model Section Box START --- */}
            <div className={styles.formSectionBox}>
              <div className={styles.formGroup}>
                <label>Model</label>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="useDefaultModel"
                    checked={useDefaultModel}
                    onChange={(e) => setUseDefaultModel(e.target.checked)}
                  />
                  <label htmlFor="useDefaultModel">Use default evaluation model</label>
                </div>
                <div className={styles.modelInfo}>
                  {defaultModel ? (
                    <>
                      <span className={styles.modelName}>
                        Current default model: {defaultModel.provider}/{defaultModel.model}
                      </span>
                      <button onClick={handleDefaultModel} className={styles.editButton}>
                        <Pencil size={16} />
                      </button>
                    </>
                  ) : (
                    <span className={styles.modelName}>
                      No default model set
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* --- Model Section Box END --- */}

            {/* --- Prompt Section Box START --- */}
            <div className={styles.formSectionBox}>
              <div className={styles.formGroup}>
                <label htmlFor="evaluationPrompt">prompt</label>
                <br /> Evaluation prompt
                <p className={styles.description}>
                  Define your llm-as-a-judge evaluation template. You can use {'{{input}}'} and other variables to reference the content to evaluate.
                </p>
                <CodeBlock
                  code={templateData.prompt}
                />
                {variables.length > 0 && (
                  <div className={styles.variablesContainer}>
                    <div className={styles.variablesLabel}>The following variables are available:</div>
                    {variables.map((variable, index) => (
                      <span key={index} className={styles.variableTag}>
                        {variable}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="scoreReasoningPrompt">Score reasoning prompt</label>
                <p className={styles.description}>
                  Define how the LLM should explain its evaluation. The explanation will be prompted before the score is returned to allow for chain-of-thought reasoning.
                </p>
                <input
                  type="text"
                  id="scoreReasoningPrompt"
                  value={templateData.outputSchema.score}
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="scoreRangePrompt">Score range prompt</label>
                <p className={styles.description}>
                  Define how the LLM should return the evaluation score in natural language. Needs to yield a numeric value.
                </p>
                <input
                  type="text"
                  id="scoreRangePrompt"
                  value={templateData.outputSchema.reasoning}
                  readOnly
                />
              </div>
            </div>
            {/* --- Prompt Section Box END --- */}
          </form>
        </div>

        {mode != 'panel' && (
          <>
            {/* 3. 사이드바 영역 */}
            <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
              <div className={styles.sidebarHeader}>
                <h3>Change history</h3>
              </div>
              <div className={styles.sidebarContent}>
                {isHistoryLoading ? (
                  <p>Loading history...</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id}
                      onClick={() => setActiveTemplateId(item.id)}
                      className={`${styles.historyItem} ${activeTemplateId === item.id ? styles.activeHistory : ''}`}
                    >
                      <span className={styles.historyNumber}>#{item.version}</span>
                      {item.version === maxVersion ? (
                        <span className={styles.historyStatus}>active</span>
                      ) : (
                        <span className={`${styles.historyStatus} ${styles.statusPlaceholder}`}>
                          active
                        </span>
                      )}
                      <span className={styles.historyDate}>{item.createdAt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default Templates;
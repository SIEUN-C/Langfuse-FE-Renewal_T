import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useProjectId from 'hooks/useProjectId';
import { getDefaultModel, createTemplate, getTemplateById } from "./services/libraryApi.js";
import styles from "./CustomEvaluator.module.css";
import FormPageLayout from "../../components/Layouts/FormPageLayout.jsx";
import FormGroup from "../../components/Form/FormGroup.jsx";
import CodeBlock from "../../components/CodeBlock/CodeBlock.jsx";
import { Pencil } from 'lucide-react';

const CustomEvaluator = () => {
  const { projectId } = useProjectId();
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [variables, setVariables] = useState([]);
  const [defaultModel, setDefaultModel] = useState(null);
  const [useDefaultModel, setUseDefaultModel] = useState(true);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scoreReasoning, setScoreReasoning] = useState('One sentence reasoning for the score');
  const [scoreRange, setScoreRange] = useState("Score between 0 and 1. Score 0 if false or negative and 1 if true or positive.")
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  // Library Edit
  const { templateId } = useParams();
  const isEditModel = Boolean(templateId);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [modelResponse] = await Promise.all([
          getDefaultModel(projectId)
        ]);

        setDefaultModel(modelResponse);

        if (isEditModel) {
          const templateData = await getTemplateById(projectId, templateId);
          // Library Edit
          if (templateData) {
            setName(templateData.name);
            setPrompt(templateData.prompt);
            setScoreReasoning(templateData.outputSchema.score);
            setScoreRange(templateData.outputSchema.reasoning);
          }
        }

      } catch (err) {
        setError("Failed to load template details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, templateId, isEditModel]);

  useEffect(() => {
    const extractVariables = (text) => {
      if (!text) return [];
      const regex = /{{\s*(\w+)\s*}}/g;
      const matches = text.match(regex) || [];
      return [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))];
    };

    const newVariables = extractVariables(prompt);
    setVariables(newVariables);
  }, [prompt]);

  if (loading) {
    return <div className={styles.message}>Loading Custom...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  const handleDefaultModel = () => {
    navigate(`/llm-as-a-judge/default-model`)
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Template 이름을 입력해주세요');
      return;
    }

    setIsSaving(true);

    try {
      const templeData = {
        projectId,
        name,
        prompt,
        variables,
        scoreReasoning,
        scoreRange,
      };

      const newTemplate = await createTemplate(templeData)

      alert('성공적으로 저장되었습니다.');

      navigate(`/llm-as-a-judge/templates/${newTemplate.id}`);
    } catch (error) {
      alert(`저장에 실패했습니다. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.evaluatorFormContainer}>
      <header className={styles.evaluatorFormHeader}>
        <h2>Create Custom Evaluator</h2>
      </header>

      <form className={styles.evaluatorFormBody} onSubmit={(e) => e.preventDefault()}>
        {/* Name Section */}
        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Select a template name"
          />
        </div>

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
              <span className={styles.modelName}> {loading ? (
                <p>Loading default model...</p>
              ) : defaultModel ? (
                <p>
                  Current default model:{" "}
                  <strong>
                    {defaultModel.provider} / {defaultModel.model}
                  </strong>
                </p>
              ) : (
                // 데이터가 없거나 API 호출에 실패한 경우
                <p>Default model not found</p>
              )}</span>
              <button onClick={handleDefaultModel} className={styles.editButton}>
                <Pencil size={16} />
              </button>
            </div>
          </div>
        </div>
        {/* --- Model Section Box END --- */}

        {/* --- Prompt Section Box START --- */}
        <div className={styles.formSectionBox}>
          <div className={styles.formGroup}>
            <label htmlFor="evaluationPrompt">Prompt</label>
            <br /> Evaluation prompt
            <p className={styles.description}>
              Define your llm-as-a-judge evaluation template. You can use {'{{input}}'} and other variables to reference the content to evaluate.
            </p>
            <CodeBlock
              code={prompt}
              onChange={(newValue) => setPrompt(newValue)}
            />
            {variables.length > 0 && (
              <div className={styles.variablesContainer}>
                <span className={styles.variablesLabel}>The following variables are available:</span>
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
              value={scoreReasoning}
              onChange={(e) => setScoreReasoning(e.target.value)}
              autoComplete='off'
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
              value={scoreRange}
              onChange={(e) => setScoreRange(e.target.value)}
              autoComplete='off'
            />
          </div>
        </div>
        {/* --- Prompt Section Box END --- */}
      </form>
      <div className={styles.formFooter}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};
export default CustomEvaluator;
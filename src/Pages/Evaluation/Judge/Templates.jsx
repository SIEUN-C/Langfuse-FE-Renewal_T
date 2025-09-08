import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Book } from 'lucide-react';
import useProjectId from 'hooks/useProjectId';
import { getTemplateById } from "./services/libraryApi";
import styles from "./Templates.module.css";
import FormPageLayout from "../../../components/Layouts/FormPageLayout.jsx";
import FormGroup from "../../../components/Form/FormGroup.jsx";
import CodeBlock from "../../../components/CodeBlock/CodeBlock.jsx";

const Templates = () => {
  const { templateId } = useParams();
  const { projectId } = useProjectId();
  const navigate = useNavigate();

  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    if (!projectId || !templateId) {
      setLoading(false);
      return;
    }

    const fetchTemplateDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTemplateById(projectId, templateId);
        setTemplateData(data);

        if (data && data.prompt) {
          const extractVariables = (text) => {
            const regex = /{{\s*(\w+)\s*}}/g;
            const matches = text.match(regex) || [];
            return [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))];
          };
          setVariables(extractVariables(data.prompt));
        }

      } catch (err) {
        setError("Failed to load template details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateDetails();
  }, [projectId, templateId]);

  if (loading) {
    return <div className={styles.message}>Loading template...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!templateData) {
    return <div className={styles.message}>Template not found.</div>;
  }

  // Breadcrumbs UI 구성
  const breadcrumbs = (
    <>
      <Book size={16} />
      {/* 'Evaluators' 또는 'Templates' 등 상위 경로로 수정해주세요. */}
      <Link to="/llm-as-a-judge">Evaluators</Link>
      <span>/</span>
      <span className="active">{templateData.name}</span>
    </>
  );

  return (
    <FormPageLayout
      breadcrumbs={breadcrumbs}
      // 조회 페이지이므로 저장 버튼은 없고, 뒤로가기/취소 버튼만 제공
      onCancel={() => navigate('/evaluators')} // 이전 페이지로 이동
      isSaveDisabled={true} // 저장 버튼 비활성화
      hideSaveButton={true} // 저장 버튼 숨김 (FormPageLayout에 이 기능이 있다는 가정)
    >
      <FormGroup
        htmlFor="evaluator-name"
        label="Evaluator Name"
        subLabel="Unique identifier for this evaluator template."
      >
        <div className={styles.readOnlyField}>{templateData.name}</div>
      </FormGroup>

      <FormGroup
        htmlFor="model-name"
        label="Model"
        subLabel="The model used for this evaluation."
      >
        {/* API 응답에 모델명이 없으므로, 우선 하드코딩된 값으로 대체합니다. */}
        <div className={styles.readOnlyField}>{templateData.model || 'gpt-4o-mini-2024-07-18'}</div>
      </FormGroup>

      <FormGroup
        htmlFor="prompt-content"
        label="Prompt"
        subLabel="The prompt template used for the evaluation."
      >
        <CodeBlock
          code={templateData.prompt}
          readOnly={true} // 읽기 전용으로 설정
        />
        {variables.length > 0 && (
          <div className={styles.variablesContainer}>
            <span className={styles.variablesLabel}>VARIABLES:</span>
            {variables.map((variable, index) => (
              <span key={index} className={styles.variableTag}>{variable}</span>
            ))}
          </div>
        )}
      </FormGroup>

      <FormGroup
        htmlFor="score-reasoning"
        label="Score reasoning prompt"
        subLabel="Defines how the LLM should explain its evaluation."
      >
        <div className={styles.readOnlyTextarea}>
          {templateData.outputSchema.reasoning}
        </div>
      </FormGroup>

      <FormGroup
        htmlFor="score-range"
        label="Score range prompt"
        subLabel="Defines how the LLM should return the evaluation score."
      >
        <div className={styles.readOnlyTextarea}>
          {templateData.outputSchema.score}
        </div>
      </FormGroup>

    </FormPageLayout>
  );
};

export default Templates;
/*
  수정: 파일 전체를 아래 코드로 교체합니다.
  - 주석: DataTable.jsx가 accessor 함수를 사용하므로, accessorKey 방식에서
    원래의 accessor(row) 방식으로 되돌렸습니다.
*/
import React from 'react';
import { Link } from 'react-router-dom';
// --- ✨ 추가: 바로 이 한 줄이 오류를 해결합니다 ---
import styles from '../EvaluationView.module.css'; 

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString();
};

// --- ✨ 수정: Score Value가 1일 때의 예외 처리를 추가합니다 ---
const formatScoreValue = (value) => {
  if (typeof value !== 'number' || value === null || value === undefined) {
    return '-';
  }
  // 주석: 값이 정확히 1이면 소수점 없이 '1'로 표시합니다.
  if (value === 1) {
    return '1';
  }
  // 주석: 그 외의 모든 숫자는 소수점 4자리까지 표시합니다.
  return value.toFixed(4);
};
// -----------------------------------------------------------

// --- ✨ 추가: 텍스트를 특정 단어 수로 자르는 함수 ---
const truncateText = (text, wordLimit = 7) => {
  if (!text || typeof text !== 'string') {
    return '-';
  }
  const words = text.split(' ');
  if (words.length > wordLimit) {
    // 주석: 7단어 이상이면 자르고 뒤에 '...'을 붙입니다.
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  return text;
};

// --- ✨ 추가: 긴 ID를 앞뒤 일부만 보여주도록 자르는 함수 ---
const shortenId = (id, start = 8, end = 4) => {
  if (!id || typeof id !== 'string' || id.length <= start + end) {
    return id || '-';
  }
  // 주석: 예: "abcde-fghij-klmno" -> "abcde-fg...lmno"
  return `${id.substring(0, start)}...${id.substring(id.length - end)}`;
}


export const getEvaluationViewColumns = (projectId) => {
  return [
    // --- ✨ 수정: Status 컬럼의 accessor 부분을 아래와 같이 수정합니다 ---
    {
      header: 'Status',
      accessor: (row) => {
        const status = row.status ?? '-';
        // 주석: status 값에 따라 동적으로 CSS 클래스를 부여합니다.
        // 현재는 'COMPLETED' 상태만 초록색으로 처리합니다.
        const statusClass = status === 'COMPLETED' ? styles.statusCompleted : '';
        
        return (
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {status}
          </span>
        );
      },
    },
    // -------------------------------------------------------------
    {
      header: 'Start Time',
      accessor: (row) => formatDateTime(row.startTime),
    },
    {
      header: 'End Time',
      accessor: (row) => formatDateTime(row.endTime),
    },
    {
      header: 'Score Name',
      accessor: (row) => row.score?.name || '-',
    },
    // --- ✨ 수정: Score Value 컬럼에 formatScoreValue 함수를 적용합니다 ---
    {
      header: 'Score Value',
      accessor: (row) => formatScoreValue(row.score?.value),
    },
    // --- ✨ 수정: Score Comment 컬럼에 truncateText 함수를 적용합니다 ---
    // --- ✨ 수정: Score Comment 컬럼에 테두리 스타일을 적용합니다 ---
    {
      header: 'Score Comment',
      accessor: (row) => {
        const comment = row.score?.comment;
        // 주석: comment가 있을 때만 스타일이 적용된 span으로 감싸줍니다.
        return comment ? (
          <span className={styles.scoreComment}>
            {truncateText(comment)}
          </span>
        ) : '-';
      },
    },
    // -----------------------------------------------------------
    {
      header: 'Error',
      accessor: (row) => row.error || '-',
    },
    // --- ✨ 수정: Trace 컬럼을 페이지 이동을 위한 Link로 되돌립니다 ---
    {
      header: 'Trace',
      accessor: (row) => {
        const traceId = row.jobInputTraceId;
        // 주석: traceId가 있을 때만 버튼 스타일의 링크를 보여줍니다.
        return traceId ? (
          // 주석: 클릭 시 projectId와 traceId를 이용해 상세 페이지로 이동합니다.
          <Link to={`/project/${projectId}/traces/${traceId}`} className={styles.cellButton}>
            {shortenId(traceId)}
          </Link>
        ) : '-';
      },
    },
    // --- ✨ 수정: Template 컬럼을 클릭하면 해당 템플릿 상세 페이지로 이동하도록 Link를 추가합니다 ---
    {
      header: 'Template',
      accessor: (row) => {
        const templateId = row.jobTemplateId;
        // 주석: templateId가 있을 때만 버튼 형태로 된 링크를 보여줍니다.
        return templateId ? (
          // 주석: 클릭 시 templateId를 가지고 templates 상세 페이지로 이동합니다.
          //       경로는 요청하신 대로 `/llm-as-a-judge/templates/${templateId}` 형식으로 설정합니다.
          <Link to={`/llm-as-a-judge/templates/${templateId}`} className={styles.cellButton}>
            {shortenId(templateId)}
          </Link>
        ) : '-';
      },
    },
    // ------------------------------------------------------------------------------------
  ];
};
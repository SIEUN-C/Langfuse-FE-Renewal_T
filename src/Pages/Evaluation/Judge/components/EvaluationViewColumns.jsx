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


// --- ✨ 추가: 긴 ID를 앞뒤 일부만 보여주도록 자르는 함수 ---
const shortenId = (id, start = 8, end = 4) => {
  if (!id || typeof id !== 'string' || id.length <= start + end) {
    return id || '-';
  }
  // 주석: 예: "abcde-fghij-klmno" -> "abcde-fg...lmno"
  return `${id.substring(0, start)}...${id.substring(id.length - end)}`;
}

// ========================[수정 시작 (1/2)]========================
// 주석: truncateText 함수의 기본 단어 제한을 8로 수정하여
//       'Small' 상태일 때 7-9단어만 보이도록 하는 요구사항을 반영합니다.
const truncateText = (text, wordLimit = 8) => { 
// ========================[수정 끝 (1/2)]========================
  if (!text || typeof text !== 'string') {
    return '-';
  }
  const words = text.split(' ');
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  return text;
};



// ========================[수정 시작]========================
// 주석: getEvaluationViewColumns 함수가 rowHeight를 인자로 받도록 수정합니다.
export const getEvaluationViewColumns = (projectId, rowHeight) => {
// ========================[수정 끝]========================
  return [
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => {
        const status = row.status ?? '-';
        // 주석: status 값에 따라 동적으로 CSS 클래스를 부여합니다.
//         // 현재는 'COMPLETED' 상태만 초록색으로 처리합니다.
        const statusClass = status === 'COMPLETED' ? styles.statusCompleted : '';
        return (
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'startTime',
      header: 'Start Time',
      accessor: (row) => formatDateTime(row.startTime),
    },
    {
      id: 'endTime',
      header: 'End Time',
      accessor: (row) => formatDateTime(row.endTime),
    },
    {
      id: 'scoreName',
      header: 'Score Name',
      accessor: (row) => row.score?.name || '-',
    },
    {
      // --- ✨ 수정: Score Value 컬럼에 formatScoreValue 함수를 적용합니다 ---
      id: 'scoreValue',
      header: 'Score Value',
      accessor: (row) => formatScoreValue(row.score?.value),
    },
    {
      id: 'scoreComment',
      header: 'Score Comment',
      accessor: (row) => {
        const comment = row.score?.comment;
        // ========================[수정 시작 (2/2)]========================
        // 주석: 이 로직은 기존과 동일하게 유지됩니다. 
        //       'small'일 때는 위에서 수정한 truncateText(8단어)가 적용되고,
        //       'medium'과 'large'일 때는 전체 텍스트가 표시됩니다.
        //       CSS에서 이 전체 텍스트를 몇 줄까지 보여줄지 결정하게 됩니다.
        const displayText = rowHeight === 'small' ? truncateText(comment) : comment;
        // ========================[수정 끝 (2/2)]========================
        
        return comment ? (
          // 주석: 현재 rowHeight('small', 'medium', 'large')를 클래스 이름으로 넘겨주어
          //       CSS가 올바른 높이 스타일을 적용할 수 있도록 합니다.
          <span className={`${styles.scoreComment} ${styles[rowHeight]}`}>
            {displayText}
          </span>
        ) : '-';
        // ========================[수정 끝 (2/2)]========================
      },
    },
    {
      id: 'error',
      header: 'Error',
      accessor: (row) => row.error || '-',
    },
    {
       // --- ✨ 수정: Trace 컬럼을 페이지 이동을 위한 Link로 되돌립니다 ---
      id: 'trace',
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
    {
       // --- ✨ 수정: Template 컬럼을 클릭하면 해당 템플릿 상세 페이지로 이동하도록 Link를 추가합니다 ---
      id: 'template',
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
  ];
};
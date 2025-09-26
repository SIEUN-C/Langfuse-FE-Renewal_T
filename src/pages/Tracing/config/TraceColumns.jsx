import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Sigma, MoveRight, Tag } from 'lucide-react';
import styles from '../Tracing.module.css';
import dayjs from 'dayjs';

// 이 함수는 값이 null, undefined, 객체 등 어떤 형태든 안전하게 렌더링해주는 좋은 유틸리티입니다.
const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (Array.isArray(value)) {
    // 배열인 경우 태그처럼 보이게 쉼표로 구분된 문자열로 표시
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return <pre className={styles.cellText}>{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
};

export const getTraceTableColumns = (projectId, rowHeight) => {
  return [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessor: (row) => dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      defaultVisible: true,
    },
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => row.name,
      defaultVisible: true,
    },
    // 기존 input 컬럼을 다음과 같이 수정합니다:

   {
      id: 'input',
      header: 'Input',
      accessor: (row) => {
        const inputComment = row.input;

        if (inputComment === null || typeof inputComment === 'undefined' || inputComment.trim() === '') {
          return '-'
        }

        // Row height가 'small'일 때: 원본 문자열 그대로 표시 (JSON 파싱하지 않음)
        if (rowHeight === 'small') {
          return (
            <span className={`${styles.commentBox} ${styles[rowHeight]}`}>
              {inputComment}
            </span>
          );
        }

        // Row height가 'medium' 또는 'large'일 때: JSON 파싱 시도
        try {
          const parsedInput = JSON.parse(inputComment);
          
          // 파싱된 객체를 첫 번째 사진처럼 구조화해서 표시
          const formatObjectWithStructure = (obj, depth = 0) => {
            const indent = '  '.repeat(depth);
            
            if (Array.isArray(obj)) {
              const itemsText = obj.length === 1 ? '1 item' : `${obj.length} items`;
              let result = `[ *${itemsText}*\n`;
              
              obj.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                  const objectKeys = Object.keys(item);
                  const keysText = objectKeys.length === 1 ? '1 item' : `${objectKeys.length} items`;
                  result += `${indent}  ${index}: { *${keysText}*\n`;
                  
                  Object.entries(item).forEach(([key, value]) => {
                    // 문자열 값에서 따옴표 처리를 개선
                    let displayValue;
                    if (typeof value === 'string') {
                      // 이미 따옴표로 감싸진 문자열인지 확인
                      if (value.startsWith('"') && value.endsWith('"')) {
                        displayValue = value; // 이미 따옴표가 있으면 그대로 사용
                      } else {
                        displayValue = `"${value}"`; // 따옴표가 없으면 추가
                      }
                    } else {
                      displayValue = value;
                    }
                    result += `${indent}    ${key}: ${displayValue}\n`;
                  });
                  
                  result += `${indent}  }\n`;
                } else {
                  let displayValue;
                  if (typeof item === 'string') {
                    // 이미 따옴표로 감싸진 문자열인지 확인
                    if (item.startsWith('"') && item.endsWith('"')) {
                      displayValue = item; // 이미 따옴표가 있으면 그대로 사용
                    } else {
                      displayValue = `"${item}"`; // 따옴표가 없으면 추가
                    }
                  } else {
                    displayValue = item;
                  }
                  result += `${indent}  ${index}: ${displayValue}\n`;
                }
              });
              
              result += `${indent}]`;
              return result;
            }
            
            if (typeof obj === 'object' && obj !== null) {
              const objectKeys = Object.keys(obj);
              const keysText = objectKeys.length === 1 ? '1 item' : `${objectKeys.length} items`;
              let result = `{ *${keysText}*\n`;
              
              Object.entries(obj).forEach(([key, value]) => {
                // 문자열 값에서 따옴표 처리를 개선
                let displayValue;
                if (typeof value === 'string') {
                  // 이미 따옴표로 감싸진 문자열인지 확인
                  if (value.startsWith('"') && value.endsWith('"')) {
                    displayValue = value; // 이미 따옴표가 있으면 그대로 사용
                  } else {
                    displayValue = `"${value}"`; // 따옴표가 없으면 추가
                  }
                } else {
                  displayValue = value;
                }
                result += `${indent}  ${key}: ${displayValue}\n`;
              });
              
              result += `${indent}}`;
              return result;
            }
            
            return String(obj);
          };

          return (
            <div className={`${styles.commentBox} ${styles[rowHeight]}`}>
              <pre style={{ 
                fontFamily: 'monospace', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {formatObjectWithStructure(parsedInput)}
              </pre>
            </div>
          );
        } catch (error) {
          // JSON 파싱 실패 시 원본 문자열 표시
          return (
            <span className={`${styles.commentBox} ${styles[rowHeight]}`}>
              {inputComment}
            </span>
          );
        }
      },
      defaultVisible: true,
    },
    {
      id: 'output',
      header: 'Output',
      accessor: (row) => {
        const outputComment = row.output;
        return outputComment ? (
          <span className={`${styles.commentBox} ${styles[rowHeight]}`}>
            {outputComment}
          </span>
        ) : '-';
      },
      defaultVisible: true,
    },
    {
      id: 'observationLevels',
      header: 'Observations Levels',
      accessor: (row) => row.observations,
      defaultVisible: true,
    },
    {
      id: 'latency',
      header: 'Latency',
      accessor: (row) => (row.latency != null ? `${row.latency.toFixed(2)}s` : '-'),
      defaultVisible: true,
    },
    {
      id: 'tokens',
      header: 'Tokens',
      accessor: (row) => <div>{safeRender(row.inputTokens)} <MoveRight size={10} /> {safeRender(row.outputTokens)} (<Sigma size={10} />{safeRender(row.totalTokens)})</div>,
      defaultVisible: true,
    },
    {
      id: 'totalCost',
      header: 'Total Cost',
      accessor: (row) => (row.cost != null ? `$${Number(row.cost).toFixed(6)}` : '-'),
      defaultVisible: true,
    },
    {
      id: 'environment',
      header: 'Environment',
      accessor: (row) => {
        return (
          <span className={styles.cellButton}>
            {row.environment}
          </span>
        )
      },
      defaultVisible: true,
    },
    {
      id: 'tags',
      header: 'Tags',
      accessor: (row) => {
        if (!Array.isArray(row.tags) || row.tags.length === 0) {
          return '-';
        }

        return (
          <div className={styles.tagContainer}>
            {row.tags.map((tag) => (
              <span key={tag} className={styles.tagItem}>
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )
      },
      defaultVisible: true,
    },
    {
      id: 'metadata',
      header: 'Metadata',
      accessor: (row) => {
        const metadataValue = row.metadata;

        if (metadataValue === null || typeof metadataValue === 'undefined') {
          return '-'
        }

        if (rowHeight === 'small') {
          const compactJson = JSON.stringify(metadataValue);

          return (
            <span className={`${styles.commentBox} ${styles[rowHeight]}`}>
              {compactJson}
            </span>
          );
        } else {
          const formattedMetadata = JSON.stringify(metadataValue, null, 2);

          return (
            <span className={`${styles.commentBox} ${styles[rowHeight]}`}>
              <pre>{formattedMetadata}</pre>
            </span>
          );
        }
      },
      defaultVisible: true,
    },
    {
      id: 'sessionId',
      header: 'Session ID',
      accessor: (row) => safeRender(row.sessionId),
      defaultVisible: false,
    },
    {
      id: 'userId',
      header: 'User ID',
      accessor: (row) => safeRender(row.userId),
      defaultVisible: false,
    },
    {
      id: 'level',
      header: 'Level',
      accessor: (row) => safeRender(row.level),
      defaultVisible: false,
    },
    {
      id: 'version',
      header: 'Version',
      accessor: (row) => safeRender(row.version),
      defaultVisible: false,
    },
    {
      id: 'release',
      header: 'Release',
      accessor: (row) => safeRender(row.release),
      defaultVisible: false,
    },
    {
      id: 'id',
      header: 'Trace ID',
      accessor: (row) => safeRender(row.id),
      defaultVisible: false,
    },
    {
      id: 'inputCost',
      header: 'Input Cost',
      accessor: (row) => (row.inputCost != null ? `$${Number(row.inputCost).toFixed(6)}` : '-'),
      defaultVisible: false,
    },
    {
      id: 'outputCost',
      header: 'Output Cost',
      accessor: (row) => (row.outputCost != null ? `$${Number(row.outputCost).toFixed(6)}` : '-'),
      defaultVisible: false,
    },
    {
      id: 'inputTokens',
      header: 'Input Tokens',
      accessor: (row) => safeRender(row.inputTokens),
      defaultVisible: false,
    },
    {
      id: 'outputTokens',
      header: 'Output Tokens',
      accessor: (row) => safeRender(row.outputTokens),
      defaultVisible: false,
    },
    {
      id: 'totalTokens',
      header: 'Total Tokens',
      accessor: (row) => safeRender(row.totalTokens),
      defaultVisible: false,
    }
  ];
};
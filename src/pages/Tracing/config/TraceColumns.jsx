import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Sigma, MoveRight } from 'lucide-react';
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

export const traceTableColumns = [
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
  {
    id: 'input',
    header: 'Input',
    accessor: (row) => <div className={styles.cellText}>{row.input}</div>,
    defaultVisible: true,
  },
  {
    id: 'output',
    header: 'Output',
    accessor: (row) => <div className={styles.cellText}>{row.output}</div>,
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
    accessor: (row) => <div>{safeRender(row.inputTokens)}<MoveRight size={10}/>{safeRender(row.outputTokens)}(<Sigma size={10}/>{safeRender(row.totalTokens)})</div>,
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
    accessor: (row) => safeRender(row.environment),
    defaultVisible: true,
  },
  {
    id: 'tags',
    header: 'Tags',
    accessor: (row) => safeRender(row.tags),
    defaultVisible: true,
  },
  {
    id: 'metadata',
    header: 'Metadata',
    accessor: (row) => safeRender(row.metadata),
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
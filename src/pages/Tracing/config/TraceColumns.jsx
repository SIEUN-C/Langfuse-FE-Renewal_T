// src/pages/Tracing/traceColumns.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import styles from '../Tracing.module.css';
import dayjs from 'dayjs';

const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  // value가 객체나 배열인 경우, JSON 문자열로 변환하여 보여줍니다.
  if (typeof value === 'object') {
    return <pre className={styles.cellText}>{JSON.stringify(value, null, 2)}</pre>;
  }
  // 그 외의 경우(문자열, 숫자 등)는 그대로 반환합니다.
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
    accessor: (row) => <div className={styles.cellText}>{safeRender(row.input)}</div>,
    defaultVisible: true,
  },
  {
    id: 'output',
    header: 'Output',
    accessor: (row) => <div className={styles.cellText}>{safeRender(row.output)}</div>,
    defaultVisible: true,
  },
  {
    id: 'observationLevels',
    header: 'Observation Levels',
    accessor: (row) => safeRender(row.observationLevels),
    defaultVisible: true,
  },
  {
    id: 'latency',
    header: 'Latency',
    accessor: (row) => (row.latency != null ? `${row.latency}s` : '-'),
    defaultVisible: true,
  },
  {
    id: 'tokens',
    header: 'Tokens',
    accessor: (row) => safeRender(row.tokens),
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
    id: 'session',
    header: 'Session',
    accessor: (row) => safeRender(row.session),
    defaultVisible: false,
  },
  {
    id: 'user',
    header: 'User',
    accessor: (row) => safeRender(row.user),
    defaultVisible: false,
  },
  {
    id: 'observations',
    header: 'Observations',
    accessor: (row) => safeRender(row.observations),
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
    id: 'traceId',
    header: 'Trace ID',
    accessor: (row) => safeRender(row.traceId),
    defaultVisible: false,
  },
  {
    id: 'inputCost',
    header: 'Input Cost',
    accessor: (row) => safeRender(row.inputCost),
    defaultVisible: false,
  },
  {
    id: 'outputCost',
    header: 'Output Cost',
    accessor: (row) => safeRender(row.outputCost),
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
  },
];
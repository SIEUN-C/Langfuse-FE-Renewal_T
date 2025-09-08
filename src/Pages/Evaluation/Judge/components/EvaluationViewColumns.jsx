/*
  수정: 파일 전체를 아래 코드로 교체합니다.
  - 주석: DataTable.jsx가 accessor 함수를 사용하므로, accessorKey 방식에서
    원래의 accessor(row) 방식으로 되돌렸습니다.
*/
import React from 'react';
import { Link } from 'react-router-dom';

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString();
};

export const getEvaluationViewColumns = (projectId) => {
  return [
    {
      header: 'Status',
      accessor: (row) => row.status ?? '-',
    },
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
    {
      header: 'Score Value',
      accessor: (row) => row.score?.value ?? '-',
    },
    {
      header: 'Score Comment',
      accessor: (row) => row.score?.comment || '-',
    },
    {
      header: 'Error',
      accessor: (row) => row.error || '-',
    },
    {
      header: 'Trace',
      accessor: (row) => {
        const traceId = row.jobInputTraceId;
        return traceId ? <Link to={`/project/${projectId}/traces/${traceId}`}>View Trace</Link> : '-';
      },
    },
    {
      header: 'Template',
      accessor: (row) => row.jobTemplateId || '-',
    },
  ];
};
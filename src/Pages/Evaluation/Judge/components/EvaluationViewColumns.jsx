import React from 'react';
import styles from './EvaluatorsTable.module.css'; // 메인 테이블 스타일 재활용

// 컬럼 정의를 반환하는 함수
export const getEvaluationViewColumns = () => {
    const handleSetUpClick = (e, row) => {
        e.stopPropagation(); // 행 클릭 이벤트가 있다면 전파 방지
        // TODO: 'Set up' 버튼 클릭 시 로직 구현
        console.log(`Setting up: ${row.name}`);
        alert(`"${row.name}" setup process initiated.`);
    };

    return [
        {
            header: 'Status',
            accessor: (row) => row.status,
        },
        {
            header: 'Start Time',
            accessor: (row) => row.starttime,
        },
        {
            header: 'End Time',
            accessor: (row) => row.endtime,
        },
        {
            header: 'Score Name',
            accessor: (row) => row.scorename,
        },
        {
            header: 'Score Value',
            accessor: (row) => row.scorevalue,
        },
        {
            header: 'Score Comment',
            accessor: (row) => row.scorecomment,
        },
        {
            header: 'Error',
            accessor: (row) => row.error,
        },
        {
            header: 'Trace',
            accessor: (row) => row.trace,
        },
        {
            header: 'Template',
            accessor: (row) => row.template,
        },
    ];
};
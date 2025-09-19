// src/Pages/Dashboards/utils/hooks.js

/**
 * 시계열 데이터에서 특정 컬럼을 기준으로 데이터를 추출하는 함수
 * @param {Array} data - 원본 데이터 배열
 * @param {string} timeColumn - 시간 컬럼명
 * @param {Array} extractConfig - 추출 설정 배열
 * @returns {Array} 변환된 시계열 데이터
 */
export const extractTimeSeriesData = (data, timeColumn, extractConfig) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  // 시간별로 그룹화
  const groupedByTime = data.reduce((acc, item) => {
    const timeKey = item[timeColumn];
    if (!acc[timeKey]) {
      acc[timeKey] = [];
    }
    acc[timeKey].push(item);
    return acc;
  }, {});

  // 시계열 형식으로 변환
  return Object.entries(groupedByTime).map(([timestamp, items]) => {
    const values = [];
    
    extractConfig.forEach(config => {
      items.forEach(item => {
        // uniqueIdentifierColumns를 기반으로 라벨 생성
        const labelParts = config.uniqueIdentifierColumns.map(col => {
          const value = item[col.accessor];
          return col.formatFct ? col.formatFct(value) : value;
        }).filter(Boolean);
        
        const label = labelParts.join(' ');
        const value = item[config.valueColumn];
        
        if (label && value !== undefined && value !== null) {
          values.push({ label, value: Number(value) });
        }
      });
    });

    return {
      ts: new Date(timestamp).getTime(),
      values
    };
  }).sort((a, b) => a.ts - b.ts);
};

/**
 * 누락된 값을 채우고 데이터를 변환하는 함수
 * @param {Array} timeSeriesData - 시계열 데이터
 * @param {Array} expectedLabels - 예상되는 라벨 배열
 * @returns {Array} 변환된 데이터
 */
export const fillMissingValuesAndTransform = (timeSeriesData, expectedLabels) => {
  // ★★★ 수정: timeSeriesData가 배열이 아닐 경우를 대비
  if (!Array.isArray(timeSeriesData) || timeSeriesData.length === 0) return [];
  // ★★★ 수정: expectedLabels가 없을 경우를 대비하여 모든 라벨을 수집
  if (!expectedLabels) {
    const allLabels = new Set();
    timeSeriesData.forEach(dp => dp.values.forEach(v => allLabels.add(v.label)));
    expectedLabels = Array.from(allLabels);
  }

  return timeSeriesData.map(dataPoint => {
    const filledValues = expectedLabels.map(label => {
      const existingValue = dataPoint.values.find(v => v.label === label);
      return {
        label,
        value: existingValue ? existingValue.value : 0
      };
    });

    return {
      ...dataPoint,
      values: filledValues
    };
  });
};

/**
 * 🔄 시계열 데이터가 비어있는지 확인 (업데이트됨)
 * @param {Object} params
 * @param {Array} params.data - 시계열 데이터 배열
 * @param {boolean} params.isNullValueAllowed - null 값 허용 여부 (기본: false)
 * @returns {boolean} 데이터가 비어있으면 true
 */
export const isEmptyTimeSeries = ({
  data,
  isNullValueAllowed = false,
}) => {
  // ★★★ 수정: data가 null이나 undefined일 경우를 처리하는 방어 코드 추가
  if (!data) {
    return true;
  }
  
  return (
    data.length === 0 ||
    data.every(
      (item) =>
        item.values.length === 0 ||
        (isNullValueAllowed
          ? false
          : item.values.every((value) => value.value === 0)),
    )
  );
};

/**
 * 프로젝트의 모든 모델 목록을 가져오는 함수 (Mock 구현)
 * @param {string} projectId - 프로젝트 ID
 * @param {Array} globalFilterState - 글로벌 필터 상태
 * @param {Date} fromTimestamp - 시작 날짜
 * @param {Date} toTimestamp - 종료 날짜
 * @returns {Array} 모델 목록
 */
export const getAllModels = (projectId, globalFilterState, fromTimestamp, toTimestamp) => {
  // TODO: 실제 API 연동 시 구현
  console.log('getAllModels called with:', { projectId, globalFilterState, fromTimestamp, toTimestamp });
  
  // Mock 모델 데이터
  return [
    { model: 'Qwen3-30B-A3B-Instruct-2507-UD-Q5_K_XL.gguf' },
    { model: 'gpt-4' },
    { model: 'gpt-3.5-turbo' },
    { model: 'claude-3-sonnet' },
    { model: 'claude-3-haiku' },
    { model: 'gemini-pro' },
    { model: 'llama-2-70b' },
    { model: 'mistral-large' },
    { model: 'cohere-command' },
    { model: 'anthropic-claude-instant' }
  ];
};
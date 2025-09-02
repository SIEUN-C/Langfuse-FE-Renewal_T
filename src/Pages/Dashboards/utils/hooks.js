// TODO: API와 관련된 부분들은 실제 API 연동 시 구현 필요
// import { api } from "@/src/utils/api";
// import { mapLegacyUiTableFilterToView } from "@/src/features/query";

/**
 * 모든 모델 정보를 가져오는 함수
 * @param {string} projectId - 프로젝트 ID
 * @param {Array} globalFilterState - 글로벌 필터 상태
 * @param {Date} fromTimestamp - 시작 날짜
 * @param {Date} toTimestamp - 종료 날짜
 * @returns {Array} 모델 정보 배열
 */
export const getAllModels = (projectId, globalFilterState, fromTimestamp, toTimestamp) => {
    // TODO: 실제 API 연동 시 구현
    // const allModels = api.dashboard.executeQuery.useQuery({
    //   projectId,
    //   query: {
    //     ...
    //   }
    // });
    
    // 임시로 매개변수 사용 (ESLint 경고 방지)
    console.log('getAllModels called with:', { projectId, globalFilterState, fromTimestamp, toTimestamp });
    
    // Mock 데이터 반환 (임시)
    const mockData = [
      { providedModelName: 'gpt-4', count: 150 },
      { providedModelName: 'gpt-3.5-turbo', count: 200 },
      { providedModelName: 'claude-3', count: 80 },
    ];
    
    return extractAllModels(mockData);
  };
  
  /**
   * 모델 데이터 추출 함수
   * @param {Array} data - 원본 데이터
   * @returns {Array} 추출된 모델 정보
   */
  const extractAllModels = (data) => {
    return data
      .filter((item) => item.providedModelName !== null)
      .map((item) => ({
        model: item.providedModelName,
        count: item.count,
      }));
  };
  
  /**
   * 고유 식별자 컬럼들로부터 차트 라벨 생성
   * @param {Array} uniqueIdentifierColumns - 고유 식별자 컬럼 정보
   * @param {Object} row - 데이터베이스 행
   * @returns {string} 생성된 라벨
   */
  function generateChartLabelFromColumns(uniqueIdentifierColumns, row) {
    return uniqueIdentifierColumns
      .map(({ accessor, formatFct }) => {
        if (row[accessor] === null || row[accessor] === undefined) return null;
        return formatFct
          ? formatFct(row[accessor])
          : row[accessor];
      })
      .filter((value) => value !== null)
      .join(" ");
  }
  
  /**
   * 시계열 데이터 추출 함수
   * 데이터를 다음 형식으로 변환:
   * [{ts: 123, values: [{label: "A", value: 1}, {label: "B", value: 2}]}, ...]
   * 
   * @param {Array} data - 데이터베이스 행 배열
   * @param {string} timeColumn - 시간 컬럼명
   * @param {Array} mapping - 필드 매핑 정보
   * @returns {Map} 시간별 차트 데이터 맵
   */
  export function extractTimeSeriesData(data, timeColumn, mapping) {
    return data.reduce((acc, curr) => {
      const date = new Date(curr[timeColumn]).getTime();
  
      const reducedData = [];
      
      // 매핑 정보에 따라 DatabaseRow를 ChartData로 변환
      mapping.forEach((mapItem) => {
        const chartLabel = generateChartLabelFromColumns(
          mapItem.uniqueIdentifierColumns,
          curr,
        );
        const columnValue = curr[mapItem.valueColumn];
        
        if (
          chartLabel &&
          columnValue !== undefined &&
          typeof chartLabel === "string"
        ) {
          reducedData.push({
            label: chartLabel,
            value: columnValue ? columnValue : 0,
          });
        }
      });
  
      const existingData = acc.get(date);
      if (existingData) {
        existingData.push(...reducedData);
      } else {
        acc.set(date, reducedData);
      }
  
      return acc;
    }, new Map());
  }
  
  /**
   * 누락된 값들을 채우고 최종 형식으로 변환
   * @param {Map} inputMap - 시간별 차트 데이터 맵
   * @param {Array} labelsToAdd - 추가할 라벨들 (기본값: [])
   * @returns {Array} TimeSeriesChartDataPoint 형식의 배열
   */
  export function fillMissingValuesAndTransform(inputMap, labelsToAdd = []) {
    const result = [];
  
    inputMap.forEach((chartDataArray, timestamp) => {
      const existingLabels = chartDataArray.map((value) => value.label);
  
      // labelsToAdd의 각 라벨에 대해 기본값 0 추가
      labelsToAdd.forEach((label) => {
        if (!existingLabels.includes(label)) {
          chartDataArray.push({ label: label, value: 0 });
        }
      });
  
      result.push({
        ts: timestamp,
        values: chartDataArray,
      });
    });
    
    return result;
  }
  
  /**
   * 시계열 데이터가 비어있는지 확인
   * @param {Object} params
   * @param {Array} params.data - 시계열 데이터 배열
   * @param {boolean} params.isNullValueAllowed - null 값 허용 여부 (기본: false)
   * @returns {boolean} 데이터가 비어있으면 true
   */
  export const isEmptyTimeSeries = ({
    data,
    isNullValueAllowed = false,
  }) => {
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
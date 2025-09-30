// components/FilterControls/config/configBuilder.js
import { dashboardsFilterDefs } from './definitions/dashboardsDefinitions';
import { evaluationDetailFilterDefs } from './definitions/evaluationDetailDefinitions';
import { homeFilterDefs } from './definitions/homeDefinitions';
import { judgeFilterDefs } from './definitions/judgeDefinitions';
import { observationsFilterDefs } from './definitions/observationsDefinitions';
import { promptsFilterDefs } from './definitions/promptsDefinitions';
import { sessionsFilterDefs } from './definitions/sessionDefinitions';
import { tracesFilterDefs } from './definitions/traceDefinitions';
import { filterOperators } from './filterOperators';

/**
 * definitions와 operators 객체를 기반으로 FilterBuilder와 호환되는 설정 배열을 생성합니다.
 * @param {Array<Object>} definitions - tracesFilterDefs와 같은 열 정의 배열
 * @param {Object} operators - filterOperators와 같은 연산자 맵
 * @returns {Array<Object>} FilterBuilder에 전달될 컬럼 설정 배열
 */
const buildConfigFromDefs = (definitions, operators) => {
  return definitions.map(def => {
    // `def.type`에 해당하는 연산자 목록을 `filterOperators`에서 찾습니다.
    const availableOperators = operators[def.type] || [];
    
    // FilterBuilder가 필요로 하는 형식(`key`, `label` 등)으로 객체를 매핑합니다.
    return {
      key: def.id, // definitions의 'id'를 'key'로 사용
      label: def.name, // 'name'을 'label'로 사용
      type: def.type, // 타입을 그대로 전달하여 빌더 내에서 활용 가능
      operators: availableOperators,
      options: def.options || [], // 옵션이 있으면 전달
      // 'stringObject'나 'numberObject' 같은 타입은 메타 키가 필요함을 나타냄
      hasMetaKey: def.type.endsWith("Object"), 
    };
  });
};

export const getDashboardsFilterConfig = () => {
  return buildConfigFromDefs(dashboardsFilterDefs, filterOperators);
};

export const getEvaluationDetailFilterConfig = () => {
  return buildConfigFromDefs(evaluationDetailFilterDefs, filterOperators);
};

export const getHomeFilterConfig = () => {
  return buildConfigFromDefs(homeFilterDefs, filterOperators);
};

export const getJudgeFilterConfig = () => {
  return buildConfigFromDefs(judgeFilterDefs, filterOperators);
};

export const getObservationsFilterConfig = () => {
  return buildConfigFromDefs(observationsFilterDefs, filterOperators);
};

export const getPromptsFilterConfig = () => {
  return buildConfigFromDefs(promptsFilterDefs, filterOperators);
};

export const getSessionsFilterConfig = () => {
  return buildConfigFromDefs(sessionsFilterDefs, filterOperators);
};

export const getTracesFilterConfig = () => {
  return buildConfigFromDefs(tracesFilterDefs, filterOperators);
};
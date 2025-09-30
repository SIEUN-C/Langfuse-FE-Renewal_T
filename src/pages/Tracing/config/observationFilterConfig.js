// 관측치 탭에서 쓸 필터 정의.
// 기존 components/FilterControls/filterConfig.js 를 건드리지 않고 재구성합니다.

import {
    // 필요하면 가져다 쓸 공용 오퍼레이터만 import
} from 'react'; // ← dummy import 방지용 (없어도 됨)

/** 공용 오퍼레이터 복제 (원본 파일을 수정하지 않기 위해 내부 복제) */
const commonStringOperators = ["=", "contains", "does not contain", "starts with", "ends with"];
const commonNumericOperators = ["=", ">", "<", ">=", "<="];
const commonCategoricalOperators = ["any of", "none of"];
const allCategoricalOperators = ["any of", "none of", "all of"];

// ✅ 관측치(Observations) 탭에서 쓸 FilterBuilder 전용 config
// - 화면에서 실제로 쓰는 키만 최소 세트로 시작 (확장 가능)
// - key 라벨은 UI 표시용, 백엔드 매핑은 buildFilterState 쪽에서 담당
export const observationsFilterConfig = [
    {
        key: "Type", label: "Type", type: "categorical", operators: commonCategoricalOperators,
        options: [
            "GENERATION", "SPAN", "EVENT",
            "AGENT", "TOOL", "CHAIN", "RETRIEVER", "EVALUATOR",
            "EMBEDDING", "GUARDRAIL"
        ]
    },
    {
        key: "Level", label: "Level", type: "categorical", operators: commonCategoricalOperators,
        options: ["DEBUG", "DEFAULT", "WARNING", "ERROR"]
    },
    // 필요 시 확장 예시:
    // { key: "Model", label: "Model", type: "categorical", operators: commonCategoricalOperators, options: [] },
    // { key: "Tags",  label: "Tags",  type: "categorical", operators: allCategoricalOperators, options: [] },
];

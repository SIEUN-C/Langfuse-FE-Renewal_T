// 관측치 탭 전용: UI 모드 ↔ 서버 searchType 매핑
export const SEARCH_MODE = {
    FULL_TEXT: 'full',
    IDS_NAMES: 'ids-names',
};

// ⚠️ Langfuse 서버별 구현에 맞춰 조정 가능
// - IDs/Names: 3000 기준 기본 동작이므로 [] 로 보냄(백엔드 기본 매칭 사용)
// - Full Text: 전체 텍스트 검색을 명시적으로 활성화
export function mapSearchModeToTypes(mode) {
    switch (mode) {
        case SEARCH_MODE.FULL_TEXT:
            return ['fullText']; // <- 서버가 기대하는 키. 필요하면 'full_text' 등으로 변경
        case SEARCH_MODE.IDS_NAMES:
        default:
            return []; // 기본(IDs/Names) 검색
    }
}

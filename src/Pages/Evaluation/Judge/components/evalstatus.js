// judge/components/evalstatus.js

/** 배열화 */
export function toScopeArray(scope) {
    if (!scope) return [];
    return Array.isArray(scope) ? scope : [String(scope)];
}

/** 최종 상태 계산(서버 값 우선) */
export function computeFinalStatus(cfg = {}) {
    if (cfg.finalStatus) return String(cfg.finalStatus).toUpperCase();

    const st = String(cfg.status || '').toUpperCase();
    if (st === 'ACTIVE') return 'ACTIVE';

    const scopeArr = toScopeArray(cfg.timeScope).map(s => String(s).toUpperCase());
    const onlyExisting = scopeArr.includes('EXISTING') && !scopeArr.includes('NEW');

    const execs = Array.isArray(cfg.jobExecutionsByState) ? cfg.jobExecutionsByState : [];
    const hasPending = execs.some(je => String(je.status).toUpperCase() === 'PENDING');
    const total = execs.reduce((acc, je) => acc + (Number(je._count) || 0), 0);

    if (onlyExisting && !hasPending && total > 0) return 'FINISHED';
    return 'INACTIVE';
}

/** 3000 규칙: EXISTING-only면 편집/토글 둘 다 금지 */
export function isExistingOnly(cfg = {}) {
    const scopeArr = toScopeArray(cfg.timeScope).map(s => String(s).toUpperCase());
    return scopeArr.includes('EXISTING') && !scopeArr.includes('NEW');
}

/** 폼/토글 모두의 '편집 가능'은 EXISTING-only가 아니어야 함 */
export function isEditable(cfg) {
    return !isExistingOnly(cfg);
}

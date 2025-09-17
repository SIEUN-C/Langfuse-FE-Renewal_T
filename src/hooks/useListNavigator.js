import { useEffect, useMemo, useCallback } from 'react';

/**
 * 리스트 데이터를 탐색하는 로직을 관리하는 커스텀 훅
 * @param {boolean} isEnabled - 훅의 키보드 이벤트 리스너 활성화 여부
 * @param {Array<Object>} data - 'id' 속성을 포함하는 객체 배열
 * @param {string | null} selectedId - 현재 선택된 아이템의 ID
 * @param {(id: string) => void} setSelectedId - 선택된 ID를 변경하는 함수
 * @param {() => void} [onClose] - (선택 사항) 'Escape' 키를 눌렀을 때 호출될 함수
 */
export const useListNavigator = (isEnabled, data, selectedId, setSelectedId, onClose) => {
  const currentIndex = useMemo(() => {
    if (!selectedId || !data) return -1;
    return data.findIndex(item => item.id === selectedId);
  }, [data, selectedId]);

  const handleNext = useCallback(() => {
    if (currentIndex < data.length - 1) {
      const nextItem = data[currentIndex + 1];
      setSelectedId(nextItem.id);
    }
  }, [data, currentIndex, setSelectedId]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const previousItem = data[currentIndex - 1];
      setSelectedId(previousItem.id);
    }
  }, [data, currentIndex, setSelectedId]);

  useEffect(() => {
    if (!isEnabled || !data || data.length === 0) return;

    const handleKeyDown = (event) => {
      if (event.key === 'j') {
        handleNext();
      } else if (event.key === 'k') {
        handlePrevious();
      }
      // ✅ onClose 함수가 제공되었을 때만 Escape 키 로직을 실행
      else if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, handleNext, handlePrevious, onClose, data]);

  return {
    currentIndex,
    handleNext,
    handlePrevious,
  };
};
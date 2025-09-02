import React, { useState, useEffect } from 'react';
import { getAllModels } from '../../utils/hooks';

/* eslint-disable react-refresh/only-export-components */

/**
 * 체크 아이콘 컴포넌트 (Lucide Check 대체)
 */
function CheckIcon({ visible = true }) {
  return (
    <span style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      opacity: visible ? 1 : 0,
      color: '#22c55e'
    }}>
      ✓
    </span>
  );
}

/**
 * 드롭다운 아이콘 컴포넌트 (Lucide ChevronsUpDown 대체)
 */
function ChevronIcon() {
  return (
    <span style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      opacity: 0.5,
      fontSize: '12px'
    }}>
      ⇅
    </span>
  );
}

/**
 * 모델 선택 팝오버 컴포넌트
 * @param {Object} props
 * @param {Array} props.allModels - 모든 모델 배열 (객체 형태: {model: string})
 * @param {Array} props.selectedModels - 선택된 모델 배열
 * @param {function} props.setSelectedModels - 선택된 모델 설정 함수
 * @param {string} props.buttonText - 버튼 텍스트
 * @param {boolean} props.isAllSelected - 전체 선택 여부
 * @param {function} props.handleSelectAll - 전체 선택 핸들러
 */
export const ModelSelectorPopover = ({
  allModels,
  selectedModels,
  setSelectedModels,
  buttonText,
  isAllSelected,
  handleSelectAll,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredModels = allModels.filter(model =>
    model.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModelToggle = (modelName) => {
    setSelectedModels((prev) =>
      prev.includes(modelName)
        ? prev.filter((m) => m !== modelName)
        : [...prev, modelName]
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '224px', // w-56
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          backgroundColor: 'white',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        {buttonText}
        <ChevronIcon />
      </button>

      {/* 팝오버 내용 */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '224px', // w-56
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          marginTop: '4px'
        }}>
          {/* 검색 입력 */}
          <div style={{ padding: '8px' }}>
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {/* 전체 선택 */}
            <div
              onClick={handleSelectAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderTop: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <CheckIcon visible={isAllSelected} />
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                Select All
              </span>
            </div>

            {/* 구분선 */}
            <hr style={{ 
              margin: '4px 0', 
              border: 'none', 
              borderTop: '1px solid #e5e7eb' 
            }} />

            {/* 모델 목록 */}
            {filteredModels.length === 0 ? (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                No model found.
              </div>
            ) : (
              filteredModels.map((model) => (
                <div
                  key={model.model}
                  onClick={() => handleModelToggle(model.model)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <CheckIcon visible={selectedModels.includes(model.model)} />
                  <span style={{ marginLeft: '8px' }}>
                    {!model.model || model.model === "" ? (
                      <i>none</i>
                    ) : (
                      model.model
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 팝오버 외부 클릭 시 닫기 */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99
          }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

/**
 * 모델 선택 훅
 * @param {string} projectId - 프로젝트 ID
 * @param {Array} globalFilterState - 글로벌 필터 상태
 * @param {Date} fromTimestamp - 시작 날짜
 * @param {Date} toTimestamp - 종료 날짜
 */
export const useModelSelection = (
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
) => {
  const allModels = getAllModels(
    projectId,
    globalFilterState,
    fromTimestamp,
    toTimestamp,
  );

  const [selectedModels, setSelectedModels] = useState([]);
  const [firstAllModelUpdate, setFirstAllModelUpdate] = useState(true);

  const isAllSelected = selectedModels.length === allModels.length;

  const buttonText = isAllSelected
    ? "All models"
    : `${selectedModels.length} selected`;

  const handleSelectAll = () => {
    setSelectedModels(isAllSelected ? [] : [...allModels.map((m) => m.model)]);
  };

  useEffect(() => {
    if (firstAllModelUpdate && allModels.length > 0) {
      // 처음에는 최대 10개 모델만 선택
      setSelectedModels(allModels.slice(0, 10).map((model) => model.model));
      setFirstAllModelUpdate(false);
    }
  }, [allModels, firstAllModelUpdate]);

  return {
    allModels,
    selectedModels,
    setSelectedModels,
    isAllSelected,
    buttonText,
    handleSelectAll,
  };
};

export default ModelSelectorPopover;
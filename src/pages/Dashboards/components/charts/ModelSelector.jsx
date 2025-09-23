// src/pages/Dashboards/components/charts/ModelSelector.jsx

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

  // 🎯 [수정] 데이터가 비정상적일 경우를 대비한 방어 코드 추가
  const filteredModels = (allModels || []) // allModels가 null/undefined일 경우 빈 배열로 처리
    .filter(model => model && typeof model.model === 'string') // model 객체와 model.model 속성이 유효한지 확인
    .filter(model =>
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
          width: '224px',
          padding: '8px 12px',
          border: '1px solid #4b5563', // 어두운 테마에 맞게 수정
          backgroundColor: '#1f2937', // 어두운 테마에 맞게 수정
          color: '#e5e7eb', // 어두운 테마에 맞게 수정
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
          width: '224px',
          backgroundColor: '#374151', // 어두운 테마
          border: '1px solid #4b5563', // 어두운 테마
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          marginTop: '4px',
          color: '#e5e7eb' // 전체 텍스트 색상
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
                border: '1px solid #4b5563',
                borderRadius: '4px',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: '#1f2937', // 어두운 테마
                color: '#e5e7eb', // 어두운 테마
                boxSizing: 'border-box' // 패딩이 너비를 넘지 않도록
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
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
              borderTop: '1px solid #4b5563' 
            }} />

            {/* 모델 목록 */}
            {filteredModels.length === 0 ? (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                color: '#9ca3af',
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
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
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


// 🎯 Home.jsx로 로직이 이전되었으므로 이 훅은 더 이상 사용되지 않습니다.
// 🎯 하지만 다른 곳에서 사용할 가능성을 대비해 남겨둡니다.
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
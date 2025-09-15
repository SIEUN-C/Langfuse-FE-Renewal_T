import React from 'react';

/**
 * ExpandListButton 컴포넌트
 * 리스트를 확장/축소하는 버튼
 * 
 * @param {boolean} isExpanded - 현재 확장 상태
 * @param {function} setExpanded - 확장 상태 변경 함수
 * @param {number} totalLength - 전체 아이템 수
 * @param {number} maxLength - 축소 시 최대 표시 개수
 * @param {string} expandText - 확장 버튼 텍스트
 * @param {string} className - 추가 CSS 클래스
 * @param {object} style - 추가 스타일
 */
const ExpandListButton = ({ 
  isExpanded, 
  setExpanded, 
  totalLength, 
  maxLength, 
  expandText,
  className = '',
  style = {}
}) => {
  // 버튼이 필요하지 않은 경우 렌더링하지 않음
  if (totalLength <= maxLength) return null;

  const defaultStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '8px 16px',
    marginTop: '12px',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    color: '#f3f4f6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ...style
  };

  const handleMouseEnter = (e) => {
    e.target.style.backgroundColor = '#374151';
    e.target.style.borderColor = '#4b5563';
  };

  const handleMouseLeave = (e) => {
    e.target.style.backgroundColor = style.backgroundColor || '#1f2937';
    e.target.style.borderColor = style.borderColor || '#374151';
  };

  return (
    <button
      className={className}
      onClick={() => setExpanded(!isExpanded)}
      style={defaultStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isExpanded ? 'Show less' : expandText}
      <span style={{ 
        marginLeft: '4px',
        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease'
      }}>
        ▼
      </span>
    </button>
  );
};

export default ExpandListButton;
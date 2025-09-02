import React from 'react';

/**
 * 스켈레톤 로딩 컴포넌트
 */
function Skeleton({ className = '', style = {} }) {
  return (
    <div 
      style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        height: '100%',
        width: '100%',
        ...style
      }}
      className={className}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Flex 컨테이너 컴포넌트 (Tremor 대체)
 */
function Flex({ 
  children, 
  alignItems = 'stretch', 
  justifyContent = 'flex-start', 
  className = '',
  style = {} 
}) {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems,
        justifyContent,
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * 텍스트 컴포넌트 (Tremor 대체)
 */
function Text({ children, className = '', style = {} }) {
  return (
    <span 
      style={{
        color: '#6b7280',
        fontSize: '0.875rem',
        ...style
      }}
      className={className}
    >
      {children}
    </span>
  );
}

/**
 * 문서 팝업 컴포넌트 (간단한 버전)
 */
function DocPopup({ description, href }) {
  if (!description) return null;
  
  return (
    <div style={{
      marginTop: '8px',
      textAlign: 'center'
    }}>
      <Text style={{ fontSize: '0.75rem' }}>
        {description}
      </Text>
      {href && (
        <div style={{ marginTop: '4px' }}>
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              fontSize: '0.75rem',
              textDecoration: 'underline'
            }}
          >
            Learn more
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * 데이터 없음 컴포넌트
 * @param {Object} props
 * @param {string} props.noDataText - 표시할 텍스트 
 * @param {React.ReactNode} props.children - 추가 컨텐츠
 * @param {string} props.className - CSS 클래스
 */
const NoData = ({
  noDataText = "No data",
  children,
  className = '',
}) => {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      className={className}
      style={{
        height: '75%',
        minHeight: '9rem',
        width: '100%',
        borderRadius: '6px',
        border: '2px dashed #d1d5db',
        flexDirection: 'column'
      }}
    >
      <Text>{noDataText}</Text>
      {children}
    </Flex>
  );
};

/**
 * 데이터 없음 또는 로딩 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {string} props.description - 설명 텍스트
 * @param {string} props.href - 도움말 링크
 * @param {string} props.className - CSS 클래스
 */
export function NoDataOrLoading({
  isLoading,
  description,
  href,
  className = '',
}) {
  if (isLoading) {
    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        className={className}
        style={{
          height: '75%',
          minHeight: '9rem',
          width: '100%',
          borderRadius: '6px'
        }}
      >
        <Skeleton />
      </Flex>
    );
  }

  return (
    <NoData noDataText="No data" className={className}>
      {description && <DocPopup description={description} href={href} />}
    </NoData>
  );
}

export default NoDataOrLoading;
import React, { useState } from 'react';

/**
 * 탭 컴포넌트
 * @param {Object} props
 * @param {Array} props.tabs - 탭 배열
 * @param {string} props.tabs[].tabTitle - 탭 제목
 * @param {React.ReactNode} props.tabs[].content - 탭 내용
 */
const TabComponent = ({ tabs }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Mock PostHog capture 함수
  const capture = (eventName, properties) => {
    console.log('PostHog capture:', eventName, properties);
  };

  return (
    <div>
      {/* 모바일용 셀렉트 */}
      <div style={{ 
        display: 'block',
        '@media (min-width: 640px)': {
          display: 'none'
        }
      }}>
        <label 
          htmlFor="tabs"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0
          }}
        >
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          style={{
            display: 'block',
            width: '100%',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            padding: '8px 12px',
            paddingRight: '40px',
            fontSize: '1rem',
            outline: 'none'
          }}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
          {tabs.map((tab, index) => (
            <option key={tab.tabTitle} value={index}>
              {tab.tabTitle}
            </option>
          ))}
        </select>
      </div>

      {/* 데스크톱용 탭 */}
      <div style={{
        display: 'none',
        '@media (min-width: 640px)': {
          display: 'block'
        }
      }}>
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <nav
            style={{
              marginBottom: '-1px',
              display: 'flex',
              gap: '8px'
            }}
            aria-label="Tabs"
          >
            {tabs.map((tab, index) => (
              <a
                key={tab.tabTitle}
                style={{
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderBottom: '2px solid',
                  borderBottomColor: index === selectedIndex ? '#3b82f6' : 'transparent',
                  color: index === selectedIndex ? '#3b82f6' : '#6b7280',
                  padding: '8px 4px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                aria-current={index === selectedIndex ? "page" : undefined}
                onClick={() => {
                  setSelectedIndex(index);
                  capture("dashboard:chart_tab_switch", {
                    tabLabel: tab.tabTitle,
                  });
                }}
                onMouseEnter={(e) => {
                  if (index !== selectedIndex) {
                    e.target.style.borderBottomColor = '#d1d5db';
                    e.target.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== selectedIndex) {
                    e.target.style.borderBottomColor = 'transparent';
                    e.target.style.color = '#6b7280';
                  }
                }}
              >
                {tab.tabTitle}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* 탭 내용 */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        height: '75%',
        flexDirection: 'column'
      }}>
        {tabs[selectedIndex]?.content}
      </div>

      {/* 반응형을 위한 미디어 쿼리 CSS */}
      <style>{`
        @media (min-width: 640px) {
          .mobile-select { display: none !important; }
          .desktop-tabs { display: block !important; }
        }
        @media (max-width: 639px) {
          .mobile-select { display: block !important; }
          .desktop-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TabComponent;
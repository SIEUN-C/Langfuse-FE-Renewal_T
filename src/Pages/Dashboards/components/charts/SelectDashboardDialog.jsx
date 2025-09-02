import React, { useState } from "react";

/**
 * 대시보드 선택 다이얼로그 컴포넌트
 * 위젯을 추가할 대시보드를 선택하는 다이얼로그
 * @param {Object} props
 * @param {boolean} props.open - 다이얼로그 열림 상태
 * @param {function} props.onOpenChange - 열림 상태 변경 함수
 * @param {string} props.projectId - 프로젝트 ID
 * @param {function} props.onSelectDashboard - 대시보드 선택 콜백
 * @param {function} props.onSkip - 건너뛰기 콜백
 */
const SelectDashboardDialog = ({
  open,
  onOpenChange,
  projectId,
  onSelectDashboard,
  onSkip,
}) => {
  const [selectedDashboardId, setSelectedDashboardId] = useState(null);

  // TODO: 실제 API 연동 필요
  console.log('SelectDashboardDialog props:', {
    open,
    projectId,
    selectedDashboardId
  });

  // Mock 대시보드 데이터
  const mockDashboards = {
    isLoading: false,
    isError: false,
    error: null,
    data: {
      dashboards: [
        {
          id: "dash-1",
          name: "Main Analytics Dashboard",
          description: "Primary dashboard for tracking key metrics and performance indicators",
          updatedAt: "2024-01-15T10:30:00Z",
          owner: "PROJECT"
        },
        {
          id: "dash-2", 
          name: "Model Performance",
          description: "Dashboard focused on model accuracy and performance metrics",
          updatedAt: "2024-01-14T15:45:00Z",
          owner: "PROJECT"
        },
        {
          id: "dash-3",
          name: "Cost Analysis",
          description: "Financial tracking and cost optimization dashboard",
          updatedAt: "2024-01-13T09:20:00Z",
          owner: "PROJECT"
        },
        {
          id: "dash-4",
          name: "User Feedback",
          description: "Customer satisfaction and feedback analysis",
          updatedAt: "2024-01-12T14:15:00Z",
          owner: "USER" // 이건 필터링될 예정
        }
      ]
    }
  };

  const dashboards = mockDashboards;

  const handleAdd = () => {
    if (selectedDashboardId) {
      onSelectDashboard(selectedDashboardId);
      onOpenChange(false);
      console.log('Dashboard selected:', selectedDashboardId);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
    console.log('Dashboard selection skipped');
  };

  if (!open) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* 다이얼로그 콘텐츠 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1001,
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: '24px 24px 0 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: 0,
            paddingBottom: '16px'
          }}>
            Select dashboard to add widget to
          </h2>
        </div>

        {/* 바디 */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflow: 'auto'
        }}>
          <div style={{
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {dashboards.isLoading ? (
              <div style={{
                padding: '32px 0',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                Loading dashboards...
              </div>
            ) : dashboards.isError ? (
              <div style={{
                padding: '32px 0',
                textAlign: 'center',
                color: '#dc2626'
              }}>
                Error: {dashboards.error?.message}
              </div>
            ) : dashboards.data?.dashboards.filter(d => d.owner === "PROJECT").length === 0 ? (
              <div style={{
                padding: '32px 0',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                No dashboards found.
              </div>
            ) : (
              /* 테이블 */
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Name
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Description
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboards.data?.dashboards
                    .filter((d) => d.owner === "PROJECT")
                    .map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => setSelectedDashboardId(d.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedDashboardId === d.id ? '#f3f4f6' : 'transparent',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedDashboardId !== d.id) {
                            e.target.closest('tr').style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedDashboardId !== d.id) {
                            e.target.closest('tr').style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <td style={{
                          padding: '12px',
                          fontWeight: '500'
                        }}>
                          {d.name}
                        </td>
                        <td style={{
                          padding: '12px',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={d.description}>
                          {d.description}
                        </td>
                        <td style={{
                          padding: '12px',
                          color: '#6b7280'
                        }}>
                          {new Date(d.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '0 24px 24px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px'
        }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Skip
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedDashboardId}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: selectedDashboardId ? '#3b82f6' : '#9ca3af',
              color: 'white',
              borderRadius: '4px',
              cursor: selectedDashboardId ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (selectedDashboardId) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDashboardId) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            Add to Dashboard
          </button>
        </div>
      </div>
    </>
  );
}

export default SelectDashboardDialog; 
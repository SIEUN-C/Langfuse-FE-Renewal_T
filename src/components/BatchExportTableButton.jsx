import React, { useState } from 'react';
import { api } from '../utils/api';
import { showSuccessToast } from '../features/notifications/showSuccessToast';
import { useHasProjectAccess } from '../features/rbac/utils/checkProjectAccess';

// Export options configuration
const exportOptions = {
  csv: { label: 'CSV' },
  json: { label: 'JSON' },
  xlsx: { label: 'Excel' }
};

export const BatchExportTableButton = (props) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const createExport = api.batchExport.create.useMutation({
    onSettled: () => {
      setIsExporting(false);
    },
    onSuccess: () => {
      showSuccessToast({
        title: "Export queued",
        description: "You will receive an email when the export is ready.",
        duration: 10000,
        link: {
          href: `/project/${props.projectId}/settings/exports`,
          text: "View exports",
        },
      });
    },
  });
  
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "batchExports:create",
  });

  const handleExport = async (format) => {
    setIsExporting(true);
    setIsMenuOpen(false);
    
    try {
      await createExport.mutateAsync({
        projectId: props.projectId,
        name: `${new Date().toISOString()} - ${props.tableName} as ${format}`,
        format,
        query: {
          tableName: props.tableName,
          filter: props.filterState,
          searchQuery: props.searchQuery || undefined,
          searchType: props.searchType || undefined,
          orderBy: props.orderByState,
        },
      });
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 권한이 없으면 렌더링하지 않음
  if (!hasAccess) return null;

  return (
    <div className="batch-export-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        className="export-button"
        onClick={toggleMenu}
        disabled={isExporting}
        title="Export"
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {isExporting ? (
          <span style={{ 
            display: 'inline-block', 
            width: '16px', 
            height: '16px',
            border: '2px solid #ccc',
            borderTop: '2px solid #333',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}>
          </span>
        ) : (
          <span style={{ fontSize: '16px' }}>⬇</span>
        )}
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={closeMenu}
          />
          
          {/* Dropdown menu */}
          <div 
            className="dropdown-menu"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              minWidth: '120px',
              zIndex: 1000
            }}
          >
            <div style={{ 
              padding: '8px 12px', 
              borderBottom: '1px solid #eee',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#333'
            }}>
              Export
            </div>
            
            {Object.entries(exportOptions).map(([key, options]) => (
              <button
                key={key}
                className="dropdown-item"
                onClick={() => handleExport(key)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                as {options.label}
              </button>
            ))}
          </div>
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .export-button:hover:not(:disabled) {
          background-color: #f5f5f5;
        }
        
        .dropdown-item:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </div>
  );
};
import React, { useState, useEffect } from 'react';

/**
 * 버튼 컴포넌트
 */
function Button({ 
  children, 
  onClick, 
  variant = 'default',
  type = 'button',
  loading = false,
  disabled = false,
  style = {} 
}) {
  const baseStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    opacity: disabled || loading ? 0.6 : 1,
    ...style
  };

  const variantStyles = {
    default: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    outline: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variantStyles[variant]
      }}
    >
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid currentColor',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      {children}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}

/**
 * 입력 필드 컴포넌트
 */
function Input({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  style = {} 
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '0.875rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        ...style
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

/**
 * 라벨 컴포넌트
 */
function Label({ htmlFor, children, style = {} }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '4px',
        ...style
      }}
    >
      {children}
    </label>
  );
}

/**
 * 텍스트에어리어 컴포넌트
 */
function Textarea({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  rows = 3,
  style = {} 
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '0.875rem',
        resize: 'vertical',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit',
        ...style
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

/**
 * 다이얼로그 컴포넌트
 */
function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
}

function DialogContent({ children, className, style = {} }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function DialogHeader({ children }) {
  return (
    <div style={{
      padding: '24px 24px 16px 24px',
      borderBottom: '1px solid #f3f4f6'
    }}>
      {children}
    </div>
  );
}

function DialogTitle({ children }) {
  return (
    <h2 style={{
      margin: 0,
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#111827'
    }}>
      {children}
    </h2>
  );
}

function DialogBody({ children }) {
  return (
    <div style={{ padding: '16px 24px' }}>
      {children}
    </div>
  );
}

function DialogFooter({ children }) {
  return (
    <div style={{
      padding: '16px 24px 24px 24px',
      borderTop: '1px solid #f3f4f6'
    }}>
      {children}
    </div>
  );
}

/**
 * 대시보드 편집 다이얼로그
 * @param {Object} props
 * @param {boolean} props.open - 다이얼로그 열림 상태
 * @param {function} props.onOpenChange - 열림 상태 변경 함수
 * @param {string} props.projectId - 프로젝트 ID
 * @param {string} props.dashboardId - 대시보드 ID
 * @param {string} props.initialName - 초기 이름
 * @param {string} props.initialDescription - 초기 설명
 */
const EditDashboardDialog = ({
  open,
  onOpenChange,
  projectId,
  dashboardId,
  initialName,
  initialDescription,
}) => {
  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [isLoading, setIsLoading] = useState(false);

  // props가 변경될 때 state 업데이트
  useEffect(() => {
    setName(initialName || '');
    setDescription(initialDescription || '');
  }, [initialName, initialDescription]);

  // Mock API 호출 함수들
  const showSuccessToast = ({ title, description }) => {
    alert(`✅ ${title}: ${description}`);
  };

  const showErrorToast = (title, message) => {
    alert(`❌ ${title}: ${message}`);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showErrorToast('Validation error', 'Dashboard name is required');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 실제 API 연동 시 구현
      // await api.dashboard.updateDashboardMetadata.mutate({
      //   projectId,
      //   dashboardId,
      //   name: name.trim(),
      //   description: description.trim(),
      // });

      // Mock API 호출 시뮬레이션
      console.log('Updating dashboard:', {
        projectId,
        dashboardId,
        name: name.trim(),
        description: description.trim(),
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기

      showSuccessToast({
        title: 'Dashboard updated',
        description: 'The dashboard has been updated successfully',
      });

      onOpenChange(false);
    } catch (error) {
      showErrorToast('Failed to update dashboard', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Dashboard</DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dashboard name"
              />
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dashboard description"
                rows={3}
              />
            </div>
          </div>
        </DialogBody>
        
        <DialogFooter>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditDashboardDialog;
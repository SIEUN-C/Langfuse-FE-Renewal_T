import React from 'react';

const RightAlignedCell = ({
  children,
  className = '',
  title
}) => {
  return (
    <div 
      style={{
        textAlign: 'right'
      }}
      className={className}
      title={title}
    >
      {children}
    </div>
  );
}

export default RightAlignedCell;
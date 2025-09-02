import React from 'react';

const  LeftAlignedCell = ({
  children,
  className = '',
  title
}) => {
  return (
    <div 
      style={{
        textAlign: 'left'
      }}
      className={className}
      title={title}
    >
      {children}
    </div>
  );
}

export default LeftAlignedCell;
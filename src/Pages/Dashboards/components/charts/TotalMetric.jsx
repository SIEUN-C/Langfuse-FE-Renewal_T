import React from 'react';
import { compactNumberFormatter } from '../../utils/numbers.js';

const TotalMetric = ({ totalCount, description }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline', 
      gap: '8px',
      marginBottom: '0px'
    }}>
      <div style={{
        fontSize: '1.9rem',   
        fontWeight: '500',
        color: '#f8fafc'
      }}>
        {compactNumberFormatter(totalCount)}
      </div>
      
      <div style={{
        fontSize: '12px',     
        color: '#9ca3af',      
        fontWeight: '400'
      }}>
        {description}       
      </div>
    </div>
  );
};

export default TotalMetric;
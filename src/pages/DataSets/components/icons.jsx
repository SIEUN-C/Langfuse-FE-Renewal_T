// src/Pages/Evaluation/DataSets/components/icons.jsx
import React from "react";

export function PencilIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 15l-1.5 4.5L12 18l6.5-6.5a1.9 1.9 0 10-2.7-2.7L9 15z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M14.5 7.5l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 8V6a2 2 0 012-2 2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 8l1 9a2 2 0 002 2 2 2 0 002-2l1-9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11.5 11.5v5M13.5 11.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

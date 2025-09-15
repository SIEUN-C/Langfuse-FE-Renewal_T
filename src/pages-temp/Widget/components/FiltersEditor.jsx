// src/Pages/Widget/components/FiltersEditor.jsx
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { X, Plus, ChevronDown, Check, Search } from "lucide-react";
import { widgetFilterConfig, getWidgetOperatorMapping } from "../../../components/FilterControls/filterConfig.js";

// ✅ 다크모드 MultiSelect 컴포넌트
function MultiSelectDropdown({ 
  options = [], 
  values = [], 
  onChange, 
  placeholder = "Select values...",
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = options.filter(opt => opt && opt.length > 0);
  
  const filteredOptions = safeOptions.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked) => {
    onChange(checked ? [...filteredOptions] : []);
  };

  const handleOptionToggle = (option) => {
    const newValues = values.includes(option)
      ? values.filter(v => v !== option)
      : [...values, option];
    onChange(newValues);
  };

  const isAllSelected = filteredOptions.length > 0 && 
    filteredOptions.every(opt => values.includes(opt));
  const isIndeterminate = filteredOptions.some(opt => values.includes(opt)) && !isAllSelected;

  const displayText = () => {
    if (values.length === 0) return placeholder;
    if (values.length === 1) return values[0];
    return `${values.length} selected`;
  };

  // 옵션이 없으면 텍스트 입력으로 폴백
  if (safeOptions.length === 0) {
    return (
      <input
        type="text"
        className={className}
        value={values.join(', ')}
        onChange={(e) => {
          const newValues = e.target.value
            .split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);
          onChange(newValues);
        }}
        placeholder="Enter values separated by commas..."
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #374151',
          borderRadius: '6px',
          fontSize: '14px',
          outline: 'none',
          backgroundColor: '#1f2937',
          color: '#f9fafb'
        }}
      />
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: '38px',
          padding: '8px 12px',
          border: '1px solid #374151',
          borderRadius: '6px',
          background: disabled ? '#111827' : '#1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          color: disabled ? '#6b7280' : '#f9fafb'
        }}
      >
        <span style={{ 
          textAlign: 'left', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1 
        }}>
          {displayText()}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: '#9ca3af', 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            marginLeft: '8px'
          }} 
        />
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          marginTop: '4px',
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          overflow: 'hidden',
          minWidth: '200px',
          maxWidth: '400px'
        }}>
          {/* 검색 입력 */}
          <div style={{ padding: '12px', borderBottom: '1px solid #374151' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#111827',
                color: '#f9fafb'
              }}
            />
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {/* Select All 옵션 */}
            {filteredOptions.length > 1 && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: '#111827',
                  borderBottom: '1px solid #374151',
                  fontWeight: '500'
                }}
                onClick={() => handleSelectAll(!isAllSelected)}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {}}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', color: '#f9fafb' }}>Select All</span>
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
                  ({filteredOptions.length})
                </span>
              </div>
            )}
            
            {/* 개별 옵션들 */}
            {filteredOptions.map(option => (
              <div 
                key={option} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #2d3748'
                }}
                onClick={() => handleOptionToggle(option)}
                onMouseEnter={(e) => e.target.style.background = '#374151'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={values.includes(option)}
                  onChange={() => {}}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', color: '#f9fafb' }}>{option}</span>
              </div>
            ))}
            
            {/* 결과 없음 메시지 */}
            {filteredOptions.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                <span>No options found</span>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#60a5fa',
                      background: 'none',
                      border: '1px solid #60a5fa',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* 선택된 항목 수 표시 */}
          {values.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#111827',
              borderTop: '1px solid #374151',
              fontSize: '12px'
            }}>
              <span style={{ color: '#9ca3af' }}>
                {values.length} of {safeOptions.length} selected
              </span>
              <button 
                onClick={() => onChange([])}
                style={{
                  color: '#f87171',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FiltersEditor({
  styles,
  filters,
  setFilters,
  getDimensionsForView,
  view,
}) {
  const operatorMapping = getWidgetOperatorMapping();

  const availableColumns = useMemo(() => {
    const viewDimensions = typeof getDimensionsForView === "function" 
      ? getDimensionsForView(view) ?? [] 
      : [];

    const viewSpecificColumns = widgetFilterConfig.filter(config => {
      switch (view) {
        case "traces":
          return !["observationName", "model", "type"].includes(config.key);
        case "observations":
          return !["session", "sessionId"].includes(config.key);
        case "scores-numeric":
        case "scores-categorical":
          return ["environment", "scoreName", "release", "version", "user", "userId", "timestamp"].includes(config.key);
        default:
          return true;
      }
    });

    if (viewDimensions.length > 0) {
      return viewDimensions.map(dim => {
        const configItem = widgetFilterConfig.find(config => 
          config.key === dim.value || 
          config.key === dim.value.toLowerCase() ||
          config.label.toLowerCase() === dim.label.toLowerCase()
        );
        
        return {
          id: dim.value,
          name: dim.label,
          value: dim.value,
          label: dim.label,
          type: configItem?.type || "string",
          operators: configItem?.operators || ["=", "contains"],
          options: configItem?.options || [],
          hasMetaKey: configItem?.hasMetaKey || false
        };
      });
    }

    return viewSpecificColumns.map(config => ({
      id: config.key,
      name: config.label,
      value: config.key,
      label: config.label,
      type: config.type,
      operators: config.operators,
      options: config.options || [],
      hasMetaKey: config.hasMetaKey || false
    }));
  }, [getDimensionsForView, view]);

  const getOptionsForColumn = useCallback((columnId) => {
    const configItem = widgetFilterConfig.find(config => config.key === columnId);
    
    const widgetSpecificOptions = {
      "environment": ["default"],
    };
    
    return widgetSpecificOptions[columnId] || configItem?.options || [];
  }, []);

  const getOperatorsForColumn = useCallback((columnId) => {
    const column = availableColumns.find(col => col.id === columnId);
    if (!column) return [];

    return column.operators.map(op => ({
      value: operatorMapping[op] || op.toLowerCase().replace(/\s+/g, ""),
      label: op
    }));
  }, [availableColumns, operatorMapping]);

  const updateFilter = (index, updates) => {
    setFilters(filters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const addFilter = () => {
    const firstColumn = availableColumns[0];
    const firstOperators = firstColumn ? getOperatorsForColumn(firstColumn.id) : [];
    
    setFilters([
      ...filters,
      {
        id: Date.now(),
        column: firstColumn?.id || "",
        operator: firstOperators[0]?.value || "anyOf",
        values: [],
        metaKey: ""
      }
    ]);
  };

  const removeFilter = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
  };

  const handleValueChange = (index, newValue) => {
    updateFilter(index, { values: Array.isArray(newValue) ? newValue : [newValue] });
  };

  const handleTextValueChange = (index, textValue) => {
    const values = textValue
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    updateFilter(index, { values });
  };

  const getValueString = (values) => {
    return Array.isArray(values) ? values.join(', ') : '';
  };

  const renderValueInput = (filter, index) => {
    const column = availableColumns.find(col => col.id === filter.column);
    if (!column) {
      return (
        <input
          type="text"
          value={getValueString(filter.values || [])}
          onChange={(e) => handleTextValueChange(index, e.target.value)}
          placeholder="Enter values..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #374151',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#1f2937',
            color: '#f9fafb'
          }}
        />
      );
    }

    const isMultiSelectOperator = ["anyOf", "noneOf", "allOf"].includes(filter.operator);

    switch (column.type) {
      case "number":
        return (
          <input
            type="number"
            value={filter.values?.[0] || ''}
            onChange={(e) => handleValueChange(index, e.target.value)}
            placeholder="Enter number..."
            step="any"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#1f2937',
              color: '#f9fafb'
            }}
          />
        );

      case "date":
        return (
          <input
            type="datetime-local"
            value={filter.values?.[0] || ''}
            onChange={(e) => handleValueChange(index, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#1f2937',
              color: '#f9fafb'
            }}
          />
        );

      case "categorical":
        if (isMultiSelectOperator) {
          const availableOptions = getOptionsForColumn(column.id);
          return (
            <MultiSelectDropdown
              options={availableOptions}
              values={filter.values || []}
              onChange={(newValues) => handleValueChange(index, newValues)}
              placeholder="Select values..."
            />
          );
        } else {
          return (
            <input
              type="text"
              value={getValueString(filter.values || [])}
              onChange={(e) => handleTextValueChange(index, e.target.value)}
              placeholder="Enter value..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#1f2937',
                color: '#f9fafb'
              }}
            />
          );
        }

      case "string":
      default:
        return (
          <input
            type="text"
            value={getValueString(filter.values || [])}
            onChange={(e) => handleTextValueChange(index, e.target.value)}
            placeholder={isMultiSelectOperator ? "Enter values separated by commas..." : "Enter value..."}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#1f2937',
              color: '#f9fafb'
            }}
          />
        );
    }
  };

  const renderMetaKeyInput = (filter, index) => {
    const column = availableColumns.find(col => col.id === filter.column);
    if (!column?.hasMetaKey) return null;

    return (
      <input
        type="text"
        value={filter.metaKey || ''}
        onChange={(e) => updateFilter(index, { metaKey: e.target.value })}
        placeholder="key"
        style={{
          width: '80px',
          padding: '8px 12px',
          border: '1px solid #374151',
          borderRadius: '6px',
          fontSize: '14px',
          outline: 'none',
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          marginRight: '8px'
        }}
      />
    );
  };

  return (
    <div style={{ 
      background: '#111827', 
      padding: '16px', 
      borderRadius: '8px', 
      border: '1px solid #374151' 
    }}>
      {filters.length > 0 && filters.map((filter, index) => {
        const column = availableColumns.find(col => col.id === filter.column);
        const availableOperators = filter.column ? getOperatorsForColumn(filter.column) : [];
        const hasMetaKey = column?.hasMetaKey;

        return (
          <div 
            key={filter.id || index} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ 
              fontSize: '14px', 
              color: '#9ca3af', 
              minWidth: '50px',
              fontWeight: '500'
            }}>
              {index === 0 ? "Where" : "And"}
            </span>

            <select
              value={filter.column || ""}
              onChange={(e) => {
                const columnId = e.target.value;
                const newColumn = availableColumns.find(col => col.id === columnId);
                const newOperators = columnId ? getOperatorsForColumn(columnId) : [];
                
                updateFilter(index, {
                  column: columnId,
                  operator: newOperators[0]?.value || "anyOf",
                  values: [],
                  metaKey: ""
                });
              }}
              style={{
                minWidth: '120px',
                padding: '8px 12px',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#1f2937',
                color: '#f9fafb'
              }}
            >
              <option value="" disabled>Column</option>
              {availableColumns.map(col => (
                <option key={col.id} value={col.id}>
                  {col.name}
                  {col.hasMetaKey && ' *'}
                </option>
              ))}
            </select>

            {renderMetaKeyInput(filter, index)}

            <select
              disabled={!filter.column}
              value={filter.operator || ""}
              onChange={(e) => updateFilter(index, { operator: e.target.value })}
              style={{
                minWidth: '100px',
                padding: '8px 12px',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: filter.column ? '#1f2937' : '#111827',
                color: filter.column ? '#f9fafb' : '#6b7280',
                cursor: filter.column ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="" disabled>Operator</option>
              {availableOperators.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            <div style={{ flex: 1, minWidth: '150px' }}>
              {renderValueInput(filter, index)}
            </div>

            <button
              onClick={() => removeFilter(index)}
              title="Remove filter"
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      <button 
        onClick={addFilter}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: '1px dashed #4b5563',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          color: '#9ca3af',
          cursor: 'pointer',
          fontSize: '14px',
          width: '100%',
          justifyContent: 'center',
          marginTop: filters.length > 0 ? '8px' : '0px'
        }}
      >
        <Plus size={16} />
        Add filter
      </button>
    </div>
  );
}
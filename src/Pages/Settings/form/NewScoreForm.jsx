import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react'
import commonStyles from '../layout/SettingsCommon.module.css';
import formStyles from '../layout/Form.module.css';

const NewScoreForm = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('NUMERIC');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [description, setDescription] = useState('');
  // CATEGORICAL 타입일 때의 상태
  const [categories, setCategories] = useState([{ value: 1, label: '' }]);

  const handleSubmit = (event) => {
    event.preventDefault();

    // 기본 필드
    const payload = {
      name: name?.trim(),
      dataType,
      description: description?.trim() || undefined,
    };

    if (dataType === 'NUMERIC') {
      // 숫자 변환 (빈 값은 undefined로 보내서 optional 처리)
      const min =
        minValue === '' || minValue === null || minValue === undefined
          ? undefined
          : Number(minValue);
      const max =
        maxValue === '' || maxValue === null || maxValue === undefined
          ? undefined
          : Number(maxValue);

      // 유효성 검사: 숫자 변환 실패 방지
      if (minValue !== '' && Number.isNaN(min)) {
        alert('Minimum은 숫자여야 합니다.');
        return;
      }
      if (maxValue !== '' && Number.isNaN(max)) {
        alert('Maximum은 숫자여야 합니다.');
        return;
      }
      if (min !== undefined && max !== undefined && min > max) {
        alert('Minimum은 Maximum보다 클 수 없습니다.');
        return;
      }

      if (min !== undefined) payload.minValue = min;
      if (max !== undefined) payload.maxValue = max;
    }

    if (dataType === 'CATEGORICAL') {
      // 공백 라벨 제거 + 숫자 변환 + 정렬
      const cleaned = (categories || [])
        .map((c) => ({
          value: Number(c.value),
          label: (c.label ?? '').trim(),
        }))
        .filter((c) => !Number.isNaN(c.value) && c.label.length > 0)
        .sort((a, b) => a.value - b.value);

      if (cleaned.length === 0) {
        alert('최소 1개 이상의 카테고리를 입력해 주세요.');
        return;
      }

      payload.categories = cleaned;
    }

    // BOOLEAN은 별도 필드 불필요(서버 스키마에 따라 다르면 여기서 세팅)
    // payload.categories = [{ value: 1, label: 'True' }, { value: 0, label: 'False' }];

    onSave(payload);
  };

  // 카테고리 라벨 변경
  const handleCategoryLabelChange = (index, label) => {
    const newCategories = [...categories];
    newCategories[index].label = label;
    setCategories(newCategories);
  };

  // 카테고리 값 변경 (숫자 또는 빈 문자열 허용)
  const handleCategoryValueChange = (index, value) => {
    const newCategories = [...categories];
    if (value === '') {
      newCategories[index].value = '';
    } else {
      const numValue = Number(value);
      if (!Number.isNaN(numValue)) {
        newCategories[index].value = numValue;
      }
    }
    setCategories(newCategories);
  };

  const addCategory = () => {
    const nums = categories.map((c) => Number(c.value)).filter((v) => !Number.isNaN(v));
    const nextValue = nums.length > 0 ? Math.max(...nums) + 1 : 0;
    setCategories([...categories, { value: nextValue, label: '' }]);
  };

  const removeCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  return (
    <div className={formStyles.formWrapper}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.formBody}>
          {/* name */}
          <div className={formStyles.formGroup}>
            <label htmlFor="name" className={formStyles.formLabel}>Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={formStyles.formInput}
              required
            />
          </div>

          {/* Data Type */}
          <div className={formStyles.formGroup}>
            <label htmlFor="dataType" className={formStyles.formLabel}>Data type</label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className={formStyles.formSelect}
            >
              <option value="NUMERIC">NUMERIC</option>
              <option value="CATEGORICAL">CATEGORICAL</option>
              <option value="BOOLEAN">BOOLEAN</option>
            </select>
          </div>

          {/* NUMERIC */}
          {dataType === 'NUMERIC' && (
            <>
              <div className={formStyles.formGroup}>
                <label htmlFor="minValue" className={formStyles.formLabel}>Minimum (optional)</label>
                <input
                  type="number"
                  id="minValue"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className={formStyles.formInput}
                />
              </div>
              <div className={formStyles.formGroup}>
                <label htmlFor="maxValue" className={formStyles.formLabel}>Maximum (optional)</label>
                <input
                  type="number"
                  id="maxValue"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className={formStyles.formInput}
                />
              </div>
            </>
          )}

          {/* CATEGORICAL */}
          {dataType === 'CATEGORICAL' && (
            <div className={formStyles.formGroup}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <label className={formStyles.formLabel} style={{ flexBasis: '100px', flexGrow: 0 }}>Value</label>
                <label className={formStyles.formLabel}>Label</label>
              </div>
              {categories.map((cat, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={cat.value}
                    onChange={(e) => handleCategoryValueChange(index, e.target.value)}
                    className={formStyles.formInput}
                    style={{ flexBasis: '100px', flexGrow: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Label"
                    value={cat.label}
                    onChange={(e) => handleCategoryLabelChange(index, e.target.value)}
                    className={formStyles.formInput}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className={commonStyles.button}
                    style={{ padding: '8px', background: 'transparent', border: '1px solid #444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCategory}
                className={commonStyles.button}
                style={{ marginTop: '8px', alignSelf: 'center', width: '100%' }}
              >
                <Plus size={16} /> Add category
              </button>
            </div>
          )}

          {/* BOOLEAN */}
          {dataType === 'BOOLEAN' && (
            <div className={formStyles.formGroup}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <label className={formStyles.formLabel} style={{ flexBasis: '100px', flexGrow: 0 }}>Value</label>
                <label className={formStyles.formLabel}>Label</label>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" value={1} disabled className={formStyles.formInput} style={{ flexBasis: '100px', flexGrow: 0 }} />
                <input type="text" value="True" disabled className={formStyles.formInput} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" value={0} disabled className={formStyles.formInput} style={{ flexBasis: '100px', flexGrow: 0 }} />
                <input type="text" value="False" disabled className={formStyles.formInput} />
              </div>
            </div>
          )}

          {/* Description */}
          <div className={formStyles.formGroup}>
            <label htmlFor="description" className={formStyles.formLabel}>Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={formStyles.formTextarea}
              placeholder="Provide an optional description of the score config..."
              rows={4}
            />
          </div>
        </div>

        {/* form footer */}
        <footer className={formStyles.formFooter}>
          <button type="submit" className={commonStyles.button} style={{ width: '100%' }}>
            Submit
          </button>
        </footer>
      </form>
    </div>
  );
};

export default NewScoreForm;

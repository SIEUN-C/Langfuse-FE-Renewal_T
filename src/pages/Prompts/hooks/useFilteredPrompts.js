import { useState, useMemo } from 'react';
import { promptsFilterConfig } from '../../../components/FilterControls/filterConfig.js';

const applyFilters = (prompts, builderFilters, searchQuery, searchType) => {
    let tempPrompts = [...prompts];

    // 1. FilterBuilder의 고급 필터 적용
    const activeBuilderFilters = builderFilters.filter(f => String(f.value || '').trim() !== '');
    if (activeBuilderFilters.length > 0) {
        tempPrompts = tempPrompts.filter(prompt => {
            return activeBuilderFilters.every(filter => {
                const keyMap = { Name: 'name', Version: 'versions', Type: 'type', Labels: 'tags', Tags: 'tags' };
                const promptKey = keyMap[filter.column];
                if (!promptKey) return true;

                const promptValue = prompt[promptKey];
                const filterValue = filter.value;
                if (promptValue === null || promptValue === undefined) return false;

                const config = promptsFilterConfig.find(c => c.key === filter.column);
                if (!config) return true;

                const pvString = String(promptValue).toLowerCase();
                const fvString = String(filterValue).toLowerCase();

                switch (config.type) {
                    case 'string':
                        if (filter.operator === '=') return pvString === fvString;
                        if (filter.operator === 'contains') return pvString.includes(fvString);
                        if (filter.operator === 'does not contain') return !pvString.includes(fvString);
                        if (filter.operator === 'starts with') return pvString.startsWith(fvString);
                        if (filter.operator === 'ends with') return pvString.endsWith(fvString);
                        return true;
                    case 'number':
                        const pvNum = Number(promptValue);
                        const fvNum = Number(filterValue);
                        if (isNaN(pvNum) || isNaN(fvNum)) return false;
                        if (filter.operator === '=') return pvNum === fvNum;
                        if (filter.operator === '>') return pvNum > fvNum;
                        if (filter.operator === '<') return pvNum < fvNum;
                        if (filter.operator === '>=') return pvNum >= fvNum;
                        if (filter.operator === '<=') return pvNum <= fvNum;
                        return true;
                    case 'categorical':
                        const fvArray = Array.isArray(filterValue) ? filterValue.map(v => v.toLowerCase()) : fvString.split(',');
                        const pvArray = Array.isArray(promptValue) ? promptValue.map(v => String(v).toLowerCase()) : [pvString];
                        if (filter.operator === 'any of') return fvArray.some(val => pvArray.includes(val));
                        if (filter.operator === 'none of') return !fvArray.some(val => pvArray.includes(val));
                        if (filter.operator === 'all of') return fvArray.every(val => pvArray.includes(val));
                        return true;
                    default:
                        return true;
                }
            });
        });
    }

    // 2. 검색창(SearchInput) 필터 적용
    const query = searchQuery.trim().toLowerCase();
    if (query) {
        tempPrompts = tempPrompts.filter(prompt => {
            if (searchType === 'Names, Tags') {
                const nameMatch = prompt.name ? prompt.name.toLowerCase().includes(query) : false;
                const tagMatch = Array.isArray(prompt.tags) && prompt.tags.some(tag => tag.toLowerCase().includes(query));
                return nameMatch || tagMatch;
            }
            if (searchType === 'Full Text') {
                return JSON.stringify(prompt).toLowerCase().includes(query);
            }
            return true;
        });
    }

    return tempPrompts;
}


export const useFilteredPrompts = (prompts) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('Names, Tags');
    const [builderFilters, setBuilderFilters] = useState(() => {
        const initialColumn = promptsFilterConfig[0];
        return [{ id: Date.now(), column: initialColumn.key, operator: initialColumn.operators[0], value: '', metaKey: '' }];
    });

    const filteredPrompts = useMemo(() => {
        return applyFilters(prompts, builderFilters, searchQuery, searchType);
    }, [prompts, builderFilters, searchQuery, searchType]);

    // SearchInput 컴포넌트에 필요한 props
    const searchInputProps = {
        placeholder: "Search...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        searchType: searchType,
        setSearchType: setSearchType,
        searchTypes: ['Names, Tags', 'Full Text']
    };

    // FilterControls 컴포넌트에 필요한 props
    const filterControlsProps = {
        builderFilterProps: {
            filters: builderFilters,
            onFilterChange: setBuilderFilters,
            filterConfig: promptsFilterConfig
        }
    };

    return { filteredPrompts, searchInputProps, filterControlsProps };
};
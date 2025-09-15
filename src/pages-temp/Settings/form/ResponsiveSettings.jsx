import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import commonStyles from './layout/SettingsCommon.module.css';

const ResponsiveSettings = ({ children }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // 메뉴 옵션들
    const menuOptions = [
        { value: '/settings/general', label: 'General' },
        { value: '/settings/api-keys', label: 'API Keys' },
        { value: '/settings/llm-connections', label: 'LLM Connections' },
        { value: '/settings/models', label: 'Models' },
        { value: '/settings/scores', label: 'Scores' },
        { value: '/settings/members', label: 'Members' },
    ];

    // 화면 크기 감지
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // 현재 경로에 따라 선택된 메뉴 설정
    useEffect(() => {
        const currentOption = menuOptions.find(option => 
            location.pathname.includes(option.value.split('/')[2])
        );
        if (currentOption) {
            setSelectedMenu(currentOption.value);
        }
    }, [location.pathname]);

    // 메뉴 변경 처리
    const handleMenuChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedMenu(selectedValue);
        navigate(selectedValue);
    };

    return (
        <div className={commonStyles.container}>
            {/* 모바일에서만 표시되는 드롭다운 메뉴 */}
            {isMobile && (
                <select 
                    className={commonStyles.mobileMenuSelect}
                    value={selectedMenu}
                    onChange={handleMenuChange}
                >
                    {menuOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            )}
            
            {/* 페이지 컨텐츠 */}
            {children}
        </div>
    );
};

export default ResponsiveSettings;
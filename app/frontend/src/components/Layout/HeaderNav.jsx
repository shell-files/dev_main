import React from 'react';
import { useNavigate } from 'react-router';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 
import { useAuth } from '@hooks/AuthContext.jsx';

const Headernav = ({ toggleSidebar, isSidebarOpen }) => {
    const navigate = useNavigate();
    const { toggleAlarm } = useAlarm();
    const { user, selectedCompany, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header">
            {/* 1. 로고 및 모바일 햄버거 버튼 그룹 */}
            <div className="header-left-group">
                <div className="logo-placeholder" onClick={() => navigate('/main')} style={{ cursor: "pointer" }}>
                    로고
                </div>
                
                {/* 모바일 햄버거 메뉴 버튼 (CSS 미디어쿼리에서 800px 이하일 때만 flex로 노출) */}
                <button className="mobile-hamburger" onClick={toggleSidebar} aria-label="메뉴 열기">
                    ☰
                </button>
            </div>

            {/* 2. 우측 사용자 정보 및 알림 영역 */}
            <div className="header-right-group">
                <div className="user-link" onClick={() => navigate('/my_page')} style={{ cursor: "pointer" }}>
                    {user?.name || '사용자'} <span>({selectedCompany?.company_name || '소속 없음'})</span>
                </div>
                
                <div className="header-action" onClick={handleLogout} style={{ cursor: "pointer" }}>
                    로그아웃
                </div>
                <div className="header-action" onClick={toggleAlarm} style={{ cursor: "pointer" }}>
                    알림
                    <div className="noti-dot"></div>
                </div>
            </div>
        </header>
    );
}

export default Headernav;
import React from 'react';
import { useNavigate } from 'react-router';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 
import { useAuth } from '@hooks/AuthContext.jsx';

const Headernav = () => {
    const navigate = useNavigate();
    const { toggleAlarm } = useAlarm();
    const { user, selectedCompany, logout } = useAuth(); // 전역 상태 가져오기

    const handleLogout = () => {
        logout(); // 전역 상태 초기화 및 LocalStorage 삭제
        navigate('/'); // 메인(게이트) 화면으로 이동
    };

    return (
        <>
            <header className="header">
                
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
                
            </header>
        </>
    );
}

export default Headernav;
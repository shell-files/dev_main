import React from 'react';
import { useNavigate } from 'react-router';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 

const Headernav = () => {
    const navigate = useNavigate();
    
    const { toggleAlarm } = useAlarm();

    return (
        <>
            <header className="header" style={{ justifyContent: 'space-between', padding: '0 24px' }}>
                <div className="logo-placeholder" onClick={() => navigate('/')} style={{ cursor: 'pointer', margin: 0 }}>
                    로고
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <div className="user-link" onClick={() => navigate('/my_page')} style={{ cursor: "pointer" }}>
                        이채훈 <span>(SKM)</span>
                    </div>
                    
                    <div className="header-action" onClick={() => navigate('/')} style={{ cursor: "pointer" }}>
                        로그아웃
                    </div>
                    <div className="header-action" onClick={toggleAlarm} style={{ cursor: "pointer" }}>
                        알림
                        <div className="noti-dot"></div>
                    </div>
                </div>
            </header>
        </>
    );
}

export default Headernav;
import React from 'react';
import { useNavigate } from 'react-router';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 

const Headernav = () => {
    const navigate = useNavigate();
    
    const { toggleAlarm } = useAlarm();

    return (
        <>
            {/* class 대신 className 사용 */}
            <header className="header">
                
                {/* location.href 대신 navigate 사용 */}
                <div className="user-link" onClick={() => navigate('/my_page')} style={{ cursor: "pointer" }}>
                    이채훈 <span>(SKM)</span>
                </div>
                
                <div className="header-action" onClick={() => navigate('/')} style={{ cursor: "pointer" }}>
                    로그아웃
                </div>
                
                {/* 💡 onClick에 방금 가져온 toggleAlarm을 연결합니다! */}
                <div className="header-action" onClick={toggleAlarm} style={{ cursor: "pointer" }}>
                    알림
                    <div className="noti-dot"></div>
                </div>
                
            </header>
        </>
    );
}

export default Headernav;
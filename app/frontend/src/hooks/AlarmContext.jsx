import React, { createContext, useState, useContext } from 'react';

const AlarmContext = createContext();

export const AlarmProvider = ({ children }) => {
    const [isAlarmOpen, setIsAlarmOpen] = useState(false);
    
    // 테스트용 초기 알림 데이터
    const [notifications, setNotifications] = useState([
        { id: 1, text: '김하영 님이 ESG 데이터 파일(CSV)을 업로드했습니다.' },
        { id: 2, text: '장태원 님이 요청하신 백엔드 API 배포가 완료되었습니다.' },
        { id: 3, text: '비밀번호 변경 권장 알림입니다.' }
    ]);

    const toggleAlarm = () => setIsAlarmOpen(!isAlarmOpen);
    const closeAlarm = () => setIsAlarmOpen(false);

    // 새로운 알림이 도착했을 때 호출할 함수 (STOMP 연동 시 사용)
    const addNotification = (text) => {
        const newNoti = { id: Date.now(), text };
        // 새 알림을 배열의 맨 앞에 추가
        setNotifications(prev => [newNoti, ...prev]); 
    };

    // 알림 삭제 함수
    const removeNoti = (idToRemove) => {
        setNotifications(notifications.filter(noti => noti.id !== idToRemove));
    };

    return (
        <AlarmContext.Provider value={{ 
            isAlarmOpen, toggleAlarm, closeAlarm, 
            notifications, addNotification, removeNoti 
        }}>
            {children}
        </AlarmContext.Provider>
    );
};

export const useAlarm = () => {
    const context = useContext(AlarmContext);
    if (!context) {
        throw new Error("useAlarm은 AlarmProvider 내부에서만 사용할 수 있습니다.");
    }
    return context;
};
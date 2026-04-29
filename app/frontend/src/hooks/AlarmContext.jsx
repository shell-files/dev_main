import React, { createContext, useState, useContext } from 'react';

const AlarmContext = createContext();

export const AlarmProvider = ({ children }) => {
    const [isAlarmOpen, setIsAlarmOpen] = useState(false);
    
    // 테스트용 초기 알림 데이터
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'USER', text: '신규 팀원 초대 요청이 승인되었습니다.', time: '10분 전' },
        { id: 2, type: 'CHECK', text: 'ESG 데이터 1분기 실적 승인이 반려되었습니다.', time: '1시간 전' },
        { id: 3, type: 'CHART', text: '0.0V SR 보고서 생성이 완료되었습니다.', time: '2시간 전' },
        { id: 4, type: 'LEAF', text: '0.0V 탄소관리 보고서 생성이 완료되었습니다.', time: '1일 전' },
        { id: 5, type: 'CUBE', text: '0.0V 공급망 3D 에셋 변환이 완료되었습니다.', time: '2일 전' }
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
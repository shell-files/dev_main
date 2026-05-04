import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '@hooks/AuthContext.jsx';

const AlarmContext = createContext();

export const AlarmProvider = ({ children }) => {
    const { user, selectedCompany } = useAuth();
    const [isAlarmOpen, setIsAlarmOpen] = useState(false);
    
    // 테스트용 초기 알림 데이터
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'USER',  title: '담당자 초대 수락', chip: { text: 'Climate', colorId: 'E' }, text: '이수진 담당자님께서 초대를 수락했습니다.', time: '2 mins ago', isRead: false },
        { id: 2, type: 'CHECK', title: '데이터 검토 요청', chip: { text: 'G2-03', colorId: 'G' }, text: '데이터가 제출되어 검토 대기 중입니다.', time: '1 hour ago', isRead: false },
        { id: 3, type: 'CHART', title: '분석 리포트 완료', text: '2025년 1분기 ESG 성과 분석 리포트 생성이 완료되었습니다.', time: '3 hours ago', isRead: false },
        { id: 4, type: 'LEAF',  title: '시스템 업데이트', text: '온실가스 배출량(Scope 1,2) 산정 모듈이 업데이트 되었습니다.', time: 'Yesterday', isRead: true },
        { id: 5, type: 'CUBE',  title: '신규 기능 안내', text: '담당자 일괄 지정 및 알림 기능이 새롭게 추가되었습니다.', time: '2 days ago', isRead: true }
    ]);

    const toggleAlarm = () => setIsAlarmOpen(!isAlarmOpen);
    const closeAlarm = () => setIsAlarmOpen(false);

    // =========================================================
    // [향후 API 연계 지점 1] 초기 알림 내역 조회 (REST API)
    // =========================================================
    useEffect(() => {
        // 계정 정보나 회사 정보가 없으면 알림 초기화 및 중단
        if (!user || !selectedCompany) {
            // setNotifications([]);
            return;
        }

        // TODO: 로그인 후 백엔드에서 해당 계정+회사의 기존 알림 내역을 가져오는 API 호출
        // const fetchNotifications = async () => {
        //     try {
        //         const res = await fetch(`/api/notifications?uuid=${user.uuid}&company_id=${selectedCompany.company_id}`);
        //         const data = await res.json();
        //         setNotifications(data);
        //     } catch (error) {
        //         console.error("Failed to fetch notifications", error);
        //     }
        // };
        // fetchNotifications();
    }, [user, selectedCompany]); // 유저나 선택된 회사가 바뀔 때마다 재실행

    // 새로운 알림이 도착했을 때 호출할 함수 (STOMP 연동 시 사용)
    const addNotification = (text, type = 'USER', title = null, chip = null) => {
        const newNoti = { 
            id: Date.now(), 
            title: title || (type === 'USER' ? '담당자 알림' : '시스템 알림'),
            chip,
            text, 
            type, 
            time: 'Just now', 
            isRead: false 
        };
        setNotifications(prev => [newNoti, ...prev]); 
    };

    // =========================================================
    // [향후 API 연계 지점] 실시간 알림 웹소켓(STOMP) 연결 구독
    // =========================================================
    useEffect(() => {
        if (!user || !selectedCompany) return;

        // TODO: 백엔드 STOMP / SSE 연결 설정 (해당 회사의 알림만 구독하도록 쿼리 파라미터나 헤더 전달)
        // const client = new StompJs.Client({
        //     brokerURL: `ws://your-backend/ws?uuid=${user.uuid}&company_id=${selectedCompany.company_id}`,
        //     onConnect: () => {
        //         client.subscribe(`/user/queue/notifications/${selectedCompany.company_id}`, (message) => {
        //             const payload = JSON.parse(message.body);
        //             addNotification(payload.text, payload.type);
        //         });
        //     }
        // });
        // client.activate();
        
        // return () => client.deactivate(); // 컴포넌트 언마운트나 회사 변경 시 기존 구독 해제
    }, [user, selectedCompany]); // 유저나 선택된 회사가 바뀔 때마다 웹소켓 재연결

    // 알림 삭제 함수
    const removeNoti = (idToRemove) => {
        setNotifications(prev => prev.filter(noti => noti.id !== idToRemove));
    };

    // 알림 모두 읽음 처리
    const markAllAsRead = (types = null) => {
        setNotifications(prev => prev.map(noti => {
            if (types === null || types.includes(noti.type)) {
                return { ...noti, isRead: true };
            }
            return noti;
        }));
    };

    // 전체 삭제 (전체 알림 보기 클릭 시 등)
    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <AlarmContext.Provider value={{ 
            isAlarmOpen, toggleAlarm, closeAlarm, 
            notifications, addNotification, removeNoti,
            markAllAsRead, clearAll 
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
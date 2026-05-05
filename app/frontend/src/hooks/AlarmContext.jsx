import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '@hooks/AuthContext.jsx';
import { api } from '@utils/network.js';
// import * as StompJs from '@stomp/stompjs'; // STOMP 사용 시 주석 해제

const AlarmContext = createContext();

// =========================================================
// [설정] API 실연동 여부 플래그
// true: 내부 더미 데이터 사용 | false: 백엔드 API 실제 호출
// =========================================================
const USE_DUMMY_API = true;

export const AlarmProvider = ({ children }) => {
    const { user, selectedCompany } = useAuth();
    const [isAlarmOpen, setIsAlarmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // 더미 데이터 정의 (API 응답과 동일한 구조: content 필드 사용)
    const DUMMY_NOTIFICATIONS = [
        { id: 1, type: 'USER', title: '담당자 초대 수락', content: '이수진 담당자님께서 초대를 수락했습니다.', time: '2 mins ago', isRead: false, path: '/manager', meta: { inviteId: 1 } },
        { id: 2, type: 'CHECK', title: '데이터 검토 요청', content: '데이터가 제출되어 검토 대기 중입니다.', time: '1 hour ago', isRead: false, path: '/onboarding', meta: { datasetId: 2, issueGroupCode: 'G2-03' } },
        { id: 3, type: 'CHART', title: '분석 리포트 완료', content: '2025년 1분기 ESG 성과 분석 리포트 생성이 완료되었습니다.', time: '3 hours ago', isRead: false, path: '/dashboard/reports/3', meta: { reportId: 3 } },
        { id: 4, type: 'LEAF', title: '시스템 업데이트', content: '온실가스 배출량(Scope 1,2) 산정 모듈이 업데이트 되었습니다.', time: 'Yesterday', isRead: true, path: null, meta: {} },
        { id: 5, type: 'CUBE', title: '신규 기능 안내', content: '담당자 일괄 지정 및 알림 기능이 새롭게 추가되었습니다.', time: '2 days ago', isRead: true, path: null, meta: {} }
    ];

    const toggleAlarm = () => setIsAlarmOpen(!isAlarmOpen);
    const closeAlarm = () => setIsAlarmOpen(false);

    // 1. 알림 내역 로드 (REST API)
    useEffect(() => {
        console.log("AlarmProvider: useEffect triggered", { USE_DUMMY_API, user, selectedCompany });

        if (USE_DUMMY_API) {
            console.log("AlarmProvider: Loading dummy notifications...");
            setIsLoading(true);
            const timer = setTimeout(() => {
                setNotifications(DUMMY_NOTIFICATIONS);
                setIsLoading(false);
                console.log("AlarmProvider: Dummy notifications loaded", DUMMY_NOTIFICATIONS);
            }, 500);
            return () => clearTimeout(timer);
        }

        if (!user || !selectedCompany) {
            console.log("AlarmProvider: User or Company missing, clearing notifications");
            setNotifications([]);
            return;
        }

        const fetchNotifications = async () => {
            console.log("AlarmProvider: Fetching real notifications...");
            setIsLoading(true);
            try {
                const res = await api.get('/alarm');
                setNotifications(res.data.data.notifications || []);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, [user, selectedCompany]);

    // 2. 새로운 알림 추가 (STOMP 수신 또는 내부 트리거용)
    const addNotification = (notiObj) => {
        // API 명세와 동일한 형태의 객체를 인자로 받습니다.
        const newNoti = {
            id: notiObj.id || Date.now(),
            type: notiObj.type || 'USER',
            title: notiObj.title || '알림',
            content: notiObj.content || '',
            time: notiObj.time || 'Just now',
            isRead: false,
            path: notiObj.path || null,
            meta: notiObj.meta || {}
        };
        setNotifications(prev => [newNoti, ...prev]);
    };

    // 3. 실시간 알림 웹소켓(STOMP) 구독
    useEffect(() => {
        if (!user || !selectedCompany || USE_DUMMY_API) return;

        /* 
        [STOMP 연결 안내]
        1. 상단 StompJs import 주석을 해제하세요.
        2. 아래 로직의 brokerURL을 실제 백엔드 주소로 수정하세요.
        3. network.js의 설정을 참고하여 인증 헤더를 구성했습니다.
        */

        /*
        const client = new StompJs.Client({
            brokerURL: `${import.meta.env.VITE_WS_URL}/alarm`,
            connectHeaders: {
                Authorization: `Bearer ${localStorage.getItem("uuid")}`,
                company_id: String(selectedCompany.company_id),
            },
            onConnect: () => {
                // 사용자 큐 구독
                client.subscribe('/user/queue/notifications', (message) => {
                    const payload = JSON.parse(message.body);
                    // 현재 선택된 회사에 해당하는 알림만 추가
                    if (Number(payload.companyId) === Number(selectedCompany.company_id)) {
                        addNotification(payload);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
            }
        });
        client.activate();
        return () => client.deactivate(); 
        */
    }, [user, selectedCompany]);

    // 4. 알림 삭제 (REST API)
    const removeNoti = async (idToRemove) => {
        if (USE_DUMMY_API) {
            setNotifications(prev => prev.filter(noti => noti.id !== idToRemove));
            return;
        }

        try {
            const res = await api.delete(`/alarm/${idToRemove}`);
            // 삭제 후 최신 목록으로 업데이트
            if (res.data.data.notifications) {
                setNotifications(res.data.data.notifications);
            } else {
                setNotifications(prev => prev.filter(noti => noti.id !== idToRemove));
            }
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    // 5. 알림 읽음 처리 (REST API)
    const markAllAsRead = async (types = null) => {
        if (USE_DUMMY_API) {
            setNotifications(prev => prev.map(noti => {
                if (types === null || types.includes(noti.type)) {
                    return { ...noti, isRead: true };
                }
                return noti;
            }));
            return;
        }

        try {
            const res = await api.patch('/alarm', { types });
            setNotifications(res.data.data.notifications || []);
        } catch (error) {
            console.error("Failed to mark notifications as read", error);
        }
    };

    // 6. 전체 삭제
    const clearAll = async () => {
        if (USE_DUMMY_API) {
            setNotifications([]);
            return;
        }

        try {
            // 전체 삭제 엔드포인트 호출 (명세에 따라 /alarm 또는 별도 처리)
            await api.delete('/alarm');
            setNotifications([]);
        } catch (error) {
            console.error("Failed to clear all notifications", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <AlarmContext.Provider value={{
            isAlarmOpen, toggleAlarm, closeAlarm,
            notifications, unreadCount, isLoading, addNotification, removeNoti,
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
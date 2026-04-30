// =====================================================================================
// AlarmContext.jsx - 알림 데이터 및 상태 관리 컨텍스트
//
// [데이터 흐름]
// 1. 알림 생성: 외부(STOMP/API)에서 addNotification 호출 → notifications 상태 업데이트
// 2. 알림 조회: notifications 상태를 Alarm 컴포넌트에서 구독하여 렌더링
// 3. 상태 변경: markAllAsRead(읽음 처리), removeNoti(삭제), clearAll(전체 삭제)
//
// ========================
// 함수 설명
//
// 1. addNotification - 설명: 신규 알림 추가
//    - [백엔드 연동] 추후 STOMP 메시지 수신 시 이 함수를 호출하도록 연결 필요
// 2. markAllAsRead - 설명: 알림 읽음 처리
//    - [백엔드 연동] 추후 DB 반영을 위해 API 호출(PATCH/PUT) 로직 추가 필요
// 3. clearAll - 설명: 알림 전체 삭제
//    - [백엔드 연동] 추후 DB 반영을 위해 API 호출(DELETE) 로직 추가 필요
// 4. removeNoti - 설명: 특정 알림 삭제
//    - [백엔드 연동] 추후 DB 반영을 위해 API 호출(DELETE) 로직 추가 필요
//
// =========================
// API 연동 및 고도화 포인트
//
// 1. 초기 데이터 로드 (useEffect)
// → 추후 페이지 진입 시 api.get("/auth/notifications") 등을 통해 초기 데이터 로드 필요
//
// 2. 실시간 알림 수신
// → WebSocket(STOMP) 클라이언트 연결 후 @MessageMapping을 통해 addNotification 연동
// =====================================================================================

import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@utils/network';

const AlarmContext = createContext();

// 프론트 테스트용 더미 api on/off
// true: 백엔드 없이 더미 테스트
// false: 실제 API 호출
const USE_DUMMY_API = true;

export const AlarmProvider = ({ children }) => {
    const [isAlarmOpen, setIsAlarmOpen] = useState(false);
    
    // 알림 리스트 상태
    const [notifications, setNotifications] = useState([]);

    // [초기 데이터 로드]
    useEffect(() => {
        const fetchInitialNotifications = async () => {
            if (USE_DUMMY_API) {
                // 더미 데이터 초기화
                setNotifications([
                    { id: 1, type: 'USER', text: '신규 팀원 초대 요청이 승인되었습니다.', time: '10분 전', isRead: false },
                    { id: 2, type: 'CHECK', text: 'ESG 데이터 1분기 실적 승인이 반려되었습니다.', time: '1시간 전', isRead: false },
                    { id: 3, type: 'CHART', text: '0.0V SR 보고서 생성이 완료되었습니다.', time: '2시간 전', isRead: false },
                    { id: 4, type: 'LEAF', text: '0.0V 탄소관리 보고서 생성이 완료되었습니다.', time: '1일 전', isRead: true },
                    { id: 5, type: 'CUBE', text: '0.0V 공급망 3D 에셋 변환이 완료되었습니다.', time: '2일 전', isRead: true },
                    { id: 6, type: 'USER', text: '운영자 권한 변경 안내', time: '3일 전', isRead: true },
                    { id: 7, type: 'CHECK', text: '작년도 데이터 마이그레이션 완료', time: '1주일 전', isRead: true }
                ]);
                return;
            }

            try {
                // [백엔드 연동] 실제 API 호출
                const response = await api.get('/auth/notifications');
                setNotifications(response.data);
            } catch (error) {
                console.error("알림 로드 실패:", error);
            }
        };

        fetchInitialNotifications();
    }, []);

    const toggleAlarm = () => setIsAlarmOpen(!isAlarmOpen);
    const closeAlarm = () => setIsAlarmOpen(false);

    // [알림 추가] 추후 STOMP 메시지 수신 시 호출
    const addNotification = (text, type = 'USER') => {
        const newNoti = { id: Date.now(), text, type, time: '방금 전', isRead: false };
        setNotifications(prev => [newNoti, ...prev]); 
    };

    // [알림 읽음 처리]
    const markAllAsRead = async (targetTypes = null) => {
        // 1. 상태 먼저 업데이트 (Optimistic Update)
        setNotifications(prev => prev.map(noti => {
            if (!targetTypes || targetTypes.includes(noti.type)) {
                return { ...noti, isRead: true };
            }
            return noti;
        }));

        if (USE_DUMMY_API) return;

        try {
            // [백엔드 연동] 서버에 읽음 상태 전송
            await api.patch('/auth/notifications/read', { types: targetTypes });
        } catch (error) {
            console.error("읽음 처리 실패:", error);
        }
    };

    // [알림 전체 삭제]
    const clearAll = async () => {
        setNotifications([]);

        if (USE_DUMMY_API) return;

        try {
            // [백엔드 연동] 서버에서 전체 삭제
            await api.delete('/auth/notifications');
        } catch (error) {
            console.error("전체 삭제 실패:", error);
        }
    };

    // [알림 개별 삭제]
    const removeNoti = async (idToRemove) => {
        setNotifications(prev => prev.filter(noti => noti.id !== idToRemove));

        if (USE_DUMMY_API) return;

        try {
            // [백엔드 연동] 서버에서 개별 삭제
            await api.delete(`/auth/notifications/${idToRemove}`);
        } catch (error) {
            console.error("알림 삭제 실패:", error);
        }
    };

    return (
        <AlarmContext.Provider value={{ 
            isAlarmOpen, toggleAlarm, closeAlarm, 
            notifications, addNotification, removeNoti, markAllAsRead, clearAll
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
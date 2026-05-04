// =====================================================================================
// Alarm.jsx - 알림 센터 사이드바 컴포넌트
//
// [화면 흐름]
// 1. 알림 열기/닫기: HeaderNav의 알림 아이콘 클릭 → isAlarmOpen 상태 변경 → 슬라이딩 애니메이션 실행
// 2. 카테고리 필터링: 상단 탭(All, Users, Data, Service) 클릭 → activeFilter 업데이트 → 리스트 필터링
// 3. 읽음 처리: '알림 모두 읽음' 클릭 → handleMarkAllAsRead 실행 → 현재 탭의 알림들만 읽음 상태 변경
// 4. 삭제: 'x' 버튼 클릭 → removeNoti 실행 / '전체 알림 보기' 클릭 → clearAll 실행
//
// ========================
// 주요 함수 설명
//
// 1. handleMarkAllAsRead - 설명: 현재 활성화된 탭의 알림들만 선택적으로 읽음 처리
// 2. filteredNotifications - 설명: 선택된 필터에 따라 알림 리스트를 필터링하고, 안 읽은 알림이 상단에 오도록 정렬
//
// =========================
// API 및 기능 고도화 포인트 (수정 포인트)
//
// 1. 알림 클릭 시 페이지 이동
// → 추후 각 알림 객체에 'path' 속성을 추가하고, 알림 아이콘/텍스트 클릭 시 navigate(noti.path) 연동 필요
//
// 2. 실시간 데이터 동기화
// → AlarmContext의 notifications 상태를 구독하고 있으므로, 컨텍스트 레벨의 STOMP 연동 시 자동 반영됨
// =====================================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 
import { useAuth } from '@hooks/AuthContext.jsx';
import "@styles/alarm.css";
import userIcon from '@assets/alarm/user.png';
import dataIcon from '@assets/alarm/data.png';
import serviceIcon from '@assets/alarm/service.png';
import alarmSettingIcon from '@assets/alarm/alarmsetting.png';

const ALARM_TYPES = {
    USER:  { icon: userIcon,    color: '#03A94D' }, // Users - Green (Theme)
    CHECK: { icon: dataIcon,    color: '#3498db' }, // Data - Blue
    CHART: { icon: serviceIcon, color: '#9b59b6' }, // Service - Purple
    LEAF:  { icon: serviceIcon, color: '#a29bfe' }, // Service - Light Purple
    CUBE:  { icon: serviceIcon, color: '#6c5ce7' }  // Service - Indigo
};

const FILTER_TABS = [
    { id: 'ALL',     label: 'All',     icon: null },
    { id: 'USER',    label: 'Users',   icon: userIcon },
    { id: 'CHECK',   label: 'Data',    icon: dataIcon },
    { id: 'SERVICE', label: 'Service', icon: serviceIcon, subTypes: ['CHART', 'LEAF', 'CUBE'] }
];

const Alarm = () => {
    const { isAlarmOpen, closeAlarm, toggleAlarm, notifications, removeNoti, markAllAsRead, clearAll } = useAlarm();
    const { user, selectedCompany } = useAuth(); // 전역 인증 상태 가져오기
    const [activeFilter, setActiveFilter] = useState('ALL');

    // 탭 슬라이더 관련 상태 및 Ref
    const tabsRef = useRef([]);
    const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const updateSlider = () => {
            const activeIndex = FILTER_TABS.findIndex(t => t.id === activeFilter);
            const activeTab = tabsRef.current[activeIndex];
            if (activeTab) {
                setSliderStyle({
                    left: activeTab.offsetLeft,
                    width: activeTab.offsetWidth
                });
            }
        };
        // 렌더링 후 및 리사이즈/모달오픈 시 슬라이더 위치 업데이트
        updateSlider();
        window.addEventListener("resize", updateSlider);
        // 트랜지션 등이 완료된 후에도 한 번 더 잡아줌
        const timer = setTimeout(updateSlider, 50);
        return () => {
            window.removeEventListener("resize", updateSlider);
            clearTimeout(timer);
        };
    }, [activeFilter, isAlarmOpen]);

    // 필터링 및 정렬 로직: 안 읽은 알림(!isRead)이 무조건 상단에 위치하도록 처리
    const filteredNotifications = notifications
        .filter(noti => {
            if (activeFilter === 'ALL') return true;
            const currentFilter = FILTER_TABS.find(tab => tab.id === activeFilter);
            if (currentFilter?.subTypes) return currentFilter.subTypes.includes(noti.type);
            return noti.type === activeFilter;
        })
        .sort((a, b) => {
            if (a.isRead === b.isRead) return 0;
            return a.isRead ? 1 : -1;
        });

    const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

    // [고도화 포인트] 선택된 필터에 따라 해당 타입들의 알림만 읽음 처리하도록 Context 함수 호출
    const handleMarkAllAsRead = () => {
        if (activeFilter === 'ALL') {
            markAllAsRead(null); 
        } else {
            const currentFilter = FILTER_TABS.find(tab => tab.id === activeFilter);
            const targetTypes = currentFilter?.subTypes || [activeFilter];
            markAllAsRead(targetTypes); 
        }
    };

    return (
        <>
            {/* 배경 오버레이 */}
            <div 
                id="alarm-overlay"
                onClick={(e) => e.target.id === 'alarm-overlay' && closeAlarm()}
                style={{
                    opacity: isAlarmOpen ? 1 : 0, 
                    pointerEvents: isAlarmOpen ? 'auto' : 'none',
                }}
            />

            {/* 우측 엣지 플로팅 알림 열기 버튼 */}
            <div 
                className={`alarm-floating-toggle ${isAlarmOpen ? 'hidden' : ''}`}
                onClick={toggleAlarm}
            >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </div>

            {/* 알림 컨테이너 */}
            <div 
                id="alarm-container"
                style={{
                    transform: isAlarmOpen ? 'translateX(0)' : 'translateX(100%)',
                }}
            >
                {/* 1. 헤더 영역 */}
                <div id="alarm-header" style={{ alignItems: 'flex-start' }}>
                    <div className="alarm-title-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2>Notification Center</h2>
                            <img src={alarmSettingIcon} alt="settings" className="alarm-setting-icon" style={{ cursor: 'pointer' }} />
                        </div>
                        <div className="alarm-auth-info" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                            {selectedCompany?.company_name || 'A회사'} • {user?.name || '사용자'}님
                        </div>
                    </div>
                    <span onClick={closeAlarm} className="alarm-close-btn">×</span>
                </div>

                {/* 2. 필터 탭 영역 */}
                <div id="alarm-filter-tabs">
                    <div className="alarm-tab-slider" style={sliderStyle} />
                    {FILTER_TABS.map((tab, idx) => (
                        <button
                            key={tab.id}
                            ref={el => tabsRef.current[idx] = el}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`alarm-filter-btn ${activeFilter === tab.id ? 'active' : ''}`}
                        >
                            {tab.icon && <img src={tab.icon} alt="" />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. 액션 바 영역 (NEW 배지 및 모두 읽음) */}
                <div id="alarm-action-bar">
                    <div className="alarm-badge-new">
                        {unreadCount} NEW
                    </div>
                    <button className="alarm-read-all-btn" onClick={handleMarkAllAsRead}>
                        알림 모두 읽음
                    </button>
                </div>

                {/* 4. 알림 리스트 영역 */}
                <div id="alarm-list">
                    {filteredNotifications.map((noti) => {
                        const config = ALARM_TYPES[noti.type];
                        return (
                            <div key={noti.id} className="alarm-item">
                                {/* [고도화 포인트] 추후 알림 클릭 시 해당 페이지로 이동(navigate)하는 이벤트 핸들러 추가 영역 */}
                                <div className="alarm-icon-box" style={{ backgroundColor: `${config?.color}26` }}>
                                    <img src={config?.icon} alt="" />
                                </div>

                                <div className="alarm-content">
                                    <div className="alarm-content-header">
                                        <div className="alarm-content-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="alarm-content-title">
                                                {noti.title}
                                            </span>
                                            {noti.chip && (
                                                <span className={`alarm-chip bg-${noti.chip.colorId} ${/^[A-Z]\d+/.test(noti.chip.text) ? 'type-id' : 'type-ig'}`}>
                                                    {noti.chip.text}
                                                </span>
                                            )}
                                        </div>
                                        {!noti.isRead && <div className="alarm-unread-dot" />}
                                    </div>
                                    <span className="alarm-text">{noti.text}</span>
                                    <span className="alarm-time">{noti.time}</span>
                                </div>

                                {/* 삭제 버튼 */}
                                <div className="alarm-delete-btn" onClick={() => removeNoti(noti.id)}>
                                    <span>x</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 5. Footer */}
                <div id="alarm-footer">
                    <button className="alarm-view-all-btn" onClick={clearAll}>
                        전체 알림 보기
                    </button>
                </div>
            </div>
        </>
    );
};

export default Alarm;
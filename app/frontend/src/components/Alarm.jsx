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
// =====================================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 
import { useAuth } from '@hooks/AuthContext.jsx';
import "@styles/alarm.css";
import userIcon from '@assets/alarm/user.png';
import dataIcon from '@assets/alarm/data.png';
import serviceIcon from '@assets/alarm/service.png';
import emptyStateIcon from '@assets/alarm/empty-state.svg';

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
    const navigate = useNavigate();
    const { 
        isAlarmOpen, closeAlarm, toggleAlarm, 
        notifications, unreadCount, isLoading, removeNoti, 
        markAllAsRead, clearAll 
    } = useAlarm();
    const { user, selectedCompany } = useAuth(); 
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
        updateSlider();
        window.addEventListener("resize", updateSlider);
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

    // unreadCount는 context에서 가져온 전체 미읽음 개수를 사용합니다.

    const handleMarkAllAsRead = () => {
        if (activeFilter === 'ALL') {
            markAllAsRead(null); 
        } else {
            const currentFilter = FILTER_TABS.find(tab => tab.id === activeFilter);
            const targetTypes = currentFilter?.subTypes || [activeFilter];
            markAllAsRead(targetTypes); 
        }
    };

    // 알림 클릭 시 페이지 이동 핸들러
    const handleNotificationClick = (noti) => {
        if (noti.path) {
            closeAlarm();
            navigate(noti.path);
        }
    };

    // Meta 데이터를 기반으로 Chip 정보 파생 (Chip 필드가 없을 경우 대비)
    const getChipFromMeta = (noti) => {
        if (noti.chip) return noti.chip;
        if (!noti.meta) return null;
        
        // Data(CHECK) 타입: issueGroupCode가 있으면 Chip으로 표시
        if (noti.type === 'CHECK' && noti.meta.issueGroupCode) {
            return { text: noti.meta.issueGroupCode, colorId: 'G' };
        }
        // Users(USER) 타입: 특정 이슈그룹 관련이면 표시
        if (noti.type === 'USER' && noti.meta.issueGroupCode) {
            return { text: noti.meta.issueGroupCode, colorId: 'E' };
        }
        return null;
    };

    return (
        <>
            <div 
                id="alarm-overlay"
                onClick={(e) => e.target.id === 'alarm-overlay' && closeAlarm()}
                style={{
                    opacity: isAlarmOpen ? 1 : 0, 
                    pointerEvents: isAlarmOpen ? 'auto' : 'none',
                }}
            />

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
                    {isLoading ? (
                        <div className="alarm-empty">알림을 불러오는 중...</div>
                    ) : (filteredNotifications.length === 0) ? (
                        <div className="alarm-empty">
                            <img src={emptyStateIcon} alt="no notifications" />
                            <span>표시할 알림이 없습니다. <br /> 새로운 소식이 오면 알려드릴게요!</span>
                        </div>
                    ) : (
                        filteredNotifications.map((noti) => {
                            const config = ALARM_TYPES[noti.type];
                            const chip = getChipFromMeta(noti);
                            return (
                                <div 
                                    key={noti.id} 
                                    className="alarm-item"
                                    onClick={() => handleNotificationClick(noti)}
                                    style={{ cursor: noti.path ? 'pointer' : 'default' }}
                                >
                                    <div className="alarm-icon-box" style={{ backgroundColor: `${config?.color}26` }}>
                                        <img src={config?.icon} alt="" />
                                    </div>

                                    <div className="alarm-content">
                                        <div className="alarm-content-header">
                                            <div className="alarm-content-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="alarm-content-title">
                                                    {noti.title}
                                                </span>
                                                {chip && (
                                                    <span className={`alarm-chip bg-${chip.colorId} ${/^[A-Z]\d+/.test(chip.text) ? 'type-id' : 'type-ig'}`}>
                                                        {chip.text}
                                                    </span>
                                                )}
                                            </div>
                                            {!noti.isRead && <div className="alarm-unread-dot" />}
                                        </div>
                                        <span className="alarm-text">{noti.content}</span>
                                        <span className="alarm-time">{noti.time}</span>
                                    </div>

                                    {/* 삭제 버튼 - 이벤트 전파 중단 필요 */}
                                    <div className="alarm-delete-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        removeNoti(noti.id);
                                    }}>
                                        <span>x</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 5. Footer */}
                <div id="alarm-footer">
                    <button className="alarm-view-all-btn" onClick={clearAll}>
                        전체 알림 비우기
                    </button>
                </div>
            </div>
        </>
    );
};

export default Alarm;
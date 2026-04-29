import React, { useState } from 'react';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 

// 💡 1. 이미지 파일들을 import 합니다. (파일명이 다르면 실제 파일명으로 수정하세요)
import userIcon from '@assets/alarm/user.png';    // 계정 관리용
import dataIcon from '@assets/alarm/data.png';    // 데이터 관리용
import serviceIcon from '@assets/alarm/service.png'; // 서비스용 (파이차트)

// 💡 2. 리스트 아이콘 설정 (개별 알림용)
const TYPE_CONFIG = {
    USER: { iconImg: userIcon, color: '#888888' }, 
    CHECK: { iconImg: dataIcon, color: '#27ae60' },
    CHART: { iconImg: serviceIcon, color: '#9b59b6' }, // SKM
    LEAF: { iconImg: serviceIcon, color: '#2ecc71' },  // HG
    CUBE: { iconImg: serviceIcon, color: '#3498db' }   // TV
};

// 💡 3. 상단 필터 탭 설정 (4개 버튼용)
const FILTER_TABS = [
    { id: 'ALL', iconImg: null, fallback: 'ALL', color: '#4a90e2', isText: true },
    { id: 'USER', iconImg: userIcon, color: '#888888' },
    { id: 'CHECK', iconImg: dataIcon, color: '#27ae60' },
    { id: 'SERVICE', iconImg: serviceIcon, color: '#f39c12' }
];

const Alarm = () => {
    const { isAlarmOpen, closeAlarm, notifications, removeNoti } = useAlarm();
    const [activeFilter, setActiveFilter] = useState('ALL');

    const filteredNotifications = notifications.filter(noti => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'SERVICE') return ['CHART', 'LEAF', 'CUBE'].includes(noti.type);
        return noti.type === activeFilter;
    });

    // 💡 아이콘 렌더링 로직 통합
    const renderIcon = (img, fallback, size = '20px') => {
        if (img) {
            return <img src={img} alt="icon" style={{ width: size, height: size, objectFit: 'contain' }} />;
        }
        return <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{fallback}</span>;
    };

    if (!isAlarmOpen) return null;

    return (
        <>
            <div 
                id="noti-overlay"
                onClick={(e) => e.target.id === 'noti-overlay' && closeAlarm()}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    opacity: isAlarmOpen ? 1 : 0, transition: 'all 0.3s ease-in-out', zIndex: 999
                }}
            />

            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px',
                backgroundColor: '#ffffff', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                transform: isAlarmOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease-in-out', zIndex: 1000,
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px', borderBottom: '1px solid #f0f0f0'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: 'bold' }}>
                        Notification Center
                    </h3>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ cursor: 'pointer', fontSize: '20px', color: '#888' }}>⚙️</span>
                        <span onClick={closeAlarm} style={{ cursor: 'pointer', fontSize: '24px', color: '#888', lineHeight: '1' }}>×</span>
                    </div>
                </div>

                {/* 필터 영역 (꽉 차게 정렬) */}
                <div style={{
                    display: 'flex', gap: '10px',
                    padding: '15px 20px', borderBottom: '1px solid #f0f0f0'
                }}>
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            style={{
                                flex: 1, // 💡 가로 꽉 채우기
                                height: '34px',
                                borderRadius: '17px',
                                border: activeFilter === tab.id ? `1px solid ${tab.color}` : '1px solid #e0e0e0',
                                backgroundColor: activeFilter === tab.id ? `${tab.color}1A` : '#fff',
                                color: activeFilter === tab.id ? tab.color : '#666',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                cursor: 'pointer', padding: 0,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {renderIcon(tab.iconImg, tab.fallback, '18px')}
                        </button>
                    ))}
                </div>

                {/* 알림 리스트 영역 */}
                <div style={{ flex: 1, padding: '10px 20px', overflowY: 'auto' }}>
                    {filteredNotifications.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px 0', fontSize: '14px' }}>
                            해당 유형의 알림이 없습니다.
                        </div>
                    ) : (
                        filteredNotifications.map((noti) => (
                            <div key={noti.id} style={{
                                display: 'flex', alignItems: 'flex-start', padding: '16px 0',
                                borderBottom: '1px solid #f5f5f5', gap: '15px'
                            }}>
                                {/* 왼쪽 PNG 아이콘 영역 */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    backgroundColor: `${TYPE_CONFIG[noti.type]?.color || '#888'}1A`,
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    flexShrink: 0, overflow: 'hidden',
                                    padding: '8px' // 아이콘이 원 안에 예쁘게 들어가도록 패딩 조절
                                }}>
                                    {renderIcon(TYPE_CONFIG[noti.type]?.iconImg, '🔔', '24px')}
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                                        {noti.text}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#999' }}>
                                        {noti.time}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => removeNoti(noti.id)}
                                    style={{
                                        background: 'none', border: 'none', color: '#ccc', 
                                        cursor: 'pointer', fontSize: '18px', padding: '5px'
                                    }}
                                >
                                    〉
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default Alarm;
import React, { useState } from 'react';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 
import "@styles/alarm.css";
import userIcon from '@assets/alarm/user.png';
import dataIcon from '@assets/alarm/data.png';
import serviceIcon from '@assets/alarm/service.png';
import alarmSettingIcon from '@assets/alarm/alarmsetting.png';

const TYPE_CONFIG = {
    USER: { iconImg: userIcon, color: '#03A94D', label: 'Users' }, 
    CHECK: { iconImg: dataIcon, color: '#27ae60', label: 'Data' },
    CHART: { iconImg: serviceIcon, color: '#9b59b6', label: 'Reports' },
    LEAF: { iconImg: serviceIcon, color: '#2ecc71', label: 'Reports' },
    CUBE: { iconImg: serviceIcon, color: '#3498db', label: 'Reports' }
};

const FILTER_TABS = [
    { id: 'ALL', fallback: 'All', color: '#03A94D' },
    { id: 'USER', iconImg: userIcon,  color: '#555' },
    { id: 'CHECK', iconImg: dataIcon, color: '#555' },
    { id: 'SERVICE', iconImg: serviceIcon, color: '#555' }
];

const Alarm = () => {
    const { isAlarmOpen, closeAlarm, notifications, removeNoti } = useAlarm();
    const [activeFilter, setActiveFilter] = useState('ALL');

    const filteredNotifications = notifications.filter(noti => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'SERVICE') return ['CHART', 'LEAF', 'CUBE'].includes(noti.type);
        return noti.type === activeFilter;
    });

    const unreadCount = filteredNotifications.length;

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
                {/* 1. Header Section */}
                <div id="alarm-header">
                    <div className="alarm-title-box">
                        <h2>Notification Center</h2>
                        <img src={alarmSettingIcon} alt="settings" className="alarm-setting-icon" />
                    </div>
                    <span onClick={closeAlarm} className="alarm-close-btn">×</span>
                </div>

                {/* 2. Filter Tabs */}
                <div id="alarm-filter-tabs">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`alarm-filter-btn ${activeFilter === tab.id ? 'active' : ''}`}
                        >
                            {tab.iconImg && <img src={tab.iconImg} alt="" />}
                            {tab.fallback}
                        </button>
                    ))}
                </div>

                {/* 3. Action Bar */}
                <div id="alarm-action-bar">
                    <div className="alarm-badge-new">
                        {unreadCount} NEW
                    </div>
                    <button className="alarm-read-all-btn">
                        알림 모두 읽음
                    </button>
                </div>

                {/* 4. Notification List */}
                <div id="alarm-list">
                    {filteredNotifications.map((noti) => (
                        <div key={noti.id} className="alarm-item">
                            {/* Icon Container */}
                            <div className="alarm-icon-box" style={{ backgroundColor: `${TYPE_CONFIG[noti.type]?.color}26` }}>
                                <img src={TYPE_CONFIG[noti.type]?.iconImg} alt="" />
                            </div>

                            {/* Text Content */}
                            <div className="alarm-content">
                                <div className="alarm-content-header">
                                    <span className="alarm-content-title">
                                        {noti.type === 'USER' ? 'New team member invite' : noti.text.split(' ')[0] + ' updated'}
                                    </span>
                                    <div className="alarm-unread-dot" />
                                </div>
                                <span className="alarm-text">{noti.text}</span>
                                <span className="alarm-time">{noti.time}</span>
                            </div>

                            {/* Delete Button */}
                            <div className="alarm-delete-btn" onClick={() => removeNoti(noti.id)}>
                                <span>x</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 5. Footer */}
                <div id="alarm-footer">
                    <button className="alarm-view-all-btn">
                        전체 알림 보기
                    </button>
                </div>
            </div>
        </>
    );
}

export default Alarm;
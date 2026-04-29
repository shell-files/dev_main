import React from 'react';
import { useAlarm } from '@hooks/AlarmContext.jsx'; 

const Alarm = () => {
    // 💡 화면 그리는 데 필요한 모든 것을 Context에서 가져옵니다.
    const { isAlarmOpen, closeAlarm, notifications, removeNoti } = useAlarm();

    // isAlarmOpen이 false면 화면에 렌더링하지 않음
    if (!isAlarmOpen) return null;

    return (
        <div id="noti-layer" style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            width: '320px',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000
        }}>
            <div className="noti-top" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#f8f9fa',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>알림 목록</h3>
                <span 
                    style={{ cursor: 'pointer', fontSize: '20px', color: '#888' }} 
                    onClick={closeAlarm}
                >
                    ×
                </span>
            </div>

            <div className="noti-list" style={{ padding: '16px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>새로운 알림이 없습니다.</div>
                ) : (
                    notifications.map((noti) => (
                        <div className="noti-card" key={noti.id} style={{
                            padding: '12px',
                            marginBottom: '10px',
                            backgroundColor: '#f0f4ff', // 연한 블루 톤 배경
                            borderLeft: '4px solid #4a90e2', // 왼쪽 블루 포인트 라인
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            fontSize: '14px',
                            color: '#444'
                        }}>
                            <span style={{ paddingRight: '10px' }}>{noti.text}</span>
                            <button 
                                className="noti-close-btn" 
                                onClick={() => removeNoti(noti.id)} 
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    fontSize: '16px',
                                    padding: 0
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Alarm;
# 🔔 알림(Alarm) 시스템 API 연동 및 프론트 작업 가이드

> **기준일:** 2026-05-05  
> **대상 파일:** `AlarmContext.jsx`, `Alarm.jsx`, `HeaderNav.jsx` (+ 타 페이지 연동)  
> **DB 기준:** `alarm` 테이블 (아래 스키마)  
> **API 명세 기준:** `알림_api_명세서_-_알림.csv`

---

## 0. 전체 작업 흐름 요약

```
[Phase 1] DB 테이블 기반 알림 타입/구조 재정의
    ↓
[Phase 2] AlarmContext.jsx — 더미 제거 + API 함수 실제 연결
    ↓
[Phase 3] Alarm.jsx — path 기반 navigate 연동 + chip 매핑 재정의
    ↓
[Phase 4] HeaderNav.jsx — 미읽음 dot 실시간 반영
    ↓
[Phase 5] 타 페이지(Onboarding 등) — addNotification 직접 호출로 트리거 연동
    ↓
[Phase 6] WebSocket(STOMP) 실시간 알림 연결
```

---

## 1. DB 테이블 스키마 (알림 테이블)

```sql
CREATE TABLE alarm (
  id          BIGINT(20)    NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
  user_id     BIGINT(20)    NOT NULL COMMENT '사용자 ID',
  company_id  BIGINT(20)    NOT NULL COMMENT '회사 ID',
  type        VARCHAR(30)   NOT NULL COMMENT '알림 유형 (USER | CHECK | CHART | LEAF | CUBE)',
  title       VARCHAR(100)  COMMENT '알림 제목',
  content     VARCHAR(255)  NOT NULL COMMENT '알림 내용',
  is_read     BOOLEAN       NOT NULL DEFAULT FALSE COMMENT '읽음 여부',
  path        VARCHAR(255)  COMMENT '클릭 시 이동 경로',
  meta_json   LONGTEXT      COMMENT '추가 메타데이터 (JSON)',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  read_at     DATETIME      COMMENT '읽음 처리일시',
  deleted_at  DATETIME      COMMENT '삭제 처리일시 (Soft Delete)'
);
```

### 1-1. type 컬럼 열거값 정의

| type 값 | 프론트 탭 분류 | 의미 |
|---------|------------|------|
| `USER`  | Users 탭 | 담당자 초대/수락/실패/지정취소 등 |
| `CHECK` | Data 탭   | 지표 제출/승인/반려 관련 |
| `CHART` | Service 탭 | SR 보고서 버전별 생성완료 |
| `LEAF`  | Service 탭 | 탄소관리 보고서 생성완료 |
| `CUBE`  | Service 탭 | 공급망 관리 보고서 생성완료 |

---

## 2. 알림 발생 시나리오별 상세 정의

### 2-1. USER 타입 — 권한/역할별 수신 조건

| 시나리오 | 발신 트리거 | 수신 대상 (role 기준) | title | path | meta_json |
|---------|-----------|-------------------|-------|------|-----------|
| 담당자(부서) 초대 발송 | ESG담당자·컨설턴트가 초대 요청 | 초대받은 사용자 (email 기준) | `신규 팀원 초대` | `/manager/invite` | `{"inviteId": N}` |
| 컨설턴트 초대 발송 | 관리자(tenant_admin)가 초대 | 초대받은 컨설턴트 | `컨설턴트 초대` | `/manager/invite` | `{"inviteId": N}` |
| 초대 수락 | 초대받은 사람이 수락 | 초대를 보낸 ESG담당자·컨설턴트 | `담당자 초대 수락` | `/manager` | `{"inviteId": N, "acceptedUserId": M}` |
| 초대 실패/만료 | 초대 토큰 만료 or 거절 | 초대를 보낸 ESG담당자 | `초대 실패` | `/manager/invite` | `{"inviteId": N}` |
| 담당자 지정 취소 | ESG담당자가 이슈그룹 담당자 해제 | 해제된 부서 담당자 | `담당자 지정 취소` | `/onboarding` | `{"issueGroupCode": "G2-03"}` |

### 2-2. CHECK(DATA) 타입 — 권한별 수신 조건

> ⚠️ **핵심: 동일 이벤트라도 수신자 역할에 따라 title/content가 달라짐**

| 시나리오 | 발신 트리거 | 수신 대상 | title | path | meta_json |
|---------|-----------|---------|-------|------|-----------|
| 지표 제출 (부서담당자→ESG담당자) | 부서 담당자가 `SUBMITTED` 액션 | ESG담당자, 컨설턴트 | `데이터 검토 요청` | `/onboarding` | `{"datasetId": N, "issueGroupCode": "G2-03"}` |
| ESG담당자가 승인 | 승인 처리 | 해당 부서 담당자 | `데이터 승인 완료` | `/onboarding` | `{"datasetId": N}` |
| ESG담당자가 반려 | 반려 처리 | 해당 부서 담당자 | `데이터 승인 반려` | `/onboarding` | `{"datasetId": N, "reason": "반려사유"}` |

> **부서 담당자 입장:** 내가 제출한 것의 승인/반려 결과 알림  
> **ESG 담당자·컨설턴트 입장:** 부서 담당자가 제출한 것에 대한 검토 요청 알림

### 2-3. SERVICE 타입 — 보고서 생성 완료

| type | 시나리오 | title | path | meta_json |
|------|---------|-------|------|-----------|
| `CHART` | SR 보고서 버전 생성 완료 | `SR 보고서 생성 완료` | `/dashboard/reports/{reportId}` | `{"reportId": N, "version": "v01"}` |
| `LEAF`  | 탄소관리 보고서 생성 완료 | `탄소관리 보고서 생성 완료` | `/dashboard/carbon/{reportId}` | `{"reportId": N}` |
| `CUBE`  | 공급망 보고서 생성 완료 | `공급망 보고서 생성 완료` | `/dashboard/supply/{assetId}` | `{"assetId": N}` |

> 수신 대상: 해당 보고서 생성을 요청한 사용자 (ESG담당자·컨설턴트) / company_id 기준 격리

---

## 3. API 명세 요약

### 3-1. GET `/alarm` — 알림 목록 조회

```
Method:  GET
URL:     /alarm
Auth:    Bearer Token (Header)
Header:  Authorization: Bearer {token}
         Company_Id: {company_id}
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|--------|------|-----|------|
| `type` | String | Optional | 단일 유형 필터. 예: `USER` |
| `types` | String | Optional | 복수 필터 (콤마 구분). 예: `CHART,LEAF,CUBE` |
| `isRead` | Boolean | Optional | 읽음 여부 필터 |
| `page` | Number | Optional | 페이지 번호 (0-based) |
| `size` | Number | Optional | 페이지당 개수 |

**Response Body:**
```json
{
  "status": true,
  "message": "알림 목록 조회에 성공했습니다.",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "USER",
        "title": "신규 팀원 초대",
        "text": "신규 팀원 초대 요청이 승인되었습니다.",
        "isRead": false,
        "createdAt": "2026-04-29T10:00:00Z",
        "time": "10분 전",
        "path": "/manager/invite",
        "meta": { "inviteId": 15, "companyId": 1 }
      }
    ],
    "unreadCount": 2,
    "typeCounts": {
      "USER": 1, "CHECK": 1, "CHART": 0, "LEAF": 0, "CUBE": 0
    }
  }
}
```

---

### 3-2. PATCH `/alarm` — 읽음 처리

```
Method:  PATCH
URL:     /alarm
Auth:    Bearer Token
Header:  Authorization, Company_Id
```

**Request Body:**
```json
// 전체 읽음
{ "types": null }

// 유형별 읽음 (Service 탭)
{ "types": ["CHART", "LEAF", "CUBE"] }
```

**Response:** 업데이트된 전체 알림 목록 + `updatedCount`, `unreadCount` 포함

---

### 3-3. DELETE `/alarm/{id}` — 알림 삭제 (개별 / 전체)

```
Method:  DELETE
URL:     /alarm/{id}        (개별 삭제)
         /alarm             (전체 삭제 — id 없이 호출 or 별도 엔드포인트 확인 필요)
Auth:    Bearer Token
Header:  Authorization, Company_Id
Path:    id — 삭제할 알림 고유 ID (Number | String, Required)
```

**Response:** 삭제 후 남은 알림 목록 + `deletedCount`, `unreadCount` 포함

---

### 3-4. WebSocket/STOMP — 실시간 알림 수신

```
Protocol:   WebSocket / STOMP
URL:        /alarm  (ws 엔드포인트 — 백엔드 확인 필요)
Auth:       Bearer Token (Header)
Company_Id: 현재 선택 회사 (Scope 필터링 기준)
Subscribe:  /user/queue/notifications
```

**수신 Payload:**
```json
{
  "id": 100,
  "companyId": 1,
  "type": "CHART",
  "title": "보고서 생성 완료",
  "text": "2026년 ESG 보고서 생성이 완료되었습니다.",
  "isRead": false,
  "createdAt": "2026-04-29T10:30:00Z",
  "time": "방금 전",
  "path": "/dashboard/reports/100",
  "meta": { "reportId": 100 }
}
```

> **Scope 격리:** `notification.companyId === selectedCompany.company_id` 일치 시에만 `addNotification()` 호출

---

## 4. AlarmContext.jsx 수정 작업

### 4-1. 수정 포인트 체크리스트

- [ ] `notifications` 초기값 더미 배열 → 빈 배열 `[]` 로 변경
- [ ] `fetchNotifications` 주석 해제 및 실제 API 연결
- [ ] `markAllAsRead` → REST API `PATCH /alarm` 호출로 교체
- [ ] `removeNoti` → REST API `DELETE /alarm/{id}` 호출로 교체
- [ ] `clearAll` → 전체 삭제 API 호출 또는 `types: null` + 별도 delete all 엔드포인트 연계
- [ ] STOMP 구독 주석 해제 및 `companyId` 매칭 로직 확인
- [ ] `addNotification` 함수: DB 필드명(`content` → `text`) 매핑 확인

### 4-2. 수정 전/후 비교

**Before (더미):**
```jsx
const [notifications, setNotifications] = useState([
    { id: 1, type: 'USER', title: '담당자 초대 수락', ... },
    ...
]);
```

**After (API 연동):**
```jsx
const [notifications, setNotifications] = useState([]);
const [isLoading, setIsLoading] = useState(false);
```

**Before (주석 처리된 fetch):**
```jsx
// const fetchNotifications = async () => { ... };
// fetchNotifications();
```

**After (실제 연결):**
```jsx
useEffect(() => {
    if (!user || !selectedCompany) {
        setNotifications([]);
        return;
    }
    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/alarm', {
                headers: { Company_Id: selectedCompany.company_id }
            });
            // DB: content 필드 → 프론트: text 필드로 매핑
            const mapped = res.data.data.notifications.map(n => ({
                ...n,
                text: n.text ?? n.content,  // API 응답 필드명 확인 후 정리
            }));
            setNotifications(mapped);
        } catch (err) {
            console.error('알림 조회 실패', err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchNotifications();
}, [user, selectedCompany]);
```

**markAllAsRead 수정:**
```jsx
const markAllAsRead = async (types = null) => {
    try {
        const res = await api.patch('/alarm', { types }, {
            headers: { Company_Id: selectedCompany.company_id }
        });
        setNotifications(res.data.data.notifications.map(n => ({
            ...n, text: n.text ?? n.content
        })));
    } catch (err) {
        console.error('읽음 처리 실패', err);
    }
};
```

**removeNoti 수정:**
```jsx
const removeNoti = async (idToRemove) => {
    try {
        const res = await api.delete(`/alarm/${idToRemove}`, {
            headers: { Company_Id: selectedCompany.company_id }
        });
        setNotifications(res.data.data.notifications.map(n => ({
            ...n, text: n.text ?? n.content
        })));
    } catch (err) {
        console.error('알림 삭제 실패', err);
        // 실패 시 낙관적 업데이트 rollback (선택)
    }
};
```

**STOMP 구독 수정:**
```jsx
useEffect(() => {
    if (!user || !selectedCompany) return;

    const client = new StompJs.Client({
        brokerURL: `${import.meta.env.VITE_WS_URL}/alarm`,
        connectHeaders: {
            Authorization: `Bearer ${getAccessToken()}`,
            Company_Id: String(selectedCompany.company_id),
        },
        onConnect: () => {
            client.subscribe('/user/queue/notifications', (message) => {
                const payload = JSON.parse(message.body);
                // Scope 격리: 현재 회사 알림만 반영
                if (Number(payload.companyId) === Number(selectedCompany.company_id)) {
                    addNotification({
                        ...payload,
                        text: payload.text ?? payload.content,
                    });
                }
            });
        },
        onStompError: (frame) => {
            console.error('STOMP error', frame);
        },
    });
    client.activate();
    return () => client.deactivate();
}, [user, selectedCompany]);
```

**addNotification 수정 (STOMP payload 직접 수용):**
```jsx
// 기존: (text, type, title, chip) 파라미터
// 변경: notification 객체 전체를 받아 state에 prepend
const addNotification = (notification) => {
    const normalized = {
        ...notification,
        text: notification.text ?? notification.content,
        time: notification.time ?? '방금 전',
        isRead: false,
    };
    setNotifications(prev => [normalized, ...prev]);
};
```

---

## 5. Alarm.jsx 수정 작업

### 5-1. path 기반 navigate 연동

```jsx
// 현재: navigate 미연결
// 수정: 알림 클릭 시 path로 이동 + 읽음 처리

import { useNavigate } from 'react-router';

const navigate = useNavigate();

const handleNotificationClick = async (noti) => {
    // 읽음 처리 (단건) — 현재 API는 PATCH /alarm (types 기반)이므로
    // 단건 읽음은 별도 엔드포인트 확인 or 클릭 시 path 이동만 처리
    if (noti.path) {
        closeAlarm();
        navigate(noti.path);
    }
};
```

**JSX 적용 위치 (`alarm-icon-box` 또는 `alarm-content`):**
```jsx
<div
    className="alarm-item"
    style={{ cursor: noti.path ? 'pointer' : 'default' }}
    onClick={() => handleNotificationClick(noti)}  // ← 추가
>
```

### 5-2. chip 매핑 재정의

현재 더미 데이터에만 `chip` 필드가 있으나, 실제 API 응답에는 없음.  
→ `meta_json` 기반으로 chip을 프론트에서 파생시키는 방식 채택.

```jsx
// Alarm.jsx 내 유틸 함수 추가
const getChipFromMeta = (noti) => {
    if (!noti.meta) return null;
    // CHECK 타입: issueGroupCode가 있으면 chip으로 표시
    if (noti.type === 'CHECK' && noti.meta.issueGroupCode) {
        return { text: noti.meta.issueGroupCode, colorId: 'G' };
    }
    // USER 타입: 특정 이슈그룹 관련이면 표시
    if (noti.type === 'USER' && noti.meta.issueGroupCode) {
        return { text: noti.meta.issueGroupCode, colorId: 'E' };
    }
    return null;
};

// 렌더링 시
const chip = noti.chip ?? getChipFromMeta(noti);
{chip && (
    <span className={`alarm-chip bg-${chip.colorId} ${/^[A-Z]\d+/.test(chip.text) ? 'type-id' : 'type-ig'}`}>
        {chip.text}
    </span>
)}
```

### 5-3. isLoading 상태 표시 (선택)

`AlarmContext`에서 `isLoading` export 추가 후:
```jsx
const { ..., isLoading } = useAlarm();

// alarm-list 내
{isLoading ? (
    <div className="alarm-loading">알림을 불러오는 중...</div>
) : filteredNotifications.length === 0 ? (
    <div className="alarm-empty">알림이 없습니다.</div>
) : (
    filteredNotifications.map(noti => { ... })
)}
```

---

## 6. HeaderNav.jsx 수정 작업

### 6-1. 미읽음 dot — 실제 unreadCount 기반으로 변경

```jsx
// 현재: 항상 dot 표시
// 수정: 미읽음이 있을 때만 표시

const { notifications } = useAlarm();
const unreadCount = notifications.filter(n => !n.isRead).length;

// JSX
<div className="header-action" onClick={toggleAlarm} style={{ cursor: "pointer" }}>
    알림
    {unreadCount > 0 && <div className="noti-dot"></div>}
</div>
```

---

## 7. 타 페이지에서 알림 트리거 연동

> 타 페이지(Onboarding 등)에서 사용자 액션 발생 시 알림을 직접 발생시키는 방식.  
> **단, 실제 운영에서는 백엔드가 DB에 alarm 레코드를 저장하고 STOMP로 push → 프론트는 수신만 하는 구조가 권장됨.**  
> 아래는 더미 API 모드(`USE_DUMMY_API = true`) 또는 REST API 응답 후 UX 즉시 반영용 패턴.

### 7-1. Onboarding.jsx — 기존 `addNotification` 시그니처 변경 적용

```jsx
// Onboarding.jsx 상단
import { useAlarm } from '@hooks/AlarmContext.jsx';
const { addNotification } = useAlarm();
const { user, selectedCompany } = useAuth();
```

**지표 제출 완료 시 (부서담당자 → ESG담당자에게 알림 트리거):**
```jsx
const handleSubmit = async (metricId) => {
    const res = await requestSubmitMetricApi(metricId);
    if (res.status) {
        // 로컬 상태 업데이트
        updateMetricStatus(metricId, 'SUBMITTED');

        // 더미 모드: 알림 즉시 추가 (실제: STOMP가 처리)
        if (USE_DUMMY_API) {
            addNotification({
                type: 'CHECK',
                title: '데이터 검토 요청',
                text: `${selectedCompany?.company_name} 지표 데이터가 검토 대기 중입니다.`,
                path: '/onboarding',
                meta: { datasetId: metricId, companyId: selectedCompany?.company_id },
            });
        }
        showDefaultAlert('제출 완료', '검토 요청이 전송되었습니다.');
    }
};
```

**승인 완료 시 (ESG담당자 → 부서담당자에게 알림 트리거):**
```jsx
const handleApprove = async (metricId) => {
    const res = await requestApproveMetricApi(metricId);
    if (res.status) {
        updateMetricStatus(metricId, 'APPROVED');
        if (USE_DUMMY_API) {
            addNotification({
                type: 'CHECK',
                title: '데이터 승인 완료',
                text: '제출하신 ESG 지표가 승인 처리되었습니다.',
                path: '/onboarding',
                meta: { datasetId: metricId },
            });
        }
    }
};
```

**반려 시:**
```jsx
const handleReject = async (metricId, reason) => {
    const res = await requestRejectMetricApi(metricId, reason);
    if (res.status) {
        updateMetricStatus(metricId, 'REJECTED');
        if (USE_DUMMY_API) {
            addNotification({
                type: 'CHECK',
                title: '데이터 승인 반려',
                text: `제출하신 ESG 지표가 반려되었습니다. 사유: ${reason}`,
                path: '/onboarding',
                meta: { datasetId: metricId, reason },
            });
        }
    }
};
```

**담당자 초대 시:**
```jsx
const handleInviteAssignees = async (issueGroup, assignees) => {
    const res = await requestInviteAssigneesApi(issueGroup, assignees);
    if (res.status) {
        if (USE_DUMMY_API) {
            addNotification({
                type: 'USER',
                title: '신규 팀원 초대',
                text: `${issueGroup} 이슈그룹 담당자 초대 메일이 발송되었습니다.`,
                path: '/manager/invite',
                meta: { issueGroupCode: issueGroup },
            });
        }
    }
};
```

---

## 8. USE_DUMMY_API → 실제 API 전환 전략

```
USE_DUMMY_API = true  →  더미 함수에서 addNotification 직접 호출 (UX 검증용)
USE_DUMMY_API = false →  실제 API 호출 후 STOMP payload로 알림 수신 (운영)
```

### 전환 시 체크리스트

- [ ] `VITE_API_BASE_URL`, `VITE_WS_URL` 환경변수 설정
- [ ] `api.js` (axios 인스턴스) Authorization 헤더 자동 주입 확인
- [ ] `Company_Id` 헤더 interceptor에 포함 or 각 호출마다 명시
- [ ] STOMP 라이브러리 설치: `npm install @stomp/stompjs`
- [ ] 알림 클릭 → navigate 동작 확인 (path 기준 라우트 존재 여부)
- [ ] 더미 `addNotification` 호출 코드 블록 제거 (`USE_DUMMY_API` 조건부로 wrapping 후 제거)

---

## 9. AlarmContext value 변경사항 (export 추가)

```jsx
return (
    <AlarmContext.Provider value={{ 
        isAlarmOpen, toggleAlarm, closeAlarm, 
        notifications,
        isLoading,           // ← 신규 추가
        addNotification,
        removeNoti,
        markAllAsRead,
        clearAll 
    }}>
        {children}
    </AlarmContext.Provider>
);
```

---

## 10. 주의사항 및 향후 고도화 포인트

### 주의사항

1. **`content` vs `text` 필드명 불일치**  
   DB는 `content` 컬럼이나 API 응답에서 `text`로 내려올 수 있음. API 응답 필드명 백엔드와 최종 확인 후 정규화.

2. **Soft Delete (`deleted_at`) 처리**  
   `DELETE /alarm/{id}` 는 실제 삭제가 아닌 soft delete (deleted_at 업데이트). 프론트는 응답 목록 기준으로만 상태 갱신.

3. **company_id 격리 필수**  
   STOMP 수신 시 반드시 `payload.companyId === selectedCompany.company_id` 검증. 멀티테넌트 보안 핵심.

4. **읽음 처리 시점**  
   현재 API는 PATCH bulk 방식. 단건 읽음(클릭 시 즉시)은 백엔드 엔드포인트 추가 필요 또는 navigate 시 별도 처리.

### 향후 고도화

- **알림 설정 아이콘 (`alarmSettingIcon`)**: 알림 유형별 ON/OFF 설정 페이지 연결
- **페이지네이션**: `page`, `size` 파라미터로 무한스크롤 또는 더보기 구현
- **`typeCounts` 활용**: 필터 탭 뱃지에 유형별 미읽음 수 표시
- **Service 타입 미정 항목**: `CHART / LEAF / CUBE` 외 추가 서비스 타입 발생 시 `ALARM_TYPES` 맵 및 `FILTER_TABS.subTypes` 배열 동시 업데이트

---

## 11. 파일별 수정 요약 (Quick Reference)

| 파일 | 작업 내용 |
|-----|---------|
| `AlarmContext.jsx` | ① 더미 초기값 `[]` 로 교체, ② fetchNotifications 실제 연결, ③ markAllAsRead/removeNoti API 교체, ④ STOMP 구독 활성화, ⑤ addNotification 시그니처 객체 수용으로 변경, ⑥ isLoading export 추가 |
| `Alarm.jsx` | ① path 기반 navigate 연동, ② chip을 meta에서 파생하는 getChipFromMeta 유틸 추가, ③ isLoading/empty 상태 UI 추가 |
| `HeaderNav.jsx` | ① unreadCount > 0 일 때만 noti-dot 표시 |
| `Onboarding.jsx` | ① 제출/승인/반려/초대 액션 함수에 addNotification 호출 추가 (USE_DUMMY_API 조건부) |
| `alarm.css` | ① `.alarm-loading`, `.alarm-empty` 스타일 추가 (선택) |

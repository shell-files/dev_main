# 🔔 알림 시스템 API 사전 연동 가이드

본 문서는 알림 시스템(`AlarmContext.jsx`, `Alarm.jsx`)의 API 사전 연결 작업 내용과 향후 백엔드 실연동 시 필요한 조치 사항을 정리한 문서입니다.

---

## 🛠️ 작업 완료 내역

### 1. 필드명 통일 (`text` → `content`)
- DB 스키마 및 사용자 요청에 따라 알림 본문 필드명을 `content`로 통일했습니다.
- 프론트엔드 UI(`Alarm.jsx`)와 데이터 관리(`AlarmContext.jsx`) 모두 이 필드를 기준으로 동작합니다.

### 2. `USE_DUMMY_API` 플래그 도입
- `AlarmContext.jsx` 상단에 `USE_DUMMY_API` 상수를 추가했습니다.
- **`true` (현재)**: 로컬 더미 데이터를 사용하여 UI 동작을 확인합니다.
- **`false`**: 실제 백엔드 API(`/alarm`)를 호출하여 데이터를 로드하고 조작합니다.

### 3. API 기반 CRUD 로직 사전 구축
- **조회 (GET)**: `useEffect` 내에서 `api.get('/alarm')`을 호출하도록 구성했습니다.
- **읽음 (PATCH)**: `api.patch('/alarm', { types })`를 통해 유형별/전체 읽음 처리가 가능합니다.
- **삭제 (DELETE)**: 개별 삭제(`api.delete('/alarm/{id}')`) 및 전체 삭제 로직을 구성했습니다.

### 4. 사용자 경험(UX) 개선
- **이동 (Navigate)**: 알림 클릭 시 `path` 필드가 있으면 해당 페이지로 자동 이동합니다.
- **Chip 동적 표시**: `chip` 필드가 없어도 `meta` 정보(이슈그룹 코드 등)를 분석하여 적절한 배지를 표시합니다.
- **로딩 및 빈 상태**: 알림을 불러오는 중이거나 알림이 없을 때의 UI를 추가했습니다.
- **실시간 뱃지**: `HeaderNav`에서 읽지 않은 알림이 있을 때만 점(dot)이 표시됩니다.

### 5. STOMP 라이브러리 설치 및 연동 준비
- `@stomp/stompjs` 라이브러리를 설치했습니다.
- `AlarmContext.jsx` 내에 실시간 알림 수신을 위한 구독(Subscribe) 로직을 구조화하여 주석으로 준비해 두었습니다.

---

## 🚀 향후 실연동 시 전환 방법

백엔드 API가 준비되면 아래 단계를 따라 즉시 연동할 수 있습니다.

### Step 1: API 모드 활성화
`src/hooks/AlarmContext.jsx` 파일 상단의 설정을 변경합니다.
```javascript
const USE_DUMMY_API = false; // 실제 API 사용으로 전환
```

### Step 2: STOMP 실시간 알림 활성화
1. `src/hooks/AlarmContext.jsx` 상단의 import 주석을 해제합니다.
   ```javascript
   import * as StompJs from '@stomp/stompjs';
   ```
2. `useEffect` 내의 STOMP 연결 로직 주석을 해제하고 `brokerURL`을 실제 서버 주소로 수정합니다.

### Step 3: API 엔드포인트 확인
- 현재 모든 호출은 `src/utils/network.js`에 정의된 `api` 인스턴스를 사용합니다.
- 백엔드에서 요구하는 헤더(`company_id`, `Authorization`)는 인터셉터에 의해 자동으로 주입됩니다.
- 만약 엔드포인트 주소가 다르다면 `AlarmContext.jsx` 내의 URL을 수정하세요.

---

## 📝 데이터 구조 (참고)
백엔드 응답 및 더미 데이터는 아래 구조를 따릅니다.
```json
{
  "id": 1,
  "type": "USER",
  "title": "담당자 초대 수락",
  "content": "이수진 담당자님께서 초대를 수락했습니다.",
  "time": "2 mins ago",
  "isRead": false,
  "path": "/manager",
  "meta": { 
    "inviteId": 1,
    "issueGroupCode": "G2-03" 
  }
}
```

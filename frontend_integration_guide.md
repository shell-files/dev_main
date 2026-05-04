# 프론트엔드 연동 및 공통 작업 가이드

본 문서는 현재 구축된 프론트엔드 시스템의 로그인, 권한 관리, 알림 시스템 및 API 연동 방식을 정리한 가이드입니다. 향후 백엔드 실연동 및 신규 페이지 추가 시 본 가이드의 표준 패턴을 준수해주시기 바랍니다.

---

## 1. 전역 상태 및 네트워크 아키텍처

프론트엔드는 `Context API`를 통해 전역 상태를 관리하며, 모든 API 요청은 `axios` 인터셉터를 거쳐 자동으로 인증 정보가 포함됩니다.

### 🧩 핵심 구성 요소
- **AuthContext**: 사용자 인증 상태, 선택된 회사 정보, 권한(Role) 관리.
- **AlarmContext**: 실시간 알림 내역 및 알림창 노출 상태 관리.
- **Network Layer**: `localStorage`의 토큰 및 회사 ID를 모든 API 헤더에 자동 주입.

---

## 2. 주요 파일별 연동 지점 및 코드 위치

### 📡 network.js (API 통신 표준)
- **위치**: `src/utils/network.js`
- **역할**: 백엔드 서버 주소 설정 및 인증 헤더 자동 주입.
- **주요 코드 (L38-54)**:
  ```javascript
  const applyAuthInterceptor = (instance) => {
    instance.interceptors.request.use((config) => {
      const uuid = localStorage.getItem("uuid"); // TOKEN.uuid
      const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
      if (uuid) config.headers['Authorization'] = `Bearer ${uuid}`;
      if (selectedCompany?.company_id) config.headers['X-Company-ID'] = selectedCompany.company_id;
      return config;
    });
  };
  ```

### 🔐 AuthContext.jsx (로그인 및 회사 선택)
- **위치**: `src/hooks/AuthContext.jsx`
- **주요 함수**:
  - `login(data)` (L23): 로그인 성공 시 `uuid`, `user`, `companys` 정보를 전역 상태와 LocalStorage에 저장.
  - `selectCompany(id)` (L41): 현재 활동 중인 회사를 변경하고 관련 권한을 업데이트.
- **영향 범위**: 모든 페이지 상단 네비게이션 및 권한 기반 버튼 노출의 기준이 됨.

### 🔔 AlarmContext.jsx (알림 시스템)
- **위치**: `src/hooks/AlarmContext.jsx`
- **주요 함수**:
  - `addNotification(text, type, ...)` (L46): 새로운 알림 발생 시 전역 상태에 추가.
  - `useEffect (L25, L62)`: 페이지 로드 시 기존 알림 조회 API 및 WebSocket(STOMP) 연결 지점.

---

## 3. 백엔드 실연동 로드맵 (Dummy -> Real)

현재 대부분의 페이지는 `USE_DUMMY` 플래그를 통해 더미 데이터를 사용 중입니다. 실제 서버 연동 시 아래 순서로 진행합니다.

### 🔄 API 전환 단계
1. **플래그 해제**: `Login.jsx` (L71), `SignUp.jsx` (L51) 등의 `USE_DUMMY` 변수를 `false`로 변경.
2. **엔드포인트 수정**: 각 파일 상단에 주석으로 명시된 API 경로 확인.
   - 예: `Login.jsx` → `api.post("/auth/login")`
   - 예: `SignUp.jsx` → `api.post("/user")` (OCR), `api.put("/user")` (회원가입)
3. **응답 데이터 구조 맞춤**: 백엔드 응답을 프론트엔드 상태(State) 구조에 맞게 매핑.

---

## 4. 데이터 구조 매핑 (공통DB_v1 - 목록.csv 기준)

프론트엔드에서 사용하는 주요 객체와 DB 테이블 간의 관계입니다.

| 프론트엔드 변수명 | 연관 DB 테이블 | 주요 컬럼 (매핑) | 비고 |
| :--- | :--- | :--- | :--- |
| `user` | **USER**, **TOKEN** | `id`, `email`, `name`, `uuid` | 식별아이디(uuid) 필수 |
| `selectedCompany` | **COMPANY** | `id`, `company_name`, `business_number` | 현재 활성화된 회사 정보 |
| `currentRoleName` | **ROLE**, **USER_ROLE** | `role` ("ESG 담당자", "컨설턴트" 등) | 권한에 따른 기능 제한 기준 |
| `notifications` | **ALARM** | `id`, `user_id`, `content` | 알림 내역 |
| `metrics` (Onboarding) | **ISSUE**, **RAW_DATASET** | `id`, `status`, `value`, `supporting_file_id` | 온보딩 지표 및 증빙 데이터 |

---

## 5. 신규 페이지 개발 가이드 (Standard Workflow)

새로운 기능을 가진 페이지(예: `Report.jsx`)를 추가할 때의 표준 작업 절차입니다.

1. **Auth 훅 연동**:
   ```javascript
   const { selectedCompany, user } = useAuth();
   if (!user) return <Redirect to="/login" />;
   ```
2. **API 호출**:
   ```javascript
   import { api } from "@utils/network";
   const fetchData = async () => {
     const res = await api.get("/api/v1/report"); // 헤더는 network.js에서 자동 처리됨
     setData(res.data);
   };
   ```
3. **권한 처리**:
   ```javascript
   const canEdit = selectedCompany.role === "ESG 담당자";
   {canEdit && <button>수정하기</button>}
   ```
4. **알림 연동**:
   ```javascript
   const { addNotification } = useAlarm();
   const onActionSuccess = () => addNotification("리포트가 생성되었습니다.", "CHART");
   ```

---

## 🛠️ 유지보수 주의사항
- **권한 명칭**: 현재 코드상 "ESG 담당자", "ESG담당자" (공백 유무)를 모두 체크하도록 되어 있으나, 백엔드와 최종 명칭 확정 시 `AuthContext`에서 정규화 처리가 권장됩니다.
- **LocalStorage**: 보안을 위해 민감한 정보(비밀번호 등)는 절대 저장하지 않으며, 식별용 UUID와 토큰만 관리합니다.

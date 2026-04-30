# Onboarding Page Refactor Guide

## 0. 목적

현재 온보딩 페이지는 ESG 지표 입력 테이블을 단순히 표시하는 수준입니다.  
이번 리팩토링의 목적은 다음과 같습니다.

1. 온보딩 지표를 `온보딩.xlsx` 기준으로 구성합니다.
2. 상위 탭 `경영일반 / E / S / G`와 하위 이슈그룹 탭을 제공합니다.
3. 이슈그룹 단위로 담당자를 지정하고 초대할 수 있게 합니다.
4. 권한별로 보이는 데이터와 가능한 액션을 분리합니다.
5. 지표별로 임시저장 / 제출을 처리합니다.
6. 향후 API 연동을 고려하여 `USE_DUMMY_API` 기반 더미 로직과 실제 API 연결 포인트를 분리합니다.

---

## 1. 현재 수정해야 할 핵심 사항

### 1. 하단 액션바 제거

현재 하단에 있는 전역 버튼:

```txt
임시 저장 / 최종 승인 요청
```

위 버튼은 삭제합니다.

변경 후에는 각 지표 행(row) 단위로 아래 액션이 들어가야 합니다.

```txt
지표별 임시저장
지표별 제출
승인
반려
```

즉, 저장/제출은 페이지 전체 단위가 아니라 **지표 개별 단위**로 처리합니다.

---

### 2. 상위 탭 + 하위 이슈그룹 탭 구조 추가

상위 탭:

```txt
전체 / 경영일반 / E / S / G
```

하위 탭:

```txt
선택한 상위 탭에 속한 issue_group 목록
```

예:

```txt
E 클릭
→ Climate / Energy / Water / Pollution / Circularity ... 하위 탭 표시
```

하위 탭은 다음 기능을 가져야 합니다.

```txt
- 여러 개 선택 가능
- 선택된 이슈그룹만 테이블에 표시
- 이슈그룹 탭에는 x 버튼 표시
- x 클릭 시 해당 이슈그룹 필터 해제
- 상위 탭 전체를 볼 수도 있어야 함
```

예시:

```txt
E 전체 보기
E + Climate만 보기
E + Climate + Energy만 보기
Climate 탭 x 클릭 → Climate 필터 제거
```

---

### 3. 이슈그룹 기준

`온보딩.xlsx` 기준으로 이슈그룹을 구성합니다.

현재 확인된 주요 issue_group 목록:

```txt
Climate
Energy
Water
Pollution
Circularity
Biodiversity
Product_env
Supply Chain_env
Sustainable investment
Labor
Safety
Talent
Diversity
Human Rights
Supply Chain_social
Community
Product_resp
Privacy
Governance
Risk
compliance
Ethics
Business Conduct
Data Governance
```

`온보딩.xlsx`는 다음 주요 컬럼을 가진다고 가정합니다.

| 컬럼 | 의미 |
|---|---|
| 대분류 | ESG경영일반 / E / S / G 등 상위 분류 |
| 중분류 | 세부 분류 |
| issue_id | 지표 ID |
| issue_name | 지표명 또는 세부 항목명 |
| issue_group | 이슈그룹 |
| checklist_question | 체크리스트 질문 |
| unit | 단위 |
| input_format | 입력 타입 |
| 데이터 입력 | 사용자 입력값 |
| 증빙 첨부 | 증빙 파일 상태 |
| R&R 부서 | 담당 부서 |
| R&R 담당자 | 담당자 |

---

## 2. 권한별 화면/데이터 접근 규칙

### 1. ESG 담당자

ESG 담당자는 전체 데이터를 볼 수 있습니다.

가능 액션:

```txt
- 모든 이슈그룹 조회
- 모든 지표 입력 가능
- 모든 지표 임시저장 가능
- 모든 지표 제출 가능
- 승인 가능
- 반려 가능
- 이슈그룹 담당자 지정 가능
- 초대 가능
```

---

### 2. 컨설턴트

컨설턴트도 전체 데이터를 볼 수 있습니다.

가능 액션:

```txt
- 모든 이슈그룹 조회
- 모든 지표 입력 가능
- 모든 지표 임시저장 가능
- 모든 지표 제출 가능
- 검토 가능
```

승인/반려 가능 여부는 정책에 따라 결정합니다.  
초기 구현에서는 ESG 담당자와 동일하게 볼 수 있으나, 승인/반려는 ESG 담당자 전용으로 두는 것을 권장합니다.

---

### 3. 부서 담당자

부서 담당자는 자신에게 할당된 이슈그룹만 볼 수 있습니다.

가능 액션:

```txt
- 본인에게 할당된 이슈그룹만 조회
- 해당 이슈그룹 지표 입력
- 해당 지표 임시저장
- 해당 지표 제출
- 증빙 첨부
```

불가능 액션:

```txt
- 미할당 이슈그룹 조회
- 승인
- 반려
- 다른 이슈그룹 담당자 지정
```

---

## 3. 상태값 정의

지표 데이터 상태는 다음 값을 사용합니다.

| 상태값 | 설명 |
|---|---|
| NOT_STARTED | 미입력 |
| DRAFT | 작성 중 |
| SUBMITTED | 제출 |
| APPROVED | 승인 |
| REJECTED | 반려 |
| COMPLETED | 완료 |

화면 표시 문구는 다음처럼 매핑합니다.

| 내부 상태값 | 화면 표시 |
|---|---|
| NOT_STARTED | 미입력 |
| DRAFT | 작성 중 |
| SUBMITTED | 제출 |
| APPROVED | 승인 |
| REJECTED | 반려 |
| COMPLETED | 완료 |

---

## 4. 지표별 액션 버튼 정의

### 지표 행 액션 컬럼

기존:

```txt
승인 / 반려
```

변경:

```txt
임시저장 / 제출 / 승인 / 반려
```

권한과 상태에 따라 버튼 노출을 다르게 합니다.

| 권한 | 상태 | 노출 버튼 |
|---|---|---|
| 부서 담당자 | NOT_STARTED | 임시저장 |
| 부서 담당자 | DRAFT | 임시저장 / 제출 |
| 부서 담당자 | REJECTED | 임시저장 / 재제출 |
| 부서 담당자 | SUBMITTED | 없음 |
| 부서 담당자 | APPROVED | 없음 |
| ESG 담당자 | SUBMITTED | 승인 / 반려 |
| ESG 담당자 | DRAFT | 임시저장 / 제출 가능 |
| ESG 담당자 | NOT_STARTED | 임시저장 가능 |
| 컨설턴트 | NOT_STARTED/DRAFT/REJECTED | 임시저장 / 제출 가능 |
| 컨설턴트 | SUBMITTED | 조회 또는 검토 |

---

## 5. 이슈그룹 R&R 담당자 지정 기능

### 1. R&R 컬럼 추가

테이블에 `R&R` 컬럼을 추가합니다.

R&R 컬럼은 이슈그룹 단위 담당자 지정 상태를 보여줍니다.

표시 예시:

```txt
담당자 지정
수락대기
홍길동 외 2명
```

---

### 2. 담당자 지정 버튼

각 이슈그룹 단위로 담당자 지정 버튼을 제공합니다.

중요:

```txt
지표별 담당자 지정이 아니라 이슈그룹 단위 담당자 지정
```

예:

```txt
issue_group = Climate
→ Climate에 속한 모든 지표는 Climate 담당자들이 볼 수 있음
```

---

### 3. 담당자 지정 모달

버튼 클릭 시 모달을 엽니다.

입력 필드:

```txt
- 이메일
- 이름
- 부서
```

한 이슈그룹에 여러 명을 지정할 수 있어야 합니다.

모달 구조:

```txt
담당자 지정 모달
├─ issue_group 이름 표시
├─ 담당자 입력 row
│  ├─ 이메일
│  ├─ 이름
│  ├─ 부서
│  └─ 삭제 버튼
├─ 담당자 추가 버튼
├─ 초대 메일 발송 버튼
└─ 취소 버튼
```

---

### 4. 초대 상태

초대 메일 발송 후 R&R 상태는 `수락대기`로 표시합니다.

```txt
담당자 지정 버튼 클릭
→ 이메일/이름/부서 입력
→ 초대 메일 발송
→ INVITE 생성
→ R&R 표시: 수락대기
→ 초대 수락 및 가입 완료
→ R&R 표시: 담당자 이름
```

---

### 5. 여러 담당자 표시 방식

담당자가 1명일 때:

```txt
홍길동
```

담당자가 여러 명일 때:

```txt
홍길동 외 2명
```

초대 수락 전일 때:

```txt
수락대기 3명
```

---

## 6. 탭/필터 상세 로직

### 1. 상위 탭 상태

```js
const [activeCategory, setActiveCategory] = useState("전체");
```

값:

```txt
전체
경영일반
E
S
G
```

---

### 2. 선택된 이슈그룹 상태

```js
const [selectedIssueGroups, setSelectedIssueGroups] = useState([]);
```

예:

```js
["Climate", "Energy"]
```

---

### 3. 필터링 규칙

```txt
1. activeCategory가 "전체"이면 모든 대분류 표시
2. activeCategory가 "E"이면 E 대분류만 표시
3. selectedIssueGroups가 비어 있으면 해당 대분류 전체 표시
4. selectedIssueGroups가 있으면 해당 issue_group만 표시
5. searchTerm이 있으면 issue_id, issue_name, checklist_question, 담당자명 기준으로 추가 필터
```

---

### 4. 하위 이슈그룹 탭 닫기

선택된 issue_group 탭의 x 클릭 시:

```js
setSelectedIssueGroups((prev) =>
  prev.filter((group) => group !== targetGroup)
);
```

---

## 7. 더미 API 설계

API 연동 전까지는 `USE_DUMMY_API`로 제어합니다.

```js
const USE_DUMMY_API = true;
```

### 규칙

```txt
true  → 더미 데이터 사용
false → 실제 API 호출
```

---

## 8. API 연결 포인트

### 1. 온보딩 목록 조회

```js
const requestOnboardingMetricsApi = async () => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "온보딩 지표 목록 조회 성공",
      data: {
        metrics: dummyMetrics,
      },
    };
  }

  const response = await api.get("/auth/onboarding/metrics");
  return response.data;
};
```

예상 응답:

```json
{
  "status": true,
  "message": "온보딩 지표 목록 조회 성공",
  "data": {
    "metrics": [
      {
        "issueId": "E001",
        "category": "E",
        "issueGroup": "Climate",
        "issueName": "온실가스 배출량",
        "checklistQuestion": "Scope 1 직접 온실가스 배출량은?",
        "unit": "tCO2e",
        "inputFormat": "number",
        "value": "",
        "evidenceAttached": false,
        "status": "NOT_STARTED",
        "assignees": []
      }
    ]
  }
}
```

프론트 처리:

```js
const result = await requestOnboardingMetricsApi();
setMetrics(result.data.metrics);
```

---

### 2. 지표 입력값 임시저장

```js
const requestSaveMetricDraftApi = async (metricId, payload) => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "임시 저장되었습니다.",
      data: {
        metricId,
        status: "DRAFT",
      },
    };
  }

  const response = await api.patch(`/auth/onboarding/metrics/${metricId}`, payload);
  return response.data;
};
```

Request Body:

```json
{
  "value": "1234",
  "unit": "tCO2e"
}
```

---

### 3. 지표 제출

```js
const requestSubmitMetricApi = async (metricId) => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "제출되었습니다.",
      data: {
        metricId,
        status: "SUBMITTED",
      },
    };
  }

  const response = await api.post(`/auth/onboarding/metrics/${metricId}/submit`);
  return response.data;
};
```

---

### 4. 지표 승인

```js
const requestApproveMetricApi = async (metricId) => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "승인되었습니다.",
      data: {
        metricId,
        status: "APPROVED",
      },
    };
  }

  const response = await api.patch(`/auth/onboarding/metrics/${metricId}/approve`);
  return response.data;
};
```

---

### 5. 지표 반려

```js
const requestRejectMetricApi = async (metricId, reason) => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "반려되었습니다.",
      data: {
        metricId,
        status: "REJECTED",
        reason,
      },
    };
  }

  const response = await api.patch(`/auth/onboarding/metrics/${metricId}/reject`, {
    reason,
  });

  return response.data;
};
```

---

### 6. 증빙 파일 업로드

```js
const requestUploadEvidenceApi = async (metricId, file) => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "증빙 파일이 첨부되었습니다.",
      data: {
        metricId,
        evidenceAttached: true,
        fileName: file.name,
      },
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/auth/onboarding/metrics/${metricId}/evidence`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
```

---

### 7. 이슈그룹 담당자 초대

```js
const requestInviteIssueGroupAssigneesApi = async (issueGroup, assignees) => {
  if (USE_DUMMY_API) {
    return {
      status: true,
      message: "담당자 초대가 발송되었습니다.",
      data: {
        issueGroup,
        inviteStatus: "PENDING",
        assignees: assignees.map((assignee, index) => ({
          id: `dummy-invite-${index + 1}`,
          ...assignee,
          status: "PENDING",
        })),
      },
    };
  }

  const response = await api.post(`/auth/onboarding/issue-groups/${issueGroup}/assignees/invite`, {
    assignees,
  });

  return response.data;
};
```

Request Body:

```json
{
  "assignees": [
    {
      "email": "user1@company.com",
      "name": "홍길동",
      "department": "환경팀"
    },
    {
      "email": "user2@company.com",
      "name": "김철수",
      "department": "안전팀"
    }
  ]
}
```

---

## 9. 화면 컬럼 구성

변경 후 테이블 컬럼:

| 컬럼 | 설명 |
|---|---|
| ID | issue_id |
| 대분류 | 경영일반 / E / S / G |
| 이슈그룹 | Climate, Energy 등 |
| 체크리스트 내용 | checklist_question |
| 데이터 입력 | value 입력 |
| 단위 | unit |
| 증빙 | 증빙 첨부 버튼 |
| 상태 | 미입력/작성중/제출/승인/반려/완료 |
| R&R | 이슈그룹 담당자 지정/수락대기/담당자 표시 |
| 액션 | 임시저장/제출/승인/반려 |

---

## 10. 데이터 모델 프론트 기준

```js
const metric = {
  issueId: "E001",
  category: "E",
  issueGroup: "Climate",
  issueName: "온실가스 배출",
  checklistQuestion: "Scope 1 직접 온실가스 배출량은?",
  unit: "tCO2e",
  inputFormat: "number",
  value: "",
  evidenceAttached: false,
  evidenceFileName: "",
  status: "NOT_STARTED",
  rejectReason: "",
  assignees: [
    {
      id: 1,
      email: "user@company.com",
      name: "홍길동",
      department: "환경팀",
      status: "ACCEPTED"
    }
  ]
};
```

---

## 11. 담당자 초대 데이터 모델

```js
const assignee = {
  email: "user@company.com",
  name: "홍길동",
  department: "환경팀",
  status: "PENDING"
};
```

상태값:

| 상태 | 설명 |
|---|---|
| PENDING | 수락대기 |
| ACCEPTED | 수락완료 |
| REJECTED | 거절 |
| EXPIRED | 만료 |

---

## 12. Role 기반 필터링 로직

현재 로그인 사용자의 role 기준으로 필터링합니다.

예시:

```js
const currentUser = {
  roleId: 2,
  roleName: "부서 담당자",
  email: "dept@company.com",
};
```

역할 분기:

```js
const canViewAll =
  currentUser.roleName === "ESG 담당자" ||
  currentUser.roleName === "컨설턴트" ||
  currentUser.roleName === "관리자";
```

부서 담당자 필터:

```js
const visibleMetrics = canViewAll
  ? metrics
  : metrics.filter((metric) =>
      metric.assignees.some(
        (assignee) =>
          assignee.email === currentUser.email &&
          assignee.status === "ACCEPTED"
      )
    );
```

---

## 13. 구현 순서

### Step 1. 기존 하단 액션바 제거

삭제 대상:

```txt
onboarding-action-bar
임시 저장
최종 승인 요청
```

---

### Step 2. 테이블 액션 컬럼 변경

각 행에 다음 버튼 추가:

```txt
임시저장
제출
승인
반려
```

---

### Step 3. 온보딩.xlsx 기준 데이터 구조 반영

초기에는 더미 데이터로 수동 변환합니다.

이후 API 연결 시 백엔드가 `온보딩.xlsx` 기준 데이터를 내려주도록 합니다.

---

### Step 4. 상위 탭 구현

```txt
전체 / 경영일반 / E / S / G
```

---

### Step 5. 하위 이슈그룹 탭 구현

```txt
선택 가능
복수 선택 가능
x 버튼으로 해제 가능
```

---

### Step 6. R&R 컬럼 추가

```txt
담당자 지정
수락대기
담당자 이름 표시
```

---

### Step 7. 담당자 지정 모달 구현

```txt
이메일 / 이름 / 부서 입력
여러 명 추가 가능
초대 메일 발송
```

---

### Step 8. 권한별 데이터 필터링

```txt
부서 담당자 → 본인 할당 이슈그룹만
ESG 담당자 / 컨설턴트 / 관리자 → 전체
```

---

### Step 9. API 함수 분리

```txt
requestOnboardingMetricsApi
requestSaveMetricDraftApi
requestSubmitMetricApi
requestApproveMetricApi
requestRejectMetricApi
requestUploadEvidenceApi
requestInviteIssueGroupAssigneesApi
```

---

## 14. 주의사항

### 1. CSS 충돌 금지

Onboarding 전용 CSS는 반드시 아래처럼 스코프를 제한합니다.

```css
#onboarding_page ...
```

전역 선택자 사용 금지:

```css
body
html
*
.sidebar
.header
.btn
.input-group
```

---

### 2. 권한 검증

프론트에서 role 기반으로 버튼을 숨기더라도 실제 권한 검증은 백엔드에서 반드시 해야 합니다.

프론트 role은 UI 표시용입니다.

---

### 3. 회사 스코프

모든 온보딩 API는 `Company_Id` 헤더를 기준으로 현재 선택 회사 데이터를 처리해야 합니다.

```http
Company_Id: selectedCompanyId
```

---

### 4. 더미 데이터와 실제 API 구조 일치

더미 데이터 구조는 실제 API 응답 구조와 최대한 동일하게 유지합니다.

그래야 API 연결 시 화면 코드 수정이 최소화됩니다.

---

## 15. 최종 목표 UI

최종 화면 구조:

```txt
Onboarding
├─ 상위 탭
│  ├─ 전체
│  ├─ 경영일반
│  ├─ E
│  ├─ S
│  └─ G
├─ 하위 이슈그룹 탭
│  ├─ Climate x
│  ├─ Energy x
│  └─ Water x
├─ 검색창
├─ 지표 테이블
│  ├─ ID
│  ├─ 대분류
│  ├─ 이슈그룹
│  ├─ 체크리스트 내용
│  ├─ 데이터 입력
│  ├─ 단위
│  ├─ 증빙
│  ├─ 상태
│  ├─ R&R
│  └─ 액션
└─ 담당자 지정 모달
   ├─ 이메일
   ├─ 이름
   ├─ 부서
   ├─ 담당자 추가
   └─ 초대 메일 발송
```

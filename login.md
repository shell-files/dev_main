# ESG SaaS Frontend Development Guide (Login + Spline)

---

## 0. 프로젝트 목적

본 프로젝트는 ESG 데이터 기반 SaaS 플랫폼이며  
현재 범위는 **로그인 / 인증 UX + SaaS 랜딩형 로그인 화면 구현**이다.

---

## 1. 폴더 구조 (고정)


src/
├── components/          # 2회 이상 재사용 공통 컴포넌트만 생성
│   ├── Header.jsx       # 상단 네비게이션 (로고, 유저정보, 알림 등)
│   ├── Sidebar.jsx      # 좌측 메뉴 네비게이션 (페이지 이동)
│   └── [추가 예정]
├── homes/               # 모든 페이지 (Route 단위)
│   ├── gates/           
│   │   └── Gate.jsx     
│   │       # 역할: 서비스 진입 전 초기 게이트 페이지
│   ├── logins/          
│   │   ├── Login.jsx    
│   │   │   # 역할: 로그인 및 비밀번호 찾기 처리 (토큰 발급 요청)
│   │   ├── SignUp.jsx   
│   │   │   # 역할: 일반 회원가입 페이지
│   │   └── InviteSignUp.jsx
│   │       # 역할: 초대 기반 회원가입 (코드 검증 포함)
│   ├── mains/           
│   │   ├── Onboarding.jsx
│   │   │   # 역할: 데이터 입력 화면
│   │   ├── Dashboard.jsx
│   │   │   # 역할: 핵심 데이터 요약 화면 (KPI, ESG 요약, 그래프)
│   │   ├── MyPage.jsx
│   │   │   # 역할: 사용자 정보 조회/수정 (프로필, 계정 설정)
│   │   ├── Manager.jsx
│   │   │   # 역할: ESG담당자 전용 페이지 (유저 관리, 권한 관리)
│   │   ├── Log.jsx
│   │   │   # 역할: 시스템 로그 / 활동 기록 조회
│   │   └── Invite.jsx
│   │       # 역할: 사용자 초대 관리 (초대 생성, 상태 확인)
│   ├── errors/          
│   │   ├── NotFound.jsx 
│   │   │   # 역할: 존재하지 않는 경로 접근 시 404 페이지
│   │   └── [추가예정]  
│   └── styles/          
│       # 역할: 전역 스타일 / 페이지별 스타일 관리
├── utils/               
│   ├── api.js           # API 호출 함수 모음 (axios 등)
│   ├── auth.js          # 토큰 관리 (localStorage, 쿠키)
│   ├── formatter.js     # 날짜/숫자 포맷 함수
│   └── [추가예정]
├── assets/              
│   # 이미지, 아이콘, 폰트 등 정적 리소스
└── App.js               
    # 역할: 라우팅 관리


### 규칙
- 구조 변경 금지
- 로그인 관련 UI는 `logins/` 내부에서만 관리
- 공통 컴포넌트는 2회 이상 재사용 시만 components로 이동

---

## 2. 전체 화면 구조


LoginLayout
├── LoginVisual (좌측 3D 영역)
└── LoginCardArea (우측 카드)
├── login
├── forgot
└── success


### JSX 구조

```jsx
<div className="login-layout">
  <LoginVisual />
  <div className="login-card-area">
    {/* login / forgot / success */}
  </div>
</div>
3. View 상태 관리
const [view, setView] = useState("login");
값	의미
login	로그인
forgot	비밀번호 찾기
success	발송 완료
4. 함수 네이밍 규칙
[도메인] + [행동] + [대상]
함수	설명
requestLoginApi	로그인 API
handleLoginSubmit	로그인 클릭
goToForgotView	forgot 이동
requestPasswordResetApi	비밀번호 요청
goToLoginView	login 복귀
5. 상태 변수 규칙
[도메인] + [속성]
변수	설명
loginEmail	이메일
loginPassword	비밀번호
loginLoading	로그인 로딩
passwordResetEmail	reset 이메일
passwordResetLoading	reset 로딩
6. 주석 규칙
파일 상단
// 1. login → handleLoginSubmit → requestLoginApi → navigate("/home")
// 2. forgot → goToForgotView → handlePasswordResetSubmit → requestPasswordResetApi → setView("success")
// 3. success → goToLoginView
7. API 규칙
로그인
api.post("/auth/login", { email, password })
비밀번호 찾기
api.post("/auth/password-reset", { email })
8. 더미 테스트
const USE_DUMMY_API = true;
9. UX 규칙
금지
alert 사용 금지
필수
input 하단 메시지

예:

❌ 이메일 없음
✅ 이메일을 입력해 주세요
10. Spline 3D 배경 (방법 A)
사용 코드
<div className="visual-3d">
  <iframe
    src="https://prod.spline.design/xxxxx/scene.splinecode"
    frameBorder="0"
    width="100%"
    height="100%"
  />
</div>
11. Spline 규칙
좌측 영역만 사용
텍스트 영역 침범 금지
중앙 여백 확보
12. 디자인 규칙
컬러
Primary: #16a34a
Dark: #064e3b
Light: #bbf7d0
구성 요소
cube / glass / grid / leaf
13. CSS 규칙
버튼
.login-action-button {
  display: flex;
  align-items: center;
  justify-content: center;
}
스피너
.button-spinner {
  border: 3px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
14. LoginVisual.jsx 역할
좌측 3D 영역 담당
SaaS 브랜드 메시지 표시
Spline embed 포함
15. 앞으로 작업 단계
1. LoginVisual.jsx 구현
2. validation UX 개선
3. API 연결
4. 토큰 관리
5. ESG Dashboard 연결
16. 금지 사항
❌ 구조 변경
❌ alert 사용
❌ 네이밍 규칙 무시
17. 목표
단순 로그인 X
→ SaaS 랜딩 + 인증 UX
→ ESG 브랜드 경험
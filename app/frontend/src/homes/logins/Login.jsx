// Login.jsx 페이지 흐름설명:
// 1. login: 로그인 화면 표시 → 이메일/비밀번호 입력 → 로그인 버튼 클릭 → 로그인 API 요청 → 성공 시 /home 이동
// 2. forgot: 비밀번호 찾기 클릭 → forgot 화면 전환 → 이메일 입력 → 임시 비밀번호 발송 API 요청 → 성공 시 success 화면 전환
// 3. success: 이메일 발송 완료 안내 → 로그인으로 돌아가기 클릭 → login 화면 복귀

// 함수 설명
// 0. handleAccountInquiry - 설명: 계정 문의 안내 표시

// 1. initLoginPage - 설명: 로그인 버튼 클릭 시 실행되는 메인 핸들러
// 1. requestLoginApi - 설명: 로그인 API 요청 함수
// 1. navigateToHome - 설명: 로그인 성공 시 홈 화면으로 이동

// 2. goToForgotView - 설명: 로그인 화면 → 비밀번호 찾기 화면 전환
// 2. handlePasswordResetSubmit - 설명: 이메일 전송 버튼 클릭 시 실행
// 2. requestPasswordResetApi - 설명: 임시 비밀번호 발송 API
// 2. showSuccessView - 설명: 이메일 발송 완료 화면 표시
// 3. goToLoginView - 설명: 성공 화면 → 로그인 화면 복귀

// 46, 120 째 줄 api 구축 시 연결해야해요!

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@utils/network";
import "@styles/logins.css";

const Login = () => {
  // =========================
  // 0. 공통 상태
  // =========================

  // view - 현재 화면 상태 관리
  // 1. login: 로그인 화면
  // 2. forgot: 비밀번호 찾기 화면
  // 3. success: 이메일 발송 완료 화면
  const [view, setView] = useState("login");

  // API 요청 중 버튼 중복 클릭 방지용 로딩 상태
  const [loading, setLoading] = useState(false);

  // 페이지 이동 처리 함수
  const navigate = useNavigate();

  // 로그인 페이지 진입 시 body에 id="login" 부여
  // login.css에서 #login .container 같은 스타일을 적용하기 위한 처리
  useEffect(() => {
    document.body.id = "login";

    return () => {
      document.body.removeAttribute("id");
    };
  }, []);

  // =========================
  // 1. login: 로그인 화면 상태/함수
  // =========================

  // 1. login_로그인 이메일, 비밀번호 입력값
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 1. login_로그인 API 요청 함수
  // TODO: 백엔드 로그인 엔드포인트 확정 후 "/auth/login" 부분 수정
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginEmail.trim()) {
      alert("이메일을 입력해 주세요.");
      return;
    }

    if (!loginPassword.trim()) {
      alert("비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);
      // 여기 부분 수정해야해요 api 연결!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      navigate("/home");
    } catch (error) {
      alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 1. login_회원가입 화면 이동 함수
  const goToSignupPage = () => {
    navigate("/signup");
  };

  // =========================
  // 2. forgot: 비밀번호 찾기 화면 상태/함수
  // =========================

  // 2. forgot_비밀번호 찾기 이메일 입력값
  const [passwordResetEmail, setPasswordResetEmail] = useState("");

  // 2. forgot_비밀번호 찾기 화면으로 이동하는 함수
  const goToForgotView = () => {
    setView("forgot");
  };

  // 2. forgot_임시 비밀번호 이메일 전송 API 요청 함수
  // TODO: 백엔드 임시 비밀번호 발송 엔드포인트 확정 후 "/auth/password-reset" 부분 수정
  const handleSendPasswordEmail = async (e) => {
    e.preventDefault();

    if (!passwordResetEmail.trim()) {
      alert("이메일을 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);
      // 여기 부분 수정해야해요 api 연결!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      await api.post("/auth/password-reset", {
        email: passwordResetEmail,
      });

      setView("success");
    } catch (error) {
      alert("이메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. success: 이메일 발송 완료 화면 함수
  // =========================

  // 3. success_로그인 화면으로 돌아가는 함수
  const goToLoginView = () => {
    setView("login");
  };

  // =========================
  // 4. 공통: 계정 문의 안내 함수
  // =========================

  // 이메일 찾기 / 아이디 문의 클릭 시 안내
  const handleAccountInquiry = () => {
    alert(
      "계정 관련 문의는 아래 연락처로 부탁드립니다.\n\n" +
        "담당자: 고객지원팀\n" +
        "연락처: 010-0000-0000\n" +
        "운영시간: 평일 09:00 ~ 18:00"
    );
  };

  return (
    <>
      {/* ========================= */}
      {/* 1. login: 로그인 화면 */}
      {/* ========================= */}
      <div
        className="container"
        id="login-section"
        style={{ display: view === "login" ? "block" : "none" }}
      >
        <div className="header-nav">
          <span className="back-btn">←</span>
        </div>

        <div className="logo-placeholder">로고 추가 예정</div>

        <h1>Login</h1>

        <form className="input-group" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="이메일을 입력해주세요"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <div className="links">
            <span onClick={goToSignupPage}>회원 가입</span> /{" "}
            <span onClick={handleAccountInquiry}>이메일 찾기</span> /{" "}
            <span className="active-link" onClick={goToForgotView}>
              비밀번호 찾기
            </span>
          </div>

          <button className="login-action-button" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>

      {/* ========================= */}
      {/* 2. forgot: 비밀번호 찾기 화면 */}
      {/* ========================= */}
      <div
        className="container"
        id="forgot-section"
        style={{ display: view === "forgot" ? "block" : "none" }}
      >
        <div className="header-nav">
          <span className="back-btn" onClick={goToLoginView}>
            ←
          </span>
        </div>

        <div className="logo-placeholder">로고 추가 예정</div>

        <h1>비밀번호 찾기</h1>

        <form className="input-group" onSubmit={handleSendPasswordEmail}>
          <input
            type="email"
            placeholder="이메일을 입력해주세요"
            value={passwordResetEmail}
            onChange={(e) => setPasswordResetEmail(e.target.value)}
          />

          <div className="info-box">
            *계정 이메일 입력 후 이메일 전송 클릭 시
            <br />
            임시 비밀번호를 해당 이메일에 발송
          </div>

          <div className="links">
            <span onClick={handleAccountInquiry}>
              아이디가 기억나지 않나요?
            </span>
          </div>

          <button className="login-action-button" type="submit" disabled={loading}>
            {loading ? "전송 중..." : "이메일 전송"}
          </button>
        </form>
      </div>

      {/* ========================= */}
      {/* 3. success: 이메일 발송 완료 화면 */}
      {/* ========================= */}
      <div
        className="container"
        id="success-section"
        style={{ display: view === "success" ? "block" : "none" }}
      >
        <div className="logo-placeholder">로고 추가 예정</div>

        <h1>이메일 발송 완료</h1>

        <div className="success-message-box">
          <div className="success-message-main">
            임시 비밀번호가 발송되었습니다.
          </div>
          <div>입력하신 이메일의 메일함을 확인해 주세요.</div>
        </div>

        <button className="login-action-button success-button" onClick={goToLoginView}>
          로그인으로
          <br />
          돌아가기
        </button>
      </div>
    </>
  );
};

export default Login;
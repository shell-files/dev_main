// =====================================================================================
// Login.jsx 페이지 흐름설명 (함수 기준)

// 1. login 흐름 → handleLoginSubmit (handleLogin) → requestLoginApi 호출 → 성공 시 navigateToHome (navigate("/main")) 실행
// 2. forgot 흐름 → goToForgotView → handlePasswordResetSubmit (handleSendPasswordEmail) → requestPasswordResetApi 호출 → 성공 시 showSuccessView (setView("success")) 실행
// 3. success 흐름 → goToLoginView → setView("login") 실행

// ========================
// 함수 설명 (현재 코드 기준)

// 0. handleAccountInquiry - 설명: 계정 문의 안내 alert 출력 (이메일 찾기 / 고객센터)

// 1. login
// 1. initLoginPage (useEffect) - 설명: 페이지 진입 시 body에 id="login" 설정 (CSS scope 적용)
// 1. requestLoginApi - 설명: 로그인 API 요청 함수
//    - 현재 더미 API 지원 (USE_DUMMY_API)
//    - 실제 API 연결 시 "/auth/login" 수정 필요
// 1. handleLoginSubmit (handleLogin) - 설명: 로그인 버튼 클릭 시 실행
//    - 입력값 검증 (email, password)
//    - requestLoginApi 호출
//    - 성공 시 navigate("/main")
// 1. navigateToHome - 설명: 로그인 성공 시 홈 화면 이동 (navigate("/main"))

// 2. forgot
// 2. goToForgotView - 설명: login → forgot 화면 전환
// 2. requestPasswordResetApi - 설명: 임시 비밀번호 발송 API 요청
//    - 현재 더미 API 지원
//    - 실제 API 연결 시 "/auth/password-reset" 수정 필요
// 2. handlePasswordResetSubmit (handleSendPasswordEmail) - 설명: 이메일 전송 버튼 클릭 시 실행
//    - 입력값 검증 (email)
//    - requestPasswordResetApi 호출
//    - 성공 시 setView("success")
// 2. showSuccessView - 설명: 이메일 발송 완료 화면 표시 (setView("success"))

// 3. success
// 3. goToLoginView - 설명: success → login 화면 복귀
// 3. goToPasswordResetViewAgain - 설명: success → forgot 화면 이동
//    - 이메일 입력값 초기화
//    - 재입력 유도 UX

// =========================
// API 연결 위치 (수정 포인트)
// =========================

// 1. requestLoginApi
// → api.post("/auth/login", { email, password })

// 2. requestPasswordResetApi
// → api.post("/auth/password-reset", { email })
// =====================================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@utils/network";
// import LoginVisual from "@logins/LoginVisual";
import "@styles/logins.css";
import emailIcon from "@assets/login/email-icon.png"; // 새로 추가된 아이콘

// 프론트 테스트용 더미 api 이거 false 로 처리하고 api 연결하면 됩니다. (api 확정 및 테스트 마무리 후 지워도 됨)
// true: 백엔드 없이 더미 테스트
// false: 실제 API 호출
const USE_DUMMY_API = false;

const Login = () => {
  // =========================
  // 0. 공통 상태
  // =========================

  // view - 현재 화면 상태 관리
  // 1. login: 로그인 화면
  // 2. forgot: 비밀번호 찾기 화면
  // 3. success: 이메일 발송 완료 화면
  const [view, setView] = useState("login");
  const [errors, setErrors] = useState({});

  // 1. login_로그인 버튼 로딩 상태
  const [loginLoading, setLoginLoading] = useState(false);

  // 2. forgot_이메일 전송 버튼 로딩 상태
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // 페이지 이동 처리 함수
  const navigate = useNavigate();

  // 필수 기입 메세지 처리 함수
  const validateRequiredField = (name, value) => {
  let message = "";

  if (!value.trim()) {
    if (name === "loginEmail") message = "이메일을 입력해 주세요.";
    if (name === "loginPassword") message = "비밀번호를 입력해 주세요.";
    if (name === "passwordResetEmail") message = "이메일을 입력해 주세요.";
  }

  if ((name === "loginEmail" || name === "passwordResetEmail") && value.trim()) {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(value)) {
      message = "올바른 이메일 주소를 입력해 주세요.";
    }
  }

  setErrors((prev) => ({
    ...prev,
    [name]: message,
  }));

  return message;
  };

  // =========================
  // 1. initLoginPage
  // =========================

  // 로그인 페이지 진입 시 body에 id="login" 부여
  // logins.css에서 #login .container 같은 스타일을 적용하기 위한 처리
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

  // 1. requestLoginApi
  // 설명: 로그인 API 요청 함수
  // 현재는 USE_DUMMY_API=true 상태라 백엔드 없이 성공 응답을 더미로 반환
  // 실제 API 구축 시 USE_DUMMY_API=false로 변경 후 "/auth/login" 엔드포인트 수정
  const requestLoginApi = async () => {
    if (USE_DUMMY_API) {
      await new Promise((resolve) => setTimeout(resolve, 900));

      return {
        status: "success",
        data: {
          accessToken: "dummy-access-token",
          user: {
            userId: "dummy-user-001",
            email: loginEmail,
          },
        },
        message: null,
      };
    }

    const response = await api.post("/auth/auth", {
      email: loginEmail,
      password: loginPassword,
    });

    return response.data;
  };

  // 1. handleLoginSubmit
  // 설명: 로그인 버튼 클릭 시 실행되는 메인 핸들러
  // 역할:
  // - 이메일/비밀번호 입력값 검증
  // - requestLoginApi 호출
  // - 성공 시 accessToken 저장
  // - 성공 시 /main 이동
  const handleLogin = async (e) => {
    e.preventDefault();

    const emailError = validateRequiredField("loginEmail", loginEmail);
    const passwordError = validateRequiredField("loginPassword", loginPassword);

    if (emailError || passwordError) return;

    try {
      setLoginLoading(true);

      const result = await requestLoginApi();

      if (result.status !== "success") {
        throw new Error(result.message || "로그인 실패");
      }

      // 1. navigateToHome 전 토큰 저장
      // 실제 로그인 API 응답 구조 확정 후 key 이름은 조정 가능
      if (result.data?.accessToken) {
        localStorage.setItem("accessToken", result.data.accessToken);
      }

      if (result.data?.user?.userId) {
        localStorage.setItem("userId", result.data.user.userId);
      }

      // 1. navigateToHome
      navigate("/main");
    } catch (error) {
      alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
    } finally {
      setLoginLoading(false);
    }
  };

  // 1. login_회원가입 화면 이동 함수
  const goToSignupPage = () => {
    navigate("/signup");
  };
  const goToGatePage = () => {
    navigate("/");
  };

  // =========================
  // 2. forgot: 비밀번호 찾기 화면 상태/함수
  // =========================

  // 2. forgot_비밀번호 찾기 이메일 입력값
  const [passwordResetEmail, setPasswordResetEmail] = useState("");

  // 2. goToForgotView
  // 설명: 로그인 화면에서 비밀번호 찾기 화면으로 전환
  const goToForgotView = () => {
    setView("forgot");
  };

  // 2. requestPasswordResetApi
  // 설명: 임시 비밀번호 발송 API 요청 함수
  // 현재는 USE_DUMMY_API=true 상태라 백엔드 없이 성공 응답을 더미로 반환
  // 실제 API 구축 시 USE_DUMMY_API=false로 변경 후 "/auth/password-reset" 엔드포인트 수정
  const requestPasswordResetApi = async () => {
    if (USE_DUMMY_API) {
      await new Promise((resolve) => setTimeout(resolve, 900));

      return {
        status: "success",
        data: {
          sent: true,
        },
        message: "임시 비밀번호가 발송되었습니다.",
      };
    }

    const response = await api.post("/auth/password-reset", {
      email: passwordResetEmail,
    });

    return response.data;
  };

  // 3. success_이메일 마스킹 표시 함수
  // 예: hello@example.com → he***@example.com
  const maskEmail = (email) => {
    const [id, domain] = email.split("@");

    if (!id || !domain) return email;

    const visibleId = id.length <= 2 ? id[0] : id.slice(0, 2);
    return `${visibleId}***@${domain}`;
  };

  // 2. handlePasswordResetSubmit
  // 설명: 이메일 전송 버튼 클릭 시 실행되는 메인 핸들러
  // 역할:
  // - 이메일 입력값 검증
  // - requestPasswordResetApi 호출
  // - 성공 시 success 화면 전환
  const handleSendPasswordEmail = async (e) => {
    if (e) e.preventDefault();

  const emailError = validateRequiredField(
    "passwordResetEmail",
    passwordResetEmail
  );

  if (emailError) return;

    try {
      setPasswordResetLoading(true);

      const result = await requestPasswordResetApi();

      if (result.status !== "success") {
        throw new Error(result.message || "이메일 전송 실패");
      }

      // 2. showSuccessView
      setView("success");
    } catch (error) {
      alert("이메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // =========================
  // 3. success: 이메일 발송 완료 화면 함수
  // =========================

  // 3. goToLoginView
  // 설명: success 화면에서 login 화면으로 복귀
  const goToLoginView = () => {
    setView("login");
  };
  
  // 3. success_이메일 다시 받기 클릭 함수
  // 설명: success 화면 → forgot 화면으로 이동하고 이메일 입력값 초기화
const goToPasswordResetViewAgain = () => {
  setPasswordResetEmail("");
  setView("forgot");
};

  // =========================
  // 4. 공통: 계정 문의 안내 함수
  // =========================

  // 0. handleAccountInquiry
  // 설명: 이메일 찾기 / 아이디 문의 클릭 시 안내
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
    <div className="login-layout">
        {/* ========================= */}
        {/* 1. login: 로그인 화면 */}
        {/* ========================= */}
        <div
          className="container"
          id="login-section"
          style={{ display: view === "login" ? "block" : "none" }}
        >
          <div className="header-nav">
            <span className="back-btn" onClick={goToGatePage}>←</span>
          </div>

          <div className="logo-placeholder">로고 추가 예정</div>

          <h1>Login</h1>

          <form className="input-group" onSubmit={handleLogin}>
          <input
            type="email"
            autoComplete="off"
            name="loginEmail"
            className={errors.loginEmail ? "input-error" : ""}
            placeholder="이메일을 입력해주세요"
            value={loginEmail}
            onChange={(e) => {
              setLoginEmail(e.target.value);
              setErrors((prev) => ({ ...prev, loginEmail: "" }));
            }}
            onBlur={(e) => validateRequiredField("loginEmail", e.target.value)}
          />
          {errors.loginEmail && <p className="error">{errors.loginEmail}</p>}

          <input
            type="password"
            autoComplete="new-password"
            name="loginPassword"
            className={errors.loginPassword ? "input-error" : ""}
            placeholder="비밀번호를 입력해주세요"
            value={loginPassword}
            onChange={(e) => {
              setLoginPassword(e.target.value);
              setErrors((prev) => ({ ...prev, loginPassword: "" }));
            }}
            onBlur={(e) => validateRequiredField("loginPassword", e.target.value)}
          />
          {errors.loginPassword && <p className="error">{errors.loginPassword}</p>}

            <div className="links">
              <span onClick={goToSignupPage}>회원 가입</span> |{" "}
              <span onClick={handleAccountInquiry}>이메일 찾기</span> |{" "}
              <span className="active-link" onClick={goToForgotView}>
                비밀번호 찾기
              </span>
            </div>

            <button
              className="login-action-button"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? <span className="button-spinner" /> : "로그인"}
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

          <div className="forgot-icon-wrapper">
            <img 
              src={emailIcon} 
              alt="이메일 비밀번호 찾기" 
            />
          </div>

          <form className="input-group" onSubmit={handleSendPasswordEmail}>
            <input
              type="email"
              autoComplete="off"
              name="passwordResetEmail"
              className={errors.passwordResetEmail ? "input-error" : ""}
              placeholder="이메일을 입력해주세요"
              value={passwordResetEmail}
              onChange={(e) => {
                setPasswordResetEmail(e.target.value);
                setErrors((prev) => ({ ...prev, passwordResetEmail: "" }));
              }}
              onBlur={(e) => validateRequiredField("passwordResetEmail", e.target.value)}
            />
            {errors.passwordResetEmail && <p className="error">{errors.passwordResetEmail}</p>}

            <div className="info-box">
              <strong>임시 비밀번호 발송 안내</strong>
              입력하신 이메일로 임시 비밀번호가 발송됩니다.
            </div>

            <button
              className="login-action-button"
              type="submit"
              disabled={passwordResetLoading}
            >
              {passwordResetLoading ? (
                <span className="button-spinner" />
              ) : (
                "이메일 전송"
              )}
            </button>

            <div className="links">
              <span onClick={handleAccountInquiry}>
                아이디가 기억나지 않나요?
              </span>
            </div>
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

          <div className="success-check-wrap">
            <div className="success-check-icon">✓</div>
          </div>

          <div className="success-message-box">
            <div className="success-message-main">
              {maskEmail(passwordResetEmail)}
              <br />
              임시 비밀번호를 발송했습니다.
            </div>

            <div className="success-message-sub">
              메일이 보이지 않는다면 스팸 메일함을 확인해 주세요.
              <br />
              로그인 확인 후 비밀번호를 변경해 주세요.
            </div>
          </div>

          <button
            className="login-action-button success-button"
            onClick={goToLoginView}
          >
            로그인으로 돌아가기
          </button>

          <div className="success-help-links">
            <span onClick={goToPasswordResetViewAgain}>이메일 다시 받기</span>
            <span className="divider">|</span>
            <span onClick={handleAccountInquiry}>고객센터 문의</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
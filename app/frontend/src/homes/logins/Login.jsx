import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "@styles/login.css";

const Login = () => {
  const [isForgotView, setIsForgotView] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.id = "login";
    return () => {
      document.body.removeAttribute("id");
    };
  }, []);

  const toggleView = () => {
    setIsForgotView((prev) => !prev);
  };

  const handleLogin = () => {
    // TODO: 나중에 API 연결
    navigate("/home");
  };

  return (
    <>
      {/* 로그인 영역 */}
      <div
        className="container"
        id="login-section"
        style={{ display: isForgotView ? "none" : "block" }}
      >
        <div className="header-nav">
          <span className="back-btn">←</span>
        </div>

        <div className="logo-placeholder">로고 추가 예정</div>

        <h1>Login</h1>

        <form className="input-group">
          <input type="email" placeholder="이메일을 입력해주세요" />
          <input type="password" placeholder="비밀번호를 입력해주세요" />
        </form>

        <div className="links">
          <span onClick={() => navigate("/signup")}>회원 가입</span> /{" "}
          <span
              onClick={() =>
                alert(
                  "계정 관련 문의는 아래 연락처로 부탁드립니다.\n\n" +
                  "담당자: 고객지원팀\n" +
                  "연락처: 010-0000-0000\n" +
                  "운영시간: 평일 09:00 ~ 18:00"
                )
              }
               >
            이메일 찾기
          </span>{" "}
          /{" "}
          <span className="active-link" onClick={toggleView}>
            비밀번호 찾기
          </span>
        </div>

        <button className="btn-primary" onClick={handleLogin}>
          로그인
        </button>
      </div>

      {/* 비밀번호 찾기 영역 */}
      <div
        className="container"
        id="forgot-section"
        style={{ display: isForgotView ? "block" : "none" }}
      >
        <div className="header-nav">
          <span className="back-btn" onClick={toggleView}>
            ←
          </span>
        </div>

        <div className="logo-placeholder">로고 추가 예정</div>

        <h1>비밀번호 찾기</h1>

        <form className="input-group">
          <input type="email" placeholder="이메일을 입력해주세요" />
        </form>

        <div className="info-box">
          *계정 이메일 입력 후 이메일 전송 클릭 시
          <br />
          임시 비밀번호를 해당 이메일에 발송
        </div>

        <div className="links">
          <span onClick={() => alert(
                  "계정 관련 문의는 아래 연락처로 부탁드립니다.\n\n" +
                  "담당자: 고객지원팀\n" +
                  "연락처: 010-0000-0000\n" +
                  "운영시간: 평일 09:00 ~ 18:00"
                )}>
            아이디가 기억나지 않나요?
          </span>
        </div>

        <button className="btn-primary">이메일 전송</button>
      </div>
    </>
  );
};

export default Login;
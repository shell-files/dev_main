import { useEffect, useState } from "react";
import "@styles/login.css";

const Signup = () => {
  const [isForgotView, setIsForgotView] = useState(false);

  useEffect(() => {
    document.body.id = "login";

    return () => {
      document.body.removeAttribute("id");
    };
  }, []);

  const toggleView = () => {
    setIsForgotView((prev) => !prev);
  };

  return (
    <>
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
          <a href="signup.html">회사 등록</a> /{" "}
          <span onClick={() => alert("아이디 찾기 커스텀 알럿")}>
            이메일 찾기
          </span>{" "}
          /{" "}
          <span className="active-link" onClick={toggleView}>
            비밀번호 찾기
          </span>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            window.location.href = "main.html";
          }}
        >
          로그인
        </button>
      </div>

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
          <span onClick={() => alert("아이디 찾기 커스텀 알럿")}>
            아이디가 기억나지 않나요?
          </span>
        </div>

        <button className="btn-primary">이메일 전송</button>
      </div>
    </>
  );
}

export default Signup;
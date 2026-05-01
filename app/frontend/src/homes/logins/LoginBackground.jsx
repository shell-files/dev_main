import "@styles/loginBackground.css";
import gateBg1 from '@assets/backgrounds/GateBg1.png'
import gateBg2 from '@assets/backgrounds/GateBg2.png'
import gateBg3 from '@assets/backgrounds/GateBg3.png'

const LoginBackground = () => {
  return (
    <aside className="login-background" aria-hidden="true">
      <div className="login-visual-content">
          <p className="login-visual-kicker">ESG Data Integration</p>

          <h2 className="login-visual-title">
            지속가능경영 데이터를
            <br />
            하나의 플랫폼에서.
          </h2>

          <p className="login-visual-description">
            복잡한 ESG 지표 관리부터 증빙 수집, 승인 워크플로우까지,
            체계적인 데이터 거버넌스를 경험하세요.
          </p>

          <div className="login-visual-badge-list">
            <div className="login-visual-badge">
              <span className="badge-dot"></span> 지속가능경영보고서 AI 자동 발간
            </div>
            <div className="login-visual-badge">
              <span className="badge-dot"></span> LCA / PCF 탄소관리 자동화 AI
            </div>
            <div className="login-visual-badge">
              <span className="badge-dot"></span> 공급망 데이터 AI 기반 통합 관리
            </div>
          </div>
        </div>

        <img
          src={gateBg1}
          width="360"
          height="360"
          alt=""
          className="login-visual-object login-visual-object-main"
        />
        <img
          src={gateBg2}
          width="120"
          height="120"
          alt=""
          className="login-visual-object login-visual-object-sub login-visual-object-sub-1"
        />
        <img
          src={gateBg3}
          width="100"
          height="100"
          alt=""
          className="login-visual-object login-visual-object-sub login-visual-object-sub-2"
        />
      </aside>
  );
};

export default LoginBackground;

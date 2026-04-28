import React from 'react'
import { useNavigate } from 'react-router'
import '@styles/Gate.css'

// ―――――――――― [ Images import ] ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
import logo from '@assets/logos/Logo.png'
import gateBg1 from '@assets/backgrounds/GateBg1.png'
import gateBg2 from '@assets/backgrounds/GateBg2.png'
import gateBg3 from '@assets/backgrounds/GateBg3.png'
import gateMain1 from '@assets/banners/GateMain3.jpg'

// ―――――――――― [ Icon import ] ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
import gateReport from '@assets/icons/base/GateReport.png'
import gateCarbon from '@assets/icons/base/GateCarbon.png'
import gateSupply from '@assets/icons/base/GateSupply.png'
import gateLogin from '@assets/icons/base/GateLogin.png'
import gateReportHover from '@assets/icons/hover/GateReportHover.png'
import gateCarbonHover from '@assets/icons/hover/GateCarbonHover.png'
import gateSupplyHover from '@assets/icons/hover/GateSupplyHover.png'
import gateLoginHover from '@assets/icons/hover/GateLoginHover.png'

const gate = () => {

	const navigate = useNavigate()

	// ―――――――――― [ 로그인 카드 클릭 핸들러 ] ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
	const handleLoginClick = () => {
		navigate("/login")
	}

	return (
		<div className="gate-body">
			{/* ―――――――――― [ bacgrounds 이미지 ] ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */}
			<div className="bg-elements">
				<img src={gateBg1} alt="background shape 1" className="bg-img bg-1" />
				<img src={gateBg2} alt="background shape 2" className="bg-img bg-2" />
				<img src={gateBg3} alt="background shape 3" className="bg-img bg-3" />
			</div>

			<div className="container">
				{/* ―――――――――― [ header ] ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */}
				<header className="header">
					<img src={logo} alt="We are IT Hero Logo" className="logo" />
				</header>

				<main className="content-wrapper">
					{/* ―――――――――― [ 좌측 메인 배너 ] ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */}
						<section 
							className="main-banner" 
							style={{ backgroundImage: `url(${gateMain1})` }}
						>
							<div className="banner-overlay"></div>
							<div className="banner-text">
								<h2>지속 가능한 미래를 위한 최적의 파트너</h2>
								<h1>ESG 통합 솔루션</h1>
								<p> 
										보고서 자동 요약, 탄소배출량 추적, 공급망 관리까지! <br />
										복잡한 ESG 경영을 단 하나의 플랫폼으로 스마트하게 완성하고 <br />
										기업의 가치를 높이세요.
								</p>
							</div>
						</section>

						{/* ―――――――――― [ 우측 서비스 그리드 ] ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */}
						<section className="service-grid">
							{/* 1. ESG 보고서 요약 자동화 시스템 (SKM) */}
							<div className="service-card top-left">
								<span className="badge">SKM</span>
								<div className="icon-box">
									<img src={gateReport} alt="icon" className="default-icon" />
									<img src={gateReportHover} alt="icon hover" className="hover-icon" />
								</div>
								<h2>ESG 보고서 요약<br />자동화 시스템</h2>
							</div>

							{/* 2. ESG 탄소배출량 관리 시스템 (HighGo!) */}
							<div className="service-card top-right">
								<span className="badge">HighGo!</span>
								<div className="icon-box">
									<img src={gateCarbon} alt="icon" className="default-icon" />
									<img src={gateCarbonHover} alt="icon hover" className="hover-icon" />
								</div>
								<h2>ESG 탄소배출량<br />관리 시스템</h2>
							</div>
							
							{/* 3. ESG 공급망 관리 시스템 (TripleValues) */}
							<div className="service-card bottom-left">
								<span className="badge">TripleValues</span>
								<div className="icon-box">
									<img src={gateSupply} alt="icon" className="default-icon" />
									<img src={gateSupplyHover} alt="icon hover" className="hover-icon" />
								</div>
								<h2>ESG 공급망<br />관리 시스템</h2>
							</div>

							{/* 4. 로그인 페이지 이동 */}
							<div 
								className="service-card login-card bottom-right" 
								onClick={handleLoginClick}
							>
								<span className="badge">Platform</span>
								<div className="icon-box">
									<img src={gateLogin} alt="icon" className="default-icon" />
									<img src={gateLoginHover} alt="icon hover" className="hover-icon" />
								</div>
								<h2>로그인</h2>
							</div>
						</section>
				</main>
			</div>
		</div>
	)
}

export default gate
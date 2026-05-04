import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";
import { AlarmProvider } from '@hooks/AlarmContext.jsx';
import '@styles/App.css'
import NotFound from '@errors/NotFound.jsx'
import Gate from '@gates/Gate.jsx'
import Login from '@logins/Login.jsx'
import Signup from '@logins/SignUp.jsx'
import Main from '@mains/Main.jsx'
import Onboarding from '@mains/Onboarding.jsx'
import Dashboard from '@mains/Dashboard.jsx'
import Manager from '@mains/Manager.jsx'
import Headernav from "@components/HeaderNav.jsx"
import Sidebarnav from "@components/SidebarNav.jsx"
import Alarm from "@components/Alarm.jsx"
import CompanySelect from "@logins/CompanySelect.jsx"
import Invite from "@mains/Invite.jsx"
import "@styles/mains.css";

function App() {
  const paths1 = [
      { path: "/", element: <Gate /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/company", element: <CompanySelect /> },
      { path: "*", element: <NotFound /> },
  ]
  const paths2 = [
    { path: "/main", element: <Main /> },
    { path: "/main/dashboard", element: <Dashboard />},
    { path: "/main/manager", element: <Manager />},
    { path: "/main/onboarding", element: <Onboarding />},
    { path: "/main/Invite", element: <Invite />},
    { path: "main/*", element: <NotFound /> },
  ]
  
  const location = useLocation();
  const [isNav, setIsNav] = useState(location.pathname.includes("/main"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);

  // 2. 화면 리사이즈 시 800px을 기준으로 사이드바 상태를 자동으로 동기화
  useEffect(() => {
    // 800px 이하 여부를 판단하는 미디어 쿼리 생성
    const mediaQuery = window.matchMedia("(max-width: 800px)");

    const handleMediaChange = (e) => {
      if (e.matches) {
        // 화면이 800px 이하(모바일)가 되면 무조건 사이드바를 닫음
        setIsSidebarOpen(false);
      } else {
        // 화면이 801px 이상(데스크탑)으로 복귀하면 자동으로 사이드바를 다시 열어줌
        setIsSidebarOpen(true);
      }
    };

    // 초기 실행 및 리스너 등록
    mediaQuery.addEventListener("change", handleMediaChange);
    
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  // 3. 페이지 경로 이동 시 처리
  useEffect(() => {
    setIsNav(location.pathname.includes("/main"));
    // 모바일 환경에서만 페이지 이동 시 사이드바를 자동으로 닫음
    if (window.innerWidth <= 800) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* ... (이전 return 내부 구조와 동일하게 유지) ... */}
      { !isNav && 
        <Routes>
          {paths1?.map((v, i) => <Route key={i} path={v.path} element={v.element} />)}
        </Routes>
      }
      { isNav &&
      <AlarmProvider>
        <div id="main_page">
          <div className="main-layout">
            <Headernav toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            
            <div className="content_box" style={{ position: "relative" }}>
              
              {/* 데스크탑 환경에서 동작하는 사이드바 토글 엣지 버튼 */}
              {window.innerWidth > 800 && (
                <div 
                  className={`sidebar-edge-toggle ${isSidebarOpen ? "open" : "closed"}`}
                  onClick={toggleSidebar}
                  title={isSidebarOpen ? "메뉴 접기" : "메뉴 펼치기"}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {isSidebarOpen ? (
                      <polyline points="15 18 9 12 15 6"></polyline>
                    ) : (
                      <polyline points="9 18 15 12 9 6"></polyline>
                    )}
                  </svg>
                </div>
              )}

              <Sidebarnav isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
              
              <div className="main_right_box">
                <Alarm />
                <Routes>
                  {paths2?.map((v, i) => <Route key={i} path={v.path} element={v.element} />)}
                </Routes>
              </div>
            </div>
          </div>

          {isSidebarOpen && window.innerWidth <= 800 && (
            <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
          )}
        </div>
      </AlarmProvider>
      }
    </>
  );
}

export default App;
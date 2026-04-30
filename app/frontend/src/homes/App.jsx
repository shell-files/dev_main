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
import Headernav from "@components/HeaderNav.jsx"
import Sidebarnav from "@components/SidebarNav.jsx"
import Alarm from "@components/Alarm.jsx"
import "@styles/mains.css";
import CompanySelect from "@logins/CompanySelect.jsx"


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
    { path: "/main/onboarding", element: <Onboarding />},
    { path: "main/*", element: <NotFound /> },
  ]
  const [ isNav, setIsNav ] = useState(true);
  const location = useLocation();
  useEffect(()=>{
    setIsNav(location.pathname.includes("/main"))
  }, [location.pathname])
  return (
    <>
      { !isNav && 
        <Routes>
          {paths1?.map((v, i) => <Route key={i} path={v.path} element={v.element} />)}
        </Routes>
      }
      { isNav &&
      <AlarmProvider>
        <div id="main_page">
          <div className="main-layout">
            <Headernav />
            <div className="content_box">
              <Sidebarnav />
              <div className="main_right_box">
                <Alarm />
                <Routes>
                  {paths2?.map((v, i) => <Route key={i} path={v.path} element={v.element} />)}
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </AlarmProvider>
      }
    </>

  )
}

export default App

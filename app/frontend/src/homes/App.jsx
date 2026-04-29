import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";
import '@styles/App.css'
import NotFound from '@errors/NotFound.jsx'
import Gate from '@gates/Gate.jsx'
import Login from '@logins/Login.jsx'
import Signup from '@logins/SignUp.jsx'
import Main from '@mains/Main.jsx'
import Dashboard from '@mains/Dashboard.jsx'
import Headernav from "@components/HeaderNav.jsx"
import Sidebarnav from "@components/SidebarNav.jsx"
import "@styles/mains.css";


function App() {
  const paths1 = [
      { path: "/", element: <Gate /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "*", element: <NotFound /> },
  ]
  const paths2 = [
    { path: "/main", element: <Main /> },
    { path: "/main/dashboard", element: <Dashboard />},
    { path: "main/*", element: <NotFound /> },
  ]
  const [ isNav, setIsNav ] = useState(true);
  const location = useLocation();
  useEffect(()=>{
    setIsNav(location.pathname.includes("/main"))
  }, [])
  return (
    <>
      { !isNav && 
        <Routes>
          {paths1?.map((v, i) => <Route key={i} path={v.path} element={v.element} />)}
        </Routes>
      }
      { isNav &&
        <div id="main_page">
          <div className="main-layout">
            <Headernav />
            <div className="content_box">
              <Sidebarnav />
              <div className="main_right_box" style={{ padding: "20px" }}>
                <Routes>
                  {paths2?.map((v, i) => <Route key={i} path={v.path} element={v.element} />)}
                </Routes>
              </div>
            </div>
          </div>
        </div>
      }
    </>

  )
}

export default App

import { Routes, Route } from "react-router";
import '@styles/App.css'
import NotFound from '@errors/NotFound.jsx'
import Gate from '@gates/Gate.jsx'
import Login from '@logins/Login.jsx'
import Signup from '@logins/SignUp.jsx'


function App() {
   const paths = [
    {path: "/", element: <Gate />},
    {path: "/login", element: <Login />},
    {path: "/signup", element: <Signup />},
    {path: "*", element: <NotFound />},
  ]
  return (
    <>
      <Routes>
        { paths?.map((v, i) => <Route key={i} path={v.path} element={v.element} />) }
      </Routes>
    </>
  )
}

export default App

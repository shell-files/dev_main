import { Routes, Route } from "react-router";
import '@styles/App.css'
import NotFound from '@pages/NotFound.jsx'
import Home from '@pages/Home.jsx'

function App() {
   const paths = [
    {path: "/", element: <Home />},
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

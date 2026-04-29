import { useNavigate } from "react-router"

const sidebarnav= () => {

    const navigate = useNavigate()

    return(
        <>
        <aside className="sidebar">
        <div className="logo-placeholder">로고</div>
        
        <nav className="nav-group">
            <div className="nav-title">프로젝트 목록</div>
            <div className="nav-item" >데이터입력</div>
            <div className="nav-item" onClick={()=>navigate("/skm")} >1팀 (SKM)</div>
            <div className="nav-item">2팀 (HG)</div>
            <div className="nav-item">3팀 (TV)</div>
        </nav>

        <nav className="nav-group">
            <div className="nav-item" onclick="location.href='404.html'">404</div>
            <div className="nav-item" onclick="location.href='log.html'">로그 확인</div>
            <div className="nav-item">ESG 담당자 페이지</div>
            <div className="nav-item sub-item" onclick="location.href='manager.html'">└ 관리페이지</div>
            <div className="nav-item sub-item" onclick="location.href='invite.html'">└ 초대페이지</div>
        </nav>

        <div className="sidebar-footer">
            <select className="company-select">
                <option>SKM</option>
                <option>HG</option>
                <option>TV</option>
            </select>
            <input type="text" className="company-search" placeholder="회사 검색..."/>
        </div>
    </aside>
        </>
    )

}

export default sidebarnav
import { useState } from "react";
import { useNavigate } from "react-router";

const Sidebarnav = () => { // 컴포넌트 이름은 대문자로 시작하는 것이 관례입니다.
    const navigate = useNavigate();

    // 1. 데이터 및 검색어 상태 관리
    const [searchTerm, setSearchTerm] = useState("");
    const companies = [
        { id: "SKM", name: "SKM" },
        { id: "HG", name: "HG" },
        { id: "TV", name: "TV" },
        { id: "GOOGLE", name: "Google" }, // 예시 데이터 추가
    ];

    return(
        <>
        <aside className="sidebar">
        <div className="sidebar-header">
            <div className="sidebar-title">W.I.T.H</div>
            <div className="sidebar-subtitle">we are IT hero!</div>
        </div>
        <nav className="nav-group">
            <div className="nav-title">프로젝트 목록</div>
            <div className="nav-item" >데이터입력</div>
            <div className="nav-item" onClick={()=>navigate("/skm")} >1팀 (SKM)</div>
            <div className="nav-item">2팀 (HG)</div>
            <div className="nav-item">3팀 (TV)</div>
        </nav>
    // 2. 검색어에 필터링된 데이터 계산
    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <aside className="sidebar">
            <div className="logo-placeholder">로고</div>
            
            <nav className="nav-group">
                <div className="nav-title">프로젝트 목록</div>
                <div className="nav-item">데이터입력</div>
                <div className="nav-item" onClick={() => navigate("/skm")}>1팀 (SKM)</div>
                <div className="nav-item">2팀 (HG)</div>
                <div className="nav-item">3팀 (TV)</div>
            </nav>

            <nav className="nav-group">
                <div className="nav-item" onClick={() => navigate('/404')}>404</div>
                <div className="nav-item" onClick={() => navigate('/log')}>로그 확인</div>
                <div className="nav-item">ESG 담당자 페이지</div>
                <div className="nav-item sub-item" onClick={() => navigate('/manager')}>└ 관리페이지</div>
                <div className="nav-item sub-item" onClick={() => navigate('/invite')}>└ 초대페이지</div>
            </nav>

            <div className="sidebar-footer">
                {/* 3. Input과 searchTerm 상태 연결 */}
                <input 
                    type="text" 
                    className="company-search" 
                    placeholder="회사 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* 4. 필터링된 결과로 Select Option 렌더링 */}
                <select className="company-select">
                    {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))
                    ) : (
                        <option disabled>결과 없음</option>
                    )}
                </select>
            </div>
        </aside>
    );
}

export default Sidebarnav;
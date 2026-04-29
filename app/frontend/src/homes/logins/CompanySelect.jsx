import { useState } from "react";
import { useNavigate } from "react-router"; // react-router-dom 버전 6 기준
import "@styles/company.css"

const CompanySelect = () => {
  const navigate = useNavigate();

  // 1. 데이터와 상태 관리
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태
  const [selectedCompany, setSelectedCompany] = useState(""); // 선택된 회사 값 상태

  // 전체 회사 리스트 (보통 서버에서 받아오거나 상수로 관리)
  const companies = [
    { id: "google", name: "구글 (Google)" },
    { id: "naver", name: "네이버 (Naver)" },
    { id: "kakao", name: "카카오 (Kakao)" },
    { id: "samsung", name: "삼성전자 (Samsung)" },
    { id: "toss", name: "토스 (Toss)" },
  ];

  // 2. 검색어에 따라 필터링된 리스트 계산
  // 리액트에서는 상태가 변하면 컴포넌트가 재실행되므로, 변수로 선언만 해도 충분합니다.
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. 선택 완료 핸들러
  const handleSubmit = () => {
    if (!selectedCompany) {
      alert("회사를 먼저 선택해주세요!");
      return;
    }

    // 선택된 회사의 이름을 찾기
    const companyName = companies.find(c => c.id === selectedCompany)?.name;
    alert(`${companyName}이(가) 선택되었습니다.`);
    
    // 리액트 라우터를 이용한 페이지 이동
    navigate("/main"); 
  };

  return (
    <div id="select_company">
      <div className="select-container">
        <div className="select-code">회사 선택</div>
        
        {/* 검색 입력 창 */}
        <div className="input-group">
          <label htmlFor="search">회사명 검색</label>
          <input
            type="text"
            id="search"
            className="search-input"
            placeholder="회사 이름을 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // 입력할 때마다 상태 업데이트
          />
        </div>

        {/* 회사 선택 셀렉트 박스 */}
        <div className="input-group">
          <label htmlFor="companyList">회사 선택</label>
          <select
            id="companyList"
            className="company-select"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)} // 선택할 때마다 상태 업데이트
          >
            <option value="">회사를 선택해주세요</option>
            {filteredCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn-submit" onClick={handleSubmit}>
          선택 완료
        </button>
        
        <p className="info-text">목록에 회사가 없다면 관리자에게 문의하세요.</p>
      </div>
    </div>
  );
};

export default CompanySelect;
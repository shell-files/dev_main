import React, { useState } from 'react';
import "@styles/invite.css"


const Invite = () => {
  // 상태 관리 예시 (이메일 칩 기능 등)
  const [emails1, setEmails1] = useState([]);
  const [emails2, setEmails2] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Company');
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [issueEmail, setIssueEmail] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);

  // 이메일 검증 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const esgCategories = [
    "Climate", "Energy", "Water", "Pollution", "Circularity", "Biodiversity", "Product_env", "Supply Chain_env", "Sustainable investment",
    "Labor", "Safety", "Talent", "Diversity", "Human Rights", "Supply Chain_social", "Community", "Product_resp", "Privacy",
    "Governance", "Risk", "Compliance", "Ethics", "Business Conduct", "Data Governance"
  ];


  const refreshEmail = () => {
    setEmail1(""); 
    setEmails1([]);
    setEmail2(""); 
    setEmails2([]);
  }


  // 이메일 입력
  const inputEmail1 = (e) => {
    e.preventDefault()
    if (!email1.trim() || !emailRegex.test(email1.trim())){
      alert("이메일을 확인해주세요")
      return;
    }
    setEmails1([...emails1,email1])
    setEmail1("")
  }
  const inputEmail2 = (e) => {
    e.preventDefault()
    if (!email2.trim() || !emailRegex.test(email2.trim())){
      alert("이메일을 확인해주세요")
      return;
    }
    setEmails2([...emails2,email2])
    setEmail2("")
  }

  const inviteCompany = (e)=> {
    e.preventDefault()
    console.log(emails1)
  }

  const roleRequest = (e) => {
    e.preventDefault()
    console.log(emails2)
  }

  const inviteConsultant = (e) => {
    e.preventDefault()
    console.log(emails1)
  }

  const inviteEmployee = (e) => {
    e.preventDefault()
    console.log(emails1)
  }

  const inputIssueEmail = (e) => {
    e.preventDefault();

    // 1. 빈 값 입력 방지 (선택 사항이지만 권장)
    if (!email1.trim() || !emailRegex.test(email1.trim())){
      alert("이메일을 확인해주세요")
      return;
    }
    if (selectedCategories.length == 0) {
      alert("이슈를 선택해주세요")  
      return
    };


    // 2. 함수형 업데이트로 안전하게 추가
    setEmails1((prev) => [
      ...prev,
      { 
        email: email1, 
        issue: [...selectedCategories] // 배열을 복사해서 넣는 것이 안전합니다.
      }
    ]);

    // 3. 입력창 및 체크박스 초기화 (다음 입력을 위해)
    setEmail1(""); 
    setSelectedCategories([]); // 이메일 한 명 넣을 때마다 체크박스도 비우고 싶다면 추가
  };


  return (
    <main id="invite-page-root" className="content-body">
      <div className="invite-section">
        <div className="section-header">
          <h1>팀원 초대 관리</h1>
          <p className="description">프로젝트를 함께 운영할 팀원을 초대하고 적절한 권한을 부여하세요.</p>
        </div>

        {/* 권한 선택 그리드 */}
        <div className="role-grid">
          <div 
            className={`role-card ${selectedRole === 'Company' ? 'selected' : ''}`}
            onClick={() => {setSelectedRole('Company'); refreshEmail();}}
          >
            <h3>Company</h3>
            <p>시스템 설정 및 팀원 관리, 모든 데이터에 접근 가능합니다.</p>
          </div>
          <div 
            className={`role-card ${selectedRole === 'Consultant' ? 'selected' : ''}`}
            onClick={() => {setSelectedRole('Consultant'); refreshEmail();}}
          >
            <h3>Consultant</h3>
            <p>ESG 데이터를 입력하고 보고서를 관리하며 초대 할 수 있습니다.</p>
          </div>
          <div 
            className={`role-card ${selectedRole === 'Employee' ? 'selected' : ''}`}
            onClick={() => {setSelectedRole('Employee'); refreshEmail();}}
          >
            <h3>Employee</h3>
            <p>데이터 조회 및 입력만 가능합니다.</p>
          </div>
        </div>

        {/* 초대 폼 */}
        {/* 협력사 초대 */}
          {
          selectedRole == "Company" &&
          <div className="invite-form-card" style={{ display: "flex", gap: "24px" }}>
            {/* 왼쪽 섹션 */}
            <div className="invite_company_left" style={{ flex: 1, minWidth: 0 }}>
              <label className="form-label">협력사 초대</label>
              <div className="chip-input-container">
                <div className='email_list' style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {emails1.map((email, index) => (
                    <div 
                      key={index} 
                      className="email-chip" 
                      onClick={() => setEmails1(emails1.filter((_, i) => i !== index))}
                    >
                      {email} <span>×</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={inputEmail1} style={{ flex: 1, minWidth: "150px" }}>
                  <input 
                    type="text" 
                    value={email1 || ""} 
                    onChange={(e) => setEmail1(e.target.value)} 
                    style={{ width: "100%", border: "none", outline: "none" }} 
                    className="email-input" 
                    placeholder="이메일 입력 후 엔터" 
                  />
                </form>
              </div>
              <form onSubmit={inviteCompany} className="button-wrapper" style={{ marginTop: '12px', textAlign: 'right' }}>
                <button type='submit' className="btn-primary">초대장 발송</button>
              </form>
            </div>

            {/* 중앙 구분선 */}
            <div className="center_bar" style={{ width: "1px", backgroundColor: "#eee", alignSelf: "stretch" }}></div>

            {/* 오른쪽 섹션 */}
            <div className="invite_company_right" style={{ flex: 1, minWidth: 0 }}>
              <label className="form-label">협력 권한 요청</label>
              <div className="chip-input-container">
                <div className='email_list' style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {emails2.map((email, index) => (
                    <div 
                      key={index} 
                      className="email-chip"
                      onClick={() => setEmails2(emails2.filter((_, i) => i !== index))}
                    >
                      {email} <span>×</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={inputEmail2} style={{ flex: 1, minWidth: "150px" }}>
                  <input 
                    type="text" 
                    value={email2 || ""} 
                    onChange={(e) => setEmail2(e.target.value)} 
                    style={{ width: "100%", border: "none", outline: "none" }} 
                    className="email-input" 
                    placeholder="이메일 입력 후 엔터" 
                  />
                </form>
              </div>
              <form onSubmit={roleRequest} className="button-wrapper" style={{ marginTop: '12px', textAlign: 'right' }}>
                <button className="btn-primary">권한 요청 발송</button>
              </form>
            </div>
          </div>
          }
          {/* 컨설턴트 초대 */}
          {
          selectedRole == "Consultant" &&
            <div className="invite-form-card" style={{ display: "flex", gap: "24px" }}>
              {/* 왼쪽 섹션 */}
              <div className="invite_company_left" style={{ flex: 1, minWidth: 0 }}>
                <label className="form-label">컨설턴트 초대</label>
                <div className="chip-input-container">
                  <div className='email_list' style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {emails1.map((email, index) => (
                      <div 
                        key={index} 
                        className="email-chip" 
                        onClick={() => setEmails1(emails1.filter((_, i) => i !== index))}
                      >
                        {email} <span>×</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={inputEmail1} style={{ flex: 1, minWidth: "150px" }}>
                    <input 
                      type="text" 
                      value={email1 || ""} 
                      onChange={(e) => setEmail1(e.target.value)} 
                      style={{ width: "100%", border: "none", outline: "none" }} 
                      className="email-input" 
                      placeholder="이메일 입력 후 엔터" 
                    />
                  </form>
                </div>
                <form onSubmit={inviteConsultant} className="button-wrapper" style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button type='submit' className="btn-primary">초대장 발송</button>
                </form>
              </div>
            </div>
          }

          {/* 직원 초대 */}
          {selectedRole === "Employee" && (
            <div className="invite-form-card" style={{ display: "flex", gap: "24px", alignItems: "stretch" }}>
              
              {/* 왼쪽 섹션: 체크박스 리스트 */}
              <div className="invite_company_left" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <label className="form-label">요청 카테고리 (중복 선택 가능)</label>
                <div 
                  className="checkbox-group-container" 
                  style={{ 
                    border: "1px solid #ddd", 
                    borderRadius: "8px", 
                    padding: "15px", 
                    height: "200px",      /* 높이 고정 */
                    overflowY: "auto",    /* 내용 많으면 스크롤 */
                    backgroundColor: "#fafafa"
                  }}
                >
                  {esgCategories.map((item, idx) => (
                    <label 
                      key={idx} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        marginBottom: "10px", 
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(item)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, item]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== item));
                          }
                        }}
                        style={{ marginRight: "10px", accentColor: "#03a94d", width: "16px", height: "16px" }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* 중앙 구분선 */}
              <div className="center_bar" style={{ width: "1px", backgroundColor: "#eee" }}></div>

              {/* 오른쪽 섹션: 이메일 칩 입력 */}
              <div className="invite_company_right" style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <label className="form-label">직원 회원 가입 초대 (이메일)</label>
                <div className="chip-input-container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div className='email_list' style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {emails1.map((email, index) => (
                      <div 
                        key={index} 
                        className="email-chip"
                        onClick={() => setEmails1(emails1.filter((_, i) => i !== index))}
                      >
                        {email.email} / {email.issue.join(", ")} <span>×</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={inputIssueEmail} style={{ width: "100%" }}>
                    <input 
                      type="text" 
                      value={email1 || ""} 
                      onChange={(e) => setEmail1(e.target.value)} 
                      style={{ width: "100%", border: "none", outline: "none", marginTop: "10px" }} 
                      className="email-input" 
                      placeholder="이메일 입력 후 엔터" 
                    />
                  </form>
                </div>
                
                <form onSubmit={inviteEmployee} className="button-wrapper" style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button 
                    type='submit'
                    className="btn-primary"
                    style={{ width: "160px" }}
                  >
                    권한 요청 발송
                  </button>
                </form>
              </div>
            </div>
          )}
        {/* 최근 내역 테이블 */}
        <div className="history-container">
          <div className="history-header">최근 초대 내역</div>
          <table className="history-table">
            <thead>
              <tr>
                <th>대상 이메일</th>
                <th>권한</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>member1@gmail.com</td>
                <td>Manager</td>
                <td><span className="status-badge">초대 대기중</span></td>
                <td><button className="btn-resend">재발송</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Invite;
import React, { useState } from 'react';
import "@styles/invite.css";

const Invite = () => {
  const [emails1, setEmails1] = useState([]);
  const [emails2, setEmails2] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Company');
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

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
  };

  const inputEmail1 = (e) => {
    e.preventDefault();
    if (!email1.trim() || !emailRegex.test(email1.trim())){
      alert("이메일을 확인해주세요");
      return;
    }
    setEmails1([...emails1, email1]);
    setEmail1("");
  };

  const inputEmail2 = (e) => {
    e.preventDefault();
    if (!email2.trim() || !emailRegex.test(email2.trim())){
      alert("이메일을 확인해주세요");
      return;
    }
    setEmails2([...emails2, email2]);
    setEmail2("");
  };

  const inviteCompany = (e)=> {
    e.preventDefault();
    console.log(emails1);
  };

  const roleRequest = (e) => {
    e.preventDefault();
    console.log(emails2);
  };

  const inviteConsultant = (e) => {
    e.preventDefault();
    console.log(emails1);
  };

  const inviteEmployee = (e) => {
    e.preventDefault();
    console.log(emails1);
  };

  const inputIssueEmail = (e) => {
    e.preventDefault();
    if (!email1.trim() || !emailRegex.test(email1.trim())){
      alert("이메일을 확인해주세요");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("이슈를 선택해주세요");
      return;
    }

    setEmails1((prev) => [
      ...prev,
      { 
        email: email1, 
        issue: [...selectedCategories]
      }
    ]);

    setEmail1(""); 
    setSelectedCategories([]);
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

        {/* 1. 협력사 초대 */}
        {selectedRole === "Company" && (
          <div className="invite-form-card">
            {/* 왼쪽 섹션 */}
            <div className="invite_company_left">
              <label className="form-label">협력사 초대</label>
              <div className="chip-input-container">
                <div className='email_list'>
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
                <form onSubmit={inputEmail1} className="email-form">
                  <input 
                    type="text" 
                    value={email1 || ""} 
                    onChange={(e) => setEmail1(e.target.value)} 
                    className="email-input" 
                    placeholder="이메일 입력 후 엔터" 
                  />
                </form>
              </div>
              <form onSubmit={inviteCompany} className="button-wrapper">
                <button type='submit' className="btn-primary">초대장 발송</button>
              </form>
            </div>

            {/* 중앙 구분선 */}
            <div className="center_bar"></div>

            {/* 오른쪽 섹션 */}
            <div className="invite_company_right">
              <label className="form-label">협력 권한 요청</label>
              <div className="chip-input-container">
                <div className='email_list'>
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
                <form onSubmit={inputEmail2} className="email-form">
                  <input 
                    type="text" 
                    value={email2 || ""} 
                    onChange={(e) => setEmail2(e.target.value)} 
                    className="email-input" 
                    placeholder="이메일 입력 후 엔터" 
                  />
                </form>
              </div>
              <form onSubmit={roleRequest} className="button-wrapper">
                <button className="btn-primary">권한 요청 발송</button>
              </form>
            </div>
          </div>
        )}

        {/* 2. 컨설턴트 초대 */}
        {selectedRole === "Consultant" && (
          <div className="invite-form-card single-section">
            <div className="invite_company_left">
              <label className="form-label">컨설턴트 초대</label>
              <div className="chip-input-container">
                <div className='email_list'>
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
                <form onSubmit={inputEmail1} className="email-form">
                  <input 
                    type="text" 
                    value={email1 || ""} 
                    onChange={(e) => setEmail1(e.target.value)} 
                    className="email-input" 
                    placeholder="이메일 입력 후 엔터" 
                  />
                </form>
              </div>
              <form onSubmit={inviteConsultant} className="button-wrapper">
                <button type='submit' className="btn-primary">초대장 발송</button>
              </form>
            </div>
          </div>
        )}

        {/* 3. 직원 초대 */}
        {selectedRole === "Employee" && (
          <div className="invite-form-card employee-grid">
            
            {/* 왼쪽 섹션: 체크박스 리스트 */}
            <div className="invite_company_left category-section">
              <label className="form-label">요청 카테고리 (중복 선택 가능)</label>
              <div className="checkbox-group-container">
                {esgCategories.map((item, idx) => (
                  <label key={idx} className="category-checkbox-label">
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
                      className="category-checkbox"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            {/* 중앙 구분선 */}
            <div className="center_bar"></div>

            {/* 오른쪽 섹션: 이메일 칩 입력 */}
            <div className="invite_company_right email-section">
              <label className="form-label">직원 회원 가입 초대 (이메일)</label>
              <div className="chip-input-container">
                <div className='email_list'>
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
                <form onSubmit={inputIssueEmail} className="email-form">
                  <input 
                    type="text" 
                    value={email1 || ""} 
                    onChange={(e) => setEmail1(e.target.value)} 
                    className="email-input" 
                    placeholder="이메일 입력 후 엔터" 
                  />
                </form>
              </div>
              
              <form onSubmit={inviteEmployee} className="button-wrapper">
                <button type='submit' className="btn-primary">
                  권한 요청 발송
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 최근 내역 테이블 */}
        <div className="history-container">
          <div className="history-header">최근 초대 내역</div>
          <div className="table-responsive">
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
      </div>
    </main>
  );
};

export default Invite;
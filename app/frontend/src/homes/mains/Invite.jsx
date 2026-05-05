import React, { useState } from 'react';
import "@styles/invite.css";

const Invite = () => {
  // --- 기존 상태 ---
  const [emails1, setEmails1] = useState([]);
  const [emails2, setEmails2] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Company');
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  // --- 탭 & 페이지네이션 상태 ---
  const [activeTab, setActiveTab] = useState('company'); 
  const [historyPage, setHistoryPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1);
  
  const itemsPerPage = 5;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const esgCategories = [
    "Climate", "Energy", "Water", "Pollution", "Circularity", "Biodiversity", "Product_env", "Supply Chain_env", "Sustainable investment",
    "Labor", "Safety", "Talent", "Diversity", "Human Rights", "Supply Chain_social", "Community", "Product_resp", "Privacy",
    "Governance", "Risk", "Compliance", "Ethics", "Business Conduct", "Data Governance"
  ];

  // --- 최근 초대 내역 ---
  const [invitationHistory] = useState([
    { id: 1, email: "member1@gmail.com", role: "Manager", status: "대기중" },
    { id: 2, email: "consult1@naver.com", role: "Consultant", status: "만료" },
    { id: 3, email: "worker1@company.com", role: "Employee", status: "대기중" }
  ]);

  // --- 권한 요청 승인 대기 ---
  const [approvalList, setApprovalList] = useState([
    { id: 1, email: "req1@partner.com", currentRole: "Guest", requestedRole: "Company", requestDate: "2026-05-01" },
    { id: 2, email: "req2@partner.com", currentRole: "Guest", requestedRole: "Company", requestDate: "2026-05-03" }
  ]);

  // --- 구성원 목록 데이터 구조 (협력사 탭에 '관계' 데이터 추가) ---
  const [members] = useState({
    company: [
      { id: 1, companyName: "그린테크", email: "partner1@supply.com", date: "2026-03-20", relation: "원청-협력" }
    ],
    consultant: [
      { id: 1, name: "김컨설", email: "consult1@naver.com", phone: "010-1234-5678", date: "2026-01-15" }
    ],
    employee: [
      { id: 1, name: "이직원", email: "worker1@company.com", position: "ESG팀", date: "2026-02-01" }
    ]
  });

  const refreshEmail = () => {
    setEmail1(""); 
    setEmails1([]);
    setEmail2(""); 
    setEmails2([]);
  };

  // --- 핸들러 함수들 ---
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

  const inviteCompany = (e)=> { e.preventDefault(); console.log(emails1); };
  const roleRequest = (e) => { e.preventDefault(); console.log(emails2); };
  const inviteConsultant = (e) => { e.preventDefault(); console.log(emails1); };
  const inviteEmployee = (e) => { e.preventDefault(); console.log(emails1); };

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
    setEmails1((prev) => [...prev, { email: email1, issue: [...selectedCategories] }]);
    setEmail1(""); 
    setSelectedCategories([]);
  };

  const handleApprove = (id) => {
    alert("권한 요청을 승인했습니다.");
    setApprovalList(approvalList.filter(item => item.id !== id));
  };

  const handleReject = (id) => {
    alert("권한 요청을 거절했습니다.");
    setApprovalList(approvalList.filter(item => item.id !== id));
  };

  const paginate = (data, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = (data) => Math.ceil(data.length / itemsPerPage) || 1;

  return (
    <main id="invite-page-root" className="content-body">
      <div className="invite-section">
        <div className="section-header">
          <h1>팀원 초대 관리</h1>
          <p className="description">프로젝트를 함께 운영할 팀원을 초대하고 적절한 권한을 부여하세요.</p>
        </div>

        {/* 1. 권한 선택 그리드 */}
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

        {/* 2. 초대 폼 영역 */}
        {selectedRole === "Company" && (
          <div className="invite-form-card">
            <div className="invite_company_left">
              <label className="form-label">협력사 초대</label>
              <div className="chip-input-container">
                <div className='email_list'>
                  {emails1.map((email, index) => (
                    <div key={index} className="email-chip" onClick={() => setEmails1(emails1.filter((_, i) => i !== index))}>
                      {email} <span>×</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={inputEmail1} className="email-form">
                  <input type="text" value={email1 || ""} onChange={(e) => setEmail1(e.target.value)} className="email-input" placeholder="이메일 입력 후 엔터" />
                </form>
              </div>
              <form onSubmit={inviteCompany} className="button-wrapper">
                <button type='submit' className="btn-primary">초대장 발송</button>
              </form>
            </div>
            <div className="center_bar"></div>
            <div className="invite_company_right">
              <label className="form-label">협력 권한 요청</label>
              <div className="chip-input-container">
                <div className='email_list'>
                  {emails2.map((email, index) => (
                    <div key={index} className="email-chip" onClick={() => setEmails2(emails2.filter((_, i) => i !== index))}>
                      {email} <span>×</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={inputEmail2} className="email-form">
                  <input type="text" value={email2 || ""} onChange={(e) => setEmail2(e.target.value)} className="email-input" placeholder="이메일 입력 후 엔터" />
                </form>
              </div>
              <form onSubmit={roleRequest} className="button-wrapper">
                <button className="btn-primary">권한 요청 발송</button>
              </form>
            </div>
          </div>
        )}

        {selectedRole === "Consultant" && (
          <div className="invite-form-card single-section">
            <div className="invite_company_left">
              <label className="form-label">컨설턴트 초대</label>
              <div className="chip-input-container">
                <div className='email_list'>
                  {emails1.map((email, index) => (
                    <div key={index} className="email-chip" onClick={() => setEmails1(emails1.filter((_, i) => i !== index))}>
                      {email} <span>×</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={inputEmail1} className="email-form">
                  <input type="text" value={email1 || ""} onChange={(e) => setEmail1(e.target.value)} className="email-input" placeholder="이메일 입력 후 엔터" />
                </form>
              </div>
              <form onSubmit={inviteConsultant} className="button-wrapper">
                <button type='submit' className="btn-primary">초대장 발송</button>
              </form>
            </div>
          </div>
        )}

        {selectedRole === "Employee" && (
          <div className="invite-form-card employee-grid">
            <div className="invite_company_left category-section">
              <label className="form-label">요청 카테고리 (중복 선택 가능)</label>
              <div className="checkbox-group-container">
                {esgCategories.map((item, idx) => (
                  <label key={idx} className="category-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCategories([...selectedCategories, item]);
                        else setSelectedCategories(selectedCategories.filter(c => c !== item));
                      }}
                      className="category-checkbox"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="center_bar"></div>
            <div className="invite_company_right email-section">
              <label className="form-label">직원 회원 가입 초대 (이메일)</label>
              <div className="chip-input-container">
                <div className='email_list'>
                  {emails1.map((email, index) => (
                    <div key={index} className="email-chip" onClick={() => setEmails1(emails1.filter((_, i) => i !== index))}>
                      {email.email} / {email.issue.join(", ")} <span>×</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={inputIssueEmail} className="email-form">
                  <input type="text" value={email1 || ""} onChange={(e) => setEmail1(e.target.value)} className="email-input" placeholder="이메일 입력 후 엔터" />
                </form>
              </div>
              <form onSubmit={inviteEmployee} className="button-wrapper">
                <button type='submit' className="btn-primary">권한 요청 발송</button>
              </form>
            </div>
          </div>
        )}

        {/* 3. 최근 초대 내역 & 권한 요청 승인 영역 */}
        <div className="management-dual-section">
          {/* 최근 초대 내역 테이블 */}
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
                  {paginate(invitationHistory, historyPage).map((item) => (
                    <tr key={item.id}>
                      <td>{item.email}</td>
                      <td>{item.role}</td>
                      <td>
                        <span className={`status-badge ${item.status === '만료' ? 'expired' : ''}`}>
                          {item.status}
                        </span>
                      </td>
                      <td><button className="btn-resend">재발송</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-wrapper">
              <button disabled={historyPage === 1} onClick={() => setHistoryPage(historyPage - 1)}>이전</button>
              <span>{historyPage} / {totalPages(invitationHistory)}</span>
              <button disabled={historyPage === totalPages(invitationHistory)} onClick={() => setHistoryPage(historyPage + 1)}>다음</button>
            </div>
          </div>

          {/* 권한 요청 승인 대기 */}
          <div className="history-container">
            <div className="history-header">권한 요청 승인 대기</div>
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>희망 권한</th>
                    <th>요청일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalList.length > 0 ? (
                    paginate(approvalList, approvalPage).map((item) => (
                      <tr key={item.id}>
                        <td>{item.email}</td>
                        <td><span className="role-badge">{item.requestedRole}</span></td>
                        <td>{item.requestDate}</td>
                        <td>
                          <div className="action-button-group">
                            <button className="btn-approve" onClick={() => handleApprove(item.id)}>승인</button>
                            <button className="btn-reject" onClick={() => handleReject(item.id)}>거절</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="empty-text">대기 중인 요청이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination-wrapper">
              <button disabled={approvalPage === 1} onClick={() => setApprovalPage(approvalPage - 1)}>이전</button>
              <span>{approvalPage} / {totalPages(approvalList)}</span>
              <button disabled={approvalPage === totalPages(approvalList)} onClick={() => setApprovalPage(approvalPage + 1)}>다음</button>
            </div>
          </div>
        </div>

        {/* 4. 구성원 목록 영역 */}
        <div className="history-container member-management-section">
          <div className="history-header with-tabs">
            <span>등록된 구성원 목록</span>
            <div className="member-tabs">
              <button className={activeTab === 'company' ? 'active' : ''} onClick={() => { setActiveTab('company'); setMemberPage(1); }}>
                협력사
              </button>
              <button className={activeTab === 'consultant' ? 'active' : ''} onClick={() => { setActiveTab('consultant'); setMemberPage(1); }}>
                컨설턴트
              </button>
              <button className={activeTab === 'employee' ? 'active' : ''} onClick={() => { setActiveTab('employee'); setMemberPage(1); }}>
                직원
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="history-table">
              <thead>
                {/* 탭별 고유 컬럼 정의 */}
                {activeTab === 'company' && (
                  <tr>
                    <th>회사명</th>
                    <th>이메일</th>
                    <th>관계</th>
                    <th>등록일</th>
                  </tr>
                )}
                {activeTab === 'consultant' && (
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>연락처</th>
                    <th>등록일</th>
                  </tr>
                )}
                {activeTab === 'employee' && (
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>소속 부서</th>
                    <th>등록일</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginate(members[activeTab], memberPage).map((m) => (
                  <tr key={m.id}>
                    {/* 협력사 전용 렌더링 (회사명, 이메일, 등록일, 관계) */}
                    {activeTab === 'company' && (
                      <>
                        <td>{m.companyName}</td>
                        <td>{m.email}</td>
                        <td>{m.relation}</td>
                        <td>{m.date}</td>
                      </>
                    )}
                    {/* 컨설턴트 전용 렌더링 */}
                    {activeTab === 'consultant' && (
                      <>
                        <td>{m.name}</td>
                        <td>{m.email}</td>
                        <td>{m.phone}</td>
                        <td>{m.date}</td>
                      </>
                    )}
                    {/* 직원 전용 렌더링 */}
                    {activeTab === 'employee' && (
                      <>
                        <td>{m.name}</td>
                        <td>{m.email}</td>
                        <td>{m.position}</td>
                        <td>{m.date}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-wrapper">
            <button disabled={memberPage === 1} onClick={() => setMemberPage(memberPage - 1)}>이전</button>
            <span>{memberPage} / {totalPages(members[activeTab])}</span>
            <button disabled={memberPage === totalPages(members[activeTab])} onClick={() => setMemberPage(memberPage + 1)}>다음</button>
          </div>
        </div>

      </div>
    </main>
  );
};

export default Invite;
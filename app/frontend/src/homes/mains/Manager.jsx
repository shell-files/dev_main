import React, { useState, useEffect, useCallback } from 'react';
import '@styles/Manager.css'; 

// 23개 이상의 이슈 그룹 예시
const ALL_ISSUE_GROUPS = [
  "기업개요", "Climate", "Social", "Governance", "Ethics", "Waste", "Water", 
  "Energy", "Labor", "Human Rights", "Community", "Product Safety", "Tax",
  "Biodiversity", "Supply Chain", "Diversity", "Data Privacy", "Anti-Corruption",
  "Safety", "Circular Economy", "Greenhouse Gas", "Air Quality", "ESG Strategy"
];

const Manager = () => {
  const [users, setUsers] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 검색 및 필터
  const [userSearch, setUserSearch] = useState("");
  const [dataSearch, setDataSearch] = useState("");

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = () => {
    setLoading(true);
    // 실제 환경에선 API 호출 
    setUsers([
        { id: "U001", name: "이채훈", dept: "IT전략팀", groups: ["기업개요", "Climate"] },
        { id: "U002", name: "이정빈", dept: "ESG경영팀", groups: ["Social"] },
        { id: "U003", name: "이나라", dept: "ESG경영팀", groups: ["Social"] },
    ]);
    setInputs([
        { id: "INP-01", q_id: "Q-101", q_name: "에너지 사용량", group: "Climate", val: "450kWh", u_id: "U001", status: "pending" },
    ]);
    setLoading(false);
  };

  // 모달 열기
  const openGroupModal = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // 이슈 그룹 추가/삭제 (중복 방지 및 최소 1개 유지)
  const toggleGroup = (groupName) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const hasGroup = u.groups.includes(groupName);
        let newGroups;
        if (hasGroup) {
          newGroups = u.groups.filter(g => g !== groupName);
          if (newGroups.length === 0) return u; // 최소 1개 유지
        } else {
          newGroups = [...u.groups, groupName]; // 중복은 UI에서 원천 차단됨
        }
        const updatedUser = { ...u, groups: newGroups };
        setCurrentUser(updatedUser); // 모달 실시간 반영
        return updatedUser;
      }
      return u;
    }));
  };

  const kpi = {
    approved: inputs.filter(i => i.status === 'approved').length,
    pending: inputs.filter(i => i.status === 'pending').length,
    rejected: inputs.filter(i => i.status === 'rejected').length
  };

  return (
    <div className="admin-page-container">
      <header className="admin-header">
        <h2>ESG 통합 관리 시스템</h2>
        <button className="btn-refresh" onClick={fetchInitialData}>데이터 새로고침 🔄</button>
      </header>

      {/* KPI 섹션 */}
      <section className="kpi-section">
        <div className="kpi-card approved"><span>승인완료</span><strong>{kpi.approved}</strong></div>
        <div className="kpi-card pending"><span>승인대기</span><strong>{kpi.pending}</strong></div>
        <div className="kpi-card rejected"><span>반려됨</span><strong>{kpi.rejected}</strong></div>
      </section>

      <div className="admin-grid">
        {/* [구역 1] 유저 권한 관리 */}
        <section className="admin-card">
          <h3>👥 사원 권한 관리</h3>
          <input className="search-bar" placeholder="사원명 검색..." onChange={(e) => setUserSearch(e.target.value)} />
          <table className="admin-table">
            <thead>
              <tr><th>사원명</th><th>권한 상태</th><th>관리</th></tr>
            </thead>
            <tbody>
              {users.filter(u => u.name.includes(userSearch)).map(u => (
                <tr key={u.id}>
                  <td>{u.name}<br/><small>{u.dept}</small></td>
                  <td><span className="group-count">이슈 {u.groups.length}개 할당됨</span></td>
                  <td>
                    <button className="btn-manage" onClick={() => openGroupModal(u)}>이슈 그룹 관리</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* [구역 2] 데이터 승인 */}
        <section className="admin-card">
          <h3>📝 데이터 검토 내역</h3>
          <input className="search-bar" placeholder="항목 검색..." onChange={(e) => setDataSearch(e.target.value)} />
          <table className="admin-table">
            <thead>
              <tr><th>항목</th><th>데이터</th><th>입력자</th><th>결정</th></tr>
            </thead>
            <tbody>
              {inputs.filter(i => i.q_name.includes(dataSearch)).map(item => (
                <tr key={item.id}>
                  <td>{item.q_name}</td>
                  <td className="data-val">{item.val}</td>
                  <td>{users.find(u => u.id === item.u_id)?.name}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-app">승인</button>
                      <button className="btn-rej">반려</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* 이슈 그룹 관리 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>[{currentUser?.name}] 이슈 그룹 설정</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="group-label">현재 할당된 그룹 (클릭 시 제거)</div>
              <div className="tag-container active-tags">
                {currentUser?.groups.map(g => (
                  <button key={g} className="tag assigned" onClick={() => toggleGroup(g)}>{g} ✕</button>
                ))}
              </div>

              <div className="group-label" style={{ marginTop: '20px' }}>추가 가능한 그룹</div>
              <div className="tag-container available-tags">
                {ALL_ISSUE_GROUPS.filter(g => !currentUser?.groups.includes(g)).map(g => (
                  <button key={g} className="tag unassigned" onClick={() => toggleGroup(g)}>+ {g}</button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-save-confirm" onClick={() => setIsModalOpen(false)}>설정 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manager;
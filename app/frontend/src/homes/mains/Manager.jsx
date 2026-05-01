import React, { useState, useEffect, useCallback } from 'react';
import '@styles/Manager.css';

/**
 * [CONSTANTS]
 * 이슈 그룹 카테고리 매핑 및 전체 리스트
 */
const CATEGORY_MAP = {
  general: ["기업개요", "ESG Strategy", "Tax", "Anti-Corruption"],
  environmental: ["Climate", "Waste", "Water", "Energy", "Biodiversity", "Greenhouse Gas", "Air Quality", "Circular Economy"],
  social: ["Social", "Labor", "Human Rights", "Community", "Product Safety", "Diversity", "Safety", "Data Privacy"],
  governance: ["Governance", "Ethics"]
};

const ALL_ISSUE_GROUPS = [
  "기업개요", "Climate", "Social", "Governance", "Ethics", "Waste", "Water", "Energy",
  "Labor", "Human Rights", "Community", "Product Safety", "Tax", "Biodiversity",
  "Supply Chain", "Diversity", "Data Privacy", "Anti-Corruption", "Safety",
  "Circular Economy", "Greenhouse Gas", "Air Quality", "ESG Strategy"
];

const PAGE_SIZE = 10;

const Manager = () => {
  // 1. [AUTH] 로컬 스토리지 정보 (페이지 진입 시 확인)
  const [authInfo] = useState({
    uuid: localStorage.getItem('uuid') || 'guest-uuid',
    companyId: localStorage.getItem('companyId') || 'guest-company'
  });

  // 2. [STATE] 데이터 및 유저 관리
  const [users, setUsers] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('user'); // 'user' 또는 'data'

  // 3. [FILTER & PAGINATION]
  const [activeDataCategory, setActiveDataCategory] = useState('all'); // 전체, 경영일반, E, S, G
  const [statusFilter, setStatusFilter] = useState('all'); // KPI용 상태 필터
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dataPage, setDataPage] = useState(1);

  // 4. [MODAL] 유저 이슈 그룹 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * [API SIMULATION] 데이터 로드 로직
   * 로컬 스토리지의 uuid와 companyId를 포함하여 백엔드에 요청한다고 가정합니다.
   */
  const fetchData = useCallback(async () => {
    console.log("DB 호출 중... 인증 정보:", authInfo);
    
    // 실제 환경: const res = await axios.post('/api/data', { ...authInfo });
    // Mock 데이터 세팅 (상태값: pending, approved, rejected, writing)
    const mockInputs = [
      { id: "INP-001", group: "Climate", q_name: "에너지 사용량", val: "450kWh", file: "bill_01.pdf", u_name: "이채훈", u_id: "U001", status: "pending" },
      { id: "INP-002", group: "Social", q_name: "임직원 봉사시간", val: "120h", file: null, u_name: "이정빈", u_id: "U002", status: "writing" },
      { id: "INP-003", group: "Tax", q_name: "법인세 납부액", val: "1.2억", file: "tax_report.zip", u_name: "이나라", u_id: "U003", status: "approved" },
      { id: "INP-004", group: "Governance", q_name: "이사회 출석률", val: "95%", file: "meeting_minutes.pdf", u_name: "이채훈", u_id: "U001", status: "rejected" },
      { id: "INP-005", group: "Waste", q_name: "폐기물 재활용량", val: "30t", file: "waste_log.xlsx", u_name: "이나라", u_id: "U003", status: "pending" },
    ];
    setInputs(mockInputs);

    const mockUsers = [
      { id: "U001", name: "이채훈", email: "chaehoon@skm.com", company: "SKM", tier: "1 Tier", groups: ["기업개요", "Climate", "Social"] },
      { id: "U002", name: "이정빈", email: "lee@gmail.com", company: "SKM", tier: "1 Tier", groups: ["Social"] },
      { id: "U003", name: "이나라", email: "nara@gmail.com", company: "TV", tier: "2 Tier", groups: ["Social", "Waste"] },
    ];
    setUsers(mockUsers);
  }, [authInfo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * [LOGIC] KPI 계산
   */
  const kpi = {
    approved: inputs.filter(i => i.status === 'approved').length,
    pending: inputs.filter(i => i.status === 'pending').length,
    rejected: inputs.filter(i => i.status === 'rejected').length
  };

  /**
   * [LOGIC] 액션 처리 (승인/반려/취소)
   * 백엔드로 JSON 형식의 데이터를 전송합니다.
   */
  const handleAction = (id, newStatus) => {
    const payload = {
      ...authInfo,
      targetId: id,
      updatedStatus: newStatus
    };
    console.log("백엔드 전송 JSON:", JSON.stringify(payload));
    
    setInputs(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  /**
   * [LOGIC] 유저 이슈 그룹 토글
   */
  const toggleGroup = (groupName) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const has = u.groups.includes(groupName);
        let newGroups = has ? u.groups.filter(g => g !== groupName) : [...u.groups, groupName];
        if (newGroups.length === 0) {
          alert("최소 하나의 그룹은 소속되어야 합니다.");
          return u;
        }
        const updatedUser = { ...u, groups: newGroups };
        setCurrentUser(updatedUser);
        return updatedUser;
      }
      return u;
    }));
  };

  /**
   * [LOGIC] 필터링 및 페이징 처리
   */
  // 유저 필터
  const filteredUsers = users.filter(u => u.name.includes(userSearch) || u.company.includes(userSearch));
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  // 데이터 필터 (카테고리 + KPI 상태)
  const getFilteredInputs = () => {
    let list = inputs;
    if (activeDataCategory !== 'all') {
      const targetGroups = CATEGORY_MAP[activeDataCategory];
      list = list.filter(item => targetGroups.includes(item.group));
    }
    if (statusFilter !== 'all') {
      list = list.filter(item => item.status === statusFilter);
    }
    return list;
  };

  const filteredInputs = getFilteredInputs();
  const pagedInputs = filteredInputs.slice((dataPage - 1) * PAGE_SIZE, dataPage * PAGE_SIZE);
  const totalDataPages = Math.ceil(filteredInputs.length / PAGE_SIZE);

  return (
    <div id="manager_page">
      <div className="manager-content-container">

        {/* 1. KPI 영역 */}
        <div className='kpi-container'>
          {[
            { key: 'approved', label: '승인 완료', count: kpi.approved, color: '#03a94d' },
            { key: 'pending', label: '승인 대기', count: kpi.pending, color: '#673AB7' },
            { key: 'rejected', label: '반려됨', count: kpi.rejected, color: '#dc3545' }
          ].map(item => (
            <div 
              key={item.key} 
              onClick={() => setStatusFilter(item.key === statusFilter ? 'all' : item.key)}
              className={`kpi-card ${statusFilter === item.key ? 'active' : ''}`}
              style={statusFilter === item.key ? { borderBottom: `4px solid ${item.color}` } : {}}
            >
              <div className='kpi-label'>{item.label}</div>
              <div className='kpi-value'>{item.count}</div>
            </div>
          ))}
        </div>

        {/* 2. 헤더 및 탭 */}
        <div className="page-header">
          <h2 className="page-title">ESG 통합 관리 시스템</h2>
          <div className="tab-group">
            <button className={`tab-item ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>유저 관리</button>
            <button className={`tab-item ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>데이터 승인</button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 유저 관리 탭 */}
        {/* ============================================================ */}
        {activeTab === 'user' && (
          <section className="fade-in">
            <div className="filter-bar">
              <input
                className="search-input"
                placeholder="사용자명 또는 회사명 검색"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <button className="btn-primary" onClick={fetchData}>조회</button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>사용자 정보</th>
                    <th>소속 회사</th>
                    <th>할당 이슈 그룹</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong><br />
                        <small>{u.email}</small>
                      </td>
                      <td>
                        {u.company} <span className="depth-tag">{u.tier}</span>
                      </td>
                      <td>
                        <div className="tag-container">
                          {u.groups.slice(0, 3).map(g => <span key={g} className="tag-item">{g}</span>)}
                          {u.groups.length > 3 && <span className="tag-item">+{u.groups.length - 3}</span>}
                        </div>
                      </td>
                      <td>
                        <button className="btn-outline" onClick={() => { setCurrentUser(u); setIsModalOpen(true); }}>
                          이슈 그룹 수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 데이터 승인 탭 */}
        {/* ============================================================ */}
        {activeTab === 'data' && (
          <section className="fade-in">
            <div className="data-control-row">
              <div className="category-tabs">
                <button className={activeDataCategory === 'all' ? 'active' : ''} onClick={() => setActiveDataCategory('all')}>전체</button>
                <button className={activeDataCategory === 'general' ? 'active' : ''} onClick={() => setActiveDataCategory('general')}>경영일반</button>
                <button className={activeDataCategory === 'environmental' ? 'active' : ''} onClick={() => setActiveDataCategory('environmental')}>E</button>
                <button className={activeDataCategory === 'social' ? 'active' : ''} onClick={() => setActiveDataCategory('social')}>S</button>
                <button className={activeDataCategory === 'governance' ? 'active' : ''} onClick={() => setActiveDataCategory('governance')}>G</button>
              </div>
              <button className="btn-refresh" onClick={fetchData}>데이터 새로고침 🔄</button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이슈 그룹</th>
                    <th>지표 항목</th>
                    <th>값</th>
                    <th>첨부파일</th>
                    <th>작성자</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedInputs.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td><span className="group-badge">{item.group}</span></td>
                      <td>{item.q_name}</td>
                      <td className="value-cell">{item.val}</td>
                      <td>
                        {item.file ? <a href={`#${item.file}`} className="file-link">📎 파일</a> : <span className="no-file">-</span>}
                      </td>
                      <td>{item.u_name}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'writing' && '작성 중'}
                          {item.status === 'pending' && '승인 대기'}
                          {item.status === 'approved' && '승인 완료'}
                          {item.status === 'rejected' && '반려됨'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          {item.status === 'pending' ? (
                            <>
                              <button className="btn-s btn-approve" onClick={() => handleAction(item.id, 'approved')}>승인</button>
                              <button className="btn-s btn-reject" onClick={() => handleAction(item.id, 'rejected')}>반려</button>
                            </>
                          ) : item.status !== 'writing' ? (
                            <button className="btn-s btn-undo" onClick={() => handleAction(item.id, 'pending')}>취소</button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='pagination'>
              {Array.from({ length: totalDataPages }).map((_, i) => (
                <button key={i} onClick={() => setDataPage(i + 1)} className={`page-btn ${dataPage === i + 1 ? 'active' : ''}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 모달: 이슈 그룹 관리 */}
        {/* ============================================================ */}
        {isModalOpen && currentUser && (
          <div className="modal-overlay">
            <div className="modal-window">
              <div className="modal-header">
                <h3>{currentUser.name} 권한 설정</h3>
                <button className="close-x" onClick={() => setIsModalOpen(false)}>×</button>
              </div>

              <div className="modal-body">
                <div className="modal-section">
                  <p className="section-label">현재 할당된 그룹 (클릭 시 제거)</p>
                  <div className="modal-tag-group">
                    {currentUser.groups.map(g => (
                      <button key={g} className="modal-tag assigned" onClick={() => toggleGroup(g)}>
                        {g} <span className="remove-icon">×</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-section">
                  <p className="section-label">추가 가능한 그룹 (클릭 시 추가)</p>
                  <div className="modal-tag-group">
                    {ALL_ISSUE_GROUPS
                      .filter(g => !currentUser.groups.includes(g))
                      .map(g => (
                        <button key={g} className="modal-tag unassigned" onClick={() => toggleGroup(g)}>
                          + {g}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-confirm" onClick={() => setIsModalOpen(false)}>설정 완료</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Manager;
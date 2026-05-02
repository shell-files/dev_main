import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@utils/network'; 
import '@styles/Manager.css';
import { showDefaultAlert, showConfirmAlert } from '@components/ServiceAlert/ServiceAlert';

/**
 * [CONFIG]
 * 👉 true: mock 데이터
 * 👉 false: 실제 API
 */
const USE_MOCK = true;

/**
 * [CONSTANTS]
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
  /**
   * 1. AUTH
   */
  const [authInfo] = useState({
    uuid: localStorage.getItem('uuid') || 'guest-uuid',
    companyId: localStorage.getItem('companyId') || 'guest-company'
  });

  /**
   * 2. STATE
   */
  const [users, setUsers] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');

  /**
   * 3. FILTER & PAGINATION
   */
  const [activeDataCategory, setActiveDataCategory] = useState('all'); 
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dataPage, setDataPage] = useState(1);

  /**
   * 4. MODAL
   */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * [FETCH DATA]
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let usersData = [];
      let inputsData = [];

      if (USE_MOCK) {
        // ---------------- MOCK ----------------
        await new Promise(resolve => setTimeout(resolve, 700));

        inputsData = [
          { id: "INP-001", group: "Climate", q_name: "에너지 사용량", val: "450kWh", file: "bill_01.pdf", u_name: "이채훈", u_id: "U001", status: "pending" },
          { id: "INP-002", group: "Social", q_name: "임직원 봉사시간", val: "120h", file: null, u_name: "이정빈", u_id: "U002", status: "rejected" },
          { id: "INP-003", group: "Tax", q_name: "법인세 납부액", val: "1.2억", file: "tax_report.zip", u_name: "이나라", u_id: "U003", status: "approved" },
          { id: "INP-004", group: "Governance", q_name: "이사회 출석률", val: "95%", file: "meeting_minutes.pdf", u_name: "이채훈", u_id: "U001", status: "rejected" },
          { id: "INP-005", group: "Waste", q_name: "폐기물 재활용량", val: "30t", file: "waste_log.xlsx", u_name: "이나라", u_id: "U003", status: "pending" },
        ];

        usersData = [
          { id: "U001", name: "이채훈", email: "chaehoon@skm.com", company: "SKM", tier: "1 Tier", groups: ["기업개요", "Climate", "Social"] },
          { id: "U002", name: "이정빈", email: "lee@gmail.com", company: "SKM", tier: "1 Tier", groups: ["Social"] },
          { id: "U003", name: "이나라", email: "nara@gmail.com", company: "TV", tier: "2 Tier", groups: ["Social", "Waste"] },
        ];

      } else {
        // ---------------- REAL API ----------------
        const res = await api.get('/api/manager/all-data', {
          params: authInfo
        });

        usersData = res.data.users;
        inputsData = res.data.inputs;
      }

      setUsers(usersData);
      setInputs(inputsData);

    } catch (err) {
      console.error(err);
      showDefaultAlert("데이터 오류", "데이터를 불러오는 중 문제가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [authInfo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * KPI
   */
  const kpi = {
    approved: inputs.filter(i => i.status === 'approved').length,
    pending: inputs.filter(i => i.status === 'pending').length,
    rejected: inputs.filter(i => i.status === 'rejected').length
  };

  /**
   * ACTION
   */
  const handleAction = async (id, newStatus) => {
    const actionName = newStatus === 'approved' ? '승인' : newStatus === 'rejected' ? '반려' : '취소';

    const isConfirmed = await showConfirmAlert(
      `${actionName} 확인`,
      `해당 항목을 정말로 ${actionName}하시겠습니까?`,
      newStatus === 'rejected' ? 'warning' : 'question'
    );

    if (!isConfirmed) return;

    setIsLoading(true);
    try {

      if (!USE_MOCK) {
        await api.post('/api/manager/action', {
          id,
          status: newStatus,
          ...authInfo
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setInputs(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

      showDefaultAlert("처리 완료", `정상적으로 ${actionName}되었습니다.`, "success");

    } catch (e) {
      showDefaultAlert("처리 실패", "통신 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * GROUP TOGGLE
   */
  const toggleGroup = (groupName) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const has = u.groups.includes(groupName);
        let newGroups = has ? u.groups.filter(g => g !== groupName) : [...u.groups, groupName];

        if (newGroups.length === 0) {
          showDefaultAlert("알림", "최소 하나의 그룹은 소속되어야 합니다.", "info");
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
   * FILTER
   */
  const filteredUsers = users.filter(u => u.name.includes(userSearch) || u.company.includes(userSearch));
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  const getFilteredInputs = () => {
    let list = inputs;

    if (activeDataCategory !== 'all') {
      list = list.filter(item => CATEGORY_MAP[activeDataCategory].includes(item.group));
    }
    if (activeSubCategory !== 'all') {
      list = list.filter(item => item.group === activeSubCategory);
    }
    if (statusFilter !== 'all') {
      list = list.filter(item => item.status === statusFilter);
    }

    return list;
  };

  const filteredInputs = getFilteredInputs();
  const pagedInputs = filteredInputs.slice((dataPage - 1) * PAGE_SIZE, dataPage * PAGE_SIZE);
  const totalDataPages = Math.ceil(filteredInputs.length / PAGE_SIZE);

  const handleMainCategoryChange = (category) => {
    setActiveDataCategory(category);
    setActiveSubCategory('all');
    setDataPage(1);
  };

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
              onClick={() => !isLoading && setStatusFilter(item.key === statusFilter ? 'all' : item.key)}
              className={`kpi-card ${statusFilter === item.key ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
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
            <button 
              className={`tab-item ${activeTab === 'user' ? 'active' : ''}`} 
              onClick={() => !isLoading && setActiveTab('user')}
              disabled={isLoading}
            >
              유저 관리
            </button>
            <button 
              className={`tab-item ${activeTab === 'data' ? 'active' : ''}`} 
              onClick={() => !isLoading && setActiveTab('data')}
              disabled={isLoading}
            >
              데이터 승인
            </button>
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
                disabled={isLoading}
              />
              <button className="btn-primary" onClick={fetchData} disabled={isLoading}>조회</button>
            </div>

            <div className="table-wrapper">
              {isLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>사용자 데이터를 불러오는 중...</p>
                </div>
              ) : pagedUsers.length === 0 ? (
                <div className="empty-container">
                  <div className="empty-icon">👥</div>
                  <p>조회된 사용자가 없습니다.</p>
                </div>
              ) : (
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
                        <td>{u.company} <span className="depth-tag">{u.tier}</span></td>
                        <td>
                          <div className="tag-container">
                            {u.groups.slice(0, 3).map(g => <span key={g} className="tag-item"> {g} </span>)}
                            {u.groups.length > 3 && <span className="tag-item">+{u.groups.length - 3}</span>}
                          </div>
                        </td>
                        <td>
                          <button className="btn-outline" onClick={() => { setCurrentUser(u); setIsModalOpen(true); }} disabled={isLoading}>
                            이슈 그룹 수정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 데이터 승인 탭 */}
        {/* ============================================================ */}
        {activeTab === 'data' && (
          <section className="fade-in">
            <div className="data-control-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div className="category-tabs">
                {['all', 'general', 'environmental', 'social', 'governance'].map(cat => (
                  <button 
                    key={cat}
                    className={activeDataCategory === cat ? 'active' : ''} 
                    onClick={() => handleMainCategoryChange(cat)}
                    disabled={isLoading}
                  >
                    {cat === 'all' ? '전체' : cat === 'general' ? '경영일반' : cat.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="btn-primary" onClick={fetchData} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "데이터 새로고침"}
              </button>
            </div>

            {/* 이슈 그룹 서브 탭 */}
            {activeDataCategory !== 'all' && (
              <div className="sub-category-tabs" style={{ display: 'flex', gap: '8px', margin: '0 0 15px 0', flexWrap: 'wrap' }}>
                <button 
                  className={`tag-item ${activeSubCategory === 'all' ? 'active' : ''}`} 
                  onClick={() => setActiveSubCategory('all')}
                  style={activeSubCategory === 'all' ? { backgroundColor: '#03a94d', color: '#fff' } : { cursor: 'pointer' }}
                >
                  전체 그룹
                </button>
                {CATEGORY_MAP[activeDataCategory].map(group => (
                  <button 
                    key={group} 
                    className={`tag-item ${activeSubCategory === group ? 'active' : ''}`} 
                    onClick={() => setActiveSubCategory(group)}
                    style={activeSubCategory === group ? { backgroundColor: '#03a94d', color: '#fff' } : { cursor: 'pointer' }}
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}

            <div className="table-wrapper">
              {isLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>데이터를 처리하고 있습니다...</p>
                </div>
              ) : pagedInputs.length === 0 ? (
                <div className="empty-container">
                  <div className="empty-icon">이미지 추가 예정</div>
                  <p>해당 조건에 맞는 데이터가 없습니다.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>이슈 그룹</th><th>지표 항목</th><th>값</th><th>첨부파일</th><th>작성자</th><th>상태</th><th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInputs.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td><span className="tag-item" style={{ backgroundColor: '#f1f3f5', color: '#333', border: 'none' }}>{item.group}</span></td>
                        <td>{item.q_name}</td>
                        <td className="value-cell"><strong>{item.val}</strong></td>
                        <td>
                          {item.file ? <a href={`#${item.file}`} className="file-link" style={{ color: '#03a94d', textDecoration: 'none' }}>📎 파일</a> : "-"}
                        </td>
                        <td>{item.u_name}</td>
                        <td><span className={`role-badge ${item.status === 'approved' ? 'green' : item.status === 'pending' ? 'purple' : 'depth-tag'}`}>{item.status}</span></td>
                        <td>
                          <div className="action-btns" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {item.status === 'pending' ? (
                              <>
                                <button className="btn-outline" onClick={() => handleAction(item.id, 'approved')} disabled={isLoading}>승인</button>
                                <button className="btn-outline" onClick={() => handleAction(item.id, 'rejected')} disabled={isLoading} style={{ color: '#dc3545' }}>반려</button>
                              </>
                            ) : item.status !== 'writing' ? (
                              <button className="btn-outline" onClick={() => handleAction(item.id, 'pending')} disabled={isLoading}>취소</button>
                            ) : "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!isLoading && totalDataPages > 1 && (
              <div className='pagination'>
                {Array.from({ length: totalDataPages }).map((_, i) => (
                  <button key={i} onClick={() => setDataPage(i + 1)} className={`page-btn ${dataPage === i + 1 ? 'active' : ''}`} style={dataPage === i + 1 ? { backgroundColor: '#03a94d', color: '#fff', border: 'none' } : {}}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
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
                <button className="close-x" onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>

              <div className="modal-body">
                <div className="modal-section">
                  <p className="section-label" style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>현재 할당된 그룹 (클릭 시 제거)</p>
                  <div className="modal-tag-group">
                    {currentUser.groups.map(g => (
                      <button key={g} className="modal-tag assigned" onClick={() => toggleGroup(g)}>
                        {g} ×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-section" style={{ marginTop: '20px' }}>
                  <p className="section-label" style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>추가 가능한 그룹 (클릭 시 추가)</p>
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
                <button className="btn-confirm" onClick={() => {
                  showDefaultAlert("성공", "권한 설정이 저장되었습니다.", "success");
                  setIsModalOpen(false);
                }}>설정 완료</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Manager;
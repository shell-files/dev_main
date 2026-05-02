import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@utils/network'; 
import '@styles/Manager.css';
import { showDefaultAlert, showConfirmAlert } from '@components/ServiceAlert/ServiceAlert';

/**
 * [CONFIG]
 *  true: mock 데이터
 *  false: 실제 API
 */
const USE_MOCK = false;

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
const mockUsers = [
  // SKM 팀
  { id: 1, name: '이채훈', email: 'chaehoon@skm.com', company: 'SKM', tier: 'Admin', groups: ALL_ISSUE_GROUPS },
  { id: 2, name: '김하영', email: 'hayoung@skm.com', company: 'SKM', tier: 'Staff', groups: ['Water', 'Waste'] },
  { id: 3, name: '이정빈', email: 'jungbin@skm.com', company: 'SKM', tier: 'Admin', groups: ALL_ISSUE_GROUPS },
  { id: 4, name: '최수아', email: 'sua@skm.com', company: 'SKM', tier: 'Staff', groups: ['Governance', 'Tax'] },

  // HG 팀
  { id: 5, name: '김지환', email: 'jihwan@hg.com', company: 'HG', tier: 'Admin', groups: ALL_ISSUE_GROUPS },
  { id: 6, name: '조윤주', email: 'yunju@hg.com', company: 'HG', tier: 'Staff', groups: ['Social', 'Community'] },
  { id: 7, name: '최가영', email: 'gayoung@hg.com', company: 'HG', tier: 'Staff', groups: ['Biodiversity', 'Circular Economy'] },
  { id: 8, name: '최윤우', email: 'yunu@hg.com', company: 'HG', tier: 'Staff', groups: ['Waste', 'Greenhouse Gas'] },

  // TV 팀
  { id: 9, name: '남영준', email: 'youngjun@tv.com', company: 'TV', tier: 'Staff', groups: ['Human Rights', 'Diversity'] },
  { id: 10, name: '이나라', email: 'nara@tv.com', company: 'TV', tier: 'Admin', groups: ALL_ISSUE_GROUPS },
  { id: 11, name: '이현서', email: 'hyunseo@tv.com', company: 'TV', tier: 'Staff', groups: ['Supply Chain', 'Data Privacy'] },

  // MT (강사님)
  { id: 12, name: '강사님', email: 'mentor@mt.com', company: 'MT', tier: 'Admin', groups: ALL_ISSUE_GROUPS },
];

const mockInputs = [
  // SKM 팀: 환경(E) 및 윤리(G) 중심
  { id: 101, group: 'Climate', q_name: '온실가스 배출량 (Scope 1&2)', val: '450 tCO2eq', u_name: '이채훈', status: 'pending', file: 'skm_env_01.pdf' },
  { id: 102, group: 'Energy', q_name: '전력 사용 효율성 지수', val: '0.85', u_name: '이채훈', status: 'approved', file: null },
  { id: 103, group: 'Water', q_name: '용수 취수량 및 재이용률', val: '1,200톤 / 15%', u_name: '김하영', status: 'pending', file: 'water_usage.xlsx' },
  { id: 104, group: 'Waste', q_name: '지정폐기물 처리 현황', val: '25.4톤', u_name: '김하영', status: 'rejected', file: 'waste_error.png' },
  { id: 105, group: 'Ethics', q_name: '임직원 윤리강령 서약률', val: '100%', u_name: '이정빈', status: 'approved', file: null },
  { id: 106, group: 'Anti-Corruption', q_name: '부패방지 교육 이수 현황', val: '95%', u_name: '이정빈', status: 'pending', file: 'edu_report.pdf' },
  { id: 107, group: 'Governance', q_name: '사외이사 이사회 참석률', val: '92%', u_name: '최수아', status: 'approved', file: 'board_min.pdf' },
  { id: 108, group: 'Tax', q_name: '국가별 조세 납부 내역', val: '공시 완료', u_name: '최수아', status: 'pending', file: null },

  // HG 팀: 환경(E) 및 사회(S) 중심
  { id: 109, group: 'Energy', q_name: '재생에너지 사용 전환율', val: '22%', u_name: '김지환', status: 'pending', file: 're100_plan.pdf' },
  { id: 110, group: 'Air Quality', q_name: '대기오염물질 배출 농도', val: '기준치 대비 40%', u_name: '김지환', status: 'approved', file: 'air_sensor.log' },
  { id: 111, group: 'Social', q_name: '지역사회 기부금 총액', val: '1.2억원', u_name: '조윤주', status: 'approved', file: 'donation_receipt.zip' },
  { id: 112, group: 'Community', q_name: '봉사활동 참여 인원', val: '340명', u_name: '조윤주', status: 'pending', file: null },
  { id: 113, group: 'Biodiversity', q_name: '사업장 인근 생태계 영향 평가', val: '영향 낮음', u_name: '최가영', status: 'pending', file: 'bio_eval.pdf' },
  { id: 114, group: 'Circular Economy', q_name: '제품 재활용 설계 비율', val: '60%', u_name: '최가영', status: 'approved', file: null },
  { id: 115, group: 'Waste', q_name: '일반 폐기물 배출량', val: '150톤', u_name: '최윤우', status: 'pending', file: null },
  { id: 116, group: 'Greenhouse Gas', q_name: '공급망 탄소 배출 데이터', val: '수집 중', u_name: '최윤우', status: 'pending', file: 'supply_ghg.csv' },

  // TV 팀: 노동(S) 및 공급망 중심
  { id: 117, group: 'Human Rights', q_name: '인권 실사 이행 여부', val: '이행 완료', u_name: '남영준', status: 'approved', file: 'hr_audit.pdf' },
  { id: 118, group: 'Diversity', q_name: '여성 관리자 비율', val: '28.5%', u_name: '남영준', status: 'pending', file: null },
  { id: 119, group: 'Labor', q_name: '산업재해율 (LTIFR)', val: '0.02', u_name: '이나라', status: 'approved', file: 'safety_stat.xlsx' },
  { id: 120, group: 'Safety', q_name: '안전보건 경영시스템 인증', val: 'ISO 45001 유지', u_name: '이나라', status: 'pending', file: 'iso_cert.jpg' },
  { id: 121, group: 'Supply Chain', q_name: '협력사 ESG 평가 비율', val: '82%', u_name: '이현서', status: 'pending', file: 'partner_eval.pdf' },
  { id: 122, group: 'Data Privacy', q_name: '개인정보 보호 위반 건수', val: '0건', u_name: '이현서', status: 'approved', file: null },
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
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  /**
   * 3. FILTER & PAGINATION
   */
  const [totalCount, setTotalCount] = useState(0);
  const [activeDataCategory, setActiveDataCategory] = useState('all'); 
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dataPage, setDataPage] = useState(1);
  const [dataSearch, setDataSearch] = useState("");

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
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 500));

        setInputs(mockInputs);
        setUsers(mockUsers);
        setTotalCount(mockInputs.length);

      } else {
        const res = await api.get('/board', {
          params: {
            ...authInfo,
            limit: PAGE_SIZE,
            offset: (dataPage - 1) * PAGE_SIZE,
            category: activeDataCategory !== 'all' ? activeDataCategory : undefined,
            subCategory: activeSubCategory !== 'all' ? activeSubCategory : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
          }
        });

        if (!res.data.status) throw new Error();

        setUsers(res.data.data.users);
        setInputs(res.data.data.list);
        setTotalCount(res.data.data.total);
      }

    } catch (err) {
      showDefaultAlert("데이터 오류", "불러오기 실패", "error");
      console.error("API ERROR FULL:", err);
      console.error("MESSAGE:", err.message);
      console.error("RESPONSE:", err.response);
    } finally {
      setIsLoading(false);
    }
  }, [authInfo, dataPage, activeDataCategory, activeSubCategory, statusFilter,USE_MOCK]);

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
    if (newStatus === 'rejected') {
      setRejectTargetId(id);
      setRejectReason("");
      setIsRejectModalOpen(true);
      return;
    }

    const actionName = newStatus === 'approved' ? '승인' : '취소';

    const isConfirmed = await showConfirmAlert(
      `${actionName} 확인`,
      `해당 항목을 정말로 ${actionName}하시겠습니까?`,
      'question'
    );

    if (!isConfirmed) return;

    if (!isConfirmed) return;

    setIsLoading(true);
    try {

      if (!USE_MOCK) {
        await api.patch('/board', {
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
  const getFilteredInputs = () => {
    let list = inputs;

    if (activeDataCategory !== 'all') {
      list = list.filter(item =>
        CATEGORY_MAP[activeDataCategory].includes(item.group)
      );
    }

    if (activeSubCategory !== 'all') {
      list = list.filter(item => item.group === activeSubCategory);
    }

    if (statusFilter !== 'all') {
      list = list.filter(item => item.status === statusFilter);
    }

    return list;
  };
  const filteredUsers = users.filter(u => {
    const keyword = userSearch.toLowerCase();

    return (
      u.name.toLowerCase().includes(keyword) ||
      u.company.toLowerCase().includes(keyword) ||
      u.groups.some(g => g.toLowerCase().includes(keyword)) ||
      u.groups.join(' ').toLowerCase().includes(keyword)
    );
  });

  const pagedUsers = filteredUsers.slice(
    (userPage - 1) * PAGE_SIZE,
    userPage * PAGE_SIZE
  );
  const filteredInputs = getFilteredInputs();
  const totalDataPages = Math.ceil(filteredInputs.length / PAGE_SIZE);

  const pagedInputs = filteredInputs.slice(
    (dataPage - 1) * PAGE_SIZE,
    dataPage * PAGE_SIZE
  );

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
                placeholder="사용자명 또는 회사명 / 이슈그룹 검색"
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
                  <div className="empty-icon">이미지 추가 예정</div>
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
              {!isLoading && Math.ceil(filteredUsers.length / PAGE_SIZE) > 1 && (
                <div className='pagination'>
                  {Array.from({ length: Math.ceil(filteredUsers.length / PAGE_SIZE) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setUserPage(i + 1)}
                      className={`page-btn ${userPage === i + 1 ? 'active' : ''}`}
                      style={
                        userPage === i + 1
                          ? { backgroundColor: '#03a94d', color: '#fff', border: 'none' }
                          : {}
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
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
                          {/* 파일 업로드 위치에 맞게 수정 해야 함 */}
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
                <button
                  className="btn-confirm"
                  onClick={async () => {
                    try {
                      if (!USE_MOCK) {
                        const res = await api.patch('/user', {
                          userId: currentUser.id,
                          groups: currentUser.groups,
                          ...authInfo
                        });

                        if (!res.data.status) {
                          throw new Error('저장 실패');
                        }
                      }

                      showDefaultAlert("성공", "권한 설정이 저장되었습니다.", "success");
                      setIsModalOpen(false);

                    } catch (e) {
                      showDefaultAlert("실패", "권한 저장 중 오류 발생", "error");
                    }
                  }}
                >설정 완료</button>
              </div>
            </div>
          </div>
        )}
        {isRejectModalOpen && (
          <div className="modal-overlay">
            <div className="modal-window">
              <div className="modal-header">
                <h3>반려 사유 입력</h3>

                <button
                  className="close-x"
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {/* 기존 반려 사유 (있을 경우만) */}
                {inputs.find(i => i.id === rejectTargetId)?.reason && (
                  <div style={{ marginBottom: '10px', fontSize: '13px', color: '#888' }}>
                    기존 사유: {inputs.find(i => i.id === rejectTargetId)?.reason}
                  </div>
                )}
                <textarea
                  className="reject-textarea"
                  placeholder="반려 사유를 입력해주세요"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn-confirm"
                  onClick={async () => {
                    if (!rejectReason.trim()) {
                      showDefaultAlert("알림", "반려 사유를 입력해주세요.", "info");
                      return;
                    }

                    try {
                      if (!USE_MOCK) {
                        await api.patch('/board', {
                          id: rejectTargetId,
                          status: 'rejected',
                          reason: rejectReason,
                          ...authInfo
                        });
                      }

                      setInputs(prev =>
                        prev.map(i =>
                          i.id === rejectTargetId
                            ? { ...i, status: 'rejected', reason: rejectReason }
                            : i
                        )
                      );

                      showDefaultAlert("완료", "반려 처리되었습니다.", "success");
                      setIsRejectModalOpen(false);

                    } catch (e) {
                      showDefaultAlert("실패", "처리 중 오류 발생", "error");
                    }
                  }}
                >
                  반려 확정
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Manager;
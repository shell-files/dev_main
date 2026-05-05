import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@utils/network'; 
import '@styles/Manager.css';
import { showDefaultAlert, showConfirmAlert } from '@components/ServiceAlert/ServiceAlert';

/**
 * [CONFIG]
 *  true: mock 데이터
 *  false: 실제 API
 */
const UseMock = false;

/**
 * [CONSTANTS]
 */
const CATEGORY_MAP = {
  general: ["기업개요", "ESG Strategy", "Tax", "Anti-Corruption"],
  environmental: ["Climate", "Waste", "Water", "Energy", "Biodiversity", "Greenhouse Gas", "Air Quality", "Circular Economy"],
  social: ["Social", "Labor", "Human Rights", "Community", "Product Safety", "Diversity", "Safety", "Data Privacy"],
  governance: ["Governance", "Ethics"]
};

const AllIssueGroups = [
  "기업개요", "Climate", "Social", "Governance", "Ethics", "Waste", "Water", "Energy",
  "Labor", "Human Rights", "Community", "Product Safety", "Tax", "Biodiversity",
  "Supply Chain", "Diversity", "Data Privacy", "Anti-Corruption", "Safety",
  "Circular Economy", "Greenhouse Gas", "Air Quality", "ESG Strategy"
];
const mockUsers = [
  // SKM 팀
  { id: 1, name: '이채훈', email: 'chaehoon@skm.com', company: 'SKM', role: '관리자', groups: AllIssueGroups },
  { id: 2, name: '김하영', email: 'hayoung@skm.com', company: 'SKM', role: '부서 담당자', groups: ['Water', 'Waste'] },
  { id: 3, name: '이정빈', email: 'jungbin@skm.com', company: 'SKM', role: '관리자', groups: AllIssueGroups },
  { id: 4, name: '최수아', email: 'sua@skm.com', company: 'SKM', role: 'ESG 담당자', groups: ['Governance', 'Tax'] },

  // HG 팀
  { id: 5, name: '김지환', email: 'jihwan@hg.com', company: 'HG', role: '관리자', groups: AllIssueGroups },
  { id: 6, name: '조윤주', email: 'yunju@hg.com', company: 'HG', role: '부서 담당자', groups: ['Social', 'Community'] },
  { id: 7, name: '최가영', email: 'gayoung@hg.com', company: 'HG', role: 'ESG 담당자', groups: ['Biodiversity', 'Circular Economy'] },
  { id: 8, name: '최윤우', email: 'yunu@hg.com', company: 'HG', role: '컨설턴트', groups: ['Waste', 'Greenhouse Gas'] },

  // TV 팀
  { id: 9, name: '남영준', email: 'youngjun@tv.com', company: 'TV', role: '부서 담당자', groups: ['Human Rights', 'Diversity'] },
  { id: 10, name: '이나라', email: 'nara@tv.com', company: 'TV', role: '관리자', groups: AllIssueGroups },
  { id: 11, name: '이현서', email: 'hyunseo@tv.com', company: 'TV', role: 'ESG 담당자', groups: ['Supply Chain', 'Data Privacy'] },

  // MT (강사님)
  { id: 12, name: '강사님', email: 'mentor@mt.com', company: 'MT', role: '관리자', groups: AllIssueGroups },
];

const mockInputs = [
  { id: 101, issueGroup: 'Climate', questionName: '온실가스 배출량 (Scope 1&2)', value: '450 tCO2eq', userName: '이채훈', status: 'pending', attachmentFile: 'skm_env_01.pdf' },
  { id: 102, issueGroup: 'Energy', questionName: '전력 사용 효율성 지수', value: '0.85', userName: '이채훈', status: 'approved', attachmentFile: null },
  
  { id: 103, issueGroup: 'Water', questionName: '용수 취수량 및 재이용률', value: '1,200톤 / 15%', userName: '김하영', status: 'pending', attachmentFile: 'water_usage.xlsx' },
  { id: 104, issueGroup: 'Waste', questionName: '지정폐기물 처리 현황', value: '25.4톤', userName: '김하영', status: 'rejected', attachmentFile: 'waste_error.png' },

  { id: 105, issueGroup: 'Ethics', questionName: '임직원 윤리강령 서약률', value: '100%', userName: '이정빈', status: 'approved', attachmentFile: null },
  { id: 106, issueGroup: 'Anti-Corruption', questionName: '부패방지 교육 이수 현황', value: '95%', userName: '이정빈', status: 'pending', attachmentFile: 'edu_report.pdf' },

  { id: 107, issueGroup: 'Governance', questionName: '사외이사 이사회 참석률', value: '92%', userName: '최수아', status: 'approved', attachmentFile: 'board_min.pdf' },
  { id: 108, issueGroup: 'Tax', questionName: '국가별 조세 납부 내역', value: '공시 완료', userName: '최수아', status: 'pending', attachmentFile: null },

  { id: 109, issueGroup: 'Energy', questionName: '재생에너지 사용 전환율', value: '22%', userName: '김지환', status: 'pending', attachmentFile: 're100_plan.pdf' },
  { id: 110, issueGroup: 'Air Quality', questionName: '대기오염물질 배출 농도', value: '기준치 대비 40%', userName: '김지환', status: 'approved', attachmentFile: 'air_sensor.log' },

  { id: 111, issueGroup: 'Social', questionName: '지역사회 기부금 총액', value: '1.2억원', userName: '조윤주', status: 'approved', attachmentFile: 'donation_receipt.zip' },
  { id: 112, issueGroup: 'Community', questionName: '봉사활동 참여 인원', value: '340명', userName: '조윤주', status: 'pending', attachmentFile: null },

  { id: 113, issueGroup: 'Biodiversity', questionName: '사업장 인근 생태계 영향 평가', value: '영향 낮음', userName: '최가영', status: 'pending', attachmentFile: 'bio_eval.pdf' },
  { id: 114, issueGroup: 'Circular Economy', questionName: '제품 재활용 설계 비율', value: '60%', userName: '최가영', status: 'approved', attachmentFile: null },

  { id: 115, issueGroup: 'Waste', questionName: '일반 폐기물 배출량', value: '150톤', userName: '최윤우', status: 'pending', attachmentFile: null },
  { id: 116, issueGroup: 'Greenhouse Gas', questionName: '공급망 탄소 배출 데이터', value: '수집 중', userName: '최윤우', status: 'pending', attachmentFile: 'supply_ghg.csv' },

  { id: 117, issueGroup: 'Human Rights', questionName: '인권 실사 이행 여부', value: '이행 완료', userName: '남영준', status: 'approved', attachmentFile: 'hr_audit.pdf' },
  { id: 118, issueGroup: 'Diversity', questionName: '여성 관리자 비율', value: '28.5%', userName: '남영준', status: 'pending', attachmentFile: null },

  { id: 119, issueGroup: 'Labor', questionName: '산업재해율 (LTIFR)', value: '0.02', userName: '이나라', status: 'approved', attachmentFile: 'safety_stat.xlsx' },
  { id: 120, issueGroup: 'Safety', questionName: '안전보건 경영시스템 인증', value: 'ISO 45001 유지', userName: '이나라', status: 'pending', attachmentFile: 'iso_cert.jpg' },

  { id: 121, issueGroup: 'Supply Chain', questionName: '협력사 ESG 평가 비율', value: '82%', userName: '이현서', status: 'pending', attachmentFile: 'partner_eval.pdf' },
  { id: 122, issueGroup: 'Data Privacy', questionName: '개인정보 보호 위반 건수', value: '0건', userName: '이현서', status: 'approved', attachmentFile: null },
];
const PAGE_SIZE = 10;


const Manager = () => {
  const ROLE = {ADMIN: "관리자", ESG: "ESG 담당자", DEPT: "부서 담당자", CONSULTANT: "컨설턴트"};
  const [authInfo] = useState({
    uuid: localStorage.getItem('uuid') || 'guest-uuid',
    companyId: localStorage.getItem('companyId') || 'guest-company',
    role: localStorage.getItem('role') || ''
  });
  const isESG = authInfo.role === ROLE.ESG;
  const canAccess = UseMock || isESG;


  const [users, setUsers] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');

  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [activeDataCategory, setActiveDataCategory] = useState('all'); 
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dataPage, setDataPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * =========================
   * API FETCH (SAFE)
   * =========================
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      if (UseMock) {
        await new Promise(r => setTimeout(r, 300));
        setInputs(mockInputs);
        setUsers(mockUsers);
        setTotalCount(mockInputs.length);
        return;
      }

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

      const data = res?.data?.data;

      setUsers(data?.users ?? []);
      setInputs(data?.list ?? []);
      setTotalCount(data?.total ?? 0);

    } catch (err) {
      console.error({
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      });
      showDefaultAlert("데이터 오류", "불러오기 실패", "error");

      setUsers([]);
      setInputs([]);
      setTotalCount(0);

    } finally {
      setIsLoading(false);
    }
  }, [authInfo, dataPage, activeDataCategory, activeSubCategory, statusFilter]);

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
   * ACTION (SAFE FIX ONLY)
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

    setIsLoading(true);

    try {
      if (!UseMock) {
        await api.patch('/board', {
          id,
          status: newStatus,
          ...authInfo
        });
      }

      setInputs(prev =>
        prev.map(i => i.id === id ? { ...i, status: newStatus } : i)
      );

      showDefaultAlert("처리 완료", `정상적으로 ${actionName}되었습니다.`, "success");

    } catch (e) {
      console.error(e);
      showDefaultAlert("처리 실패", "통신 중 오류", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * GROUP TOGGLE (NULL SAFE ONLY)
   */
  const toggleGroup = (groupName) => {
    if (!currentUser) return;

    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {

          const groups = u.groups || [];
          const has = groups.includes(groupName);

          let newGroups = has
            ? groups.filter(g => g !== groupName)
            : [...groups, groupName];

          if (newGroups.length === 0) {
            showDefaultAlert("알림", "최소 하나의 그룹은 필요합니다.", "info");
            return u;
          }

          const updated = { ...u, groups: newGroups };
          setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
  };

  /**
   * FILTER
   */
  const getFilteredInputs = () => {
    let list = inputs || [];

    if (activeDataCategory !== 'all') {
      list = list.filter(item =>
        CATEGORY_MAP[activeDataCategory]?.includes(item.issueGroup)
      );
    }

    if (activeSubCategory !== 'all') {
      list = list.filter(item => item.issueGroup === activeSubCategory);
    }

    if (statusFilter !== 'all') {
      list = list.filter(item => item.status === statusFilter);
    }

    return list;
  };

  const filteredUsers = (users || []).filter(u => {
    const keyword = userSearch.toLowerCase();

    return (
      (u.name || "").toLowerCase().includes(keyword) ||
      (u.company || "").toLowerCase().includes(keyword) ||
      (u.groups || []).some(g => g.toLowerCase().includes(keyword))
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

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    const currentIds = pagedInputs.map(i => i.id);

    const isAllSelected = currentIds.every(id => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
    }
  };

  const handleBulkAction = async (newStatus) => {
    if (selectedIds.length === 0) return;

    const actionName = newStatus === 'approved' ? '승인' : '반려';

    const isConfirmed = await showConfirmAlert(
      `일괄 ${actionName}`,
      `선택된 ${selectedIds.length}개 항목을 ${actionName}하시겠습니까?`,
      'question'
    );

    if (!isConfirmed) return;

    setIsLoading(true);

    try {
      if (!UseMock) {
        await api.patch('/board/bulk', {
          ids: selectedIds,
          status: newStatus,
          ...authInfo
        });
      }

      // 프론트 상태 반영
      setInputs(prev =>
        prev.map(i =>
          selectedIds.includes(i.id)
            ? { ...i, status: newStatus }
            : i
        )
      );

      setSelectedIds([]); // 선택 초기화

      showDefaultAlert("완료", `일괄 ${actionName} 처리되었습니다.`, "success");

    } catch (e) {
      console.error(e);
      showDefaultAlert("실패", "일괄 처리 중 오류", "error");
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    
    <div id="manager_page">
      <div className="manager-content-container">

        {/* 1. KPI 영역 */}
        <div className='kpi-container'>
          {[
            { key: 'approved', label: '승인 완료', count: kpi.approved},
            { key: 'pending', label: '승인 대기', count: kpi.pending},
            { key: 'rejected', label: '반려됨', count: kpi.rejected }
          ].map(item => (
            <div 
              key={item.key} 
              onClick={() => !isLoading && setStatusFilter(item.key === statusFilter ? 'all' : item.key)}
              className={`kpi-card ${statusFilter === item.key ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
              
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
                        <td>{u.company} <span className="depth-tag">{u.role}</span></td>
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-outline"
                  disabled={selectedIds.length === 0 || isLoading}
                  onClick={() => handleBulkAction('approved')}
                >
                  선택 승인
                </button>

                <button
                  className="btn-outline"
                  disabled={selectedIds.length === 0 || isLoading}
                  onClick={() => handleBulkAction('rejected')}
                  style={{ color: '#dc3545' }}
                >
                  선택 반려
                </button>
              <button className="btn-primary" onClick={fetchData} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "데이터 새로고침"}
              </button>
              </div>
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
                  <p>해당 조건에 맞는 데이터가 없습니다.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              pagedInputs.length > 0 &&
                              pagedInputs.every(i => selectedIds.includes(i.id))
                            }
                            onChange={toggleSelectAll}
                          />
                        </th>
                      <th>ID</th><th>이슈 그룹</th><th>지표 항목</th><th>값</th><th>첨부파일</th><th>작성자</th><th>상태</th><th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInputs.map(item => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td>{item.id}</td>
                        <td><span className="tag-item" style={{ backgroundColor: '#f1f3f5', color: '#333', border: 'none' }}>{item.issueGroup}</span></td>
                        <td>{item.questionName}</td>
                        <td className="value-cell"><strong>{item.value}</strong></td>
                        <td>
                          {/* 파일 업로드 위치에 맞게 수정 해야 함 */}
                          {item.attachmentFile ? <a href={`#${item.attachmentFile}`} className="file-link" style={{ color: '#03a94d', textDecoration: 'none' }}>📎 파일</a> : "-"}
                        </td>
                        <td>{item.userName}</td>
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
                    {AllIssueGroups
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
                      if (!UseMock) {
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
                      if (!UseMock) {
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
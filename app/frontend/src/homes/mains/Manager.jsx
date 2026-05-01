import React, { useState, useEffect } from 'react';
import '@styles/Manager.css';

const ALL_ISSUE_GROUPS = [
  "기업개요","Climate","Social","Governance","Ethics","Waste","Water","Energy",
  "Labor","Human Rights","Community","Product Safety","Tax","Biodiversity",
  "Supply Chain","Diversity","Data Privacy","Anti-Corruption","Safety",
  "Circular Economy","Greenhouse Gas","Air Quality","ESG Strategy"
];

const PAGE_SIZE = 10;

const Manager = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [inputs, setInputs] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dataPage, setDataPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setUsers([
      { id:"U001", name:"이채훈", email:"chaehoon@skm.com", company:"SKM", tier:"1 Tier", role:"Consultant", groups:["기업개요","Climate","Social","Waste","Energy"] },
      { id:"U002", name:"이정빈", email:"lee@gmail.com", company:"SKM", tier:"1 Tier", role:"Consultant", groups:["Social"] },
      { id:"U003", name:"이나라", email:"nara@gmail.com", company:"TV", tier:"2 Tier", role:"ESG Admin", groups:["Social","Waste"] },
    ]);

    setInputs([
      { id:"INP-01", q_name:"에너지 사용량", val:"450kWh", u_id:"U001", status:"pending" },
      { id:"INP-02", q_name:"탄소 배출량", val:"120t", u_id:"U002", status:"approved" },
    ]);
  }, []);

  // KPI
  const kpi = {
    approved: inputs.filter(i=>i.status==='approved').length,
    pending: inputs.filter(i=>i.status==='pending').length,
    rejected: inputs.filter(i=>i.status==='rejected').length
  };

  const kpiItems = [
    { key: 'approved', label: '승인', count: kpi.approved, color: '#03a94d' },
    { key: 'pending', label: '대기', count: kpi.pending, color: '#673AB7' },
    { key: 'rejected', label: '반려', count: kpi.rejected, color: '#dc3545' }
  ];

  // 그룹 토글
  const toggleGroup = (groupName) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const has = u.groups.includes(groupName);
        let newGroups = has ? u.groups.filter(g=>g!==groupName) : [...u.groups, groupName];
        if (newGroups.length === 0) return u;
        const updated = { ...u, groups: newGroups };
        setCurrentUser(updated);
        return updated;
      }
      return u;
    }));
  };

  // 개별 승인
  const handleAction = (id, status) => {
    setInputs(prev => prev.map(i => i.id===id ? { ...i, status } : i));
  };

  // 선택 관련
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = (list) => {
    const ids = list.map(i => i.id);
    if (ids.every(id => selectedIds.includes(id))) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleBulkAction = (status) => {
    setInputs(prev =>
      prev.map(i =>
        selectedIds.includes(i.id) ? { ...i, status } : i
      )
    );
    setSelectedIds([]);
  };

  // 유저 필터 + 페이징
  const filteredUsers = users.filter(u =>
    u.name.includes(userSearch) || u.company.includes(userSearch)
  );

  const pagedUsers = filteredUsers.slice(
    (userPage-1)*PAGE_SIZE,
    userPage*PAGE_SIZE
  );

  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  // 데이터 필터 + 페이징 (KPI 필터 적용)
  const filteredInputs = statusFilter === 'all'
    ? inputs
    : inputs.filter(i => i.status === statusFilter);

  const pagedInputs = filteredInputs.slice(
    (dataPage-1)*PAGE_SIZE,
    dataPage*PAGE_SIZE
  );

  const totalDataPages = Math.ceil(filteredInputs.length / PAGE_SIZE);

  return (
    <div className="manager-content-container">

      {/* KPI */}
      <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
        {kpiItems.map(item => (
          <div
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            style={{
              flex:1,
              padding:'12px',
              border:'1px solid #eee',
              borderRadius:'10px',
              cursor:'pointer',
              background: statusFilter === item.key ? '#f8f9fa' : '#fff'
            }}
          >
            <div style={{fontSize:'12px', color:'#666'}}>{item.label}</div>
            <div style={{fontSize:'22px', fontWeight:'bold', color:item.color}}>
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* 헤더 */}
      <div className="page-header">
        <h2 className="page-title">통합 관리 시스템</h2>
        <div className="tab-group">
          <button className={`tab-item ${activeTab==='user'?'active':''}`} onClick={()=>setActiveTab('user')}>유저</button>
          <button className={`tab-item ${activeTab==='data'?'active':''}`} onClick={()=>setActiveTab('data')}>데이터</button>
        </div>
      </div>

      {/* ===================== */}
      {/* 유저 */}
      {/* ===================== */}
      {activeTab === 'user' && (
        <section className="fade-in">

          <div className="filter-bar">
            <input
              className="search-input"
              placeholder="검색"
              value={userSearch}
              onChange={(e)=>setUserSearch(e.target.value)}
            />
            <button className="btn-primary">조회</button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>회사</th>
                  <th>이슈 그룹</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {pagedUsers.map(u => {
                  const visible = u.groups.slice(0,4);
                  const remain = u.groups.length - 4;

                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong><br/>
                        <small>{u.email}</small>
                      </td>

                      <td>
                        {u.company}
                        <span className="depth-tag">{u.tier}</span>
                      </td>

                      <td>
                        {visible.map(g=>(
                          <span key={g} className="tag-item">{g}</span>
                        ))}
                        {remain > 0 && <span className="tag-item">+{remain}</span>}
                      </td>

                      <td>
                        <button
                          className="btn-outline"
                          onClick={()=>{setCurrentUser(u); setIsModalOpen(true);}}
                        >
                          이슈 그룹 보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:'10px'}}>
            {Array.from({length: totalUserPages}).map((_,i)=>(
              <button key={i} onClick={()=>setUserPage(i+1)} className="btn-outline">
                {i+1}
              </button>
            ))}
          </div>

        </section>
      )}

      {/* ===================== */}
      {/* 데이터 */}
      {/* ===================== */}
      {activeTab === 'data' && (
        <section className="fade-in">

          {/* 선택 액션 */}
          {selectedIds.length > 0 && (
            <div style={{
              marginBottom:'10px',
              padding:'10px',
              background:'#f8f9fa',
              border:'1px solid #eee',
              borderRadius:'8px',
              display:'flex',
              justifyContent:'space-between'
            }}>
              <span>선택 {selectedIds.length}건</span>
              <div>
                <button className="btn-outline" onClick={()=>handleBulkAction('approved')}>선택 승인</button>
                <button className="btn-outline" onClick={()=>handleBulkAction('rejected')}>선택 반려</button>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={() => toggleSelectAll(pagedInputs)}
                      checked={
                        pagedInputs.length > 0 &&
                        pagedInputs.every(i => selectedIds.includes(i.id))
                      }
                    />
                  </th>
                  <th>항목</th>
                  <th>값</th>
                  <th>작성자</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>

              <tbody>
                {pagedInputs.map(item=>(
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>

                    <td>{item.q_name}</td>
                    <td>{item.val}</td>
                    <td>{users.find(u=>u.id===item.u_id)?.name}</td>

                    <td>
                      <span className={`role-badge ${item.status==='approved'?'green':'purple'}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                    {item.status === 'pending' && (
                      <>
                        <button className="btn-outline" onClick={()=>handleAction(item.id,'approved')}>
                          승인
                        </button>
                        <button className="btn-outline" onClick={()=>handleAction(item.id,'rejected')}>
                          반려
                        </button>
                      </>
                    )}

                    {item.status === 'approved' && (
                      <button className="btn-outline" onClick={()=>handleAction(item.id,'pending')}>
                        승인 취소
                      </button>
                    )}

                    {item.status === 'rejected' && (
                      <button className="btn-outline" onClick={()=>handleAction(item.id,'pending')}>
                        반려 취소
                      </button>
                    )}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:'10px'}}>
            {Array.from({length: totalDataPages}).map((_,i)=>(
              <button key={i} onClick={()=>setDataPage(i+1)} className="btn-outline">
                {i+1}
              </button>
            ))}
          </div>

        </section>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div className="modal-header">
              <h3>{currentUser.name}</h3>
              <button onClick={()=>setIsModalOpen(false)}>×</button>
            </div>

            <div>
              <p>현재 그룹</p>
              <div className="modal-tag-group">
                {currentUser.groups.map(g=>(
                  <button key={g} className="modal-tag assigned" onClick={()=>toggleGroup(g)}>
                    {g} ✕
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginTop:'20px'}}>
              <p>추가</p>
              <div className="modal-tag-group">
                {ALL_ISSUE_GROUPS
                  .filter(g=>!currentUser.groups.includes(g))
                  .map(g=>(
                    <button key={g} className="modal-tag unassigned" onClick={()=>toggleGroup(g)}>
                      + {g}
                    </button>
                  ))}
              </div>
            </div>

            <button className="btn-confirm" onClick={()=>setIsModalOpen(false)}>
              설정 완료
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Manager;
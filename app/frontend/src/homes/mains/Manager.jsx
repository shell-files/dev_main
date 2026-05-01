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
  const [activeTab, setActiveTab] = useState('user');
  const [users, setUsers] = useState([]);
  const [inputs, setInputs] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dataPage, setDataPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
  const [statusFilter, setStatusFilter] = useState('all');

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

  // 승인/반려
  const handleAction = (id, status) => {
    setInputs(prev => prev.map(i => i.id===id ? { ...i, status } : i));
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

  // 데이터 페이징
  const pagedInputs = inputs.slice(
    (dataPage-1)*PAGE_SIZE,
    dataPage*PAGE_SIZE
  );

  const totalDataPages = Math.ceil(inputs.length / PAGE_SIZE);

  return (
    <div className="manager-content-container">

      {/* KPI (CSS 건드리지 않기 위해 inline 최소만 사용) */}
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
      {/* 유저 관리 */}
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

          {/* 페이지네이션 */}
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

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
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
                    <td>{item.q_name}</td>
                    <td>{item.val}</td>
                    <td>{users.find(u=>u.id===item.u_id)?.name}</td>

                    <td>
                      <span className={`role-badge ${item.status==='approved'?'green':'purple'}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {item.status==='pending' && (
                        <>
                          <button className="btn-outline" onClick={()=>handleAction(item.id,'approved')}>승인</button>
                          <button className="btn-outline" onClick={()=>handleAction(item.id,'rejected')}>반려</button>
                        </>
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

      {/* ===================== */}
      {/* 모달 */}
      {/* ===================== */}
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
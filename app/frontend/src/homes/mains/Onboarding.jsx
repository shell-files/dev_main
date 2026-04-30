import { useMemo, useState, useRef, useEffect } from "react";
import "@styles/onboarding.css";
import INITIAL_METRICS from "./onboardingData.js";

// =====================================================================================
// Onboarding.jsx – ONBOARDING_REFACTOR_GUIDE.md 기준 리팩토링
//
// 1. 데이터: onboarding.csv 기준 231개 지표 (onboardingData.js)
// 2. 탭: 상위(전체/경영일반/E/S/G) + 하위(이슈그룹 멀티셀렉트 칩)
// 3. 액션: 행 단위 임시저장/제출/승인/반려 (하단 액션바 삭제)
// 4. R&R: 이슈그룹 단위 담당자 지정 모달
// 5. 권한: ESG 담당자/컨설턴트/부서 담당자 분기
// 6. API: USE_DUMMY_API 패턴
// =====================================================================================

const USE_DUMMY_API = true;
const CATEGORY_TABS = ["전체", "경영일반", "E", "S", "G"];
const ROWS_PER_PAGE = 15;

const STATUS_CFG = {
  NOT_STARTED: { label: "미입력",  cls: "st-not-started" },
  DRAFT:       { label: "작성 중", cls: "st-draft" },
  SUBMITTED:   { label: "제출",    cls: "st-submitted" },
  APPROVED:    { label: "승인",    cls: "st-approved" },
  REJECTED:    { label: "반려",    cls: "st-rejected" },
  COMPLETED:   { label: "완료",    cls: "st-completed" },
};

const DUMMY_USERS = [
  { roleId: 1, roleName: "ESG 담당자", email: "esg@company.com" },
  { roleId: 2, roleName: "컨설턴트",    email: "consultant@company.com" },
  { roleId: 3, roleName: "부서 담당자", email: "dept@company.com" },
];

// ── API 함수 ──
const requestSaveMetricDraftApi = async (metricId, payload) => {
  if (USE_DUMMY_API) return { status: true, message: "임시 저장되었습니다.", data: { metricId, status: "DRAFT" } };
  // const response = await api.patch(`/auth/onboarding/metrics/${metricId}`, payload);
  // return response.data;
};
const requestSubmitMetricApi = async (metricId) => {
  if (USE_DUMMY_API) return { status: true, message: "제출되었습니다.", data: { metricId, status: "SUBMITTED" } };
};
const requestApproveMetricApi = async (metricId) => {
  if (USE_DUMMY_API) return { status: true, message: "승인되었습니다.", data: { metricId, status: "APPROVED" } };
};
const requestRejectMetricApi = async (metricId, reason) => {
  if (USE_DUMMY_API) return { status: true, message: "반려되었습니다.", data: { metricId, status: "REJECTED", reason } };
};
const requestUploadEvidenceApi = async (metricId, file) => {
  if (USE_DUMMY_API) return { status: true, data: { metricId, evidenceAttached: true, fileName: file.name } };
};
const requestInviteAssigneesApi = async (issueGroup, assignees) => {
  if (USE_DUMMY_API) return {
    status: true, message: "담당자 초대가 발송되었습니다.",
    data: { issueGroup, assignees: assignees.map((a, i) => ({ id: `inv-${i+1}`, ...a, status: "PENDING" })) },
  };
};

// ── 버튼 노출 규칙 ──
const getActions = (role, status) => {
  const b = [];
  if (role === "부서 담당자") {
    if (["NOT_STARTED","DRAFT","REJECTED"].includes(status)) b.push("임시저장");
    if (status === "DRAFT") b.push("제출");
    if (status === "REJECTED") b.push("재제출");
  } else if (role === "ESG 담당자") {
    if (["NOT_STARTED","DRAFT","REJECTED"].includes(status)) b.push("임시저장");
    if (["DRAFT","REJECTED"].includes(status)) b.push("제출");
    if (status === "SUBMITTED") { b.push("승인"); b.push("반려"); }
  } else if (role === "컨설턴트") {
    if (["NOT_STARTED","DRAFT","REJECTED"].includes(status)) b.push("임시저장");
    if (["DRAFT","REJECTED"].includes(status)) b.push("제출");
  }
  return b;
};

// ── R&R 표시 ──
const rnrDisplay = (assignees) => {
  if (!assignees || assignees.length === 0) return null;
  const accepted = assignees.filter(a => a.status === "ACCEPTED");
  const pending  = assignees.filter(a => a.status === "PENDING");
  if (accepted.length === 0 && pending.length > 0) return `수락대기 ${pending.length}명`;
  if (accepted.length === 1) return accepted[0].name;
  if (accepted.length > 1) return `${accepted[0].name} 외 ${accepted.length-1}명`;
  return null;
};

// =====================================================================================
const Onboarding = () => {
  const [metrics, setMetrics] = useState(() => INITIAL_METRICS.map(m => ({ ...m })));
  const [currentUser, setCurrentUser] = useState(DUMMY_USERS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [selectedIGs, setSelectedIGs] = useState([]);
  const [isIgExpanded, setIsIgExpanded] = useState(false); // 이슈그룹 펼침 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 탭 슬라이더
  const tabsRef = useRef([]);
  const tableWrapRef = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  // 페이지 변경 시 테이블 상단으로 스크롤
  useEffect(() => {
    if (tableWrapRef.current) {
      tableWrapRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  useEffect(() => {
    const updateSlider = () => {
      const activeIndex = CATEGORY_TABS.indexOf(activeCategory);
      const activeTab = tabsRef.current[activeIndex];
      if (activeTab) {
        setSliderStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth
        });
      }
    };
    updateSlider();
    // 창 크기 변경 시 슬라이더 위치 재계산
    window.addEventListener("resize", updateSlider);
    return () => window.removeEventListener("resize", updateSlider);
  }, [activeCategory]);

  // 모달
  const [modalIG, setModalIG] = useState(null);
  const [modalInputs, setModalInputs] = useState([{ email: "", name: "", department: "" }]);

  // ── 이슈그룹 목록 ──
  const availableIGs = useMemo(() => {
    if (activeCategory === "전체") return [];
    return [...new Set(metrics.filter(m => m.category === activeCategory).map(m => m.issueGroup))];
  }, [metrics, activeCategory]);

  // ── 필터링 ──
  const canViewAll = ["ESG 담당자", "컨설턴트", "관리자"].includes(currentUser.roleName);

  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return metrics.filter(m => {
      if (activeCategory !== "전체" && m.category !== activeCategory) return false;
      if (selectedIGs.length > 0 && !selectedIGs.includes(m.issueGroup)) return false;
      if (s && !m.issueId.toLowerCase().includes(s) && !m.issueName.toLowerCase().includes(s) && !m.checklistQuestion.toLowerCase().includes(s)) return false;
      if (!canViewAll && !m.assignees.some(a => a.email === currentUser.email && a.status === "ACCEPTED")) return false;
      return true;
    });
  }, [metrics, searchTerm, activeCategory, selectedIGs, currentUser, canViewAll]);

  const pageCount = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredData.slice(start, start + ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  const rowSpans = useMemo(() => {
    const spans = {};
    pageData.forEach((item, index) => {
      if (index === 0 || pageData[index - 1].issueGroup !== item.issueGroup) {
        let span = 1;
        for (let i = index + 1; i < pageData.length; i++) {
          if (pageData[i].issueGroup === item.issueGroup) span++;
          else break;
        }
        spans[index] = span;
      }
    });
    return spans;
  }, [pageData]);

  // ── 핸들러 ──
  const handleCatChange = (cat) => {
    if (activeCategory === cat) {
      return; // 같은 탭 클릭 시 아무 동작 안 함 (V를 눌러야 펼쳐짐)
    }
    setActiveCategory(cat);
    setSelectedIGs([]);
    setIsIgExpanded(false); // 탭 변경 시 기본적으로 닫힌 상태
    setCurrentPage(1);
  };
  const handleIGToggle = (ig) => {
    setSelectedIGs(prev => prev.includes(ig) ? prev.filter(g => g !== ig) : [...prev, ig]);
    setCurrentPage(1);
  };

  const handleValueChange = (id, value) => {
    setMetrics(prev => prev.map(m => m.issueId === id ? { ...m, value, status: m.status === "NOT_STARTED" && value.trim() ? "DRAFT" : m.status } : m));
  };

  const handleSaveDraft = async (id) => {
    const m = metrics.find(x => x.issueId === id);
    const r = await requestSaveMetricDraftApi(id, { value: m.value, unit: m.unit });
    if (r.status) setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "DRAFT" } : x));
  };
  const handleSubmit = async (id) => {
    const r = await requestSubmitMetricApi(id);
    if (r.status) setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "SUBMITTED" } : x));
  };
  const handleApprove = async (id) => {
    const r = await requestApproveMetricApi(id);
    if (r.status) setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "APPROVED" } : x));
  };
  const handleReject = async (id) => {
    const reason = prompt("반려 사유를 입력하세요:");
    if (!reason) return;
    const r = await requestRejectMetricApi(id, reason);
    if (r.status) setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "REJECTED", rejectReason: reason } : x));
  };
  const handleEvidence = async (id) => {
    const m = metrics.find(x => x.issueId === id);
    if (m.evidenceAttached) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, evidenceAttached: false, evidenceFileName: "" } : x));
    } else {
      const r = await requestUploadEvidenceApi(id, { name: "evidence.pdf" });
      if (r.status) setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, evidenceAttached: true, evidenceFileName: r.data.fileName } : x));
    }
  };

  // 모달 핸들러
  const openModal = (ig) => { setModalIG(ig); setModalInputs([{ email: "", name: "", department: "" }]); };
  const closeModal = () => setModalIG(null);
  const addModalRow = () => setModalInputs(prev => [...prev, { email: "", name: "", department: "" }]);
  const removeModalRow = (i) => setModalInputs(prev => prev.filter((_, idx) => idx !== i));
  const updateModalRow = (i, field, val) => setModalInputs(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const handleInvite = async () => {
    const valid = modalInputs.filter(r => r.email && r.name);
    if (valid.length === 0) return;
    const r = await requestInviteAssigneesApi(modalIG, valid);
    if (r.status) {
      setMetrics(prev => prev.map(m => m.issueGroup === modalIG ? { ...m, assignees: [...m.assignees, ...r.data.assignees] } : m));
      closeModal();
    }
  };

  // 페이지 목록
  const visiblePages = useMemo(() => {
    const maxVisible = 10;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pageCount, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pageCount, currentPage]);

  // 첫 이슈그룹 담당자 (R&R용)
  const getIGAssignees = (ig) => {
    const m = metrics.find(x => x.issueGroup === ig);
    return m ? m.assignees : [];
  };

  const actionBtnClass = (label) => {
    if (label === "임시저장") return "ob-act-draft";
    if (label === "제출" || label === "재제출") return "ob-act-submit";
    if (label === "승인") return "ob-act-approve";
    if (label === "반려") return "ob-act-reject";
    return "";
  };
  const actionHandler = (label, id) => {
    if (label === "임시저장") return () => handleSaveDraft(id);
    if (label === "제출" || label === "재제출") return () => handleSubmit(id);
    if (label === "승인") return () => handleApprove(id);
    if (label === "반려") return () => handleReject(id);
    return () => {};
  };

  return (
    <div id="onboarding_page">
      <main className="ob-body">
        {/* 상단 통합 헤더 (탭 + 툴바) */}
        <div className="ob-header-row">
          {/* 상위 탭 */}
          <div className="ob-cat-tabs">
            <div className={`ob-tab-slider bg-${activeCategory}`} style={sliderStyle} />
            {CATEGORY_TABS.map((tab, idx) => (
              <button
                key={tab}
                ref={el => tabsRef.current[idx] = el}
                type="button"
                className={`ob-cat-tab ${activeCategory === tab ? "active" : ""}`}
                onClick={() => handleCatChange(tab)}
              >
                {tab}
                {activeCategory === tab && tab !== "전체" && (
                  <div 
                    className={`ob-tab-expander ${isIgExpanded ? "expanded" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIgExpanded(prev => !prev);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 툴바 (우측) */}
          <div className="ob-toolbar-right">
            <select
              className="ob-role-select"
              value={currentUser.roleId}
              onChange={(e) => setCurrentUser(DUMMY_USERS.find(u => u.roleId === Number(e.target.value)))}
            >
              {DUMMY_USERS.map(u => <option key={u.roleId} value={u.roleId}>{u.roleName}</option>)}
            </select>
            <input
              type="text"
              className="ob-search"
              placeholder="지표 검색..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <span className="ob-count">총 {filteredData.length}건</span>
          </div>
        </div>

        {/* 하위 이슈그룹 탭 (폴더 형태, Expandable) */}
        {activeCategory !== "전체" && availableIGs.length > 0 && (
          <div className={`ob-ig-tabs-wrap ${isIgExpanded ? "expanded" : ""}`}>
            <div className="ob-ig-tabs-inner">
              <div className="ob-ig-tabs">
                {availableIGs.map(ig => (
                  <button
                    key={ig}
                    type="button"
                    className={`ob-ig-tab ${selectedIGs.includes(ig) ? `active theme-${activeCategory}` : ""}`}
                    onClick={() => handleIGToggle(ig)}
                  >
                    {ig}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 테이블 래퍼 */}
        <div className="ob-table-wrap" ref={tableWrapRef}>
          <table className="ob-table">
            <thead>
              <tr>
                <th style={{width:"6%"}}>ID</th>
                <th style={{width:"12%"}}>이슈그룹</th>
                <th style={{width:"30%"}}>체크리스트 내용</th>
                <th style={{width:"12%"}}>데이터 입력</th>
                <th style={{width:"6%"}}>단위</th>
                <th style={{width:"7%"}}>증빙</th>
                <th style={{width:"7%"}}>상태</th>
                <th style={{width:"10%"}}>R&R</th>
                <th style={{width:"10%"}}>액션</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((item, index) => {
                const st = STATUS_CFG[item.status] || STATUS_CFG.NOT_STARTED;
                const actions = getActions(currentUser.roleName, item.status);
                const rnr = rnrDisplay(item.assignees);
                return (
                  <tr key={item.issueId}>
                    <td className="ob-id">{item.issueId}</td>
                    {rowSpans[index] && (
                      <td rowSpan={rowSpans[index]}>
                        <span className={`ob-ig-badge theme-${
                          item.issueId.startsWith("G0") ? "경영일반" : 
                          item.issueId.startsWith("E") ? "E" : 
                          item.issueId.startsWith("S") ? "S" : "G"
                        }`}>
                          {item.issueGroup}
                        </span>
                      </td>
                    )}
                    <td className="ob-question">{item.checklistQuestion}</td>
                    <td>
                      <input
                        type="text"
                        className="ob-input"
                        value={item.value}
                        placeholder="입력"
                        disabled={item.status === "SUBMITTED" || item.status === "APPROVED" || item.status === "COMPLETED"}
                        onChange={(e) => handleValueChange(item.issueId, e.target.value)}
                      />
                    </td>
                    <td className="ob-unit">{item.unit && item.unit !== "-" ? item.unit : ""}</td>
                    <td>
                      <button
                        type="button"
                        className={`ob-evidence-btn ${item.evidenceAttached ? "attached" : ""}`}
                        onClick={() => handleEvidence(item.issueId)}
                      >
                        증빙자료 {item.evidenceAttached ? "첨부됨" : "미첨부"}
                      </button>
                    </td>
                    <td><span className={`ob-status ${st.cls}`}>{st.label}</span></td>
                    {rowSpans[index] && (
                      <td rowSpan={rowSpans[index]}>
                        {rnr ? (
                          <span className="ob-rnr-text" onClick={() => openModal(item.issueGroup)} style={{cursor:"pointer", display:"block"}}>{rnr}</span>
                        ) : (
                          <button type="button" className="ob-rnr-btn" onClick={() => openModal(item.issueGroup)}>
                            + 담당자 지정
                          </button>
                        )}
                      </td>
                    )}
                    <td>
                      <div className="ob-actions">
                        {actions.map(label => (
                          <button
                            key={label}
                            type="button"
                            className={`ob-act-btn ${actionBtnClass(label)}`}
                            onClick={actionHandler(label, item.issueId)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && (
                <tr><td colSpan="10" className="ob-empty">조회된 지표가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pageCount > 1 && (
          <div className="ob-pagination">
            <button 
              type="button" 
              className="ob-page-btn ob-page-nav" 
              style={{ visibility: currentPage > 1 ? "visible" : "hidden" }}
              onClick={() => setCurrentPage(p => p - 1)}
            >‹</button>
            
            <div className="ob-page-numbers">
              {visiblePages.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`ob-page-btn ${p === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <button 
              type="button" 
              className="ob-page-btn ob-page-nav" 
              style={{ visibility: currentPage < pageCount ? "visible" : "hidden" }}
              onClick={() => setCurrentPage(p => p + 1)}
            >›</button>
          </div>
        )}
      </main>

      {/* 담당자 지정 모달 */}
      {modalIG && (
        <div className="ob-modal-overlay" onClick={closeModal}>
          <div className="ob-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ob-modal-header">담당자 지정 — {modalIG}</div>
            <div className="ob-modal-body">
              {modalInputs.map((row, i) => (
                <div key={i} className="ob-modal-row">
                  <input placeholder="이메일" value={row.email} onChange={(e) => updateModalRow(i, "email", e.target.value)} />
                  <input placeholder="이름" value={row.name} onChange={(e) => updateModalRow(i, "name", e.target.value)} />
                  <input placeholder="부서" value={row.department} onChange={(e) => updateModalRow(i, "department", e.target.value)} />
                  {modalInputs.length > 1 && <button type="button" className="ob-modal-del" onClick={() => removeModalRow(i)}>×</button>}
                </div>
              ))}
              <button type="button" className="ob-modal-add" onClick={addModalRow}>+ 담당자 추가</button>
            </div>
            <div className="ob-modal-footer">
              <button type="button" className="ob-modal-btn secondary" onClick={closeModal}>취소</button>
              <button type="button" className="ob-modal-btn primary" onClick={handleInvite}>초대 메일 발송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
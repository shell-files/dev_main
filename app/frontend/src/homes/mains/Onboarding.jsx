import { useMemo, useState, useRef, useEffect } from "react";
import "@styles/onboarding.css";
import INITIAL_METRICS from "@assets/data/onboardingData.js";
import { showDefaultAlert, showConfirmAlert } from "@components/UI/ServiceAlert";
import { useAlarm } from '@hooks/AlarmContext.jsx';
import { useAuth } from '@hooks/AuthContext.jsx';
import Swal from 'sweetalert2';

// =====================================================================================
//
// 1. 데이터: onboarding.csv 기준 231개 지표 (onboardingData.js)
// 2. 탭: 상위(전체/경영일반/E/S/G) + 하위(이슈그룹 멀티셀렉트 칩)
// 3. 액션: 행 단위 임시저장/제출/승인/반려 (하단 액션바 삭제)
// 4. R&R: 이슈그룹 단위 담당자 지정 모달
// 5. 권한: ESG 담당자/컨설턴트/부서 담당자 분기
// 6. API: USE_DUMMY_API 패턴
//
// =====================================================================================

const USE_DUMMY_API = true;
const CATEGORY_TABS = ["전체", "경영일반", "E", "S", "G"];
const ROWS_PER_PAGE = 15;

const STATUS_CFG = {
  NOT_STARTED:       { label: "미입력",  cls: "st-not-started" },
  DRAFT:             { label: "작성중",  cls: "st-draft" },
  SUBMITTED:         { label: "검토 대기중", cls: "st-submitted" },
  EDITING_SUBMITTED: { label: "수정중", cls: "st-editing" },
  APPROVED:          { label: "승인완료", cls: "st-approved" },
  REJECTED:          { label: "반려됨",  cls: "st-rejected" },
};

const STATUS_FILTER_OPTIONS = [
  { key: "DRAFT", label: "작성중", cls: "st-draft", icon: "edit-3" },
  { key: "SUBMITTED", label: "검토", cls: "st-submitted", icon: "send" },
  { key: "REJECTED", label: "반려", cls: "st-rejected", icon: "x-circle" },
];

const DUMMY_USERS = [
  { roleId: 1, roleName: "ESG 담당자", email: "esg@company.com" },
  { roleId: 2, roleName: "컨설턴트",    email: "consultant@company.com" },
  { roleId: 3, roleName: "부서 담당자", email: "dept@company.com" },
];

// ── API 함수 ──
const requestSaveMetricDraftApi = async (metricId, payload) => {
  if (USE_DUMMY_API) return { status: true, message: "임시 저장되었습니다.", data: { metricId, status: "DRAFT" } };
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
    status: true, message: "초대 메일이 발송되었습니다.",
    data: { issueGroup, assignees: assignees.map((a, i) => ({ id: `inv-${Date.now()}-${i}`, ...a, status: "PENDING" })) },
  };
};
const requestRemoveAssigneeApi = async (issueGroup, email) => {
  if (USE_DUMMY_API) return { status: true, message: "담당자가 해제되었습니다." };
};

// ── 버튼 노출 규칙 ──
const getActions = (role, status, isAuthor) => {
  const isManager = role === "ESG 담당자" || role === "ESG담당자";
  const isConsultant = role === "컨설턴트";
  const b = [];
  
  if (status === "APPROVED") return [];

  // 검토 권한 정의: 관리자는 항상, 컨설턴트는 본인이 작성자가 아닐 때만
  const canReview = isManager || (isConsultant && !isAuthor);

  // 1. 작성자 및 관리 권한 액션
  if (isAuthor || status === "NOT_STARTED" || isManager || isConsultant) {
    if (status === "NOT_STARTED") b.push("저장");
    if (status === "DRAFT") { b.push("저장"); b.push("제출"); }
    if (status === "SUBMITTED" && !canReview) b.push("재제출"); 
    if (status === "EDITING_SUBMITTED" || status === "REJECTED") { b.push("저장"); b.push("제출"); }
  }

  // 2. 검토자 액션
  if (canReview && status === "SUBMITTED") {
    b.push("승인");
    b.push("반려");
  }
  
  return b;
};

// ── 뱃지 표시 규칙 ──
const getStatusBadge = (role, status) => {
  if (status === "APPROVED") return "-";
  return null;
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
  const { addNotification } = useAlarm();
  const { user, selectedCompany } = useAuth(); // 전역 계정/회사 상태 가져오기
  const [metrics, setMetrics] = useState(() => INITIAL_METRICS.map(m => ({ ...m })));
  
  // 기존 DUMMY_USERS 대체: AuthContext의 실제 로그인 데이터 사용
  const currentRoleName = selectedCompany?.role || "ESG담당자";
  const currentEmail = selectedCompany?.email || "esg@company.com";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [selectedIGs, setSelectedIGs] = useState([]);
  const [isIgExpanded, setIsIgExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 일괄 처리 및 에러 관련 상태
  const [selectedIds, setSelectedIds] = useState([]);
  const [errors, setErrors] = useState({}); // { issueId: boolean }
  const [shakeIds, setShakeIds] = useState({}); // { issueId: boolean } 애니메이션 트리거용

  // 상태 필터 플로팅 관련
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); // Multi-select array
  const statusMenuRef = useRef(null);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusPanelOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsStatusPanelOpen(false);
    };
    if (isStatusPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isStatusPanelOpen]);

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
  const canViewAll = ["ESG담당자", "ESG 담당자", "컨설턴트", "관리자"].includes(currentRoleName);

  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return metrics.filter(m => {
      // 1. 상태 필터 (도메인 초월 필터 - 다중 선택 지원)
      if (activeStatusFilters.length > 0) {
        if (!activeStatusFilters.includes(m.status)) return false;
      } else {
        // 2. 도메인(카테고리) 필터
        if (activeCategory !== "전체" && m.category !== activeCategory) return false;
        // 3. 이슈그룹 필터
        if (selectedIGs.length > 0 && !selectedIGs.includes(m.issueGroup)) return false;
      }
      
      // 4. 검색 (공통)
      if (s && !m.issueId.toLowerCase().includes(s) && !m.issueName.toLowerCase().includes(s) && !m.checklistQuestion.toLowerCase().includes(s)) return false;
      
      // 5. 권한 필터 (공통)
      if (!canViewAll && !m.assignees.some(a => a.email === currentEmail && a.status === "ACCEPTED")) return false;
      
      return true;
    });
  }, [metrics, searchTerm, activeCategory, selectedIGs, currentEmail, canViewAll, activeStatusFilters]);

  const pageCount = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  // 페이지 범위를 벗어나지 않도록 보정 (필터 변경이나 빠른 클릭 대응)
  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [pageCount, currentPage]);
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
    // 값이 입력되면 에러 제거
    if (value.trim() && errors[id]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setMetrics(prev => prev.map(m => {
      if (m.issueId !== id) return m;
      let nextStatus = m.status;
      if (!value.trim()) {
        // 입력값이 비워지면 미입력 상태로 회귀
        if (["DRAFT", "EDITING_SUBMITTED", "REJECTED"].includes(m.status)) {
          nextStatus = "NOT_STARTED";
        }
      } else {
        // 값이 입력되면 상태 진전
        if (m.status === "NOT_STARTED") nextStatus = "DRAFT";
        if (m.status === "SUBMITTED") nextStatus = "EDITING_SUBMITTED";
      }
      return { ...m, value, status: nextStatus };
    }));
  };

  const handleSaveDraft = async (id) => {
    const m = metrics.find(x => x.issueId === id);
    if (!m.value || !m.value.trim()) {
      setErrors(prev => ({ ...prev, [id]: true }));
      setShakeIds(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setShakeIds(prev => ({ ...prev, [id]: false })), 400);
      return false;
    }
    const r = await requestSaveMetricDraftApi(id, { value: m.value, unit: m.unit });
    if (r.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: x.status === "NOT_STARTED" ? "DRAFT" : x.status } : x));
      return true;
    }
    return false;
  };
  const handleSubmit = async (id) => {
    const m = metrics.find(x => x.issueId === id);
    if (!m.value || !m.value.trim()) {
      setErrors(prev => ({ ...prev, [id]: true }));
      setShakeIds(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setShakeIds(prev => ({ ...prev, [id]: false })), 400);
      return false;
    }
    const r = await requestSubmitMetricApi(id);
    if (r.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "SUBMITTED" } : x));
      return true;
    }
    return false;
  };
  const handleResubmit = (id) => {
    // 재제출을 누르면 다시 수정 가능한 DRAFT 상태로 변경
    setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "DRAFT" } : x));
  };
  const handleApprove = async (id) => {
    const isConfirmed = await showConfirmAlert("승인 확인", "해당 지표를 승인하시겠습니까?", "question");
    if (!isConfirmed) return;
    const r = await requestApproveMetricApi(id);
    if (r.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "APPROVED" } : x));
    }
  };
  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: '<span class="default-swal-title">반려 사유 입력</span>',
      input: 'text',
      inputPlaceholder: '반려 사유를 입력하세요...',
      showCancelButton: true,
      confirmButtonText: '반려',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      heightAuto: false,
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    });
    
    if (!reason) return;
    const r = await requestRejectMetricApi(id, reason);
    if (r.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "REJECTED", rejectReason: reason } : x));
    }
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

  // ── 일괄 처리 핸들러 ──
  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleSelectAll = (isAll) => {
    if (isAll) setSelectedIds(pageData.map(d => d.issueId));
    else setSelectedIds([]);
  };
  const handleBatchSave = async () => {
    let hasError = false;
    for (const id of selectedIds) {
      const success = await handleSaveDraft(id);
      if (!success) hasError = true;
    }
    if (!hasError) {
      setSelectedIds([]);
    }
  };
  const handleBatchSubmit = async () => {
    let hasError = false;
    for (const id of selectedIds) {
      const m = metrics.find(x => x.issueId === id);
      if (!m.value || !m.value.trim()) {
        setErrors(prev => ({ ...prev, [id]: true }));
        setShakeIds(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setShakeIds(prev => ({ ...prev, [id]: false })), 400);
        hasError = true;
      } else {
        await handleSubmit(id);
      }
    }
    if (!hasError) {
      setSelectedIds([]);
    }
  };
  const handleBatchApprove = async () => {
    // 승인 가능한(검토 대기 중인) 항목들만 필터링
    const targetIds = selectedIds.filter(id => {
      const m = metrics.find(x => x.issueId === id);
      return m && (m.status === "SUBMITTED" || m.status === "EDITING_SUBMITTED");
    });

    if (targetIds.length === 0) {
      showDefaultAlert("승인 불가", "승인 가능한(검토 대기 중인) 항목이 선택되지 않았습니다.", "warning");
      return;
    }

    const isConfirmed = await showConfirmAlert("일괄 승인", `선택한 ${targetIds.length}건의 항목을 모두 승인하시겠습니까?`, "question");
    if (!isConfirmed) return;

    for (const id of targetIds) {
      await requestApproveMetricApi(id);
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "APPROVED" } : x));
    }
    setSelectedIds([]);
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
      setModalInputs([{ email: "", name: "", department: "" }]);
      showDefaultAlert("초대 완료", "담당자 초대가 완료되었습니다.", "success");
      const m = metrics.find(x => x.issueGroup === modalIG);
      const cat = m ? m.category : 'default';
      const colorId = cat === 'E' ? 'E' : cat === 'S' ? 'S' : cat === 'G' ? 'G' : 'default';
      
      const names = valid.map(v => v.name).join(', ');
      addNotification(
        `${names} 담당자님께 초대 요청했습니다.`, 
        'USER', 
        '담당자 초대 발송', 
        { text: modalIG, colorId }
      );
    }
  };

  const handleRemoveAssignee = async (email) => {
    const isConfirmed = await showConfirmAlert("담당자 해제", "해당 담당자를 정말 해제하시겠습니까?", "warning");
    if (!isConfirmed) return;
    const r = await requestRemoveAssigneeApi(modalIG, email);
    if (r.status) {
      setMetrics(prev => prev.map(m => m.issueGroup === modalIG ? {
        ...m, assignees: m.assignees.filter(a => a.email !== email)
      } : m));
      showDefaultAlert("해제 완료", "담당자가 목록에서 제거되었습니다.", "success");
    }
  };

  const handleResendInvite = (email) => {
    showDefaultAlert("재발송 완료", `${email} 주소로 초대 메일을 재발송했습니다.`, "success");
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
    if (label === "저장") return "ob-act-draft";
    if (label === "제출" || label === "재제출") return "ob-act-submit";
    if (label === "승인") return "ob-act-approve";
    if (label === "반려") return "ob-act-reject";
    return "";
  };
  const actionHandler = (label, id) => {
    if (label === "저장") return () => handleSaveDraft(id);
    if (label === "제출") return () => handleSubmit(id);
    if (label === "재제출") return () => handleResubmit(id);
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
          {/* 상위 탭 영역 */}
          <div className="ob-header-left">
            <div className="ob-cat-tabs-container">
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

              {/* 상태 필터 플로팅 트리거 & 팝오버 */}
              <div className="ob-status-floating-wrap" ref={statusMenuRef}>
                <button 
                  type="button" 
                  className={`ob-status-circular-trigger ${isStatusPanelOpen ? "active" : ""} ${activeStatusFilters.length > 0 ? "filtering" : ""}`}
                  onClick={() => setIsStatusPanelOpen(!isStatusPanelOpen)}
                  title="상태 필터"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  {activeStatusFilters.length > 0 && <div className="ob-status-dot" />}
                </button>

                  <div className={`ob-status-radial-menu ${isStatusPanelOpen ? "open" : ""}`}>
                    {/* 해제 버튼을 첫 번째(시계방향 시작)로 배치 */}
                    <button 
                      className="ob-radial-item reset"
                      style={{ "--idx": 0, "--total": 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStatusFilters([]); // Clear all
                      }}
                    >
                      <div className="ob-radial-icon">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      </div>
                      <span className="ob-radial-label">해제</span>
                    </button>

                    {STATUS_FILTER_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.key}
                        className={`ob-radial-item ${opt.cls} ${activeStatusFilters.includes(opt.key) ? "selected" : ""}`}
                        style={{ "--idx": i + 1, "--total": 4 }}
                        onClick={(e) => {
                          e.stopPropagation(); // Don't close parent
                          setActiveStatusFilters(prev => 
                            prev.includes(opt.key) 
                              ? prev.filter(k => k !== opt.key) 
                              : [...prev, opt.key]
                          );
                        }}
                      >
                        <div className="ob-radial-icon">
                          {opt.icon === "edit-3" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
                          {opt.icon === "send" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                          {opt.icon === "x-circle" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                        </div>
                        <span className="ob-radial-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
              </div>
            </div>
          </div>

          {/* 일괄 처리 툴바 */}
          {selectedIds.length > 0 && (
            <div className="ob-batch-toolbar">
              <span className="ob-batch-count"><strong>{selectedIds.length}</strong>건 선택됨</span>
              <div className="ob-batch-btns">
                <button type="button" className="ob-batch-btn save" onClick={handleBatchSave}>선택 저장</button>
                <button type="button" className="ob-batch-btn submit" onClick={handleBatchSubmit}>선택 제출</button>
                {(currentRoleName === "ESG 담당자" || currentRoleName === "ESG담당자" || currentRoleName === "컨설턴트") && (
                  <button type="button" className="ob-batch-btn approve" onClick={handleBatchApprove}>선택 승인</button>
                )}
              </div>
            </div>
          )}

          {/* 툴바 (우측) */}
          <div className="ob-toolbar-right">
            <span className="ob-count">총 {filteredData.length.toLocaleString()}건</span>
            {/* 기존 더미 권한 선택 select 제거, 현재 사용자의 회사 및 권한 뱃지로 표시 */}
            <div className="ob-current-auth-badge" style={{display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0'}}>
              <span style={{fontWeight: 600, color: '#3b82f6'}}>{selectedCompany?.company_name || "A회사"}</span>
              <span style={{width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1'}}></span>
              <span>{currentRoleName}</span>
            </div>
            <input
              type="text"
              className="ob-search"
              placeholder="지표 검색..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* 하위 이슈그룹 탭 (폴더 형태, Expandable) - DOM 상시 유지 */}
        <div className={`ob-ig-tabs-wrap ${(isIgExpanded && activeCategory !== "전체" && availableIGs.length > 0) ? "expanded" : ""}`}>
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

        {/* 테이블 래퍼 */}
        <div className="ob-table-wrap" ref={tableWrapRef}>
          <table className="ob-table">
            <thead>
              <tr>
                <th style={{width:"6%"}}>
                  <div className="cell-id-head">
                    <input 
                      type="checkbox" 
                      className="ob-checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === pageData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    ID
                  </div>
                </th>
                <th style={{width:"11%"}}>이슈그룹 / R&R</th>
                <th style={{width:"29%"}}>체크리스트 내용</th>
                <th style={{width:"24%"}}>데이터 입력</th>
                <th style={{width:"6%"}}></th>
                <th style={{width:"8%"}}>증빙</th>
                <th style={{width:"7%"}}>상태</th>
                <th style={{width:"9%"}}>액션</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((item, index) => {
                const st = STATUS_CFG[item.status] || STATUS_CFG.NOT_STARTED;
                const isAuthor = item.assignees.some(a => a.email === currentEmail);
                const actions = getActions(currentRoleName, item.status, isAuthor);
                const rnr = rnrDisplay(item.assignees);
                const isGroupStart = !!rowSpans[index];
                return (
                  <tr key={item.issueId} className={`ob-tr-status-${item.status.toLowerCase()} ${isGroupStart ? "group-start" : ""}`}>
                    <td className={`cell-id theme-${item.category}`}>
                      <div className="cell-id-inner">
                        <input 
                          type="checkbox" 
                          className="ob-checkbox"
                          checked={selectedIds.includes(item.issueId)}
                          onChange={() => handleSelectRow(item.issueId)}
                        />
                        {item.issueId}
                      </div>
                    </td>
                    {rowSpans[index] && (
                      <td className={`cell-issue-group theme-${item.category}`} rowSpan={rowSpans[index]}>
                        <div className="ob-ig-container">
                          <span className={`ob-ig-badge theme-${item.category}`}>
                            {item.issueGroup}
                          </span>
                          <div className="ob-ig-rnr">
                            {rnr ? (
                              <span className={`ob-rnr-text theme-${item.category}`} onClick={() => openModal(item.issueGroup)}>{rnr}</span>
                            ) : (
                              <button type="button" className={`ob-rnr-btn theme-${item.category}`} onClick={() => openModal(item.issueGroup)}>
                                + 담당자
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="cell-checklist">
                      <span className="checklist-text">{item.checklistQuestion}</span>
                    </td>
                    <td className="cell-input">
                      <div className="ob-input-container">
                        <input
                          type="text"
                          className={`ob-input ${errors[item.issueId] ? "error" : ""} ${shakeIds[item.issueId] ? "shake" : ""}`}
                          value={item.value}
                          placeholder="입력"
                          disabled={["SUBMITTED", "APPROVED"].includes(item.status)}
                          onChange={(e) => {
                            handleValueChange(item.issueId, e.target.value);
                            setErrors(prev => ({ ...prev, [item.issueId]: false }));
                          }}
                          onFocus={() => {
                            setErrors(prev => ({ ...prev, [item.issueId]: false }));
                          }}
                        />
                        {errors[item.issueId] && <span className="ob-error-msg">데이터를 입력해주세요.</span>}
                      </div>
                    </td>
                    <td className="cell-unit" title={item.unit && item.unit !== "-" ? item.unit : ""}>
                      <span className="unit-text">{item.unit && item.unit !== "-" ? item.unit : ""}</span>
                    </td>
                    <td className="cell-evidence">
                      <button
                        type="button"
                        className={`ob-evidence-btn ${item.evidenceAttached ? "attached" : ""}`}
                        onClick={() => handleEvidence(item.issueId)}
                      >
                        증빙자료 {item.evidenceAttached ? "첨부됨" : "미첨부"}
                      </button>
                    </td>
                    <td className="cell-status">
                      <div className="ob-status-wrap">
                        <span className={`ob-status ${st.cls}`}>{st.label}</span>
                        {(() => {
                          const isAssigned = item.assignees.length > 0;
                          const isAuthor = item.assignees.some(a => a.email === currentEmail) || !isAssigned;
                          const canReview = (currentRoleName === "ESG담당자" || currentRoleName === "ESG 담당자") || (currentRoleName === "컨설턴트" && !isAuthor);
                          
                          return item.status === "SUBMITTED" && canReview && (
                            <button 
                              type="button" 
                              className="ob-status-sub-btn"
                              onClick={actionHandler("재제출", item.issueId)}
                            >
                              재제출
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="cell-action">
                      <div className="ob-actions">
                        {(() => {
                          const isAssigned = item.assignees.length > 0;
                          const isAuthor = item.assignees.some(a => a.email === currentEmail) || !isAssigned;
                          const actions = getActions(currentRoleName, item.status, isAuthor);
                          return actions.length > 0 ? (
                            actions.map(label => (
                              <button
                                key={label}
                                type="button"
                                className={`ob-act-btn ${actionBtnClass(label)}`}
                                onClick={actionHandler(label, item.issueId)}
                              >
                                {label}
                              </button>
                            ))
                          ) : (
                            <span className="ob-action-badge-empty">
                              {getStatusBadge(currentRoleName, item.status)}
                            </span>
                          );
                        })()}
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
              disabled={currentPage <= 1}
              style={{ visibility: currentPage > 1 ? "visible" : "hidden" }}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              disabled={currentPage >= pageCount}
              style={{ visibility: currentPage < pageCount ? "visible" : "hidden" }}
              onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
            >›</button>
          </div>
        )}
      </main>

      {/* 담당자 지정 모달 */}
      {modalIG && (
        <div className="ob-modal-overlay" onClick={closeModal}>
          <div className={`ob-modal theme-${activeCategory}`} onClick={(e) => e.stopPropagation()}>
            <div className="ob-modal-header">
              <span className="ob-modal-title">담당자 지정</span>
              <span className={`ob-ig-badge theme-${activeCategory}`}>
                {modalIG}
              </span>
            </div>
            
            <div className="ob-modal-body">
              {/* 1. 신규 초대 섹션 */}
              <div className="ob-modal-section">
                <div className="ob-modal-section-title">새 담당자 초대</div>
                <div className="ob-modal-invite-list">
                  {modalInputs.map((row, i) => (
                    <div className="ob-modal-invite-row" key={i}>
                      <input 
                        type="email" 
                        placeholder="이메일 주소 입력" 
                        value={row.email} 
                        onChange={(e) => updateModalRow(i, "email", e.target.value)} 
                      />
                      <input 
                        type="text" 
                        placeholder="이름 입력" 
                        value={row.name} 
                        onChange={(e) => updateModalRow(i, "name", e.target.value)} 
                      />
                      <input 
                        type="text" 
                        placeholder="부서명 입력" 
                        value={row.department} 
                        onChange={(e) => updateModalRow(i, "department", e.target.value)} 
                      />
                      {modalInputs.length > 1 && (
                        <button type="button" className="ob-modal-row-del" onClick={() => removeModalRow(i)}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="ob-modal-add-btn" onClick={addModalRow}>
                  + 초대 대상 추가
                </button>
              </div>

              {/* 2. 현재 목록 섹션 */}
              <div className="ob-modal-section">
                <div className="ob-modal-section-title">현재 담당자 / 초대 대기 목록</div>
                <div className="ob-modal-assignee-table-wrap">
                  <table className="ob-modal-assignee-table">
                    <thead>
                      <tr>
                        <th>이메일</th>
                        <th>이름</th>
                        <th>부서</th>
                        <th>상태</th>
                        <th>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getIGAssignees(modalIG).length > 0 ? (
                        getIGAssignees(modalIG).map(a => (
                          <tr key={a.email}>
                            <td className="m-cell-email">{a.email}</td>
                            <td>{a.name}</td>
                            <td>{a.department}</td>
                            <td>
                              <span className={`ob-m-status ${a.status === "ACCEPTED" ? "st-accepted" : "st-pending"}`}>
                                {a.status === "ACCEPTED" ? "지정 완료" : "수락 대기"}
                              </span>
                            </td>
                            <td>
                              <div className="ob-modal-assignee-actions">
                                {a.status === "PENDING" && (
                                  <button type="button" className="m-act-btn resend" onClick={() => handleResendInvite(a.email)}>재발송</button>
                                )}
                                <button type="button" className="m-act-btn remove" onClick={() => handleRemoveAssignee(a.email)}>해제</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="ob-modal-empty-list">등록된 담당자가 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="ob-modal-footer">
              <button type="button" className="ob-modal-btn secondary" onClick={closeModal}>취소</button>
              <button 
                type="button" 
                className="ob-modal-btn primary" 
                onClick={handleInvite}
                disabled={!modalInputs.some(r => r.email && r.name)}
              >
                초대 메일 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
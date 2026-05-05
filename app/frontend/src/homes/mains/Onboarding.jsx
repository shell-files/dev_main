/**
 * Onboarding.jsx 페이지 흐름 및 구조 가이드
 * 
 * 1. 데이터 흐름 (Data Flow):
 *    - 원본 데이터: metrics (onboardingData.js에서 로드 및 localStorage와 동기화)
 *    - 필터링 데이터: filteredData (검색어, 카테고리, 이슈그룹, 상태 필터가 적용된 결과)
 *    - 페이지 데이터: pageData (filteredData를 15개씩 자른 현재 페이지 데이터)
 * 
 * 2. 상태(State) 구성:
 *    - activeCategory / selectedIGs: 상단/하단 탭을 통한 도메인 필터링 상태
 *    - activeStatusFilters: 우측 상단 플로팅 메뉴를 통한 상태별(작성중 등) 필터링
 *    - selectedIds: 테이블 체크박스를 통한 일괄 처리 대상 관리
 *    - modalIG: R&R 지정을 위한 이슈그룹 모달 제어 상태
 * 
 * 3. 주요 핸들러 로직:
 *    - validateAndRun: 데이터 입력 여부 검증 후 API 콜백 실행 (Shake 애니메이션 포함)
 *    - handleBatch: 선택된 다수 항목에 대해 순차적으로 save/submit/approve 수행
 *    - sendNoti: 각 액션 성공 시 알림 센터(AlarmContext)를 통해 타겟 역할에게 알림 발송
 * 
 * 4. 외부 연동:
 *    - useAlarm: 실시간 알림 발송 및 내역 기록
 *    - useAuth: 현재 로그인한 사용자의 회사, 권한, 이메일 정보 참조
 *    - requestApi: 실제 백엔드 연동을 위한 통신 객체
 */

import { useMemo, useState, useRef, useEffect } from "react";
import "@styles/onboarding.css";
import INITIAL_METRICS from "@mains/onboarding/onboardingData.js";
import { showDefaultAlert, showConfirmAlert } from "@components/ServiceAlert/ServiceAlert";
import { useAlarm } from '@hooks/AlarmContext.jsx';
import { useAuth } from '@hooks/AuthContext.jsx';
import Swal from 'sweetalert2';

// ── 0. API 설정 ──
// USE_DUMMY_API: true일 경우 백엔드 없이 더미 데이터를 반환. 실서버 연동 시 false로 변경.
const USE_DUMMY_API = true;

// ── 1. requestApi: 온보딩 대시보드 통신 함수 모음 ──
const requestApi = {
  // 1-1. saveDraft: 지표 데이터 임시 저장
  saveDraft: async (id, payload) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 400));
      return { status: true, message: "임시 저장되었습니다.", data: { metricId: id, status: "DRAFT" } };
    }
    // const res = await api.post(`/onboarding/metrics/${id}/draft`, payload);
    // return res.data;
  },

  // 1-2. submit: 지표 데이터 제출 (검토 요청)
  submit: async (id) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 500));
      return { status: true, message: "제출되었습니다.", data: { metricId: id, status: "SUBMITTED" } };
    }
    // const res = await api.post(`/onboarding/metrics/${id}/submit`);
    // return res.data;
  },

  // 1-3. approve: 데이터 승인
  approve: async (id) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 500));
      return { status: true, message: "승인되었습니다.", data: { metricId: id, status: "APPROVED" } };
    }
    // const res = await api.post(`/onboarding/metrics/${id}/approve`);
    // return res.data;
  },

  // 1-4. reject: 데이터 반려
  reject: async (id, reason) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 500));
      return { status: true, message: "반려되었습니다.", data: { metricId: id, status: "REJECTED", reason } };
    }
    // const res = await api.post(`/onboarding/metrics/${id}/reject`, { reason });
    // return res.data;
  },

  // 1-5. uploadEvidence: 증빙자료 업로드
  uploadEvidence: async (id, file) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 700));
      return { status: true, data: { metricId: id, fileName: file.name } };
    }
    // const res = await api.post(`/onboarding/metrics/${id}/evidence`, formData);
    // return res.data;
  },

  // 1-6. invite: 담당자 초대 (R&R)
  invite: async (ig, users) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 800));
      return { 
        status: true, 
        data: { assignees: users.map((u, i) => ({ id: `inv-${Date.now()}-${i}`, ...u, status: "ACCEPTED" })) } 
      };
    }
    // const res = await api.post(`/onboarding/issue-groups/${ig}/invite`, { users });
    // return res.data;
  },

  // 1-7. remove: 담당자 해제
  remove: async (ig, email) => {
    if (USE_DUMMY_API) {
      await new Promise(r => setTimeout(r, 400));
      return { status: true };
    }
    // const res = await api.delete(`/onboarding/issue-groups/${ig}/assignees`, { data: { email } });
    // return res.data;
  }
};

// ── 2. Constants & Config ──
const CATEGORY_TABS = ["전체", "경영일반", "E", "S", "G"];
const ROWS_PER_PAGE = 15;
const STATUS_CFG = {
  NOT_STARTED: { label: "미입력", cls: "st-not-started" },
  DRAFT: { label: "작성중", cls: "st-draft" },
  SUBMITTED: { label: "검토 대기중", cls: "st-submitted" },
  EDITING_SUBMITTED: { label: "수정중", cls: "st-editing" },
  APPROVED: { label: "승인완료", cls: "st-approved" },
  REJECTED: { label: "반려됨", cls: "st-rejected" },
};
const STATUS_FILTER_OPTIONS = [
  { key: "DRAFT", label: "작성중", cls: "st-draft", icon: "edit-3" },
  { key: "SUBMITTED", label: "검토", cls: "st-submitted", icon: "send" },
  { key: "REJECTED", label: "반려", cls: "st-rejected", icon: "x-circle" },
];

/**
 * [헬퍼] Icon: 복잡한 SVG 아이콘을 한 줄로 렌더링하기 위한 컴포넌트
 */
const Icon = ({ type, size = 14, ...props }) => {
  const icons = {
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    reset: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>,
    edit3: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    xCircle: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {icons[type]}
    </svg>
  );
};

/**
 * [함수] getActions: 역할 및 현재 상태에 따라 노출할 액션 버튼 목록을 반환
 */
const getActions = (role, status, isAuthor) => {
  if (status === "APPROVED") return [];
  const isManager = ["ESG담당자", "ESG 담당자"].includes(role);
  const isConsultant = role === "컨설턴트";
  const canReview = isManager || (isConsultant && !isAuthor);
  const acts = [];
  if (isAuthor || status === "NOT_STARTED" || isManager || isConsultant) {
    if (["NOT_STARTED", "DRAFT", "REJECTED", "EDITING_SUBMITTED"].includes(status)) acts.push("저장");
    if (["DRAFT", "REJECTED", "EDITING_SUBMITTED"].includes(status)) acts.push("제출");
    if (status === "SUBMITTED" && !canReview) acts.push("재제출");
  }
  if (canReview && status === "SUBMITTED") acts.push("승인", "반려");
  return acts;
};

/**
 * [함수] rnrDisplay: 담당자 수락 상태를 바탕으로 테이블에 표시될 텍스트 반환
 */
const rnrDisplay = (assignees = []) => {
  const accepted = assignees.filter(a => a.status === "ACCEPTED");
  const pending = assignees.filter(a => a.status === "PENDING");
  if (!accepted.length && pending.length) return `수락대기 ${pending.length}명`;
  return accepted.length > 1 ? `${accepted[0].name} 외 ${accepted.length-1}명` : accepted[0]?.name || null;
};

const Onboarding = () => {
  // [연결] useAlarm(): 실시간 알림 센터 연동
  const { addNotification } = useAlarm();
  
  // [연결] useAuth(): 로그인 사용자 정보 및 소속 회사 정보 연동
  const { user, selectedCompany } = useAuth();
  
  // [변수] metrics: 온보딩 대시보드 전체 지표 데이터
  const [metrics, setMetrics] = useState(() => JSON.parse(localStorage.getItem('onboarding_metrics_dummy')) || INITIAL_METRICS);
  
  // ── States (UI & 필터링) ──
  const [searchTerm, setSearchTerm] = useState("");              // 검색어
  const [activeCategory, setActiveCategory] = useState("전체");    // 선택된 카테고리 (E/S/G 등)
  const [selectedIGs, setSelectedIGs] = useState([]);             // 다중 선택된 이슈그룹
  const [isIgExpanded, setIsIgExpanded] = useState(false);        // 이슈그룹 탭 확장 여부
  const [currentPage, setCurrentPage] = useState(1);              // 현재 페이지 번호
  const [selectedIds, setSelectedIds] = useState([]);             // 체크된 지표 ID 목록
  const [errors, setErrors] = useState({});                       // 필드별 에러 상태
  const [shakeIds, setShakeIds] = useState({});                   // 에러 시 Shake 애니메이션 트리거
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false); // 상태 필터 패널 오픈 여부
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); // 선택된 상태 필터 (작성중/검토 등)
  const [modalIG, setModalIG] = useState(null);                   // 모달이 열린 이슈그룹 이름 (null이면 모달 닫힘)
  const [modalInputs, setModalInputs] = useState([{ email: "", name: "", department: "" }]); // 모달 입력 폼

  // Refs
  const statusMenuRef = useRef(null);
  const tabsRef = useRef([]);
  const tableWrapRef = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  // ── Effects ──
  
  // [이펙트] 데이터 변경 시 로컬 스토리지 동기화
  useEffect(() => localStorage.setItem('onboarding_metrics_dummy', JSON.stringify(metrics)), [metrics]);
  
  // [테스트 권한 설정] 실 서비스에서는 selectedCompany?.role을 사용합니다.
  const TESTING_ROLE = "ESG담당자"; 
  const currentRoleName = TESTING_ROLE || selectedCompany?.role || "ESG담당자";
  const currentEmail = TESTING_ROLE ? (TESTING_ROLE === "부서 담당자" ? "dept@company.com" : TESTING_ROLE === "컨설턴트" ? "consultant@company.com" : "esg@company.com") : (selectedCompany?.email || "esg@company.com");
  
  // [이펙트] 현재 테스트 권한명을 저장 (알림 센터 등 타 컴포넌트와 동기화용)
  useEffect(() => { localStorage.setItem('onboarding_test_role', currentRoleName); }, [currentRoleName]);

  // [이펙트] 메뉴 바깥 클릭 또는 ESC 키 감지하여 패널 닫기
  useEffect(() => {
    const handleOutside = (e) => statusMenuRef.current && !statusMenuRef.current.contains(e.target) && setIsStatusPanelOpen(false);
    const handleEsc = (e) => e.key === "Escape" && setIsStatusPanelOpen(false);
    if (isStatusPanelOpen) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => { document.removeEventListener("mousedown", handleOutside); document.removeEventListener("keydown", handleEsc); };
  }, [isStatusPanelOpen]);

  // [이펙트] 카테고리 탭 변경 시 하단 슬라이더 위치 및 창 크기 대응
  useEffect(() => {
    const updateSlider = () => {
      const activeTab = tabsRef.current[CATEGORY_TABS.indexOf(activeCategory)];
      if (activeTab) setSliderStyle({ left: activeTab.offsetLeft, width: activeTab.offsetWidth });
    };
    updateSlider();
    window.addEventListener("resize", updateSlider);
    return () => window.removeEventListener("resize", updateSlider);
  }, [activeCategory]);

  // [이펙트] 페이지 번호 변경 시 테이블 스크롤 최상단으로 초기화
  useEffect(() => { if (tableWrapRef.current) tableWrapRef.current.scrollTop = 0; }, [currentPage]);

  // ── Data Filtering Logic ──

  // [변수] availableIGs: 현재 선택된 카테고리에 속한 이슈그룹 목록 추출
  const availableIGs = useMemo(() => activeCategory === "전체" ? [] : [...new Set(metrics.filter(m => m.category === activeCategory).map(m => m.issueGroup))], [metrics, activeCategory]);
  
  // [변수] canViewAll: 전체 지표를 볼 수 있는 권한(관리자 등)인지 확인
  const canViewAll = ["ESG담당자", "ESG 담당자", "컨설턴트", "관리자"].includes(currentRoleName);
  
  // [변수] filteredData: 모든 필터 조건을 적용한 최종 지표 리스트
  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return metrics.filter(m => {
      if (activeStatusFilters.length && !activeStatusFilters.includes(m.status)) return false;
      if (!activeStatusFilters.length) {
        if (activeCategory !== "전체" && m.category !== activeCategory) return false;
        if (selectedIGs.length && !selectedIGs.includes(m.issueGroup)) return false;
      }
      if (s && !m.issueId.toLowerCase().includes(s) && !m.issueName.toLowerCase().includes(s) && !m.checklistQuestion.toLowerCase().includes(s)) return false;
      return canViewAll || m.assignees.some(a => a.email === currentEmail && a.status === "ACCEPTED");
    });
  }, [metrics, searchTerm, activeCategory, selectedIGs, currentEmail, canViewAll, activeStatusFilters]);

  // [변수] pageCount / pageData: 페이지네이션 처리를 위한 변수들
  const pageCount = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const pageData = useMemo(() => filteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE), [filteredData, currentPage]);
  
  // [변수] rowSpans: 테이블의 이슈그룹 열(Td) 병합을 위한 스팬 계산
  const rowSpans = useMemo(() => {
    const spans = {};
    pageData.forEach((item, i) => {
      if (i === 0 || pageData[i - 1].issueGroup !== item.issueGroup) {
        let span = 1;
        for (let j = i + 1; j < pageData.length && pageData[j].issueGroup === item.issueGroup; j++) span++;
        spans[i] = span;
      }
    });
    return spans;
  }, [pageData]);

  // ── Handlers (Actions & API) ──

  /**
   * [함수] validateAndRun: 데이터 입력 여부 검증 후 비즈니스 로직(API 호출 등) 실행
   */
  const validateAndRun = async (id, callback) => {
    const m = metrics.find(x => x.issueId === id);
    if (!m.value?.trim()) {
      setErrors(p => ({ ...p, [id]: true }));
      setShakeIds(p => ({ ...p, [id]: true }));
      setTimeout(() => setShakeIds(p => ({ ...p, [id]: false })), 400);
      return false;
    }
    return await callback(m);
  };

  /**
   * [함수] sendNoti: 알림 발송 래퍼 (카테고리별 컬러 매칭 포함)
   */
  const sendNoti = (m, type, title, targetRole) => {
    const colorId = ['E','S','G'].includes(m.category) ? m.category : 'default';
    addNotification({ content: m.content, type, title, meta: { text: m.issueId || m.id, colorId }, targetRole });
  };

  /**
   * [핸들러] handleSaveDraft: 임시저장 수행
   */
  const handleSaveDraft = (id) => validateAndRun(id, async (m) => {
    const res = await requestApi.saveDraft(id, { value: m.value, unit: m.unit });
    if (res.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: x.status === "NOT_STARTED" ? "DRAFT" : x.status } : x));
      return true;
    }
    return false;
  });

  /**
   * [핸들러] handleSubmit: 제출(검토 요청) 수행 및 담당자 알림 발송
   */
  const handleSubmit = (id) => validateAndRun(id, async (m) => {
    const res = await requestApi.submit(id);
    if (res.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "SUBMITTED" } : x));
      const role = currentRoleName;
      if (role === "부서 담당자") {
        ["ESG담당자", "컨설턴트"].forEach(r => sendNoti({ ...m, content: `${user?.name || '부서 담당자'}님이 데이터 승인을 요청하셨습니다.` }, 'CHECK', '데이터 승인 요청', r));
      } else if (role === "컨설턴트") {
        sendNoti({ ...m, content: `${user?.name || '컨설턴트'}님이 데이터 승인을 요청하셨습니다.` }, 'CHECK', '데이터 승인 요청', "ESG담당자");
      }
      return true;
    }
    return false;
  });

  /**
   * [핸들러] handleApprove: 데이터 승인 수행
   */
  const handleApprove = async (id) => {
    if (!(await showConfirmAlert("승인 확인", "해당 지표를 승인하시겠습니까?", "question"))) return;
    const res = await requestApi.approve(id);
    if (res.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "APPROVED" } : x));
      sendNoti({ issueId: id, category: metrics.find(x => x.issueId === id)?.category, content: `${id}번 승인이 완료되었습니다.` }, 'CHECK', '데이터 승인 완료', "부서 담당자");
    }
  };

  /**
   * [핸들러] handleReject: 데이터 반려 및 사유 입력 수행
   */
  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({ title: '<span class="default-swal-title">반려 사유 입력</span>', input: 'text', showCancelButton: true, confirmButtonText: '반려', confirmButtonColor: '#ef4444', customClass: { popup: 'custom-swal-popup' } });
    if (!reason) return;
    const res = await requestApi.reject(id, reason);
    if (res.status) {
      setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "REJECTED", rejectReason: reason } : x));
      sendNoti({ issueId: id, category: metrics.find(x => x.issueId === id)?.category, content: `${id}번 반려되었습니다.` }, 'CHECK', '데이터 반려 안내', "부서 담당자");
    }
  };

  /**
   * [핸들러] handleBatch: 선택된 지표들에 대해 일괄 처리 수행
   */
  const handleBatch = async (type) => {
    for (const id of selectedIds) {
      if (type === 'save') await handleSaveDraft(id);
      if (type === 'submit') await handleSubmit(id);
      if (type === 'approve') {
        const m = metrics.find(x => x.issueId === id);
        if (m && ["SUBMITTED", "EDITING_SUBMITTED"].includes(m.status)) {
          const res = await requestApi.approve(id);
          if (res.status) {
            setMetrics(prev => prev.map(x => x.issueId === id ? { ...x, status: "APPROVED" } : x));
            sendNoti({ issueId: id, category: m.category, content: `${id}번 승인이 완료되었습니다. (일괄)` }, 'CHECK', '데이터 승인 완료', "부서 담당자");
          }
        }
      }
    }
    setSelectedIds([]);
  };

  /**
   * [핸들러] handleInvite: R&R 모달에서 새 담당자 초대 발송
   */
  const handleInvite = async () => {
    const valid = modalInputs.filter(r => r.email && r.name);
    if (!valid.length) return;
    const res = await requestApi.invite(modalIG, valid);
    if (res.status) {
      setMetrics(prev => prev.map(m => m.issueGroup === modalIG ? { ...m, assignees: [...m.assignees, ...res.data.assignees] } : m));
      setModalInputs([{ email: "", name: "", department: "" }]);
      showDefaultAlert("초대 완료", "담당자 초대가 완료되었습니다.", "success");
      const cat = metrics.find(x => x.issueGroup === modalIG)?.category || 'default';
      sendNoti({ id: modalIG, category: cat, content: `${valid.map(v => v.name).join(', ')} 담당자님께 초대 메일을 송부하였습니다.` }, 'USER', '담당자 초대 발송', currentRoleName);
      sendNoti({ id: modalIG, category: cat, content: `${selectedCompany?.company_name || '차성자'}님으로부터 담당자 초대를 받았습니다.` }, 'USER', '담당자 초대 수신', "부서 담당자");
    }
  };

  return (
    <div id="onboarding_page">
      <main className="ob-body">
        {/* 상단 통합 헤더: 탭, 필터, 툴바, 검색 */}
        <div className="ob-header-row">
          <div className="ob-header-left">
            <div className="ob-cat-tabs-container">
              <div className="ob-cat-tabs">
                <div className={`ob-tab-slider bg-${activeCategory}`} style={sliderStyle} />
                {CATEGORY_TABS.map((tab, i) => (
                  <button key={tab} ref={el => tabsRef.current[i] = el} type="button" className={`ob-cat-tab ${activeCategory === tab ? "active" : ""}`} onClick={() => { setActiveCategory(tab); setSelectedIGs([]); setIsIgExpanded(false); setCurrentPage(1); }}>
                    {tab}
                    {activeCategory === tab && tab !== "전체" && (
                      <div className={`ob-tab-expander ${isIgExpanded ? "expanded" : ""}`} onClick={(e) => { e.stopPropagation(); setIsIgExpanded(!isIgExpanded); }}>
                        <Icon type="chevronDown" strokeWidth="3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 상태 필터 플로팅 메뉴 */}
              <div className="ob-status-floating-wrap" ref={statusMenuRef}>
                <button type="button" className={`ob-status-circular-trigger ${isStatusPanelOpen ? "active" : ""} ${activeStatusFilters.length ? "filtering" : ""}`} onClick={() => setIsStatusPanelOpen(!isStatusPanelOpen)}>
                  <Icon type="filter" size={18} />
                  {activeStatusFilters.length > 0 && <div className="ob-status-dot" />}
                </button>
                <div className={`ob-status-radial-menu ${isStatusPanelOpen ? "open" : ""}`}>
                  <button className="ob-radial-item reset" style={{ "--idx": 0, "--total": 4 }} onClick={() => setActiveStatusFilters([])}>
                    <div className="ob-radial-icon"><Icon type="reset" size={12} /></div>
                    <span className="ob-radial-label">해제</span>
                  </button>
                  {STATUS_FILTER_OPTIONS.map((opt, i) => (
                    <button key={opt.key} className={`ob-radial-item ${opt.cls} ${activeStatusFilters.includes(opt.key) ? "selected" : ""}`} style={{ "--idx": i + 1, "--total": 4 }}
                      onClick={() => setActiveStatusFilters(p => p.includes(opt.key) ? p.filter(k => k !== opt.key) : [...p, opt.key])}>
                      <div className="ob-radial-icon"><Icon type={opt.icon === "edit-3" ? "edit3" : opt.icon === "send" ? "send" : "xCircle"} size={12} /></div>
                      <span className="ob-radial-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 일괄 처리 툴바 (체크박스 선택 시 노출) */}
          {selectedIds.length > 0 && (
            <div className="ob-batch-toolbar">
              <span className="ob-batch-count"><strong>{selectedIds.length}</strong>건 선택됨</span>
              <div className="ob-batch-btns">
                <button type="button" className="ob-batch-btn save" onClick={() => handleBatch('save')}>선택 저장</button>
                <button type="button" className="ob-batch-btn submit" onClick={() => handleBatch('submit')}>선택 제출</button>
                {["ESG 담당자", "ESG담당자", "컨설턴트"].includes(currentRoleName) && <button type="button" className="ob-batch-btn approve" onClick={() => handleBatch('approve')}>선택 승인</button>}
              </div>
            </div>
          )}
          
          <div className="ob-toolbar-right">
            <span className="ob-count">총 {filteredData.length.toLocaleString()}건</span>
            <div className="ob-current-auth-badge">
              <span style={{fontWeight: 600, color: '#3b82f6'}}>{selectedCompany?.company_name || "A회사"}</span>
              <span className="ob-badge-dot"></span>
              <span>{currentRoleName}</span>
            </div>
            <input type="text" className="ob-search" placeholder="지표 검색..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        {/* 하위 이슈그룹 탭 영역 */}
        <div className={`ob-ig-tabs-wrap ${(isIgExpanded && activeCategory !== "전체" && availableIGs.length) ? "expanded" : ""}`}>
          <div className="ob-ig-tabs-inner">
            <div className="ob-ig-tabs">
              {availableIGs.map(ig => (
                <button key={ig} type="button" className={`ob-ig-tab ${selectedIGs.includes(ig) ? `active theme-${activeCategory}` : ""}`} onClick={() => { setSelectedIGs(p => p.includes(ig) ? p.filter(g => g !== ig) : [...p, ig]); setCurrentPage(1); }}>{ig}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 지표 데이터 테이블 */}
        <div className="ob-table-wrap" ref={tableWrapRef}>
          <table className="ob-table">
            <thead>
              <tr>
                <th style={{width:"6%"}}><div className="cell-id-head"><input type="checkbox" className="ob-checkbox" checked={selectedIds.length > 0 && selectedIds.length === pageData.length} onChange={(e) => setSelectedIds(e.target.checked ? pageData.map(d => d.issueId) : [])} />ID</div></th>
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
              {pageData.map((item, i) => {
                const st = STATUS_CFG[item.status] || STATUS_CFG.NOT_STARTED;
                const isAuthor = item.assignees.some(a => a.email === currentEmail) || item.assignees.length === 0;
                const acts = getActions(currentRoleName, item.status, isAuthor);
                return (
                  <tr key={item.issueId} className={`ob-tr-status-${item.status.toLowerCase()} ${rowSpans[i] ? "group-start" : ""}`}>
                    <td className={`cell-id theme-${item.category}`}><div className="cell-id-inner"><input type="checkbox" className="ob-checkbox" checked={selectedIds.includes(item.issueId)} onChange={() => setSelectedIds(p => p.includes(item.issueId) ? p.filter(x => x !== item.issueId) : [...p, item.issueId])} />{item.issueId}</div></td>
                    
                    {/* 이슈그룹 및 R&R 열 (병합 적용) */}
                    {rowSpans[i] && (
                      <td className={`cell-issue-group theme-${item.category}`} rowSpan={rowSpans[i]}>
                        <div className="ob-ig-container">
                          <span className={`ob-ig-badge theme-${item.category}`}>{item.issueGroup}</span>
                          <div className="ob-ig-rnr">
                            <span className={rnrDisplay(item.assignees) ? `ob-rnr-text theme-${item.category}` : `ob-rnr-btn theme-${item.category}`} onClick={() => { setModalIG(item.issueGroup); setModalInputs([{ email: "", name: "", department: "" }]); }}>
                              {rnrDisplay(item.assignees) || "+ 담당자"}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    
                    <td className="cell-checklist"><span className="checklist-text">{item.checklistQuestion}</span></td>
                    <td className="cell-input">
                      <div className="ob-input-container">
                        <input type="text" className={`ob-input ${errors[item.issueId] ? "error" : ""} ${shakeIds[item.issueId] ? "shake" : ""}`} value={item.value} placeholder="입력" disabled={["SUBMITTED", "APPROVED"].includes(item.status)} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setErrors(p => ({ ...p, [item.issueId]: false }));
                            setMetrics(prev => prev.map(m => {
                              if (m.issueId !== item.issueId) return m;
                              let nextSt = m.status;
                              if (!val.trim()) { if (["DRAFT", "EDITING_SUBMITTED", "REJECTED"].includes(m.status)) nextSt = "NOT_STARTED"; }
                              else { if (m.status === "NOT_STARTED") nextSt = "DRAFT"; if (m.status === "SUBMITTED") nextSt = "EDITING_SUBMITTED"; }
                              return { ...m, value: val, status: nextSt };
                            }));
                          }} />
                        {errors[item.issueId] && <span className="ob-error-msg">데이터를 입력해주세요.</span>}
                      </div>
                    </td>
                    <td className="cell-unit"><span className="unit-text">{item.unit !== "-" ? item.unit : ""}</span></td>
                    <td className="cell-evidence">
                      <button type="button" className={`ob-evidence-btn ${item.evidenceAttached ? "attached" : ""}`} onClick={async () => {
                        const res = await requestApi.uploadEvidence(item.issueId, { name: "evidence.pdf" });
                        if (res.status) setMetrics(p => p.map(x => x.issueId === item.issueId ? { ...x, evidenceAttached: !x.evidenceAttached, evidenceFileName: !x.evidenceAttached ? res.data.fileName : "" } : x));
                      }}>
                        증빙자료 {item.evidenceAttached ? "첨부됨" : "미첨부"}
                      </button>
                    </td>
                    <td className="cell-status">
                      <div className="ob-status-wrap">
                        <span className={`ob-status ${st.cls}`}>{st.label}</span>
                        {item.status === "SUBMITTED" && (["ESG담당자", "ESG 담당자"].includes(currentRoleName) || (currentRoleName === "컨설턴트" && !isAuthor)) && 
                          <button type="button" className="ob-status-sub-btn" onClick={() => setMetrics(p => p.map(x => x.issueId === item.issueId ? { ...x, status: "DRAFT" } : x))}>재제출</button>}
                      </div>
                    </td>
                    <td className="cell-action">
                      <div className="ob-actions">
                        {acts.length > 0 ? acts.map(label => (
                          <button key={label} type="button" className={`ob-act-btn ob-act-${label === "저장" ? "draft" : label.includes("제출") ? "submit" : label === "승인" ? "approve" : "reject"}`} 
                            onClick={() => {
                              if (label === "저장") handleSaveDraft(item.issueId);
                              if (label === "제출") handleSubmit(item.issueId);
                              if (label === "재제출") setMetrics(p => p.map(x => x.issueId === item.issueId ? { ...x, status: "DRAFT" } : x));
                              if (label === "승인") handleApprove(item.issueId);
                              if (label === "반려") handleReject(item.issueId);
                            }}>{label}</button>
                        )) : <span className="ob-action-badge-empty">{item.status === "APPROVED" ? "-" : ""}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!pageData.length && <tr><td colSpan="10" className="ob-empty">조회된 지표가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* 하단 페이지네이션 */}
        {pageCount > 1 && (
          <div className="ob-pagination">
            <button type="button" className="ob-page-btn ob-page-nav" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
            <div className="ob-page-numbers">
              {Array.from({ length: Math.min(10, pageCount) }, (_, i) => {
                const p = Math.max(1, Math.min(pageCount - 9, currentPage - 5)) + i;
                if (p > pageCount || p < 1) return null;
                return <button key={p} type="button" className={`ob-page-btn ${p === currentPage ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>;
              })}
            </div>
            <button type="button" className="ob-page-btn ob-page-nav" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
          </div>
        )}
      </main>

      {/* R&R 담당자 지정 모달 */}
      {modalIG && (
        <div className="ob-modal-overlay" onClick={() => setModalIG(null)}>
          <div className={`ob-modal theme-${activeCategory}`} onClick={e => e.stopPropagation()}>
            <div className="ob-modal-header"><span className="ob-modal-title">담당자 지정</span><span className={`ob-ig-badge theme-${activeCategory}`}>{modalIG}</span></div>
            <div className="ob-modal-body">
              <div className="ob-modal-section">
                <div className="ob-modal-section-title">새 담당자 초대</div>
                <div className="ob-modal-invite-list">
                  {modalInputs.map((row, i) => (
                    <div className="ob-modal-invite-row" key={i}>
                      <input type="email" placeholder="이메일 주소" value={row.email} onChange={e => setModalInputs(p => p.map((r, idx) => idx === i ? { ...r, email: e.target.value } : r))} />
                      <input type="text" placeholder="이름" value={row.name} onChange={e => setModalInputs(p => p.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))} />
                      <input type="text" placeholder="부서명" value={row.department} onChange={e => setModalInputs(p => p.map((r, idx) => idx === i ? { ...r, department: e.target.value } : r))} />
                      {modalInputs.length > 1 && <button type="button" className="ob-modal-row-del" onClick={() => setModalInputs(p => p.filter((_, idx) => idx !== i))}>×</button>}
                    </div>
                  ))}
                </div>
                <button type="button" className="ob-modal-add-btn" onClick={() => setModalInputs(p => [...p, { email: "", name: "", department: "" }])}>+ 초대 대상 추가</button>
              </div>
              <div className="ob-modal-section">
                <div className="ob-modal-section-title">현재 담당자 목록</div>
                <div className="ob-modal-assignee-table-wrap">
                  <table className="ob-modal-assignee-table">
                    <thead><tr><th>이메일</th><th>이름</th><th>부서</th><th>상태</th><th>액션</th></tr></thead>
                    <tbody>
                      {(metrics.find(x => x.issueGroup === modalIG)?.assignees || []).map(a => (
                        <tr key={a.email}>
                          <td className="m-cell-email">{a.email}</td><td>{a.name}</td><td>{a.department}</td>
                          <td><span className={`ob-m-status ${a.status === "ACCEPTED" ? "st-accepted" : "st-pending"}`}>{a.status === "ACCEPTED" ? "지정 완료" : "수락 대기"}</span></td>
                          <td><div className="ob-modal-assignee-actions">
                            {a.status === "PENDING" && <button type="button" className="m-act-btn resend" onClick={() => showDefaultAlert("재발송", "초대 메일을 재발송했습니다.", "success")}>재발송</button>}
                            <button type="button" className="m-act-btn remove" onClick={async () => {
                              if (await showConfirmAlert("담당자 해제", "해당 담당자를 해제하시겠습니까?", "warning")) {
                                const res = await requestApi.remove(modalIG, a.email);
                                if (res.status) setMetrics(p => p.map(m => m.issueGroup === modalIG ? { ...m, assignees: m.assignees.filter(x => x.email !== a.email) } : m));
                              }
                            }}>해제</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="ob-modal-footer">
              <button type="button" className="ob-modal-btn secondary" onClick={() => setModalIG(null)}>취소</button>
              <button type="button" className="ob-modal-btn primary" onClick={handleInvite} disabled={!modalInputs.some(r => r.email && r.name)}>초대 메일 발송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
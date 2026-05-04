import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from '@hooks/AuthContext.jsx';

const Sidebarnav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedCompany } = useAuth();

    // 1. 권한 확인
    const role = selectedCompany?.role || "ESG담당자";
    const isSysAdmin = role === "시스템관리자";
    const isESG = role === "ESG담당자" || role === "ESG 담당자";
    const isConsultant = role === "컨설턴트";
    
    const canViewService = isSysAdmin || isESG || isConsultant;
    const canViewAdmin = isSysAdmin || isESG || isConsultant;

    // 2. 아코디언 상태 관리
    const [expanded, setExpanded] = useState({
        service: true,
        admin: false,
        settings: false
    });

    const [expandedSub, setExpandedSub] = useState({
        report: false,
        carbon: false,
        supply: false
    });

    const toggleAccordion = (key) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSubAccordion = (key, e) => {
        e.stopPropagation();
        setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isActive = (path) => location.pathname.includes(path);

    // 3. 커스텀 스크롤 인디케이터 (8-dash 순차적 활성화 및 드래그 제어) 로직
    const scrollRef = useRef(null);
    const indicatorRef = useRef(null);
    const isDraggingRef = useRef(false);
    
    const [showIndicator, setShowIndicator] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const dashCount = 8; // 8개의 고정된 선

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        
        // 내용이 뷰포트보다 길 때만 인디케이터 노출
        if (scrollHeight > clientHeight + 1) {
            setShowIndicator(true);
            const scrollRatio = scrollTop / (scrollHeight - clientHeight);
            
            // 민감도 높게 순차적으로 변경
            const index = Math.min(
                dashCount - 1,
                Math.max(0, Math.round(scrollRatio * (dashCount - 1)))
            );
            setActiveIndex(index);
        } else {
            setShowIndicator(false);
        }
    };

    // 드래그로 스크롤 제어하는 로직
    const handlePointerMove = (e) => {
        if (!isDraggingRef.current || !scrollRef.current || !indicatorRef.current) return;
        
        const rect = indicatorRef.current.getBoundingClientRect();
        // 컨테이너 내에서의 Y 위치 계산 (0.0 ~ 1.0 비율)
        const y = e.clientY - rect.top;
        const ratio = Math.max(0, Math.min(1, y / rect.height));
        
        const scrollArea = scrollRef.current;
        const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
        
        // 스크롤 즉시 업데이트
        scrollArea.scrollTop = ratio * maxScroll;
    };

    const handlePointerUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        document.body.style.userSelect = '';
        
        // 드래그 종료 시 다시 부드러운 스크롤 원복
        if (scrollRef.current) {
            scrollRef.current.style.scrollBehavior = 'smooth';
        }
    };

    const handlePointerDown = (e) => {
        isDraggingRef.current = true;
        // 드래그 중에는 부드러운 스크롤을 끄고 마우스를 즉각 따라가도록 설정
        if (scrollRef.current) {
            scrollRef.current.style.scrollBehavior = 'auto';
        }
        handlePointerMove(e); // 클릭한 위치로 즉시 이동
        
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        document.body.style.userSelect = 'none'; // 드래그 중 텍스트 선택 방지
    };

    // 컴포넌트 언마운트 시 이벤트 제거
    useEffect(() => {
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    // 아코디언이 펼쳐지거나 닫힐 때 스크롤 가능 여부 재계산
    useEffect(() => {
        // 애니메이션(0.3s) 이후 높이가 최종 확정되므로 약간의 지연 후 체크
        const timer = setTimeout(() => {
            handleScroll();
        }, 350);
        
        return () => clearTimeout(timer);
    }, [expanded, expandedSub]);

    // ResizeObserver를 통해 윈도우 크기 변경 시 즉각 반영
    useEffect(() => {
        let observer;
        if (scrollRef.current) {
            observer = new ResizeObserver(() => handleScroll());
            observer.observe(scrollRef.current);
            if (scrollRef.current.firstElementChild) {
                observer.observe(scrollRef.current.firstElementChild);
            }
        }
        return () => {
            if (observer) observer.disconnect();
        };
    }, []);

    // 4. 데이터 관리
    const [searchTerm, setSearchTerm] = useState("");
    const companies = [
        { id: "SKM", name: "SKM" },
        { id: "HG", name: "HG" },
        { id: "TV", name: "TV" },
        { id: "GOOGLE", name: "Google" },
    ];

    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const subMenuItems = ["A", "B", "C", "D", "E"];

    return (
        <aside className="sidebar">
            <div className="logo-placeholder">로고</div>
            
            <div className="nav-scroll-wrapper">
                <div className="nav-scroll-area" ref={scrollRef} onScroll={handleScroll}>
                    <nav className="nav-group">
                    <div className="nav-title">워크스페이스</div>
                    
                    <div className={`nav-item ${isActive('/main/onboarding') ? 'active' : ''}`} onClick={() => navigate("/main/onboarding")}>
                        데이터 입력
                    </div>

                    {canViewService && (
                        <div className="nav-accordion-group">
                            <div className="nav-item nav-accordion-header" onClick={() => toggleAccordion('service')}>
                                ESG 프로젝트
                                <svg className={`nav-arrow ${expanded.service ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                            <div className={`nav-accordion-content ${expanded.service ? 'expanded' : ''}`}>
                                <div className="inner-wrapper">
                                
                                <div className="nav-accordion-group sub">
                                    <div className={`nav-item sub-item ${expandedSub.report ? 'active' : ''}`} onClick={(e) => toggleSubAccordion('report', e)}>
                                        지속가능경영보고서
                                        <svg className={`nav-arrow ${expandedSub.report ? 'expanded' : ''}`} style={{width: '12px', height: '12px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                    <div className={`nav-accordion-content ${expandedSub.report ? 'expanded' : ''}`}>
                                        <div className="inner-wrapper">
                                            {subMenuItems.map(item => (
                                                <div key={item} className="nav-item sub-sub-item">{item} 프로젝트</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="nav-accordion-group sub">
                                    <div className={`nav-item sub-item ${expandedSub.carbon ? 'active' : ''}`} onClick={(e) => toggleSubAccordion('carbon', e)}>
                                        탄소배출관리
                                        <svg className={`nav-arrow ${expandedSub.carbon ? 'expanded' : ''}`} style={{width: '12px', height: '12px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                    <div className={`nav-accordion-content ${expandedSub.carbon ? 'expanded' : ''}`}>
                                        <div className="inner-wrapper">
                                            {subMenuItems.map(item => (
                                                <div key={item} className="nav-item sub-sub-item">{item} 데이터</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="nav-accordion-group sub">
                                    <div className={`nav-item sub-item ${expandedSub.supply ? 'active' : ''}`} onClick={(e) => toggleSubAccordion('supply', e)}>
                                        공급망 관리
                                        <svg className={`nav-arrow ${expandedSub.supply ? 'expanded' : ''}`} style={{width: '12px', height: '12px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                    <div className={`nav-accordion-content ${expandedSub.supply ? 'expanded' : ''}`}>
                                        <div className="inner-wrapper">
                                            {subMenuItems.map(item => (
                                                <div key={item} className="nav-item sub-sub-item">{item} 협력사</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                </div>
                            </div>
                        </div>
                    )}
                </nav>

                {canViewAdmin && (
                    <nav className="nav-group">
                        <div className="nav-title">관리자 메뉴</div>
                        <div className="nav-accordion-group">
                            <div className="nav-item nav-accordion-header" onClick={() => toggleAccordion('admin')}>
                                계정 관리
                                <svg className={`nav-arrow ${expanded.admin ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                            <div className={`nav-accordion-content ${expanded.admin ? 'expanded' : ''}`}>
                                <div className="inner-wrapper">
                                    <div className={`nav-item sub-item ${isActive('/main/manager') ? 'active' : ''}`} onClick={() => navigate('/main/manager')}>데이터 승인/관리</div>
                                    <div className={`nav-item sub-item ${isActive('/main/invite') ? 'active' : ''}`} onClick={() => navigate('/main/invite')}>사용자 초대</div>
                                </div>
                            </div>
                        </div>
                    </nav>
                )}

                <nav className="nav-group">
                    <div className="nav-title">환경 설정</div>
                    <div className="nav-accordion-group">
                        <div className="nav-item nav-accordion-header" onClick={() => toggleAccordion('settings')}>
                            내 계정 설정
                            <svg className={`nav-arrow ${expanded.settings ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                        <div className={`nav-accordion-content ${expanded.settings ? 'expanded' : ''}`}>
                            <div className="inner-wrapper">
                                <div className={`nav-item sub-item ${isActive('/my_page') ? 'active' : ''}`} onClick={() => navigate('/my_page')}>마이페이지</div>
                            </div>
                        </div>
                    </div>
                </nav>
                </div>

                {showIndicator && (
                    <div 
                        className="nav-dash-indicator" 
                        ref={indicatorRef}
                        onPointerDown={handlePointerDown}
                    >
                        {Array.from({ length: dashCount }).map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`dash-item ${activeIndex === idx ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <input 
                    type="text" 
                    className="company-search" 
                    placeholder="회사 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="company-select">
                    {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))
                    ) : (
                        <option disabled>결과 없음</option>
                    )}
                </select>
            </div>
        </aside>
    );
}

export default Sidebarnav;
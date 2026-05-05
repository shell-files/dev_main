import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from '@hooks/AuthContext.jsx';

const Sidebarnav = ({ isOpen, setIsOpen }) => {
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

    // 3. 커스텀 스크롤 인디케이터 로직
    const scrollRef = useRef(null);
    const indicatorRef = useRef(null);
    const isDraggingRef = useRef(false);
    
    const [showIndicator, setShowIndicator] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const dashCount = 8;

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        
        if (scrollHeight > clientHeight + 1) {
            setShowIndicator(true);
            const scrollRatio = scrollTop / (scrollHeight - clientHeight);
            const index = Math.min(
                dashCount - 1,
                Math.max(0, Math.round(scrollRatio * (dashCount - 1)))
            );
            setActiveIndex(index);
        } else {
            setShowIndicator(false);
        }
    };

    const handlePointerMove = (e) => {
        if (!isDraggingRef.current || !scrollRef.current || !indicatorRef.current) return;
        const rect = indicatorRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const ratio = Math.max(0, Math.min(1, y / rect.height));
        
        const scrollArea = scrollRef.current;
        const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
        scrollArea.scrollTop = ratio * maxScroll;
    };

    const handlePointerUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        document.body.style.userSelect = '';
        if (scrollRef.current) {
            scrollRef.current.style.scrollBehavior = 'smooth';
        }
    };

    const handlePointerDown = (e) => {
        isDraggingRef.current = true;
        if (scrollRef.current) {
            scrollRef.current.style.scrollBehavior = 'auto';
        }
        handlePointerMove(e);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleScroll();
        }, 350);
        return () => clearTimeout(timer);
    }, [expanded, expandedSub]);

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
        /* isOpen 상태에 따라 'open' 또는 'closed' 클래스가 적용됩니다. */
        <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            
            {/* 모바일 화면에서만 동작하는 닫기 버튼 */}
            <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} aria-label="사이드바 닫기">
                ✕
            </button>

            
            
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
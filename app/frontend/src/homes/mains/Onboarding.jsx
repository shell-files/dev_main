import { useMemo, useState } from "react";
import "@styles/onboarding.css";

// =====================================================================================
// Onboarding.jsx 페이지 흐름설명 (함수 기준)
//
// 1. 초기 데이터 흐름
// → generateMasterDummy
// → masterData 생성
// → filteredData 계산
// → 현재 페이지 기준 currentPageData 렌더링
//
// 2. 검색 흐름
// → handleSearchChange
// → searchTerm 업데이트
// → currentPage 1로 초기화
// → filteredData 재계산
//
// 3. 탭 필터 흐름
// → handleTabFilter
// → activeTab 업데이트
// → currentPage 1로 초기화
// → filteredData 재계산
//
// 4. 데이터 입력 흐름
// → handleValueChange
// → masterData 내 해당 지표 value 업데이트
// → value 존재 시 status를 작성 중으로 변경
//
// 5. 승인/반려 흐름
// → handleApproval
// → 해당 지표 status를 승인 또는 반려로 변경
//
// 6. 페이지네이션 흐름
// → handlePageChange
// → currentPage 업데이트
//
// ========================
// 함수 설명
//
// 1. generateMasterDummy - 설명: 온보딩 화면 테스트용 ESG 지표 더미 데이터 생성
// 2. getStatusClass - 설명: 상태값에 맞는 CSS class 반환
// 3. handleSearchChange - 설명: 지표명 검색어 업데이트
// 4. handleTabFilter - 설명: 전체/경영일반/E/S/G 탭 필터 변경
// 5. handleValueChange - 설명: 지표별 데이터 입력값 변경
// 6. handleApproval - 설명: ESG 담당자 권한의 승인/반려 상태 변경
// 7. handlePageChange - 설명: 페이지 이동
// 8. handleTempSave - 설명: 임시 저장 버튼 클릭 처리
// 9. handleFinalSubmit - 설명: 최종 승인 요청 버튼 클릭 처리
//
// =========================
// API 연결 위치 (수정 포인트)
//
// 1. 온보딩 목록 조회
// → api.get("/auth/onboarding/metrics")
//
// 2. 지표 입력값 저장
// → api.patch("/auth/onboarding/metrics/{metricId}", { value })
//
// 3. 증빙파일 업로드
// → api.post("/auth/onboarding/metrics/{metricId}/files", formData)
//
// 4. 승인/반려 처리
// → api.patch("/auth/onboarding/metrics/{metricId}/status", { status, reason })
//
// 5. 최종 승인 요청
// → api.post("/auth/onboarding/submit")
// =====================================================================================

const ISSUE_GROUPS = {
  경영일반: ["기업개요", "사업구조", "거버넌스개요"],
  E: ["기후변화", "에너지", "수자원", "폐기물"],
  S: ["노동·고용", "산업안전", "인권"],
  G: ["윤리경영", "이사회", "공시통제"],
};

const QUESTIONS = [
  "Scope 1 직접 온실가스 배출량",
  "Scope 2 간접 온실가스 배출량",
  "총 에너지 소비량",
  "신재생에너지 사용 비중",
  "용수 재활용률",
  "폐기물 재활용량",
  "산업재해 사망자 수",
  "임직원 교육 시간",
  "이사회 내 여성 비율",
  "부패 방지 정책 수립 여부",
];

const UNITS = ["tCO2e", "TJ", "m³", "ton", "명", "%", "시간", "건"];

const TABS = ["전체", "경영일반", "E", "S", "G"];

const ROWS_PER_PAGE = 10;

const generateMasterDummy = (count = 260) => {
  const domains = Object.keys(ISSUE_GROUPS);

  return Array.from({ length: count }, (_, index) => {
    const i = index + 1;
    const domain = domains[i % domains.length];
    const group = ISSUE_GROUPS[domain][i % ISSUE_GROUPS[domain].length];
    const statusSeed = i % 10;

    const hasValue = statusSeed > 3;
    const isComplete = statusSeed > 7;
    const hasEvidence = statusSeed > 5;

    return {
      id: `${domain.charAt(0)}${String(i).padStart(3, "0")}`,
      domain,
      issueGroup: group,
      question: `${QUESTIONS[i % QUESTIONS.length]} (지표 #${i})`,
      unit: UNITS[i % UNITS.length],
      value: hasValue ? String(Math.floor((i * 371) % 5000)) : "",
      status: isComplete ? "완료" : hasValue ? "작성 중" : "미입력",
      evidence: hasEvidence,
    };
  });
};

const getStatusClass = (status) => {
  if (status === "완료") return "status-complete";
  if (status === "작성 중") return "status-working";
  if (status === "반려") return "status-reject";
  return "status-none";
};

const Onboarding = () => {
  // =========================
  // 0. 공통 상태
  // =========================

  const [masterData, setMasterData] = useState(() => generateMasterDummy(260));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  // =========================
  // 1. 필터링 / 페이지 데이터
  // =========================

  const filteredData = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    return masterData.filter((item) => {
      const matchesTab = activeTab === "전체" || item.domain === activeTab;
      const matchesSearch =
        item.question.toLowerCase().includes(lowerSearchTerm) ||
        item.issueGroup.toLowerCase().includes(lowerSearchTerm) ||
        item.id.toLowerCase().includes(lowerSearchTerm);

      return matchesTab && matchesSearch;
    });
  }, [masterData, searchTerm, activeTab]);

  const pageCount = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const visiblePages = Array.from(
    { length: Math.min(pageCount, 10) },
    (_, index) => index + 1
  );

  // =========================
  // 2. 검색 / 탭 필터 함수
  // =========================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTabFilter = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // =========================
  // 3. 데이터 입력 / 상태 변경 함수
  // =========================

  const handleValueChange = (targetId, value) => {
    setMasterData((prev) =>
      prev.map((item) => {
        if (item.id !== targetId) return item;

        return {
          ...item,
          value,
          status: value.trim() ? "작성 중" : "미입력",
        };
      })
    );
  };

  const handleApproval = (targetId, nextStatus) => {
    setMasterData((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );
  };

  const handleFileToggle = (targetId) => {
    setMasterData((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              evidence: !item.evidence,
            }
          : item
      )
    );
  };

  // =========================
  // 4. 페이지네이션 / 하단 액션 함수
  // =========================

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTempSave = () => {
    console.log("임시 저장 대상 데이터:", masterData);
  };

  const handleFinalSubmit = () => {
    console.log("최종 승인 요청 대상 데이터:", masterData);
  };

  return (
    <div id="onboarding_page">
      <main className="onboarding-content-body">
        <div className="onboarding-top-bar">
          <input
            type="text"
            className="onboarding-search-input"
            placeholder="지표명 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
          />

          <div className="onboarding-tab-group">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`onboarding-tab ${
                  activeTab === tab ? "active" : ""
                }`}
                onClick={() => handleTabFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <section className="onboarding-data-section">
          <table className="onboarding-data-table">
            <thead>
              <tr>
                <th width="12%">ID</th>
                <th width="13%">이슈그룹</th>
                <th width="25%">체크리스트 내용</th>
                <th width="15%">데이터 입력</th>
                <th width="10%">증빙</th>
                <th width="12%">상태</th>
                <th width="13%">액션</th>
              </tr>
            </thead>

            <tbody>
              {currentPageData.map((item) => (
                <tr key={item.id}>
                  <td className="onboarding-row-id">{item.id}</td>

                  <td>
                    <span className="onboarding-issue-group">
                      {item.issueGroup}
                    </span>
                  </td>

                  <td className="onboarding-indicator-name">
                    {item.question}
                  </td>

                  <td>
                    <div className="onboarding-input-group">
                      <input
                        type="text"
                        className="onboarding-input-field"
                        value={item.value}
                        placeholder="입력"
                        onChange={(e) =>
                          handleValueChange(item.id, e.target.value)
                        }
                      />
                      <span className="onboarding-unit">{item.unit}</span>
                    </div>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={`onboarding-file-btn ${
                        item.evidence ? "file-attached" : ""
                      }`}
                      onClick={() => handleFileToggle(item.id)}
                    >
                      📎 {item.evidence ? "첨부됨" : "첨부"}
                    </button>
                  </td>

                  <td>
                    <span
                      className={`onboarding-status-badge ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <div className="onboarding-admin-actions">
                      <button
                        type="button"
                        className="onboarding-btn-approve"
                        onClick={() => handleApproval(item.id, "완료")}
                      >
                        승인
                      </button>

                      <button
                        type="button"
                        className="onboarding-btn-reject"
                        onClick={() => handleApproval(item.id, "반려")}
                      >
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {currentPageData.length === 0 && (
                <tr>
                  <td colSpan="7" className="onboarding-empty-cell">
                    조회된 지표가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <div className="onboarding-pagination">
          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              className={`onboarding-page-btn ${
                page === currentPage ? "active" : ""
              }`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
      </main>

      <footer className="onboarding-action-bar">
        <button
          type="button"
          className="onboarding-btn onboarding-btn-save"
          onClick={handleTempSave}
        >
          임시 저장
        </button>

        <button
          type="button"
          className="onboarding-btn onboarding-btn-submit"
          onClick={handleFinalSubmit}
        >
          최종 승인 요청
        </button>
      </footer>
    </div>
  );
};

export default Onboarding;
/**
 * AuthContext.jsx - 전역 인증 상태 관리 컨텍스트
 *
 * 1. 데이터 구조:
 *    - user: 로그인한 사용자 기본 정보 (name, uuid 등)
 *    - companies: 해당 사용자가 소속된 회사 목록 (복수 소속 가능)
 *    - selectedCompany: 현재 선택된 회사 (role, company_name 등 포함)
 *    - isAuthReady: localStorage 복원이 완료됐는지 여부 (라우터 가드용)
 *
 * 2. 주요 함수 흐름:
 *    - 앱 시작: useEffect → localStorage 복원 → user/companies 상태 초기화
 *    - 로그인: login(data) → 상태 설정 + localStorage 저장
 *    - 회사 선택: selectCompany(id) → selectedCompany 갱신 + localStorage 저장
 *    - 로그아웃: logout() → 모든 상태 초기화 + localStorage 전체 삭제
 *
 * 3. 외부 연동:
 *    - Login.jsx: login() 함수를 호출하여 인증 상태 세팅
 *    - CompanySelect.jsx: selectCompany() 함수로 회사 전환
 *    - Alarm.jsx / Onboarding.jsx: user, selectedCompany 값을 참조
 */

import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

/**
 * [유틸] safeJsonParse: localStorage 파싱 실패 시 fallback 반환
 */
const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  // [변수] user: 현재 로그인한 사용자 정보
  const [user, setUser] = useState(null);

  // [변수] companies: 해당 사용자의 전체 소속 회사 목록
  const [companies, setCompanies] = useState([]);

  // [변수] selectedCompany: 현재 선택된 회사 (role, company_id 등 포함)
  const [selectedCompany, setSelectedCompany] = useState(null);

  // [변수] isAuthReady: localStorage 복원 완료 여부 (라우터 가드에서 활용)
  const [isAuthReady, setIsAuthReady] = useState(false);

  /**
   * [이펙트] 앱 진입 시 localStorage에서 이전 세션 복원
   * - uuid, user, companies, selectedCompany 복원
   */
  useEffect(() => {
    const storedUuid = localStorage.getItem("uuid");
    const storedUser = safeJsonParse(localStorage.getItem("user"), null);
    const storedCompanies = safeJsonParse(localStorage.getItem("companies"), []);
    const storedSelectedCompany = safeJsonParse(localStorage.getItem("selectedCompany"), null);

    if (storedUuid && storedUser) {
      setUser({ ...storedUser, uuid: storedUuid });
      setCompanies(storedCompanies);
      setSelectedCompany(storedSelectedCompany);
    }
    setIsAuthReady(true);
  }, []);

  /**
   * [함수] login: 로그인 API 응답 데이터를 받아 전역 상태 및 localStorage에 저장
   * @param {object} data - requestApi.login()의 반환 data 필드
   */
  const login = (data) => {
    const uuid = data.uuid;
    const companies = data.companies || data.companys || [];
    const firstCompany = companies[0] || null;

    const user = data.user || {
      id: firstCompany?.id,
      name: firstCompany?.name,
      email: firstCompany?.email,
      role_id: firstCompany?.role_id,
      role: firstCompany?.role,
      company_id: firstCompany?.company_id,
    };

    if (!uuid) throw new Error("로그인 응답에 uuid가 없습니다.");
    if (!user?.name) throw new Error("로그인 응답에 사용자 이름이 없습니다.");

    // 소속 회사가 1개면 자동 선택, 복수면 null (CompanySelect 페이지에서 선택)
    const initialCompany = companies.length === 1 ? companies[0] : null;

    setUser({ ...user, uuid });
    setCompanies(companies);
    setSelectedCompany(initialCompany);

    localStorage.setItem("uuid", uuid);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("name", user.name || "");
    localStorage.setItem("companies", JSON.stringify(companies));
    localStorage.setItem("loginResponse", JSON.stringify(data));
    if (initialCompany) {
      localStorage.setItem("selectedCompany", JSON.stringify(initialCompany));
    } else {
      localStorage.removeItem("selectedCompany");
    }

    // 예전 더미 로그인 잔여값 정리
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
  };

  /**
   * [함수] selectCompany: CompanySelect 페이지에서 회사 선택 시 호출
   * @param {number|string} companyId - 선택된 회사의 company_id
   * @returns {object|null} - 선택된 회사 정보 또는 null
   */
  const selectCompany = (companyId) => {
    const company = companies.find(c => Number(c.company_id) === Number(companyId));
    if (!company) return null;

    setSelectedCompany(company);
    localStorage.setItem("selectedCompany", JSON.stringify(company));
    return company;
  };

  /**
   * [함수] logout: 전역 인증 상태 초기화 및 localStorage 전체 삭제
   */
  const logout = () => {
    setUser(null);
    setCompanies([]);
    setSelectedCompany(null);
    [
      "uuid", "user", "name", "companies",
      "selectedCompany", "accessToken", "userId", "loginResponse"
    ].forEach(key => localStorage.removeItem(key));
  };

  /**
   * [함수] hasRole: 현재 사용자가 특정 권한(role)을 가지고 있는지 확인
   * @param {...string} roles - 확인할 권한 목록
   * @returns {boolean}
   */
  const hasRole = (...roles) => {
    const role = selectedCompany?.role || user?.role;
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{
      user, companies, selectedCompany, isAuthReady,
      isAuthenticated: !!user,
      login, logout, selectCompany, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// [훅] useAuth: AuthContext를 편리하게 사용하기 위한 커스텀 훅
export const useAuth = () => useContext(AuthContext);
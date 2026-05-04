import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUuid = localStorage.getItem("uuid");
    const storedUser = safeJsonParse(localStorage.getItem("user"), null);
    const storedCompanies = safeJsonParse(localStorage.getItem("companies"), []);
    const storedSelectedCompany = safeJsonParse(
      localStorage.getItem("selectedCompany"),
      null
    );

    if (storedUuid && storedUser) {
      setUser({
        ...storedUser,
        uuid: storedUuid,
      });
      setCompanies(storedCompanies);
      setSelectedCompany(storedSelectedCompany);
    }

    setIsAuthReady(true);
  }, []);

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

    if (!uuid) {
      throw new Error("로그인 응답에 uuid가 없습니다.");
    }

    if (!user?.name) {
      throw new Error("로그인 응답에 사용자 이름이 없습니다.");
    }

    const initialCompany = companies.length === 1 ? companies[0] : null;

    setUser({
      ...user,
      uuid,
    });

    setCompanies(companies);
    setSelectedCompany(initialCompany);

    localStorage.setItem("uuid", uuid);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("name", user.name || "");
    localStorage.setItem("companies", JSON.stringify(companies));

    if (initialCompany) {
      localStorage.setItem("selectedCompany", JSON.stringify(initialCompany));
    } else {
      localStorage.removeItem("selectedCompany");
    }

    // 예전 더미 로그인 잔여값 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
  };

  const selectCompany = (companyId) => {
    const normalizedCompanyId = Number(companyId);

    const company = companies.find(
      (c) => Number(c.company_id) === normalizedCompanyId
    );

    if (!company) {
      return null;
    }

    setSelectedCompany(company);
    localStorage.setItem("selectedCompany", JSON.stringify(company));

    return company;
  };

  const logout = () => {
    setUser(null);
    setCompanies([]);
    setSelectedCompany(null);

    localStorage.removeItem("uuid");
    localStorage.removeItem("user");
    localStorage.removeItem("name");
    localStorage.removeItem("companies");
    localStorage.removeItem("selectedCompany");

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
  };

  const hasRole = (...roles) => {
    const role = selectedCompany?.role || user?.role;
    return roles.includes(role);
  };

  const value = {
    user,
    companies,
    selectedCompany,
    isAuthReady,
    isAuthenticated: !!user,
    login,
    logout,
    selectCompany,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
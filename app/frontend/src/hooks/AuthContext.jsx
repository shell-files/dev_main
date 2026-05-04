import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // 앱 로드 시 LocalStorage에서 데이터 복원
  useEffect(() => {
    const storedUuid = localStorage.getItem("uuid"); // TOKEN.uuid
    if (storedUuid) {
      setUser({
        uuid: storedUuid,
        name: localStorage.getItem("name") // USER.name
      });
      setCompanies(JSON.parse(localStorage.getItem("companies") || "[]"));
      setSelectedCompany(JSON.parse(localStorage.getItem("selectedCompany") || "null"));
    }
  }, []);

  const login = (data) => {
    // 1. 상태 업데이트
    setUser({ uuid: data.uuid, name: data.user.name });
    setCompanies(data.companys);
    
    // 2. 회사 설정 (회사가 1개면 자동 선택, 여러 개면 null 유지하여 선택 유도)
    const initialCompany = data.companys.length === 1 ? data.companys[0] : null;
    setSelectedCompany(initialCompany);

    // 3. LocalStorage 저장 (새로고침 유지용)
    localStorage.setItem("uuid", data.uuid); // TOKEN.uuid
    localStorage.setItem("name", data.user.name); // USER.name
    localStorage.setItem("companies", JSON.stringify(data.companys));
    if (initialCompany) {
      localStorage.setItem("selectedCompany", JSON.stringify(initialCompany));
    }
  };

  const selectCompany = (companyId) => {
    const company = companies.find((c) => c.company_id === companyId);
    if (company) {
      setSelectedCompany(company);
      localStorage.setItem("selectedCompany", JSON.stringify(company));
    }
  };

  const logout = () => {
    setUser(null);
    setCompanies([]);
    setSelectedCompany(null);

    localStorage.removeItem("uuid");
    localStorage.removeItem("name");
    localStorage.removeItem("companies");
    localStorage.removeItem("selectedCompany");
  };

  return (
    <AuthContext.Provider value={{ user, companies, selectedCompany, login, logout, selectCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

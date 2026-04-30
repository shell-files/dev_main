import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import '@styles/SignUp.css'
import { api } from '@utils/network'
import ksicData from '@assets/data/ksicClassification.json';
/**
 * [환경 설정]
 * USE_DUMMY: true일 경우 백엔드 API 통신 없이 가짜 데이터로 동작합니다.
 * 백엔드 서버가 준비되지 않았거나 403 에러 등의 이슈가 있을 때 프론트엔드 흐름 테스트용으로 사용합니다.
 */
const USE_DUMMY = false;

const Signup = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // 파일 선택창(input type="file")에 직접 접근하기 위한 Ref

    // --- [상태 관리: 파일 및 인증] ---
    const [fileName, setFileName] = useState(''); // 선택된 파일의 이름 표시용
    const [file, setFile] = useState(null);       // 실제 서버로 전송할 파일 객체
    const [fileId, setFileId] = useState(null);     //OCR 후 파일 ID 받기 위함
    const [isOcrDone, setIsOcrDone] = useState(false);   // 사업자 등록증 OCR 인증 완료 여부
    const [isUploading, setIsUploading] = useState(false); // OCR 업로드 중 로딩 상태
    const [isAgreed, setIsAgreed] = useState(false);     // 약관 동의 여부
    

    // --- [상태 관리: 중복 검사 및 에러] ---
    const [emailValid, setEmailValid] = useState(null);    // 이메일 중복 검사 결과 (true: 가능, false: 중복)
    const [businessValid, setBusinessValid] = useState(null); // 사업자번호 중복 검사 결과
    const [errors, setErrors] = useState({});               // 필드별 에러 메시지 저장 객체
    const [signupLoading, setSignupLoading] = useState(false); // 최종 가입 버튼 클릭 시 로딩 상태

    // --- [상태 관리: 입력 폼 데이터] ---
    const [industryCodes, setIndustryCodes] = useState([]);
    const [sel, setSel] = useState({ large: '', medium: '', small: '', fine: '', detail: '' });
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        ceoName: '',
        userName: '',
        businessNumber: '',
        companyName: '',
        openingDate: '',
        corporateNumber: '',
        headOffice: '',
        issueDate: '',
        texName: '',
        
    });
    const addIndustry = () => {
        if (!sel.detail) return alert("5단계(세세분류)까지 모두 선택해주세요.");

        const target = ksicData.find(i => 
            i.largeCategoryName === sel.large &&
            i.mediumCategoryName === sel.medium &&
            i.smallCategoryName === sel.small &&
            i.fineCategoryName === sel.fine &&
            i.detailCategoryName === sel.detail
        );

        if (target) {
            const code = target.standardIndustryClassification;
            if (industryCodes.includes(code)) {
                return alert("이미 추가된 업종 코드입니다.");
            }
            setIndustryCodes([...industryCodes, code]); // 코드만 배열에 추가
            // 선택 창 초기화
            setSel({ large: '', medium: '', small: '', fine: '', detail: '' });
        }
    };

    // 필드별 필수 입력 경고 메시지 정의
    const requiredFields = {
        email: "이메일은 필수입니다.",
        password: "비밀번호는 필수입니다.",
        ceoName: "대표자명은 필수입니다.",
        businessNumber: "사업자번호는 필수입니다.",
        companyName: "법인명은 필수입니다.",
        openingDate: "개업일은 필수입니다.",
        corporateNumber: "법인 등록번호는 필수입니다.",
        headOffice: "본점 소재지는 필수입니다.",
        issueDate: "발행일은 필수입니다.",
        texName: "발행처는 필수입니다.",
    };

    // 현재 페이지가 통신 중(로딩 중)인지 확인하는 변수
    const isLoading = isUploading || signupLoading;

    // --- [로직: 유효성 검사] ---
    /**
     * 특정 필드에 포커스가 나갔을 때(onBlur) 값의 유무와 형식을 체크합니다.
     */
    const validateField = (name, value) => {
        let message = "";
        // 1. 빈 값 체크
        if (!value) {
            message = requiredFields[name] || "필수 항목입니다.";
        }
        // 2. 이메일 형식 체크
        if (name === "email" && value) {
            const regex = /\S+@\S+\.\S+/;
            if (!regex.test(value)) {
                message = "이메일 형식이 올바르지 않습니다.";
            }
        }
        setErrors(prev => ({ ...prev, [name]: message }));
    };

    // --- [로직: 입력 값 변경 핸들링] ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // 이메일이나 사업자번호가 수정되면 중복 검사 결과를 초기화
        if (name === "email") setEmailValid(null);
        if (name === "businessNumber") setBusinessValid(null);
        
        // 타이핑 시 해당 필드의 에러 메시지 제거
        setErrors(prev => ({ ...prev, [name]: "" }));
    };

    // --- [로직: 파일 업로드 및 OCR] ---
    // 가짜 '파일 선택' 버튼 클릭 시 실제 숨겨진 input을 클릭하게 함
    const handleFileBtnClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setIsOcrDone(false); // 파일을 새로 고르면 다시 인증받도록 초기화
        }
    };

    /**
     * [등록] 버튼 클릭 시 동작: 서버에 이미지 파일을 보내 텍스트를 추출(OCR)합니다.
     */
    const handleUpload = async () => {
        if (!file) {
            alert("파일을 먼저 선택해주세요.");
            return;
        }
        setIsUploading(true);

        // 더미 모드일 경우 가공의 데이터를 폼에 즉시 채워줌
        if (USE_DUMMY) {
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    businessNumber: '123-45-67890',
                    companyName: '(주)아이티히어로 더미',
                    ceoName: '대표자명',
                    openingDate: '2020-01-01',
                    corporateNumber: '110111-0000000',
                    headOffice: '서울특별시 강남구...',
                    issueDate: '2024-04-29',
                    texName: '강남세무서',
                    industryId: '서비스업',
                    subCategory: '소프트웨어 개발'
                }));
                setIsOcrDone(true);
                setIsUploading(false);
                alert("더미 데이터로 OCR 인증이 완료되었습니다.");
            }, 1000);
            return;
        }

        // 실제 모드: FormData에 파일을 담아 API 전송
        try {
            const formDataToSend = new FormData();
            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = ['jpg', 'jpeg', 'png', 'pdf'];

            if (!allowed.includes(ext)) {
                alert("지원하지 않는 파일 형식입니다.");
                setIsUploading(false);
                return;
            }

            formDataToSend.append("file", file);
            formDataToSend.append("fileName", file.name);
            formDataToSend.append("fileExt", ext);

            const res = await api.post("/user", formDataToSend);

            if (res.data.status === true) {
                setFormData(prev => ({ ...prev, ...res.data.data }));

                // ✅ 안전 처리
                if (res.data.fileId) {
                    setFileId(res.data.fileId);
                }

                setIsOcrDone(true);
            } else {
                alert("OCR 처리 실패");
            }
        } catch (err) {
            alert("서버 오류");
        } finally {
            setIsUploading(false);
        }
    };

    // --- [로직: 중복 검사] ---
    // 1. 이메일 중복 검사 함수
    const checkEmail = async () => {
        if (!formData.email || errors.email) return;

        try {
            // 명세서: GET /user?email=값
            const res = await api.get('/user', { 
                params: { email: formData.email } 
            });
            setEmailValid(res.data.status); // true면 사용 가능, false면 중복
        } catch (err) {
            console.error("이메일 중복 검사 에러:", err);
        }
    };

    // 2. 사업자번호 중복 검사 함수
    const checkBusiness = async () => {
        if (!formData.businessNumber) return;

        try {
            // 명세서: GET /user?businessNumber=값
            const res = await api.get('/user', { 
                params: { businessNumber: formData.businessNumber } 
            });
            setBusinessValid(res.data.status);
        } catch (err) {
            console.error("사업자번호 중복 검사 에러:", err);
        }
    };

    // --- [로직: 최종 제출] ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

        if (industryCodes.length === 0) return alert("업종을 최소 하나 이상 선택해야 합니다.");
        if (!isAgreed) return alert("약관에 동의해주세요.");

        const newErrors = {};
        if (!fileId) {
            newErrors.ocr = "OCR 인증을 완료해주세요.";
        }
        // 모든 필수 필드 자동 검사
        Object.keys(requiredFields).forEach(key => {
            if (!formData[key]) {
                newErrors[key] = requiredFields[key];
            }
        });
        // 추가 조건들
        if (!file) newErrors.file = "파일 업로드 필수";
        if (!isOcrDone) newErrors.ocr = "사업자 인증 필요 (등록 버튼을 눌러주세요)";
        if (!isAgreed) newErrors.agree = "약관 동의 필요";
        if (emailValid === false) {
            newErrors.email = "이미 사용중인 이메일입니다.";
            
        }
        if (!companySize) {
            newErrors.companySize = "기업 규모 선택 필요";
        }
        if (businessValid === false) {
            newErrors.businessNumber = "이미 등록된 사업자번호입니다.";
        }
        // 에러 있으면 중단
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSignupLoading(true);

        if (USE_DUMMY) {
            setTimeout(() => {
                setSignupLoading(false);
                alert("더미 모드로 가입되었습니다!");
                navigate("/main");
            }, 1500);
            return;
        }

        try {
            const res = await api.put("/user", {
                ...formData,
                licensefileId: fileId, 
                industryCodes: industryCodes,
                agreed: isAgreed
            });
            
            // ✅ 수정: status === true 체크
            if (res.data.status === true) {
                alert("회원가입이 완료되었습니다!");
                navigate("/main");
            } else {
                // ✅ 수정: 서버 응답 메시지 활용
                alert("회원가입 요청을 처리할 수 없습니다. 입력 정보를 확인해주세요.");
            }
        } catch (err) {
            alert(`서버 오류가 발생했습니다.`);
        } finally {
            setSignupLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm("가입을 취소하시겠습니까? 입력한 정보가 사라집니다.")) {
            navigate(-1);
        }
    };

    // 반복되는 사업자 정보 입력 칸을 효율적으로 렌더링하기 위한 배열
    const bizFields = [
        { label: "법인명(단체명)", name: "companyName" },
        { label: "대표자명", name: "ceoName" },
        { label: "개업 연월일", name: "openingDate" },
        { label: "법인 등록번호", name: "corporateNumber" },
        { label: "본점 소재지", name: "headOffice" },
        { label: "발행일", name: "issueDate" },
        { label: "발행처", name: "texName" },
        { label: "사업의 종류(업태)", name: "industryId" },
        { label: "사업의 종류(종목)", name: "subCategory" }
    ];

    // --- [렌더링 구역] ---
    return (
        <div id="signup_page">
            <div className='signup-wrapper'>
                <div className="signup-container">
                    {/* 상단 제목: 더미 모드일 때 빨간 글씨로 표시 */}
                    <h1>회원가입 {USE_DUMMY && <span style={{fontSize:'12px', color:'red'}}>(더미 모드)</span>}</h1>
                    
                    <form onSubmit={handleSubmit} autoComplete="off">
                        
                        {/* 1. 가입 정보 섹션 (이메일, 비밀번호) */}
                        <section className="form-section">
                            <h2 className="section-title">가입 정보</h2>
                            {/* 이름 입력 */}
                            <div className="input-group">
                                <label>성명</label>
                                <div className="input-wrap">
                                    <input 
                                        type="text" 
                                        name="userName" 
                                        value={formData.userName} 
                                        onChange={handleChange} 
                                        onBlur={(e) => validateField("userName", e.target.value)}
                                        placeholder="이름을 입력해주세요" 
                                    />
                                    {errors.userName && <p className="error">{errors.userName}</p>}
                                </div>
                            </div>
                            
                            {/* 이메일 입력 */}
                            <div className="input-group">
                                <label>이메일</label>
                                <div className="input-wrap">
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} 
                                        onBlur={(e) => { validateField("email", e.target.value); checkEmail(); }} 
                                        placeholder="이메일을 입력해주세요" autoComplete="new-password" />
                                    {!errors.email && emailValid === true && <p className="success">사용 가능한 이메일입니다.</p>}
                                    {!errors.email && emailValid === false && <p className="error">이미 사용중입니다.</p>}
                                    {errors.email && <p className="error">{errors.email}</p>}
                                </div>
                            </div>

                            {/* 비밀번호 입력 */}
                            <div className="input-group">
                                <label>비밀번호</label>
                                <div className="input-wrap">
                                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                                        onBlur={(e) => validateField("password", e.target.value)} 
                                        placeholder="비밀번호를 입력해주세요" autoComplete="new-password" />
                                    {errors.password && <p className="error">{errors.password}</p>}
                                </div>
                            </div>
                        </section>

                        <hr className="divider" />

                        {/* 2. 사업자 정보 섹션 (파일 업로드 및 OCR 결과) */}
                        <section className="form-section">
                            <h2 className="section-title">사업자 정보</h2>
                            <p className="helper-text">*사업자등록증을 업로드한 후 등록버튼을 눌러주세요</p>
                            
                            {/* 파일 선택 및 OCR 등록 버튼 */}
                            <div className="input-group file-upload">
                                <label>사업자 등록증</label>
                                <div className="upload-controls">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                                    <input type="text" readOnly value={fileName} placeholder="선택된 파일 없음" />
                                    <button type="button" className="btn-green" onClick={handleFileBtnClick}>파일 선택</button>
                                    <button type="button" className="btn-green" onClick={handleUpload} disabled={isUploading}>
                                        {isUploading ? <span className="button-spinner" /> : "등록"}
                                    </button>
                                </div>
                            </div>
                            {errors.file && <p className="error">{errors.file}</p>}
                            {errors.ocr && <p className="error">{errors.ocr}</p>}

                            {/* 사업자 등록번호 (중복 검사 포함) */}
                            <div className="input-group">
                                <label>사업자 등록번호</label>
                                <div className="input-wrap">
                                    <input type="text" name="businessNumber" value={formData.businessNumber} onChange={handleChange}
                                        onBlur={(e) => { validateField("businessNumber", e.target.value); checkBusiness(); }} 
                                        placeholder="사업자 등록번호를 입력해주세요" autoComplete="one-time-code" />
                                    {!errors.businessNumber && businessValid === true && <p className="success">사용 가능</p>}
                                    {!errors.businessNumber && businessValid === false && <p className="error">이미 등록됨</p>}
                                    {errors.businessNumber && <p className="error">{errors.businessNumber}</p>}
                                </div>
                            </div>

                            {/* 나머지 OCR 연동 필드들 (반복문 처리) */}
                            {bizFields.map((field) => (
                                <div className="input-group" key={field.name}>
                                    <label>{field.label}</label>
                                    <div className="input-wrap">
                                        <input type="text" name={field.name} value={formData[field.name]} onChange={handleChange}
                                            onBlur={(e) => validateField(field.name, e.target.value)} 
                                            placeholder={`${field.label}을(를) 입력해주세요`} autoComplete="one-time-code" />
                                        {errors[field.name] && <p className="error">{errors[field.name]}</p>}
                                    </div>
                                </div>
                                
                            ))}
                            {/* 업종 5단계 선택 UI 추가 */}
                            <div className="industry-selection-wrapper">
                                <h3 className="sub-title">업종 추가 (표준산업분류 기준)</h3>
                                
                                <div className="select-step-group">
                                    {/* 대분류 */}
                                    <select value={sel.large} onChange={(e) => setSel({...sel, large: e.target.value, medium:'', small:'', fine:'', detail:''})}>
                                        <option value="">대분류 선택</option>
                                        {[...new Set(ksicData.map(i => i.largeCategoryName))].map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    
                                    {/* 중분류 */}
                                    <select 
                                        disabled={!sel.large} 
                                        value={sel.medium} 
                                        onChange={(e) => setSel({...sel, medium: e.target.value, small:'', fine:'', detail:''})}
                                    >
                                        <option value="">중분류 선택</option>
                                        {ksicData
                                            .filter(i => i.largeCategoryName === sel.large)
                                            .map((item, idx) => (
                                                <option key={idx} value={item.mediumCategoryName}>{item.mediumCategoryName}</option>
                                            ))}
                                    </select>
                                    
                                    {/* 소분류 */}
                                    <select 
                                        disabled={!sel.medium} 
                                        value={sel.small} 
                                        onChange={(e) => setSel({...sel, small: e.target.value, fine:'', detail:''})}
                                    >
                                        <option value="">소분류 선택</option>
                                        {ksicData
                                            .filter(i => i.mediumCategoryName === sel.medium)
                                            .map((item, idx) => (
                                                <option key={idx} value={item.smallCategoryName}>{item.smallCategoryName}</option>
                                            ))}
                                    </select>

                                    {/* 세분류 */}
                                    <select 
                                        disabled={!sel.small} 
                                        value={sel.fine} 
                                        onChange={(e) => setSel({...sel, fine: e.target.value, detail:''})}
                                    >
                                        <option value="">세분류 선택</option>
                                        {ksicData
                                            .filter(i => i.smallCategoryName === sel.small)
                                            .map((item, idx) => (
                                                <option key={idx} value={item.fineCategoryName}>{item.fineCategoryName}</option>
                                            ))}
                                            </select>
                                    

                                    {/* 세세분류 (최종) */}
                                    <select 
                                        disabled={!sel.fine} 
                                        value={sel.detail} 
                                        onChange={(e) => setSel({...sel, detail: e.target.value})}
                                    >
                                        <option value="">세세분류 선택</option>
                                        {ksicData
                                            .filter(i => i.fineCategoryName === sel.fine)
                                            .map((item, idx) => (
                                                <option key={idx} value={item.detailCategoryName}>{item.detailCategoryName}</option>
                                            ))}
                                    </select>
                                    
                                    <button type="button" className="btn-add" onClick={addIndustry}>업종 추가</button>
                                </div>

                                {/* 추가된 업종 코드 리스트 표시 */}
                                <div className="selected-codes-container">
                                    {industryCodes.map((code, idx) => (
                                        <div key={idx} className="code-tag">
                                            세세분류: {ksicData.find(i => i.standardIndustryClassification === code)?.detailCategoryName}
                                            <button type="button" onClick={() => setIndustryCodes(industryCodes.filter((_, i) => i !== idx))}>x</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <hr className="divider" />

                        {/* 3. 약관 동의 섹션 */}
                        <section className="form-section">
                            <h2 className="section-title">약관</h2>
                            <div className="terms-box">
                                <h4>[제1장 일반사항]</h4>
                                <p>본 서비스는 [WITH]이 제공하는 사업자 관리 및 OCR 인식 서비스를 포함합니다.</p>
                                <h4>[제2장 개인정보 및 사업자정보 수집]</h4>
                                <p>1. 회사는 서비스 제공을 위해 이메일, 비밀번호, 사업자등록증 내 정보를 수집합니다.</p>
                                <p>2. OCR 기능을 통해 추출된 정보는 자동 입력 편의를 위해 사용됩니다.</p>
                                <h4>[제3장 정보의 보유 및 이용기간]</h4>
                                <p>회원의 개인정보는 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다.</p>
                            </div>
                            {/* 동의 라디오 버튼 */}
                            <div className="radio-group">
                                <label><input type="radio" name="agree" checked={isAgreed === true} onChange={() => setIsAgreed(true)} /> 동의함</label>
                                <label><input type="radio" name="agree" checked={isAgreed === false} onChange={() => setIsAgreed(false)} /> 동의안함</label>
                            </div>
                            {errors.agree && <p className="error">{errors.agree}</p>}
                        </section>

                        <hr className="divider" />

                        {/* 4. 하단 액션 버튼 (가입, 취소) */}
                        <div className="action-buttons">
                            <button type="submit" className="btn-green btn-large" disabled={isLoading}>
                                {signupLoading ? <span className="button-spinner" /> : "가입"}
                            </button>
                            <button type="button" className="btn-green btn-large" onClick={handleCancel}>취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
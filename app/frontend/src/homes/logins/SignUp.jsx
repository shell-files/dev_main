import { useState,useRef } from 'react'
import { useNavigate } from 'react-router'
import '@styles/SignUp.css'
import { api } from '@utils/network'

const Signup = ()=>{
    const navigate = useNavigate();
    const fileInputRef = useRef(null); //파일 인풋에 접근하기 위한 변수
    const [fileName, setFileName] = useState(''); //선택된 파일 이름 저장용
    const [file, setFile] = useState(null);
    const [isOcrDone, setIsOcrDone] = useState(false); 
    const [isUploading, setIsUploading] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [emailValid, setEmailValid] = useState(null);
    const [businessValid, setBusinessValid] = useState(null);
    const [errors, setErrors] = useState({});
    const [signupLoading, setSignupLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        ceoName: '',
        businessNumber: '',
        companyName: '',
        openingDate: '',
        corporateNumber: '',
        headOffice: '',
        issueDate: '',
        issuer: '',
        industryId:'',
        subCategory:''
    })
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
        issuer: "발행처는 필수입니다.",
        industryId: "업태는 필수입니다.",
        subCategory: "종목은 필수입니다."
    };
    const isLoading = isUploading || signupLoading;
    const validateField = (name, value) => {
        let message = "";
        //필수값 체크
        if (!value) {
            message = requiredFields[name] || "필수 항목입니다.";
        }
        //이메일 형식 체크
        if (name === "email" && value) {
            const regex = /\S+@\S+\.\S+/;
            if (!regex.test(value)) {
                message = "이메일 형식이 올바르지 않습니다.";
            }
        }

        setErrors(prev => ({
            ...prev,
            [name]: message
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === "email") setEmailValid(null);
        if (name === "businessNumber") setBusinessValid(null);

        // 에러 초기화
        setErrors(prev => ({
            ...prev,
            [name]: ""
        }));
    };
    const handleFileBtnClick = () => {
    fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
            if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setIsOcrDone(false); 
            // 여기서 파일을 서버로 보내거는 로직 추가
            }   
    }
    const handleCancel = () => {
        if (window.confirm("가입을 취소하시겠습니까? 입력한 정보가 사라집니다.")) {
            navigate(-1); 
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("파일을 먼저 선택해주세요.");
            return;
        }
        setIsUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("file", file);

            const res = await api.post("/api/ocr", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            const result = res.data;
            if (result.success) {
                setFormData(prev => ({
                    ...prev,
                    businessNumber: result.data.businessNumber || '',
                    companyName: result.data.companyName || '',
                    ceoName: result.data.ceoName || '',
                    openingDate: result.data.openingDate || '',
                    corporateNumber: result.data.corporateNumber || '',
                    headOffice: result.data.headOffice || '',
                    issueDate: result.data.issueDate || '',
                    issuer: result.data.issuer || '',
                    industryId: result.data.industryId || '',
                    subCategory: result.data.subCategory || ''
                }));
                setIsOcrDone(true);
                // alert("OCR 완료! 자동 입력됨");
                console.log(result.data);
            } else {
                // alert("OCR 실패");
                console.error("OCR 실패");
            }
        } catch (err) {
            console.error(err);
            alert("서버 오류");
        } finally {
            setIsUploading(false);
        }
    };
    const checkEmail = async () => {
        if (!formData.email || emailValid !== null) return;
// -------------------------------------------------이메일 중복 체크 API -------------------------------------------------------
        try {
            const res = await api.get('/api/user', {
                params: { email: formData.email }
            });

            setEmailValid(res.data.available);
        } catch (err) {
            console.error(err);
        }
    };
    const checkBusiness = async () => {
        if (!formData.businessNumber) return;

        try {
            const res = await api.get('/api/user', {
                params: { businessNumber: formData.businessNumber }
            });

            setBusinessValid(res.data.available);
        } catch (err) {
            console.error(err);
        }
    };
    const handleSubmit = async(e) => {
        e.preventDefault();

        const newErrors = {};

        if (!formData.email) newErrors.email = "이메일은 필수입니다.";
        if (!formData.password) newErrors.password = "비밀번호는 필수입니다.";
        if (!formData.businessNumber) newErrors.businessNumber = "사업자번호는 필수입니다.";

        if (!file) newErrors.file = "파일 업로드 필수";
        if (!isOcrDone) newErrors.ocr = "사업자 인증 필요";
        if (!isAgreed) newErrors.agree = "약관 동의 필요";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        try {
            setSignupLoading(true);

            // 회원가입 API (추가 예정)
            const res = await api.post("/api/signup", {
                ...formData,
                fileName,
                agreed: isAgreed
            });
            if (res.data.status !== "success") {
                throw new Error("회원가입 실패");
            }

            navigate("/main");

        } catch (err) {
            alert("회원가입 실패");
        } finally {
            setSignupLoading(false);
        }
    };
    return(

        <div id="signup_page" className="signup-container">
            <h1>회원가입</h1>
            <form onSubmit={handleSubmit}>
                <section className="form-section">
                    <h2 className="section-title">가입 정보</h2>
                    <div className="input-group">
                        <label>이메일</label>
                            <div className="input-wrap">
                                <input type="email" name="email" value={formData.email} onChange={handleChange} 
                                    onBlur={(e) => {validateField("email", e.target.value);checkEmail();}} placeholder="이메일을 입력해주세요"/>
                                {!errors.email && emailValid === true && (
                                    <p className="success">사용 가능한 이메일입니다.</p>
                                )}
                                {!errors.email && emailValid === false && (
                                    <p className="error">이미 사용중입니다.</p>
                                )}
                                {errors.email && <p className="error">{errors.email}</p>}
                            </div>
                        </div>
                    <div className="input-group">
                    <label>비밀번호</label>
                        <div className="input-wrap">
                            <input type="password" name="password" value={formData.password} onChange={handleChange}
                            onBlur={(e)=>validateField("password",e.target.value)} placeholder="비밀번호를 입력해주세요"/>
                            {errors.password && <p className="error">{errors.password}</p>}
                        </div>
                    </div>
                   
                </section>
                <hr className="divider" />
                <section className="form-section">
                    <h2 className="section-title">사업자 정보</h2>
                    <p className="helper-text">*사업자등록증을 업로드한 후 등록버튼을 눌러주세요</p>
                    <div className="input-group file-upload">
                        <label>사업자 등록증</label>
                        <div className="upload-controls">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                            <input type="text" readOnly value={fileName} placeholder="선택된 파일 없음" />
                            <button type="button" className="btn-green" onClick={handleFileBtnClick}>파일 선택</button>
                            <button type="button" className="btn-green"onClick={handleUpload} disabled={isUploading}>
                                {isUploading ? <span className="button-spinner" /> : "등록"}</button>
                        </div>
                    </div>
                        {errors.file && <p className="error">{errors.file}</p>}
                        {errors.ocr && <p className="error">{errors.ocr}</p>}

                    <p className="helper-text">*입력된 정보를 확인 후 수정이 필요할 시 수정된 후 가입 버튼을 눌러주세요</p>
                    <div className="input-group">
                        <label>사업자 등록번호</label>
                        <div className="input-wrap">
                            <input type="text" name="businessNumber" value={formData.businessNumber} onChange={handleChange}
                            onBlur={(e)=>{validateField("businessNumber",e.target.value);checkBusiness()}} placeholder="사업자 등록번호를 입력해주세요"/>
                            {!errors.businessNumber && businessValid === true && (
                                <p className="success">사용 가능</p>
                            )}
                            {!errors.businessNumber && businessValid === false && (
                                <p className="error">이미 등록됨</p>
                            )}
                            {errors.businessNumber && (
                                <p className="error">{errors.businessNumber}</p>
                            )}
                        </div>
                    </div>
                    <div className="input-group"><label>법인명(단체명)</label>
                        <input type="text" name='companyName' value={formData.companyName}
                        onBlur={(e) => validateField("companyName", e.target.value)} onChange={handleChange} placeholder='법인명(단체명)을 입력해주세요'/>
                    </div>
                     <div className="input-group"><label>대표자명</label>
                        <input type="text" name="ceoName" value={formData.ceoName} 
                        onBlur={(e) => validateField("ceoName", e.target.value)} onChange={handleChange} placeholder="대표자명을 입력해주세요"/>
                    </div>
                    <div className="input-group"><label>개업 연월일</label>
                        <input type="text" name='openingDate' value={formData.openingDate} 
                        onBlur={(e) => validateField("openingDate", e.target.value)} onChange={handleChange} placeholder="개업 연월일을 입력해주세요"/>
                    </div>
                    <div className="input-group"><label>법인 등록번호</label>
                        <input type="text" name='corporateNumber' value={formData.corporateNumber} 
                        onBlur={(e) => validateField("corporateNumber", e.target.value)} onChange={handleChange} placeholder="법인 등록번호를 입력해주세요"/>
                        </div>
                    <div className="input-group"><label>본점 소재지</label>
                        <input type="text" name='headOffice' value={formData.headOffice}
                        onBlur={(e) => validateField("headOffice", e.target.value)} onChange={handleChange} placeholder='본점 소재지를 입력해주세요'/>
                        </div>
                    <div className="input-group"><label>발행일</label>
                        <input type="text" name='issueDate' value={formData.issueDate} 
                        onBlur={(e) => validateField("issueDate", e.target.value)} onChange={handleChange} placeholder='발행일을 입력해주세요'/>
                        </div>
                    <div className="input-group"><label>발행처</label>
                        <input type="text" name='issuer' value={formData.issuer}
                        onBlur={(e) => validateField("issuer", e.target.value)} onChange={handleChange} placeholder='발행처를 입력해주세요'/>
                    </div>
                    <div className="input-group"><label>사업의 종류(업태)</label>
                        <input type="text" name='industryId' value={formData.industryId}
                        onBlur={(e) => validateField("industryId", e.target.value)} onChange={handleChange} placeholder='업태를 입력해주세요'/>
                    </div>
                    <div className="input-group"><label>사업의 종류(종목)</label>
                        <input type="text" name='subCategory' value={formData.subCategory}
                        onBlur={(e) => validateField("subCategory", e.target.value)} onChange={handleChange} placeholder='종목을 입력해주세요'/>
                    </div>
                </section>

                <hr className="divider"/>

                <section className="form-section">
                    <h2 className="section-title">약관</h2>
                    <div className="terms-box">
                        <p>제1조 (목적)</p>
                        <p>본 약관은 [서비스명] (이하 "회사")이 제공하는 인터넷 관련 서비스의 이용 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
                        <p>제2조 (이용계약의 성립)</p>
                        <p>1. 이용계약은 회원이 본 약관에 동의하고 가입 신청을 한 후, 회사가 이를 승낙함으로써 성립합니다.</p>
                    </div>
                    <p className="terms-notice">민감정보 수집이용, 개인정보의 수집 및 이용, 온라인 신청 서비스 정책, 고유식별정보 수집 및 이용 항목에 대해 모두 동의합니다.</p>
                    
                    <div className="radio-group">
                        <label>
                            <input type="radio" name="agree" checked={isAgreed === true} onChange={() => setIsAgreed(true)} /> 
                            동의함
                        </label>
                        <label>
                            <input type="radio" name="agree" checked={isAgreed === false} onChange={() => setIsAgreed(false)} /> 
                            동의안함
                        </label>
                    </div>
                    {errors.agree && <p className="error">{errors.agree}</p>}
                </section>

                <hr className="divider"/>

                <div className="action-buttons">
                    <button type="submit" className="btn-green btn-large signup-action-button" disabled={isLoading}>
                        {signupLoading ? <span className="button-spinner" /> : "가입"}
                    </button>
                    <button type="button" className="btn-green btn-large" onClick={handleCancel}>취소</button>
                </div>
            </form>
        </div>
    )
}

export default Signup
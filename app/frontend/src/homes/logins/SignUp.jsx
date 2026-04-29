import '@styles/login.css'

const Signup = () => {

    return (
        <div id="signup_page">
            <div className="signup-container">
                <h1>회원가입</h1>
                <form>
                    <section className="form-section">
                        <h2 className="section-title">가입 정보</h2>
                        <div className="input-group">
                            <label>이메일</label>
                            <input type="email" placeholder="이메일을 입력해주세요" />
                        </div>
                        <div className="input-group">
                            <label>비밀번호</label>
                            <input type="password" placeholder="비밀번호를 입력해주세요" />
                        </div>
                    </section>

                    <hr className="divider" />

                    <section className="form-section">
                        <h2 className="section-title">사업자 정보</h2>
                        <p className="helper-text">*사업자등록증을 업로드한 후 등록버튼을 눌러주세요</p>
                        <div className="input-group file-upload">
                            <label>사업자 등록증</label>
                            <div className="upload-controls">
                                <input type="text" readOnly />
                                <button type="button" className="btn-green">파일</button>
                                <button type="button" className="btn-green">등록</button>
                            </div>
                        </div>

                        <p className="helper-text">*입력된 정보를 확인 후 수정이 필요할 시 수정된 후 가입 버튼을 눌러주세요</p>
                        <div className="input-group"><label>사업자 등록번호</label><input type="text" /></div>
                        <div className="input-group"><label>법인명(단체명)</label><input type="text" /></div>
                        <div className="input-group"><label>개업 연월일</label><input type="text" /></div>
                        <div className="input-group"><label>법인 등록번호</label><input type="text" /></div>
                        <div className="input-group"><label>본점 소재지</label><input type="text" /></div>
                        <div className="input-group"><label>발행일</label><input type="text" /></div>
                        <div className="input-group"><label>발행처</label><input type="text" /></div>
                    </section>

                    <hr className="divider" />

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
                            <label><input type="radio" name="agree" /> 동의함</label>
                            <label><input type="radio" name="agree" onChange={() => { }} checked /> 동의안함</label>
                        </div>
                    </section>

                    <hr className="divider" />

                    <div className="action-buttons">
                        <button type="submit" className="btn-green btn-large">가입</button>
                        <button type="button" className="btn-green btn-large">취소</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Signup
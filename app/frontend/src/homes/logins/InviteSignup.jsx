import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import '@styles/SignUp.css'
import { api } from '@utils/network'
import { showDefaultAlert, showConfirmAlert } from '@components/ServiceAlert/ServiceAlert.jsx'
import SignupInputField from '@components/SignupInputField'

const InviteSignUp = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")

    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        password: '',
        companyName: ''
    })

    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    // -----------------------------
    //  토큰 기반 정보 조회
    // -----------------------------
    useEffect(() => {
        const fetchInviteInfo = async () => {
            // if (!token) {
            //     showDefaultAlert("잘못된 접근", "초대 토큰이 없습니다.", "error")
            //     navigate("/login")
            //     return
            // }

            try {
                const res = await api.get(`/`, {
                    params: { token }
                })

                // 서버에서 받은 초대 정보
                setFormData(prev => ({
                    ...prev,
                    email: res.data.email,
                    companyName: res.data.companyName
                }))

            } catch (err) {
                showDefaultAlert("초대 오류", "유효하지 않은 초대 링크입니다.", "error")
                navigate("/login")
            }
        }

        fetchInviteInfo()
    }, [token])

    // -----------------------------
    // 입력 핸들링
    // -----------------------------
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const requiredFields = {
        userName: "이름은 필수입니다.",
        password: "비밀번호는 필수입니다."
    }

    const validateField = (name, value) => {
        let message = ""

        if (!value && requiredFields[name]) {
            message = requiredFields[name]
        }

        setErrors(prev => ({ ...prev, [name]: message }))
    }

    // -----------------------------
    // 제출
    // -----------------------------
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.userName) {
            return showDefaultAlert("입력 필요", "이름을 입력해주세요.", "warning")
        }

        if (!formData.password) {
            return showDefaultAlert("입력 필요", "임시 비밀번호를 입력해주세요.", "warning")
        }

        setLoading(true)

        try {
            await api.post('/invite/signup', {
                ...formData,
                token
            })

            showDefaultAlert("가입 완료", "초대 회원가입이 완료되었습니다.", "success")
            navigate("/login")

        } catch (err) {
            showDefaultAlert("가입 실패", "다시 시도해주세요.", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        const ok = await showConfirmAlert(
            "가입 취소",
            "작성 중인 내용이 사라집니다.",
            "warning"
        )
        if (ok) navigate("/login")
    }

    return (
        <div id="signup_page">
            <div className="signup-wrapper">
                <div className="signup-container">
                    <h1>초대 회원가입</h1>

                    <form onSubmit={handleSubmit} autoComplete="off">
                        <section className="form-section">
                            <h2 className="section-title">초대 정보</h2>

                            {/* 이름 (입력) */}
                            <SignupInputField
                                label="성명"
                                name="userName"
                                value={formData.userName}
                                onChange={handleChange}
                                onBlur={(e) => validateField("userName", e.target.value)}
                                placeholder="이름을 입력해주세요"
                                error={errors.userName}
                            />

                            {/* 이메일 (읽기 전용) */}
                            <SignupInputField
                                label="이메일"
                                name="email"
                                value={formData.email}
                                readOnly
                                onChange={() => {}}
                                placeholder="초대된 이메일"
                            />

                            {/* 회사명 (읽기 전용) */}
                            <SignupInputField
                                label="회사명"
                                name="companyName"
                                value={formData.companyName}
                                readOnly
                                onChange={() => {}}
                                placeholder="초대된 회사"
                            />

                            {/* 임시 비밀번호 */}
                            <SignupInputField
                                label="임시 비밀번호"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={(e) => validateField("password", e.target.value)}
                                placeholder="이메일로 받은 비밀번호 입력"
                                error={errors.password}
                            />
                        </section>

                        <hr className="divider" />

                        <div className="action-buttons">
                            <button type="submit" className="btn-green btn-large" disabled={loading}>
                                {loading ? "처리중..." : "가입"}
                            </button>

                            <button type="button" className="btn-green btn-large" onClick={handleCancel}>
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default InviteSignUp
from fastapi import APIRouter

router = APIRouter()
def verification():
    pass


@router.post("", 
        summary="회원 중복 체크", 
        description="회원 가입 시 이메일, 사업자 등록 번호 중복 체크")
def check():
    pass

@router.put("",
        summary="비밀번호 찾기 메일 발송",
        description="비밀번호 찾기 메일 발송")
def sendMail():
    pass

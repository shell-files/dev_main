from fastapi import APIRouter
from src.models.model import responseModel

router = APIRouter()
def verification():
    pass


@router.post("", 
        summary="회원 중복 체크", 
        description="회원 가입 시 이메일, 사업자 등록 번호 중복 체크")
def check():
    return responseModel(True, "중복 체크 완료")

@router.put("",
        summary="비밀번호 찾기 메일 발송",
        description="비밀번호 찾기 메일 발송")
def sendMail():
    return responseModel(True, "메일 발송 완료")

from fastapi import APIRouter
from src.models.model import loginModel
from src.models.auth import loginProcess

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("", 
        summary="비밀번호 찾기", 
        description="비밀번호 찾기")
def findPwd():
    pass

@router.post("",
        summary="로그인 api",
        description="email/pwd 받아서 uuid 반환")
def login(loginModel: loginModel):
    return loginProcess(loginModel)

@router.delete("",
        summary="회원 탈퇴 api",
        description="deleteYn 0 : 회원 상태 / 1 : 탈퇴 ")
def userDel():
    pass





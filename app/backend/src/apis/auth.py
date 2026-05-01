from fastapi import APIRouter
from src.models.model import loginModel, logoutModel
from src.models.auth import loginProcess, logoutProcess

router = APIRouter()

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
        summary="로그아웃 api",
        description="deleteYn 0 : 로그인 상태 / 1 : 로그아웃")
def userDel(logoutModel: logoutModel):
    return logoutProcess(logoutModel)





from fastapi import APIRouter
from src.models.model import loginModel, logoutModel, emailModel
from src.models.auth import loginProcess, logoutProcess, findPwdProcess

router = APIRouter()

@router.post("/", 
        summary="비밀번호 찾기", 
        description="비밀번호 찾기")
def findPwd(emailModel: emailModel):
    return findPwdProcess(emailModel)

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





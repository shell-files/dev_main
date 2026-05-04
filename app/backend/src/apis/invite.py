from fastapi import APIRouter
from src.models.invite import inviteProcess


router = APIRouter()

@router.put("",
            summary="회원 초대", 
            description="1. 사내직원, 2. 신규 컨설턴트, 3. 기존 가입자 컨설턴트")
def invite():
    return inviteProcess()

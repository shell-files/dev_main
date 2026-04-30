from fastapi import APIRouter
from src.models.user2 import duplicateCheckProcess, duplicateCheckModel, updateUserProcess, UserUpdateModel

router = APIRouter()

@router.post("/", 
        summary="중복 체크 api", 
        description="이메일, 사업자 등록 번호 중복 체크")
def duplicateCheck(duplicateCheckModel: duplicateCheckModel):
    return duplicateCheckProcess(duplicateCheckModel)

@router.patch("", 
        summary="회원수정 api", 
        description="회원 정보 수정")
def updateUser(userId: int, data: UserUpdateModel):
    return updateUserProcess(userId, data)

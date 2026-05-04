from fastapi import APIRouter
from src.models.user2 import duplicateCheckProcess, duplicateCheckModel, updateUserProcess, UserUpdateModel, deleteUserProcess

router = APIRouter()

@router.post("/", 
        summary="중복 체크 api", 
        description="회원가입시 사용자가 입력한 이메일, 사업자등록증 중복 여부를 체크합니다. ")
def duplicateCheck(duplicateCheckModel: duplicateCheckModel):
    return duplicateCheckProcess(duplicateCheckModel)

@router.patch("", 
        summary="회원수정 api", 
        description="회원 정보를 수정합니다.")
def updateUser(userId: int, data: UserUpdateModel):
    return updateUserProcess(userId, data)

@router.delete("", 
        summary="회원탈퇴 api", 
        description="회원 탈퇴 처리(delete_yn)입니다.")
def deleteUser(userId: int):
    return deleteUserProcess(userId)
from fastapi import APIRouter
from src.models.user2 import duplicateCheckProcess, duplicateCheckModel

router = APIRouter()

@router.post("/", 
        summary="중복 체크 api", 
        description="이메일, 사업자 등록 번호 중복 체크")
def duplicateCheck(duplicateCheckModel: duplicateCheckModel):
    return duplicateCheckProcess(duplicateCheckModel)

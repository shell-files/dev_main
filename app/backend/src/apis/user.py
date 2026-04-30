from fastapi import APIRouter, UploadFile, File
from src.models.user import licenseCheckProcess

router = APIRouter()

@router.post("", summary="OCR api", description="사업자등록증 OCR 및 진위확인")
async def licenseCheck(file: UploadFile = File(...)):
    return await licenseCheckProcess(file)

from fastapi import UploadFile, File
from src.utils.ocr import ocr, licenseInfo
from src.utils.file import licenseFile, checkBusinessStatus



async def licenseCheckProcess(file: UploadFile = File(...),):
    # 1. 파일 저장, 파일명 암호화 로직
    result, fileUuid, ext = licenseFile(file)
    # 2. OCR 로직
    ocrCheck = ocr(fileUuid, ext)
    # 3. OCR로 추출된 텍스트에서 사업자등록증 주요 정보 추출 로직
    licenseData = licenseInfo(ocrCheck["data"])
    # 4. 공공데이터포털 API 호출 로직 (사업자 등록증 진위여부 확인)
    businessStatus = await checkBusinessStatus(licenseData["사업자등록번호"].replace("-",""))

    return {
        "status": result,
        "fileUuid": fileUuid,
        "fileExt": ext,
        "licenseData": licenseData,
        "businessStatus": businessStatus
    }
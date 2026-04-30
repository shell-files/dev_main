import uuid
import shutil
from pathlib import Path
import httpx
import json
from src.utils.settings import settings
from src.utils.db import save
# from fastapi import FastAPI, UploadFile, File

# app = FastAPI()

# --------------------------
# 파일명 분리, 암호화 로직
# --------------------------

def licenseFile(file):
    UPLOAD_DIR = Path("licenseFiles")
    UPLOAD_DIR.mkdir(exist_ok=True)
    origin = file.filename
    ext = origin.split(".")[-1].lower()
    id = uuid.uuid4().hex
    newName = f"{id}.{ext}"
    folderPath = str(UPLOAD_DIR)
    sql = f"""
        insert into edu.`LICENSE_FILE` (`origin`, `ext`, `fileName`,`dir`) 
        values (?,?,?,?)
        """
    params = (origin, ext, newName, folderPath)
    result = save(sql, params)
    if result:
        path = UPLOAD_DIR / newName
    with path.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    return result, id, ext


# --------------------------
# 공공데이터포털 API 호출 로직 (사업자 등록증 진위여부 확인)
# --------------------------
async def checkBusinessStatus(businessNumber: str):
    serviceKey = settings.service_key
    url = f"https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey={serviceKey}"
    payload = {
       "b_no": [businessNumber]
       }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                content=json.dumps(payload),
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
        except Exception as e:
            return {"status": False, "msg": f"네트워크 오류: {str(e)}"}

    if response.status_code == 200:
        responseData = response.json()

        if responseData.get("data"):
            businessInfo = responseData["data"][0]

            if not businessInfo.get("tax_type_cd"):
                return {
                    "status": False,
                    "msg": businessInfo.get("tax_type")
                }
            
            if businessInfo.get("b_stt_cd") == "03":
                return {
                    "status": False,
                    "msg": "폐업 상태입니다."
                }
            
            return {"status": True}
        
        return {"status": False, "msg": "응답 데이터가 올바르지 않습니다."}
    
    else:
        return {"status": False, "msg": "API 서버 응답 실패", "code": response.status_code}


# ------------------------------fastapi 테스트용 엔드포인트 ------------------------------

# # --------------------------
# # 사업자등록증 진위여부 테스트
# # --------------------------
# @app.post("/license_check")
# async def license_check(business_number: str):
#     business_status = await checkBusinessStatus(business_number)
#     return business_status


# # --------------------------
# # 사진 업로드 테스트
# # --------------------------
# @app.post("/test_upload")
# async def test_upload(file: UploadFile = File(...)):
#     file_id = licenseFile(file)
#     return {
#         "file_id": file_id
#     }


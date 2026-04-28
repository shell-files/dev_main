import uuid
import mariadb
import shutil
from pathlib import Path
import httpx
import json
from settings import settings
from fastapi import FastAPI, UploadFile, File

app = FastAPI()


# 파일 저장 디렉토리 설정
UPLOAD_DIR = Path("licenseFiles")

# --------------------------
# mariadb 연결 로직 (임시)
# --------------------------
def getConn():
  try:
    conn = mariadb.connect(
      user=settings.user,
      password=settings.password,
      host=settings.host,
      database=settings.database,
      port=settings.port
    )
    if conn == None:
      return None
    return conn
  except mariadb.Error as e:
    print(f"접속 오류 : {e}")
    return None

# --------------------------
# DB에 저장하기
# --------------------------
def save(sql:str, params=None):
  '''DB에 단일 값 저장'''
  result = False
  try:
     with getConn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            conn.commit()
            result = True
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result


# --------------------------
# 파일명 분리, 암호화 로직
# --------------------------
def licenceFile(file):
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
    return result


# --------------------------
# 공공데이터포털 API 호출 로직 (사업자 등록증 진위여부 확인)
# --------------------------
async def checkBusinessStatus(businessNumber: str):
    serviceKey = "6616ee42a1040decaf862903d09b9f1a2e0140f93e6d568a89820979368f9545" 
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
            
            return {"status": True, "data": businessInfo}
        
        return {"status": False, "msg": "응답 데이터가 올바르지 않습니다."}
    
    else:
        return {"status": False, "msg": "API 서버 응답 실패", "code": response.status_code}


# ------------------------------fastapi 테스트용 엔드포인트 ------------------------------

# --------------------------
# 파일명 저장 테스트
# --------------------------
@app.post("/upload_license")
async def upload_license():
    fileId = licenceFile()
    
    if fileId > 0:
        return {"status": "success", "file_id": fileId}
    else:
        return {"status": "fail", "msg": "파일 저장 중 오류 발생"}

# --------------------------
# 사업자등록증 진위여부 테스트
# --------------------------
@app.post("/license_check")
async def license_check(business_number: str):
    business_status = await checkBusinessStatus(business_number)
    return business_status


# --------------------------
# 사진 업로드 테스트
# --------------------------
@app.post("/test_upload")
async def test_upload(file: UploadFile = File(...)):
    file_id = licenceFile(file)
    return {
        "file_id": file_id
    }


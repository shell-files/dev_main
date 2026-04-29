from pydantic import BaseModel, EmailStr, Field

# BaseModel 안에 있는 변수의 class type별 description 작성하는 방법  
# str인 경우 field에 (..., description="") 선언
# float인 경우 field에 (0.0, description="") 선언
# bool인 경우 field에 (True, description="") 선언

def responseModel(status: bool, message: str, data: dict={}):
    return {
        "status": status,
        "message": message,
        "data": data
    }

# -----------------------------
#  auth.py LoginModel
# -----------------------------
class loginModel(BaseModel):
  email: EmailStr = Field(..., description="로그인에서 사용되는 이메일 모델")
  password: str = Field(..., description="로그인에서 사용하는 pwd 모델")

class emailModel(BaseModel):
   email: EmailStr = Field(..., description="비밀번호 찾기에 사용되는 이메일 모델")

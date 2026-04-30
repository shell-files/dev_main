from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from src.utils.db import findAll
from src.models.model import responseModel

class duplicateCheckModel(BaseModel):
  """ user2.py get email,사업자 등록 번호 중복 체크 인증 모델 """
  # 이메일: 형식 검증은 EmailStr이 담당, 설명 추가
  email: Optional[EmailStr] =  Field(
      None,
      description="회원가입에서 사용되는 이메일 모델"
      )
  # 사업자 번호: 10자리 숫자 패턴 검증 및 길이 제한, 설명 추가
  businessNumber: Optional[str] = Field(
      None,
      min_length=10, 
      max_length=10,
      pattern=r"^\d{10}$",  # 숫자 10자리 정규표현식
      description="회원가입에서 사용되는 사업자 등록 번호 모델"
      )

def duplicateCheckProcess(duplicateCheckModel):
    """ 
    1. DB에서 이메일 중복 체크
    2. DB에서 사업자 등록 번호 중복 체크
     - 이메일과 사업자 등록 번호는 둘 다 중복이 없어야 회원가입 가능
    """
    try:
        # 1. 이메일 중복 체크
        if duplicateCheckModel.email:
            sql = """
                SELECT `email` FROM `USER` WHERE email = ?;
            """
            params = (duplicateCheckModel.email,)
            result = findAll(sql, params)
            
            is_available = len(result) == 0
            message = "사용 가능한 이메일입니다." if is_available else "이미 가입된 이메일입니다."
            
            return responseModel(True, message, {
                "type": "email",
                "available": is_available
            })

        # 2. 사업자 등록 번호 중복 체크
        if duplicateCheckModel.businessNumber:
            sql = """
                SELECT `business_number` FROM `COMPANY` WHERE business_number = ?;
            """
            params = (duplicateCheckModel.businessNumber,)
            result = findAll(sql, params)
            
            is_available = len(result) == 0
            message = "사용 가능한 사업자 번호입니다." if is_available else "이미 등록된 사업자 번호입니다."
            
            return responseModel(True, message, {
                "type": "businessNumber",
                "available": is_available
            })

        return responseModel(False, "검증할 값이 누락되었습니다.")

    except Exception as e:
        print(f"Error: {e}")
        return responseModel(False, f"서버 오류가 발생했습니다: {str(e)}")